import Groq from 'groq-sdk'
import { z } from 'zod'
import type { LLMExtractionResult } from '@/lib/types'

function getGroq() {
  return new Groq({ apiKey: process.env.GROQ_API_KEY })
}

const MeetingExtractionSchema = z.object({
  summary: z.string().max(600),
  decisions: z.array(z.string()),
  action_items: z.array(
    z.object({
      task: z.string(),
      owner: z.string().nullable(),
      due_date: z.string().nullable(),
    })
  ),
  blockers: z.array(z.string()),
  sentiment: z.enum(['positive', 'neutral', 'tense']),
})

const EXTRACTION_SYSTEM_PROMPT = `You are an expert meeting analyst. Extract structured information from meeting transcripts.
Always respond with valid JSON matching the exact schema provided. Be concise and factual.
For action items, extract the owner if explicitly mentioned, and due_date in YYYY-MM-DD format if mentioned.
If not mentioned, use null. Do not hallucinate information not present in the transcript.`

const EXTRACTION_USER_PROMPT = (transcript: string) => `Analyze this meeting transcript and return a JSON object with:
- summary: A concise 2-4 sentence summary of what was discussed
- decisions: Array of key decisions made (strings)
- action_items: Array of tasks with { task, owner (null if unclear), due_date (YYYY-MM-DD or null) }
- blockers: Array of blockers or risks mentioned
- sentiment: Overall meeting sentiment — "positive", "neutral", or "tense"

TRANSCRIPT:
${transcript}

Respond ONLY with valid JSON, no markdown, no explanation.`

export async function extractMeetingInsights(
  transcript: string,
  retries = 3
): Promise<LLMExtractionResult> {
  // For long transcripts, use map-reduce chunking
  if (transcript.length > 12000) {
    return extractWithMapReduce(transcript)
  }

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await getGroq().chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: EXTRACTION_SYSTEM_PROMPT },
          { role: 'user', content: EXTRACTION_USER_PROMPT(transcript) },
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' },
      })

      const raw = response.choices[0]?.message?.content
      if (!raw) throw new Error('Empty LLM response')

      const parsed = JSON.parse(raw)
      return MeetingExtractionSchema.parse(parsed)
    } catch (err) {
      if (attempt === retries - 1) throw err
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)))
    }
  }

  throw new Error('Extraction failed after retries')
}

async function extractWithMapReduce(transcript: string): Promise<LLMExtractionResult> {
  // Split into ~3000 char chunks with overlap
  const chunkSize = 3000
  const overlap = 300
  const chunks: string[] = []

  for (let i = 0; i < transcript.length; i += chunkSize - overlap) {
    chunks.push(transcript.slice(i, i + chunkSize))
  }

  // MAP: extract from each chunk using the faster 8B model
  const mapResults = await Promise.all(
    chunks.map(async (chunk) => {
      const response = await getGroq().chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: EXTRACTION_SYSTEM_PROMPT },
          { role: 'user', content: EXTRACTION_USER_PROMPT(chunk) },
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' },
      })
      const raw = response.choices[0]?.message?.content ?? '{}'
      try {
        return MeetingExtractionSchema.parse(JSON.parse(raw))
      } catch {
        return { summary: '', decisions: [], action_items: [], blockers: [], sentiment: 'neutral' as const }
      }
    })
  )

  // REDUCE: merge all extractions with the 70B model
  const reducePrompt = `You are given multiple partial extractions from different sections of the same meeting.
Merge them into a single, deduplicated, ranked final extraction. Remove duplicate action items and decisions.
Keep only the most important items.

Partial extractions:
${JSON.stringify(mapResults, null, 2)}

Return a single merged JSON object with the same schema: summary, decisions, action_items, blockers, sentiment.
Respond ONLY with valid JSON.`

  const response = await getGroq().chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: EXTRACTION_SYSTEM_PROMPT },
      { role: 'user', content: reducePrompt },
    ],
    temperature: 0.1,
    response_format: { type: 'json_object' },
  })

  const raw = response.choices[0]?.message?.content ?? '{}'
  return MeetingExtractionSchema.parse(JSON.parse(raw))
}
