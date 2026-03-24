import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendMeetingSummaryEmail } from '@/lib/email/send'
import type { MeetingFull } from '@/lib/types'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ meetingId: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { meetingId } = await params
  const supabase = createServiceClient()

  // Verify ownership
  const { data: meeting, error: meetingErr } = await supabase
    .from('meetings')
    .select('*')
    .eq('id', meetingId)
    .eq('user_id', userId)
    .single()

  if (meetingErr || !meeting) {
    return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })
  }

  if (meeting.status !== 'done') {
    return NextResponse.json({ error: 'Meeting is not yet processed' }, { status: 400 })
  }

  // Fetch all related data
  const [attendeesRes, extractionRes, actionItemsRes, decisionsRes] = await Promise.all([
    supabase.from('meeting_attendees').select('*').eq('meeting_id', meetingId),
    supabase.from('meeting_extractions').select('*').eq('meeting_id', meetingId).maybeSingle(),
    supabase.from('action_items').select('*').eq('meeting_id', meetingId),
    supabase.from('decisions').select('*').eq('meeting_id', meetingId),
  ])

  const attendees = attendeesRes.data ?? []
  if (attendees.length === 0) {
    return NextResponse.json({ error: 'No attendees to email. Add attendees first.' }, { status: 400 })
  }

  const meetingFull: MeetingFull = {
    ...meeting,
    extraction: extractionRes.data ?? undefined,
    action_items: actionItemsRes.data ?? [],
    decisions: decisionsRes.data ?? [],
    attendees,
  }

  try {
    await sendMeetingSummaryEmail(
      meetingFull,
      attendees.map((a: { email: string }) => a.email)
    )

    // Mark attendees as notified
    await supabase
      .from('meeting_attendees')
      .update({ notified_at: new Date().toISOString() })
      .eq('meeting_id', meetingId)

    return NextResponse.json({
      success: true,
      sent: attendees.length,
      emails: attendees.map((a: { email: string }) => a.email),
    })
  } catch (err: any) {
    console.error('Email send failed:', err)
    return NextResponse.json({ error: err.message ?? 'Failed to send email' }, { status: 500 })
  }
}
