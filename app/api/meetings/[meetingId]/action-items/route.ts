import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServiceClient } from '@/lib/supabase/server'

// PATCH /api/meetings/[meetingId]/action-items — toggle completed or update
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ meetingId: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { meetingId } = await params
  const body = await req.json()
  const { id, completed } = body

  const supabase = createServiceClient()

  // Verify ownership
  const { data: meeting } = await supabase
    .from('meetings')
    .select('id')
    .eq('id', meetingId)
    .eq('user_id', userId)
    .single()

  if (!meeting) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data, error } = await supabase
    .from('action_items')
    .update({ completed })
    .eq('id', id)
    .eq('meeting_id', meetingId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
