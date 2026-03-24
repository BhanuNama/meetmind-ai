import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServiceClient } from '@/lib/supabase/server'
import { transcribeAudio } from '@/lib/ai/transcribe'
import { extractMeetingInsights } from '@/lib/ai/extract'
import { embedAndStoreTranscript } from '@/lib/ai/embed'
import type { MeetingFull } from '@/lib/types'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ meetingId: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { meetingId } = await params
  const supabase = createServiceClient()

  const { data: meeting, error } = await supabase
    .from('meetings')
    .select('*')
    .eq('id', meetingId)
    .eq('user_id', userId)
    .single()

  if (error || !meeting) {
    return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })
  }

  if (!meeting.audio_url) {
    return NextResponse.json({ error: 'No audio file attached to this meeting' }, { status: 400 })
  }

  if (meeting.status === 'processing') {
    return NextResponse.json({ error: 'Already processing' }, { status: 409 })
  }

  // Reset to processing state
  await supabase
    .from('meetings')
    .update({ status: 'processing', error_message: null })
    .eq('id', meetingId)

  // Download audio from Supabase Storage
  // audio_url is the public URL; derive storage path from it
  const ext = meeting.audio_url.split('.').pop()?.split('?')[0] ?? 'webm'
  const storagePath = `${userId}/${meetingId}.${ext}`

  const { data: audioData, error: downloadErr } = await supabase.storage
    .from('meeting-audio')
    .download(storagePath)

  if (downloadErr || !audioData) {
    await supabase
      .from('meetings')
      .update({ status: 'failed', error_message: 'Could not download audio file from storage' })
      .eq('id', meetingId)
    return NextResponse.json({ error: 'Audio file not found in storage' }, { status: 404 })
  }

  const audioBuffer = await audioData.arrayBuffer()
  const filename = `${meetingId}.${ext}`

  // Fire-and-forget background processing
  retryInBackground(meetingId, userId, audioBuffer, filename).catch(async (err) => {
    console.error('Retry processing failed:', err)
    await supabase
      .from('meetings')
      .update({ status: 'failed', error_message: err.message ?? 'Retry failed' })
      .eq('id', meetingId)
  })

  return NextResponse.json({ success: true, status: 'processing' })
}

async function retryInBackground(
  meetingId: string,
  userId: string,
  audioBuffer: ArrayBuffer,
  filename: string
) {
  const supabase = createServiceClient()

  // Clear previous partial results so we start fresh
  await Promise.all([
    supabase.from('transcripts').delete().eq('meeting_id', meetingId),
    supabase.from('action_items').delete().eq('meeting_id', meetingId),
    supabase.from('decisions').delete().eq('meeting_id', meetingId),
    supabase.from('meeting_extractions').delete().eq('meeting_id', meetingId),
    supabase.from('meeting_embeddings').delete().eq('meeting_id', meetingId),
  ])

  // Step 1: Transcribe
  const transcription = await transcribeAudio(audioBuffer, filename)

  await supabase.from('transcripts').insert({
    meeting_id: meetingId,
    content: transcription.text,
    speakers_json: null,
  })

  await supabase
    .from('meetings')
    .update({ duration_seconds: Math.round(transcription.duration ?? 0) })
    .eq('id', meetingId)

  // Step 2: Extract insights
  const extraction = await extractMeetingInsights(transcription.text)

  await supabase.from('meeting_extractions').insert({
    meeting_id: meetingId,
    summary: extraction.summary,
    blockers: extraction.blockers,
    sentiment: extraction.sentiment,
  })

  if (extraction.action_items.length > 0) {
    await supabase.from('action_items').insert(
      extraction.action_items.map((item) => ({
        meeting_id: meetingId,
        task: item.task,
        owner: item.owner,
        due_date: item.due_date,
      }))
    )
  }

  if (extraction.decisions.length > 0) {
    await supabase.from('decisions').insert(
      extraction.decisions.map((d) => ({
        meeting_id: meetingId,
        decision_text: d,
      }))
    )
  }

  // Step 3: Embed for RAG
  await embedAndStoreTranscript(meetingId, transcription.text)

  // Step 4: Auto-email attendees if any
  const { data: attendees } = await supabase
    .from('meeting_attendees')
    .select('*')
    .eq('meeting_id', meetingId)

  if (attendees && attendees.length > 0) {
    const { data: fullMeeting } = await supabase.from('meetings').select('*').eq('id', meetingId).single()
    const { data: extractionData } = await supabase.from('meeting_extractions').select('*').eq('meeting_id', meetingId).single()
    const { data: actionItemsData } = await supabase.from('action_items').select('*').eq('meeting_id', meetingId)
    const { data: decisionsData } = await supabase.from('decisions').select('*').eq('meeting_id', meetingId)

    if (fullMeeting && extractionData) {
      const { sendMeetingSummaryEmail } = await import('@/lib/email/send')
      const meetingFull: MeetingFull = {
        ...fullMeeting,
        extraction: extractionData,
        action_items: actionItemsData ?? [],
        decisions: decisionsData ?? [],
        attendees,
      }
      await sendMeetingSummaryEmail(meetingFull, attendees.map((a: { email: string }) => a.email))
      await supabase
        .from('meeting_attendees')
        .update({ notified_at: new Date().toISOString() })
        .eq('meeting_id', meetingId)
    }
  }

  await supabase.from('meetings').update({ status: 'done' }).eq('id', meetingId)
}
