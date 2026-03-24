'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, Mic2, Calendar, Clock, User, FileText, Users, Zap, Lightbulb, AlertTriangle, Loader2, Trash2, RotateCcw, Mail, Sparkles
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { ActionItems } from '@/components/action-items'
import type { Meeting, Transcript, ActionItem, MeetingExtraction, MeetingAttendee } from '@/lib/types'

type Tab = 'summary' | 'actions' | 'decisions' | 'transcript' | 'attendees'

interface AttendeeInput { name: string; email: string }

export default function MeetingDetailPage() {
  const { meetingId } = useParams<{ meetingId: string }>()
  const router = useRouter()

  const [meeting, setMeeting]       = useState<Meeting | null>(null)
  const [transcript, setTranscript] = useState<Transcript | null>(null)
  const [extraction, setExtraction] = useState<MeetingExtraction | null>(null)
  const [decisions, setDecisions]   = useState<string[]>([])
  const [actions, setActions]       = useState<ActionItem[]>([])
  const [attendees, setAttendees]   = useState<MeetingAttendee[]>([])
  const [loading, setLoading]         = useState(true)
  const [tab, setTab]                 = useState<Tab>('summary')
  const [sendingEmail, setSendingEmail] = useState(false)
  const [retrying, setRetrying]       = useState(false)
  const [newAttendee, setNewAttendee] = useState<AttendeeInput>({ name: '', email: '' })
  const [addingAttendee, setAddingAttendee] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/meetings/${meetingId}`)
      if (!res.ok) { router.push('/dashboard'); return }
      const data = await res.json()
      const { transcript, action_items, decisions: rawDecisions, extraction, attendees, ...meetingFields } = data
      setMeeting(meetingFields as Meeting)
      setTranscript(transcript ?? null)
      setExtraction(extraction ?? null)
      setActions(action_items ?? [])
      const decisionStrings = (rawDecisions ?? []).map((d: { decision_text?: string; text?: string } | string) =>
        typeof d === 'string' ? d : d.decision_text ?? d.text ?? ''
      ).filter(Boolean)
      setDecisions(decisionStrings)
      setAttendees(attendees ?? [])
    } catch {
      toast.error('Failed to load meeting')
    } finally {
      setLoading(false)
    }
  }, [meetingId, router])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!meeting || (meeting.status !== 'processing' && meeting.status !== 'pending')) return
    const t = setInterval(load, 3000)
    return () => clearInterval(t)
  }, [meeting, load])

  const sendEmail = async () => {
    setSendingEmail(true)
    try {
      const res = await fetch(`/api/meetings/${meetingId}/email`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to send')
      toast.success(`Email sent to ${data.sent} attendee${data.sent !== 1 ? 's' : ''}!`, {
        description: data.emails?.join(', '),
      })
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to send email')
    } finally {
      setSendingEmail(false)
    }
  }

  const retryProcessing = async () => {
    setRetrying(true)
    try {
      const res = await fetch(`/api/meetings/${meetingId}/retry`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Retry failed')
      toast.success('Reprocessing started', {
        description: 'AI is re-transcribing and extracting insights.',
      })
      load()
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to retry')
    } finally {
      setRetrying(false)
    }
  }

  const addAttendee = async () => {
    if (!newAttendee.name || !newAttendee.email) return
    setAddingAttendee(true)
    try {
      const res = await fetch(`/api/meetings/${meetingId}/attendees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAttendee),
      })
      if (!res.ok) throw new Error()
      setNewAttendee({ name: '', email: '' })
      toast.success('Attendee added')
      load()
    } catch {
      toast.error('Failed to add attendee')
    } finally {
      setAddingAttendee(false)
    }
  }

  const removeAttendee = async (id: string) => {
    try {
      await fetch(`/api/meetings/${meetingId}/attendees`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attendeeId: id }),
      })
      toast.success('Attendee removed')
      load()
    } catch {
      toast.error('Failed to remove')
    }
  }

  const deleteMeeting = () => {
    toast(`Delete "${meeting?.title ?? 'this meeting'}"?`, {
      description: 'This will permanently remove the meeting and all its data.',
      action: {
        label: 'Delete',
        onClick: async () => {
          try {
            await fetch(`/api/meetings/${meetingId}`, { method: 'DELETE' })
            toast.success('Meeting deleted')
            router.push('/dashboard')
          } catch {
            toast.error('Failed to delete meeting')
          }
        },
      },
      cancel: { label: 'Cancel', onClick: () => {} },
    })
  }

  if (loading) {
    return (
      <div className="p-6 sm:p-10 flex flex-col min-h-full bg-white relative animate-pulse">
        <div className="h-6 w-32 bg-zinc-100 rounded-lg mb-8" />
        <div className="h-48 w-full bg-[#FAFAFC] rounded-[32px] mb-8" />
        <div className="h-10 w-full max-w-md bg-zinc-50 rounded-xl mb-6" />
        <div className="h-64 w-full bg-[#FAFAFC] rounded-[32px]" />
      </div>
    )
  }

  if (!meeting) return null

  const statusColors: any = {
    'done': 'text-emerald-700 bg-emerald-100',
    'processing': 'text-amber-700 bg-amber-100',
    'failed': 'text-rose-700 bg-rose-100',
    'pending': 'text-zinc-600 bg-zinc-100'
  }
  const statusColor = statusColors[meeting.status] || statusColors.pending
  
  const statusLabels: any = {
    'done': 'Processed',
    'processing': 'Processing…',
    'failed': 'Failed',
    'pending': 'Pending'
  }
  const statusLabel = statusLabels[meeting.status]

  const dur = meeting.duration_seconds
    ? `${Math.floor(meeting.duration_seconds / 60)}m ${meeting.duration_seconds % 60}s`
    : null

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'summary',    label: 'Summary' },
    { id: 'actions',    label: 'Actions',  count: actions.length },
    { id: 'decisions',  label: 'Decisions', count: decisions.length },
    { id: 'transcript', label: 'Transcript' },
    { id: 'attendees',  label: 'Attendees', count: attendees.length },
  ]

  return (
    <div className="p-6 sm:p-10 flex flex-col min-h-full bg-white relative">

      {/* Back row */}
      <div className="flex items-center justify-between mb-8">
        <button onClick={() => router.push('/dashboard/meetings')}
          className="flex items-center gap-2 text-[14px] font-bold text-zinc-500 hover:text-zinc-900 transition-colors bg-white px-4 py-2 rounded-full border border-zinc-200">
          <ArrowLeft className="h-4 w-4" /> Back to Meetings
        </button>
        <button
          onClick={deleteMeeting}
          className="flex items-center gap-2 h-[36px] px-4 rounded-full text-[13px] font-bold transition-colors bg-rose-50 text-rose-600 hover:bg-rose-100"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </button>
      </div>

      {/* Hero card */}
      <div className="bg-[#FAFAFC] border border-zinc-100 rounded-[32px] overflow-hidden shadow-sm flex flex-col mb-10">
        <div className="h-2 w-full bg-gradient-to-r from-blue-400 to-indigo-500" />
        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
            <div className="flex items-start gap-5">
              <div className="h-14 w-14 rounded-[20px] flex items-center justify-center shrink-0 bg-white border border-zinc-200 shadow-sm">
                <Mic2 className="h-6 w-6 text-indigo-500" />
              </div>
              <div className="pt-1">
                <h1 className="text-[26px] sm:text-[32px] font-bold tracking-tight text-zinc-900 leading-none mb-3">
                  {meeting.title}
                </h1>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="flex items-center gap-1.5 text-[13px] font-semibold text-zinc-500 bg-white px-3 py-1 rounded-lg border border-zinc-200">
                    <Calendar className="h-[14px] w-[14px]" />
                    {new Date(meeting.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  {dur && (
                    <span className="flex items-center gap-1.5 text-[13px] font-semibold text-zinc-500 bg-white px-3 py-1 rounded-lg border border-zinc-200">
                      <Clock className="h-[14px] w-[14px]" />
                      {dur}
                    </span>
                  )}
                  <span className={`flex items-center gap-1.5 text-[13px] font-bold px-3 py-1 rounded-lg ${statusColor}`}>
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    {statusLabel}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {meeting.status === 'done' && (
                <button
                  onClick={sendEmail}
                  disabled={sendingEmail || attendees.length === 0}
                  className="bg-indigo-600 text-white flex items-center gap-2 h-[42px] px-6 rounded-full text-[14px] font-semibold transition-all hover:bg-indigo-700 active:scale-95 disabled:opacity-50 shadow-md"
                  title={attendees.length === 0 ? 'Add attendees first' : 'Send email summary'}
                >
                  {sendingEmail
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <Mail className="h-4 w-4" />}
                  {sendingEmail ? 'Sending…' : `Email Summary`}
                </button>
              )}
              {(meeting.status === 'failed') && (
                <button
                  onClick={retryProcessing}
                  disabled={retrying}
                  className="flex items-center gap-2 h-[42px] px-6 rounded-full text-[14px] font-bold transition-colors bg-amber-100 text-amber-700 hover:bg-amber-200"
                >
                  {retrying
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <RotateCcw className="h-4 w-4" />}
                  {retrying ? 'Retrying…' : 'Retry AI Processing'}
                </button>
              )}
            </div>
          </div>

          {/* Quick stats inline below Hero */}
          {meeting.status === 'done' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-8 border-t border-zinc-200/60">
              {[
                { n: actions.length,   l: 'Action items', c: 'text-zinc-900 bg-white border border-zinc-200' },
                { n: decisions.length, l: 'Key Decisions', c: 'text-zinc-900 bg-white border border-zinc-200' },
                { n: attendees.length, l: 'Attendees',    c: 'text-zinc-900 bg-white border border-zinc-200'  },
              ].map(({ n, l, c }) => (
                <div key={l} className={`flex flex-col justify-center gap-2 p-5 rounded-[20px] shadow-sm ${c}`}>
                  <p className="text-[13px] font-bold text-zinc-500 uppercase tracking-wide">{l}</p>
                  <p className="text-[32px] font-black leading-none">{n}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Failed state */}
      {meeting.status === 'failed' && (
        <motion.div
          className="flex items-start gap-4 p-6 rounded-[24px] bg-rose-50 border border-rose-100 mb-10 shadow-sm"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="p-2 bg-white rounded-xl shadow-sm"><AlertTriangle className="h-6 w-6 text-rose-500 shrink-0" /></div>
          <div className="flex-1 min-w-0 pt-1">
            <p className="text-[16px] font-bold text-rose-900">Processing failed</p>
            {(meeting as any).error_message && (
              <p className="text-[13px] mt-2 font-mono break-all text-rose-700 bg-white p-3 rounded-lg border border-rose-100">
                {(meeting as any).error_message}
              </p>
            )}
            <p className="text-[14px] mt-3 text-rose-800 font-medium">
              Click <strong>Retry AI Processing</strong> above to try again.
            </p>
          </div>
        </motion.div>
      )}

      {/* Processing state */}
      {meeting.status === 'processing' && (
        <motion.div
          className="flex items-center gap-4 p-6 rounded-[24px] bg-indigo-50 border border-indigo-100 mb-10 shadow-sm"
          animate={{ opacity: [1, 0.6, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="p-2 bg-white rounded-xl shadow-sm"><Loader2 className="h-6 w-6 animate-spin text-indigo-500 shrink-0" /></div>
          <div>
            <p className="text-[16px] font-bold text-indigo-900">AI is processing your meeting</p>
            <p className="text-[14px] mt-1 text-indigo-700 font-medium">
              Transcribing audio and extracting insights. This may take up to 90 seconds. Auto-refreshing…
            </p>
          </div>
        </motion.div>
      )}

      {/* Tabs */}
      {meeting.status === 'done' && (
        <>
          <div className="flex flex-wrap items-center gap-3 overflow-x-auto pb-6 border-b border-zinc-100 mb-8">
            {tabs.map(({ id, label, count }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`relative flex items-center gap-2 px-5 py-2.5 text-[14px] font-bold rounded-full transition-all duration-200 ${
                  tab === id ? 'bg-zinc-900 text-white shadow-md transform scale-105' : 'bg-[#FAFAFC] text-zinc-500 border border-zinc-200 hover:bg-zinc-100'
                }`}
              >
                {label}
                {count !== undefined && count > 0 && (
                  <span className={`text-[11px] font-black px-2 py-0.5 rounded-full min-w-[20px] text-center ${
                    tab === id ? 'bg-white/20 text-white' : 'bg-zinc-200/60 text-zinc-600'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {tab === 'summary' && (
                <div className="space-y-6">
                  {extraction?.summary && (
                    <div className="p-8 rounded-[32px] bg-[#FAFAFC] border border-zinc-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
                      <div className="flex items-center gap-3 mb-5">
                        <div className="p-2 bg-white rounded-xl shadow-sm border border-zinc-100"><Sparkles className="h-5 w-5 text-indigo-500" /></div>
                        <p className="text-[18px] font-bold text-zinc-900">AI Executive Summary</p>
                      </div>
                      <p className="text-[16px] leading-[1.8] text-zinc-600 font-medium">
                        {extraction.summary}
                      </p>
                    </div>
                  )}
                  {extraction?.blockers && (extraction.blockers as string[]).length > 0 && (
                    <div className="p-8 rounded-[32px] bg-rose-50 border border-rose-100">
                      <div className="flex items-center gap-3 mb-5">
                        <div className="p-2 bg-white rounded-xl shadow-sm"><AlertTriangle className="h-5 w-5 text-rose-500" /></div>
                        <p className="text-[18px] font-bold text-rose-900">Key Blockers</p>
                      </div>
                      <ul className="space-y-3">
                        {(extraction.blockers as string[]).map((b, i) => (
                          <li key={i} className="flex items-start gap-3 text-[15px] text-rose-800 font-medium bg-white/60 p-3 rounded-2xl border border-rose-100/50">
                            <span className="h-2 w-2 rounded-full mt-2 shrink-0 bg-rose-500" />
                            {b}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {!extraction?.summary && (
                    <div className="flex flex-col items-center py-20 text-center bg-[#FAFAFC] rounded-[32px] border border-zinc-100">
                       <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-5 border border-zinc-100">
                         <Zap className="h-6 w-6 text-zinc-400" />
                       </div>
                      <p className="text-[18px] font-bold text-zinc-900 mb-2">No summary available</p>
                    </div>
                  )}
                </div>
              )}

              {tab === 'actions' && (
                <div className="p-8 rounded-[32px] bg-[#FAFAFC] border border-zinc-100 shadow-sm">
                  <ActionItems
                    meetingId={meetingId}
                    actionItems={actions}
                    onUpdate={setActions}
                  />
                </div>
              )}

              {tab === 'decisions' && (
                <div className="space-y-4">
                  {decisions.length > 0 ? decisions.map((d, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-start gap-4 p-6 rounded-[24px] bg-[#FAFAFC] border border-zinc-100 shadow-[0_2px_10px_rgba(0,0,0,0.01)] hover:bg-white transition-colors"
                    >
                      <div className="h-10 w-10 rounded-[12px] flex items-center justify-center shrink-0 bg-amber-50 border border-amber-200">
                        <Lightbulb className="h-5 w-5 text-amber-500" />
                      </div>
                      <p className="text-[16px] leading-[1.6] text-zinc-800 font-medium pt-2">{d}</p>
                    </motion.div>
                  )) : (
                    <div className="flex flex-col items-center py-20 text-center bg-[#FAFAFC] rounded-[32px] border border-zinc-100">
                       <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-5 border border-zinc-100">
                         <Lightbulb className="h-6 w-6 text-zinc-400" />
                       </div>
                      <p className="text-[18px] font-bold text-zinc-900">No decisions extracted</p>
                    </div>
                  )}
                </div>
              )}

              {tab === 'transcript' && (
                <div className="p-8 rounded-[32px] bg-[#FAFAFC] border border-zinc-100 shadow-[0_2px_10px_rgba(0,0,0,0.01)] max-h-[600px] overflow-y-auto custom-scrollbar">
                  <div className="flex items-center gap-3 mb-6 sticky top-0 bg-[#FAFAFC]/80 backdrop-blur-md py-2">
                    <div className="p-2 bg-white rounded-xl shadow-sm border border-zinc-100"><FileText className="h-5 w-5 text-indigo-500" /></div>
                    <p className="text-[18px] font-bold text-zinc-900">Raw Transcript</p>
                  </div>
                  {transcript?.content ? (
                    <p className="text-[14px] leading-[2.2] whitespace-pre-wrap font-mono text-zinc-600 bg-white p-6 rounded-[24px] border border-zinc-200/60 shadow-inner">
                      {transcript.content}
                    </p>
                  ) : (
                    <div className="flex flex-col items-center py-20 text-center">
                       <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-5 border border-zinc-100">
                         <FileText className="h-6 w-6 text-zinc-400" />
                       </div>
                      <p className="text-[16px] font-medium text-zinc-500">No transcript available</p>
                    </div>
                  )}
                </div>
              )}

              {tab === 'attendees' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                  
                  {/* Add attendee Form Box */}
                  <div className="p-8 rounded-[32px] bg-[#FAFAFC] border border-zinc-100 shadow-sm sticky top-0">
                    <p className="text-[18px] font-bold text-zinc-900 mb-6 flex items-center gap-2">
                      <Users className="w-5 h-5 text-indigo-500" /> Add Attendee
                    </p>
                    <div className="flex flex-col gap-4">
                      <input
                        className="w-full h-12 px-4 text-[15px] font-medium text-zinc-900 bg-white border border-zinc-200 rounded-[16px] shadow-sm outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 transition-all placeholder:text-zinc-400"
                        placeholder="Full Name"
                        value={newAttendee.name}
                        onChange={e => setNewAttendee(p => ({ ...p, name: e.target.value }))}
                      />
                      <input
                        className="w-full h-12 px-4 text-[15px] font-medium text-zinc-900 bg-white border border-zinc-200 rounded-[16px] shadow-sm outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 transition-all placeholder:text-zinc-400"
                        placeholder="Email Address"
                        type="email"
                        value={newAttendee.email}
                        onChange={e => setNewAttendee(p => ({ ...p, email: e.target.value }))}
                      />
                      <button
                        onClick={addAttendee}
                        disabled={addingAttendee}
                        className="bg-zinc-900 text-white h-12 w-full rounded-[16px] text-[15px] font-bold flex items-center justify-center shadow-md hover:bg-black active:scale-[0.98] transition-all disabled:opacity-50 mt-2"
                      >
                        {addingAttendee ? <Loader2 className="h-[18px] w-[18px] animate-spin" /> : 'Save Attendee'}
                      </button>
                    </div>
                  </div>

                  {/* Attendee list */}
                  <div className="space-y-3">
                    {attendees.length > 0 ? attendees.map((a) => (
                      <motion.div
                        key={a.id}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="group flex items-center justify-between p-5 rounded-[24px] bg-white border border-zinc-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:border-zinc-200 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-[16px] flex items-center justify-center bg-[#FAFAFC] border border-zinc-100">
                            <User className="h-5 w-5 text-zinc-400" />
                          </div>
                          <div>
                            <p className="text-[16px] font-bold text-zinc-900">{a.name}</p>
                            <p className="text-[13px] text-zinc-500 font-medium">{a.email}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeAttendee(a.id)}
                          className="opacity-0 group-hover:opacity-100 bg-rose-50 text-rose-600 h-9 px-4 rounded-full text-[13px] font-bold transition-all hover:bg-rose-100 shadow-sm"
                        >
                          Remove
                        </button>
                      </motion.div>
                    )) : (
                      <div className="flex flex-col items-center py-20 text-center bg-[#FAFAFC] rounded-[32px] border border-zinc-100">
                        <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-5 border border-zinc-100">
                          <Users className="h-6 w-6 text-zinc-400" />
                        </div>
                        <p className="text-[18px] font-bold mb-1 text-zinc-900">No attendees yet</p>
                        <p className="text-[14px] font-medium text-zinc-500 max-w-xs">Add attendees on the left to include them in the email summary distribution list.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </>
      )}
    </div>
  )
}
