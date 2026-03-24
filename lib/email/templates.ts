import type { MeetingFull } from '@/lib/types'
import { format } from 'date-fns'

export function buildMeetingSummaryEmail(meeting: MeetingFull): { subject: string; html: string } {
  const date = format(new Date(meeting.created_at), 'MMMM d, yyyy')
  const extraction = meeting.extraction
  const actionItems = meeting.action_items ?? []
  const decisions = meeting.decisions ?? []

  const sentimentEmoji = {
    positive: '🟢',
    neutral: '🟡',
    tense: '🔴',
  }[extraction?.sentiment ?? 'neutral']

  const actionItemsHtml =
    actionItems.length > 0
      ? actionItems
          .map(
            (item) => `
        <tr>
          <td style="padding: 8px 12px; border-bottom: 1px solid #f0f0f0;">
            ${item.task}
          </td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #f0f0f0; color: #6b7280;">
            ${item.owner ?? '—'}
          </td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #f0f0f0; color: #6b7280;">
            ${item.due_date ? format(new Date(item.due_date), 'MMM d') : '—'}
          </td>
        </tr>`
          )
          .join('')
      : '<tr><td colspan="3" style="padding: 8px 12px; color: #9ca3af;">No action items identified</td></tr>'

  const decisionsHtml =
    decisions.length > 0
      ? decisions.map((d) => `<li style="margin-bottom: 8px; color: #374151;">${d.decision_text}</li>`).join('')
      : '<li style="color: #9ca3af;">No decisions recorded</li>'

  const blockersHtml =
    (extraction?.blockers ?? []).length > 0
      ? (extraction?.blockers ?? [])
          .map((b) => `<li style="margin-bottom: 6px; color: #dc2626;">${b}</li>`)
          .join('')
      : '<li style="color: #9ca3af;">No blockers identified</li>'

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Meeting Summary</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 32px auto;">
    <tr>
      <td style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); padding: 32px; border-radius: 12px 12px 0 0;">
        <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 700;">MeetMind AI</h1>
        <p style="margin: 4px 0 0; color: #a5b4fc; font-size: 14px;">Meeting Summary</p>
      </td>
    </tr>
    <tr>
      <td style="background: white; padding: 32px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        
        <h2 style="margin: 0 0 4px; color: #111827; font-size: 20px;">${meeting.title}</h2>
        <p style="margin: 0 0 24px; color: #6b7280; font-size: 14px;">
          ${date} ${sentimentEmoji} ${extraction?.sentiment ? extraction.sentiment.charAt(0).toUpperCase() + extraction.sentiment.slice(1) : 'Neutral'} tone
        </p>

        ${
          extraction?.summary
            ? `
        <div style="background: #f8fafc; border-left: 4px solid #6366f1; padding: 16px; border-radius: 0 8px 8px 0; margin-bottom: 28px;">
          <h3 style="margin: 0 0 8px; color: #4f46e5; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Summary</h3>
          <p style="margin: 0; color: #374151; line-height: 1.6;">${extraction.summary}</p>
        </div>`
            : ''
        }

        <h3 style="margin: 0 0 12px; color: #111827; font-size: 16px; font-weight: 600;">Action Items</h3>
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-bottom: 28px; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
          <thead>
            <tr style="background: #f9fafb;">
              <th style="padding: 10px 12px; text-align: left; font-size: 12px; color: #6b7280; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Task</th>
              <th style="padding: 10px 12px; text-align: left; font-size: 12px; color: #6b7280; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Owner</th>
              <th style="padding: 10px 12px; text-align: left; font-size: 12px; color: #6b7280; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Due</th>
            </tr>
          </thead>
          <tbody>
            ${actionItemsHtml}
          </tbody>
        </table>

        <h3 style="margin: 0 0 12px; color: #111827; font-size: 16px; font-weight: 600;">Key Decisions</h3>
        <ul style="margin: 0 0 28px; padding-left: 20px;">
          ${decisionsHtml}
        </ul>

        ${
          (extraction?.blockers ?? []).length > 0
            ? `
        <h3 style="margin: 0 0 12px; color: #111827; font-size: 16px; font-weight: 600;">Blockers & Risks</h3>
        <ul style="margin: 0 0 28px; padding-left: 20px;">
          ${blockersHtml}
        </ul>`
            : ''
        }

        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 8px;">
          <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
            Generated by MeetMind AI · <a href="${process.env.NEXT_PUBLIC_APP_URL}" style="color: #6366f1; text-decoration: none;">View full transcript</a>
          </p>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`

  return {
    subject: `Meeting Summary: ${meeting.title} — ${date}`,
    html,
  }
}
