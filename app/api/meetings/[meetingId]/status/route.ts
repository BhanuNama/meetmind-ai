import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServiceClient } from '@/lib/supabase/server'

// GET /api/meetings/[meetingId]/status — SSE stream for processing status
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ meetingId: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { meetingId } = await params

  const encoder = new TextEncoder()
  let closed = false

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        if (closed) return
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      const supabase = createServiceClient()
      let pollCount = 0
      const maxPolls = 120 // 2 minutes max

      const poll = async () => {
        if (closed || pollCount >= maxPolls) {
          if (!closed) {
            send({ status: 'timeout' })
            controller.close()
          }
          return
        }

        pollCount++

        const { data: meeting } = await supabase
          .from('meetings')
          .select('status, error_message')
          .eq('id', meetingId)
          .eq('user_id', userId)
          .single()

        if (!meeting) {
          send({ status: 'not_found' })
          controller.close()
          closed = true
          return
        }

        send({ status: meeting.status, error: meeting.error_message })

        if (meeting.status === 'done' || meeting.status === 'failed') {
          controller.close()
          closed = true
          return
        }

        // Poll every second while processing
        setTimeout(poll, 1000)
      }

      req.signal.addEventListener('abort', () => {
        closed = true
        try { controller.close() } catch { /* already closed */ }
      })

      await poll()
    },
  })

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
