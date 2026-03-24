'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Briefcase, Mic2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { MeetingCard } from '@/components/meeting-card'
import { UploadMeetingModal } from '@/components/upload-meeting-modal'
import { toast } from 'sonner'
import type { Meeting } from '@/lib/types'

const SkeletonCard = () => (
  <div className="h-[92px] rounded-[24px] bg-[#FAFAFC] border border-zinc-100 animate-pulse" />
)

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadOpen, setUploadOpen] = useState(false)

  const loadMeetings = useCallback(async () => {
    try {
      const res = await fetch('/api/meetings')
      if (!res.ok) throw new Error()
      setMeetings(await res.json())
    } catch {
      toast.error('Failed to load meetings')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadMeetings() }, [loadMeetings])

  useEffect(() => {
    const busy = meetings.filter(m => m.status === 'processing' || m.status === 'pending')
    if (!busy.length) return
    const t = setInterval(loadMeetings, 3000)
    return () => clearInterval(t)
  }, [meetings, loadMeetings])

  const handleDelete = (id: string) => {
    const meeting = meetings.find(m => m.id === id)
    toast(`Delete "${meeting?.title ?? 'this meeting'}"?`, {
      description: 'This will permanently remove the meeting and all its data.',
      action: {
        label: 'Delete',
        onClick: async () => {
          setMeetings(p => p.filter(m => m.id !== id))
          try {
            await fetch(`/api/meetings/${id}`, { method: 'DELETE' })
            toast.success('Meeting deleted')
          } catch {
            toast.error('Failed to delete')
            loadMeetings()
          }
        },
      },
      cancel: { label: 'Cancel', onClick: () => {} },
    })
  }

  const done = meetings.filter(m => m.status === 'done').length
  const processing = meetings.filter(m => m.status === 'processing' || m.status === 'pending').length

  return (
    <div className="p-6 sm:p-10 flex flex-col min-h-full bg-white relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 mb-10 w-full mt-2">
        <div>
          <h3 className="text-[26px] sm:text-[30px] font-bold tracking-tight text-zinc-900 mb-1.5 leading-none">
            All Meetings
          </h3>
          <p className="text-[15px] text-zinc-500 font-medium tracking-tight">Manage all your recorded and uploaded meetings</p>
        </div>
        <button onClick={() => setUploadOpen(true)} className="flex px-6 py-3.5 bg-zinc-900 text-white rounded-full text-[14px] font-bold items-center gap-2 shadow-sm hover:bg-black transition-transform active:scale-95 w-full sm:w-auto justify-center">
           <Plus className="w-4 h-4"/> New Meeting
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <div className="p-6 rounded-[24px] bg-[#FAFAFC] border border-zinc-100 flex flex-col justify-between shadow-[0_2px_10px_rgba(0,0,0,0.01)] h-[130px]">
          <span className="text-[13px] font-bold tracking-tight text-zinc-500">Total</span>
          <span className="text-[34px] font-black tracking-tight text-zinc-900 leading-none">{meetings.length}</span>
        </div>
        <div className="p-6 rounded-[24px] bg-[#FAFAFC] border border-zinc-100 flex flex-col justify-between shadow-[0_2px_10px_rgba(0,0,0,0.01)] h-[130px]">
          <span className="text-[13px] font-bold tracking-tight text-zinc-500">Processed</span>
          <span className="text-[34px] font-black tracking-tight text-emerald-600 leading-none">{done}</span>
        </div>
        <div className="p-6 rounded-[24px] bg-[#FAFAFC] border border-zinc-100 flex flex-col justify-between shadow-[0_2px_10px_rgba(0,0,0,0.01)] h-[130px]">
          <span className="text-[13px] font-bold tracking-tight text-zinc-500">Processing</span>
          <span className="text-[34px] font-black tracking-tight text-blue-600 leading-none">{processing}</span>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-[24px] border border-zinc-100 bg-[#FAFAFC] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-zinc-100">
          <h4 className="font-bold text-[15px] text-zinc-900">History</h4>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                {[1,2,3,4].map(i => <SkeletonCard key={i} />)}
              </motion.div>
            ) : meetings.length === 0 ? (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center p-12 text-center h-full">
                <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-5 border border-zinc-100">
                  <Mic2 className="h-6 w-6 text-zinc-400" />
                </div>
                <h3 className="text-[18px] font-bold text-zinc-900 mb-1.5">No meetings yet</h3>
                <p className="text-[14px] text-zinc-500 font-medium max-w-sm mb-6 leading-relaxed">Upload your first recording to generate AI transcripts, decisions, action items, and automated summaries.</p>
                <button onClick={() => setUploadOpen(true)} className="bg-zinc-900 text-white px-7 py-3.5 rounded-full text-[14px] font-semibold hover:bg-black transition-transform active:scale-95 shadow-md flex items-center gap-2">
                  <Plus className="w-4 h-4"/> Upload Audio
                </button>
              </motion.div>
            ) : (
              <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3 pb-20">
                <AnimatePresence>
                  {meetings.map((m, i) => (
                    <motion.div key={m.id} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, x: -10 }} transition={{ delay: i * 0.03, duration: 0.2 }}>
                      <MeetingCard meeting={m} onDelete={handleDelete} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <UploadMeetingModal open={uploadOpen} onOpenChange={setUploadOpen} onMeetingCreated={() => loadMeetings()} />
    </div>
  )
}
