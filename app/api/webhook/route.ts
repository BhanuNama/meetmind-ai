import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { WebhookEvent } from '@clerk/nextjs/server'
import { Webhook } from 'svix'

export async function POST(req: NextRequest) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  // If no secret configured, skip verification (dev mode)
  if (!WEBHOOK_SECRET) {
    return handleClerkWebhook(await req.json())
  }

  const svix_id = req.headers.get('svix-id')
  const svix_timestamp = req.headers.get('svix-timestamp')
  const svix_signature = req.headers.get('svix-signature')

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 })
  }

  const body = await req.text()
  const wh = new Webhook(WEBHOOK_SECRET)

  let event: WebhookEvent
  try {
    event = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  return handleClerkWebhook(event)
}

async function handleClerkWebhook(event: WebhookEvent | Record<string, unknown>) {
  const supabase = createServiceClient()
  const { type, data } = event as { type: string; data: Record<string, unknown> }

  if (type === 'user.created' || type === 'user.updated') {
    const emailAddresses = data.email_addresses as Array<{ email_address: string; id: string }>
    const primaryEmailId = data.primary_email_address_id as string
    const primaryEmail = emailAddresses.find((e) => e.id === primaryEmailId)?.email_address

    if (!primaryEmail) {
      return NextResponse.json({ error: 'No email found' }, { status: 400 })
    }

    const firstName = data.first_name as string | null
    const lastName = data.last_name as string | null
    const name = [firstName, lastName].filter(Boolean).join(' ') || null
    const imageUrl = data.image_url as string | null

    await supabase.from('users').upsert({
      id: data.id as string,
      email: primaryEmail,
      name,
      avatar_url: imageUrl,
    })
  }

  if (type === 'user.deleted') {
    await supabase.from('users').delete().eq('id', data.id as string)
  }

  return NextResponse.json({ received: true })
}
