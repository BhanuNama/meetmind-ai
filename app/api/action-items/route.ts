import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServiceClient()
  
  // Get all meetings for this user
  const { data: meetings, error: meetingsErr } = await supabase
    .from('meetings')
    .select('id, title')
    .eq('user_id', userId)

  if (meetingsErr) return NextResponse.json({ error: meetingsErr.message }, { status: 500 })
  if (!meetings || meetings.length === 0) return NextResponse.json([])

  const meetingIds = meetings.map((m: { id: string }) => m.id)

  const { data: actions, error: actionsErr } = await supabase
    .from('action_items')
    .select('*')
    .in('meeting_id', meetingIds)
    .order('created_at', { ascending: false })

  if (actionsErr) return NextResponse.json({ error: actionsErr.message }, { status: 500 })

  // Map meeting titles to actions
  const actionsWithTitles = actions.map((action: any) => ({
    ...action,
    meeting_title: meetings.find((m: { id: string, title: string }) => m.id === action.meeting_id)?.title || 'Unknown Meeting'
  }))

  return NextResponse.json(actionsWithTitles)
}
