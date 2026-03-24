import Groq from 'groq-sdk'

function getGroq() {
  return new Groq({ apiKey: process.env.GROQ_API_KEY })
}

export interface TranscriptWord {
  word: string
  start: number
  end: number
}

export interface TranscriptSegment {
  id: number
  text: string
  start: number
  end: number
  words?: TranscriptWord[]
}

export interface TranscriptionResult {
  text: string
  segments: TranscriptSegment[]
  duration: number
  language: string
}

export async function transcribeAudio(audioBuffer: ArrayBuffer, filename: string): Promise<TranscriptionResult> {
  const blob = new Blob([audioBuffer], { type: getMimeType(filename) })
  const file = new File([blob], filename)

  const response = await getGroq().audio.transcriptions.create({
    file,
    model: 'whisper-large-v3',
    response_format: 'verbose_json',
    timestamp_granularities: ['segment', 'word'],
  }) as unknown as {
    text: string
    segments?: TranscriptSegment[]
    duration?: number
    language?: string
  }

  return {
    text: response.text,
    segments: response.segments ?? [],
    duration: response.duration ?? 0,
    language: response.language ?? 'en',
  }
}

function getMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase()
  const map: Record<string, string> = {
    mp3: 'audio/mpeg',
    mp4: 'audio/mp4',
    m4a: 'audio/mp4',
    wav: 'audio/wav',
    webm: 'audio/webm',
    ogg: 'audio/ogg',
  }
  return map[ext ?? ''] ?? 'audio/mpeg'
}
