import { Resend } from 'resend'
import { buildMeetingSummaryEmail } from './templates'
import type { MeetingFull } from '@/lib/types'

function getResend(): Resend {
  const key = process.env.RESEND_API_KEY
  if (!key || key === 'REPLACE_WITH_YOUR_RESEND_KEY' || key.startsWith('REPLACE')) {
    throw new Error(
      'RESEND_API_KEY is not configured. Get a free key at resend.com and add it to .env.local'
    )
  }
  return new Resend(key)
}

export async function sendMeetingSummaryEmail(
  meeting: MeetingFull,
  attendeeEmails: string[]
): Promise<void> {
  if (attendeeEmails.length === 0) return

  const from = process.env.RESEND_FROM_EMAIL
  if (!from || from.includes('yourdomain') || from.includes('REPLACE')) {
    throw new Error(
      'RESEND_FROM_EMAIL is not configured. ' +
      'On Resend free tier use "onboarding@resend.dev" (sends only to your verified email). ' +
      'For production, verify a domain at resend.com/domains and set your own address.'
    )
  }

  const { subject, html } = buildMeetingSummaryEmail(meeting)
  const resend = getResend()

  // Send in batches of 10 to respect Resend rate limits
  const batchSize = 10
  for (let i = 0; i < attendeeEmails.length; i += batchSize) {
    const batch = attendeeEmails.slice(i, i + batchSize)
    const results = await Promise.all(
      batch.map((email) =>
        resend.emails.send({ from, to: email, subject, html })
      )
    )

    // Surface any per-email errors
    for (const result of results) {
      if (result.error) {
        console.error('[Resend] send error:', result.error)
        throw new Error(`Resend error: ${result.error.message ?? JSON.stringify(result.error)}`)
      }
    }
  }
}
