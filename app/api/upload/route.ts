import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServiceClient } from '@/lib/supabase/server'
import { transcribeAudio } from '@/lib/ai/transcribe'
import { extractMeetingInsights } from '@/lib/ai/extract'
import { embedAndStoreTranscript } from '@/lib/ai/embed'
import { sendMeetingSummaryEmail } from '@/lib/email/send'
import type { MeetingFull } from '@/lib/types'

const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB
const ALLOWED_TYPES = ['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/webm', 'audio/ogg', 'audio/x-m4a']

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const meetingId = formData.get('meetingId') as string | null
  const title = formData.get('title') as string | null

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  if (!meetingId) return NextResponse.json({ error: 'No meetingId provided' }, { status: 400 })
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'File too large. Max 100MB.' }, { status: 413 })
  }
  if (!ALLOWED_TYPES.includes(file.type) && !file.name.match(/\.(mp3|mp4|m4a|wav|webm|ogg)$/i)) {
    return NextResponse.json({ error: 'Invalid file type. Supported: MP3, MP4, M4A, WAV, WebM' }, { status: 415 })
  }

  const supabase = createServiceClient()

  // Update meeting status to processing
  await supabase
    .from('meetings')
    .update({ status: 'processing', title: title ?? file.name.replace(/\.[^.]+$/, '') })
    .eq('id', meetingId)
    .eq('user_id', userId)

  // Upload audio to Supabase Storage
  const ext = file.name.split('.').pop() ?? 'mp3'
  const storagePath = `${userId}/${meetingId}.${ext}`
  const audioBuffer = await file.arrayBuffer()

  const { error: uploadError } = await supabase.storage
    .from('meeting-audio')
    .upload(storagePath, audioBuffer, {
      contentType: file.type,
      upsert: true,
    })

  if (uploadError) {
    await supabase.from('meetings').update({ status: 'failed', error_message: uploadError.message }).eq('id', meetingId)
    return NextResponse.json({ error: 'Storage upload failed' }, { status: 500 })
  }

  const { data: urlData } = supabase.storage.from('meeting-audio').getPublicUrl(storagePath)
  await supabase.from('meetings').update({ audio_url: urlData.publicUrl }).eq('id', meetingId)

  // Start async processing (don't await — return immediately)
  processInBackground(meetingId, userId, audioBuffer, file.name).catch(async (err) => {
    console.error('Processing failed:', err)
    await supabase
      .from('meetings')
      .update({ status: 'failed', error_message: err.message ?? 'Unknown error' })
      .eq('id', meetingId)
  })

  return NextResponse.json({ meetingId, status: 'processing' })
}

async function processInBackground(
  meetingId: string,
  userId: string,
  audioBuffer: ArrayBuffer,
  filename: string
) {
  const supabase = createServiceClient()

  try {
    // Step 1: Transcribe
    const transcription = await transcribeAudio(audioBuffer, filename)

    await supabase.from('transcripts').upsert({
      meeting_id: meetingId,
      content: transcription.text,
      speakers_json: null,
    })

    await supabase
      .from('meetings')
      .update({ duration_seconds: Math.round(transcription.duration) })
      .eq('id', meetingId)

    // Step 2: Extract insights
    const extraction = await extractMeetingInsights(transcription.text)

    // Store extraction
    await supabase.from('meeting_extractions').upsert({
      meeting_id: meetingId,
      summary: extraction.summary,
      blockers: extraction.blockers,
      sentiment: extraction.sentiment,
    })

    // Store action items
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

    // Store decisions
    if (extraction.decisions.length > 0) {
      await supabase.from('decisions').insert(
        extraction.decisions.map((d) => ({
          meeting_id: meetingId,
          decision_text: d,
        }))
      )
    }

    // Step 3: Embed transcript for RAG (free local model — no API key needed)
    await embedAndStoreTranscript(meetingId, transcription.text)

    // Step 4: Send email to attendees
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

    // Done!
    await supabase
      .from('meetings')
      .update({ status: 'done' })
      .eq('id', meetingId)

  } catch (err) {
    throw err
  }
}
