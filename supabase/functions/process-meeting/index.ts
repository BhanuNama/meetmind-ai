// Supabase Edge Function: process-meeting
// This worker is an alternative to the inline Next.js processing in /api/upload
// Use this if you want to decouple AI processing from the API route (recommended for production)
// Deploy with: supabase functions deploy process-meeting

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY')!

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return new Response('Unauthorized', { status: 401 })

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  const { meetingId } = await req.json()

  if (!meetingId) return new Response('Missing meetingId', { status: 400 })

  // Fetch meeting
  const { data: meeting } = await supabase
    .from('meetings')
    .select('*')
    .eq('id', meetingId)
    .single()

  if (!meeting) return new Response('Meeting not found', { status: 404 })
  if (!meeting.audio_url) return new Response('No audio URL', { status: 400 })

  // Update status
  await supabase
    .from('meetings')
    .update({ status: 'processing' })
    .eq('id', meetingId)

  try {
    // Download audio from storage
    const audioPath = meeting.audio_url.split('/storage/v1/object/public/meeting-audio/')[1]
    const { data: audioData, error: downloadError } = await supabase.storage
      .from('meeting-audio')
      .download(audioPath)

    if (downloadError || !audioData) throw new Error('Failed to download audio')

    // Transcribe with Groq Whisper
    const formData = new FormData()
    formData.append('file', audioData, audioPath.split('/').pop() ?? 'audio.mp3')
    formData.append('model', 'whisper-large-v3')
    formData.append('response_format', 'verbose_json')
    formData.append('timestamp_granularities[]', 'segment')

    const transcribeRes = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${GROQ_API_KEY}` },
      body: formData,
    })

    if (!transcribeRes.ok) {
      const err = await transcribeRes.text()
      throw new Error(`Transcription failed: ${err}`)
    }

    const transcription = await transcribeRes.json()

    await supabase.from('transcripts').upsert({
      meeting_id: meetingId,
      content: transcription.text,
      speakers_json: null,
    })

    await supabase
      .from('meetings')
      .update({ duration_seconds: Math.round(transcription.duration ?? 0) })
      .eq('id', meetingId)

    // Extract insights with Groq LLaMA
    const extractRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        response_format: { type: 'json_object' },
        temperature: 0.1,
        messages: [
          {
            role: 'system',
            content: 'You are an expert meeting analyst. Extract structured information. Respond with valid JSON only.',
          },
          {
            role: 'user',
            content: `Analyze this transcript and return JSON with: summary (string), decisions (string[]), action_items (array of {task, owner|null, due_date|null}), blockers (string[]), sentiment ("positive"|"neutral"|"tense").\n\nTRANSCRIPT:\n${transcription.text.slice(0, 8000)}`,
          },
        ],
      }),
    })

    if (!extractRes.ok) throw new Error('LLM extraction failed')
    const extractData = await extractRes.json()
    const extraction = JSON.parse(extractData.choices[0].message.content)

    await supabase.from('meeting_extractions').upsert({
      meeting_id: meetingId,
      summary: extraction.summary,
      blockers: extraction.blockers ?? [],
      sentiment: extraction.sentiment,
    })

    if (extraction.action_items?.length > 0) {
      await supabase.from('action_items').insert(
        extraction.action_items.map((item: { task: string; owner: string | null; due_date: string | null }) => ({
          meeting_id: meetingId,
          task: item.task,
          owner: item.owner,
          due_date: item.due_date,
        }))
      )
    }

    if (extraction.decisions?.length > 0) {
      await supabase.from('decisions').insert(
        extraction.decisions.map((d: string) => ({
          meeting_id: meetingId,
          decision_text: d,
        }))
      )
    }

    await supabase
      .from('meetings')
      .update({ status: 'done' })
      .eq('id', meetingId)

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    await supabase
      .from('meetings')
      .update({ status: 'failed', error_message: message })
      .eq('id', meetingId)

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
