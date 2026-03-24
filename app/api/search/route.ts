import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { searchTranscripts } from '@/lib/ai/embed'
import { answerFromChunks } from '@/lib/ai/answer'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { query } = body

  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    return NextResponse.json({ error: 'Query is required' }, { status: 400 })
  }

  const chunks = await searchTranscripts(query.trim(), userId, 5)
  const answer = await answerFromChunks(query.trim(), chunks)

  return NextResponse.json({
    answer,
    sources: chunks.map((c) => ({
      meetingId: c.meeting_id,
      meetingTitle: c.meeting_title,
      chunk: c.chunk_text.slice(0, 200) + (c.chunk_text.length > 200 ? '...' : ''),
      similarity: c.similarity,
    })),
  })
}
