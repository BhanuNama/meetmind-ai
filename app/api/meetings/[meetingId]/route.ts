import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServiceClient } from '@/lib/supabase/server'

// GET /api/meetings/[meetingId] — get full meeting with all related data
export async function GET(
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

  if (error || !meeting) return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })

  const [transcriptRes, actionItemsRes, decisionsRes, extractionRes, attendeesRes] =
    await Promise.all([
      supabase.from('transcripts').select('*').eq('meeting_id', meetingId).maybeSingle(),
      supabase.from('action_items').select('*').eq('meeting_id', meetingId).order('created_at'),
      supabase.from('decisions').select('*').eq('meeting_id', meetingId).order('created_at'),
      supabase.from('meeting_extractions').select('*').eq('meeting_id', meetingId).maybeSingle(),
      supabase.from('meeting_attendees').select('*').eq('meeting_id', meetingId).order('created_at'),
    ])

  return NextResponse.json({
    ...meeting,
    transcript: transcriptRes.data,
    action_items: actionItemsRes.data ?? [],
    decisions: decisionsRes.data ?? [],
    extraction: extractionRes.data,
    attendees: attendeesRes.data ?? [],
  })
}

// PATCH /api/meetings/[meetingId] — update title
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ meetingId: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { meetingId } = await params
  const body = await req.json()
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('meetings')
    .update({ title: body.title })
    .eq('id', meetingId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE /api/meetings/[meetingId] — delete meeting + all related data
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ meetingId: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { meetingId } = await params
  const supabase = createServiceClient()

  const { error } = await supabase
    .from('meetings')
    .delete()
    .eq('id', meetingId)
    .eq('user_id', userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
