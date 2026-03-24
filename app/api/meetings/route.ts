import { NextRequest, NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { createServiceClient } from '@/lib/supabase/server'

// Ensures the Clerk user exists in our users table (no webhook needed)
async function ensureUser(userId: string) {
  const supabase = createServiceClient()
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('id', userId)
    .maybeSingle()

  if (!existing) {
    const clerkUser = await currentUser()
    if (!clerkUser) return

    const primaryEmail = clerkUser.emailAddresses.find(
      (e) => e.id === clerkUser.primaryEmailAddressId
    )?.emailAddress

    await supabase.from('users').upsert({
      id: userId,
      email: primaryEmail ?? `${userId}@unknown.com`,
      name: [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || null,
      avatar_url: clerkUser.imageUrl ?? null,
    })
  }
}

// GET /api/meetings — list all meetings for authenticated user
export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('meetings')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST /api/meetings — create a new meeting record
export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await ensureUser(userId)

  const body = await req.json()
  const { title } = body

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('meetings')
    .insert({ user_id: userId, title: title ?? 'Untitled Meeting', status: 'pending' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
