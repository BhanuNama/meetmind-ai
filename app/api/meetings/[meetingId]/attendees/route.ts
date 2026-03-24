import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServiceClient } from '@/lib/supabase/server'

// POST /api/meetings/[meetingId]/attendees — add attendee
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ meetingId: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { meetingId } = await params
  const body = await req.json()
  const { email, name } = body

  const supabase = createServiceClient()

  const { data: meeting } = await supabase
    .from('meetings')
    .select('id')
    .eq('id', meetingId)
    .eq('user_id', userId)
    .single()

  if (!meeting) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data, error } = await supabase
    .from('meeting_attendees')
    .upsert({ meeting_id: meetingId, email, name })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

// DELETE /api/meetings/[meetingId]/attendees — remove attendee
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ meetingId: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { meetingId } = await params
  const { searchParams } = new URL(req.url)
  const attendeeId = searchParams.get('id')

  if (!attendeeId) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const supabase = createServiceClient()

  const { data: meeting } = await supabase
    .from('meetings')
    .select('id')
    .eq('id', meetingId)
    .eq('user_id', userId)
    .single()

  if (!meeting) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { error } = await supabase
    .from('meeting_attendees')
    .delete()
    .eq('id', attendeeId)
    .eq('meeting_id', meetingId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
