import { createServiceClient } from '@/lib/supabase/server'

// Uses HuggingFace Inference API — FREE, no local model download, works on Vercel
const HF_API_URL =
  'https://router.huggingface.co/hf-inference/models/sentence-transformers/all-MiniLM-L6-v2'

async function embed(texts: string[]): Promise<number[][]> {
  const hfToken = process.env.HUGGINGFACE_API_TOKEN // optional — increases rate limit

  const res = await fetch(HF_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(hfToken ? { Authorization: `Bearer ${hfToken}` } : {}),
    },
    body: JSON.stringify({
      inputs: texts,
      options: { wait_for_model: true },
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`HuggingFace embedding error: ${err}`)
  }

  const result = await res.json()

  // HF returns either number[][] directly, or a nested array — normalize it
  // For sentence-transformers it returns: number[][]
  return result as number[][]
}

export async function embedAndStoreTranscript(meetingId: string, transcript: string): Promise<void> {
  const chunks = chunkText(transcript)
  if (chunks.length === 0) return

  const supabase = createServiceClient()
  const batchSize = 10

  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize)
    const embeddings = await embed(batch)

    const rows = embeddings.map((embedding, idx) => ({
      meeting_id: meetingId,
      chunk_text: batch[idx],
      embedding,
    }))

    const { error } = await supabase.from('meeting_embeddings').insert(rows)
    if (error) throw new Error(`Failed to store embeddings: ${error.message}`)
  }
}

export async function searchTranscripts(
  query: string,
  userId: string,
  matchCount = 5
): Promise<Array<{
  id: string
  meeting_id: string
  chunk_text: string
  similarity: number
  meeting_title: string
  meeting_created_at: string
}>> {
  const [queryEmbedding] = await embed([query])
  const supabase = createServiceClient()

  const { data, error } = await supabase.rpc('match_meeting_embeddings', {
    query_embedding: queryEmbedding,
    match_threshold: 0.1,
    match_count: matchCount,
    filter_user_id: userId,
  })

  if (error) throw new Error(`Search failed: ${error.message}`)
  return data ?? []
}

function chunkText(text: string): string[] {
  const words = text.split(/\s+/)
  const chunks: string[] = []
  const wordsPerChunk = 150
  const overlapWords = 20

  for (let i = 0; i < words.length; i += wordsPerChunk - overlapWords) {
    const chunk = words.slice(i, i + wordsPerChunk).join(' ')
    if (chunk.trim().length > 50) chunks.push(chunk)
  }

  return chunks
}
