'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, Brain, Clock, Mic2, Briefcase, Mail } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUser } from '@clerk/nextjs'
import { MeetingCard } from '@/components/meeting-card'
import { UploadMeetingModal } from '@/components/upload-meeting-modal'
import { SearchBox } from '@/components/search-box'
import { toast } from 'sonner'
import type { Meeting } from '@/lib/types'

const SkeletonCard = () => (
  <div className="h-[72px] rounded-2xl bg-[#FAFAFC] border border-zinc-100 animate-pulse" />
)

export default function DashboardPage() {
  const { user } = useUser()
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [tab, setTab] = useState<'meetings' | 'search'>('meetings')

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
  const hoursSaved = Math.round(meetings.reduce((acc, m) => acc + (m.duration_seconds || 0), 0) / 3600) || 0

  return (
    <div className="p-6 sm:p-10 flex flex-col min-h-full bg-white relative">
      
      {/* ── Dashboard Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 mb-10 w-full mt-2">
        <div>
          <h3 className="text-[26px] sm:text-[30px] font-bold tracking-tight text-zinc-900 mb-1.5 leading-none">
            Hello, {user?.firstName || 'there'}
          </h3>
          <p className="text-[15px] text-zinc-500 font-medium tracking-tight">What meeting are you reviewing today?</p>
        </div>
        <div className="flex items-center px-4 py-3 bg-[#FAFAFC] rounded-full text-[14px] font-medium text-zinc-600 border border-zinc-200/60 w-full sm:w-[300px] shadow-sm focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-300 transition-all">
          <Search className="w-[18px] h-[18px] mb-[1px] mr-2.5 text-zinc-400" />
          <input 
            type="text" 
            placeholder="Search all transcripts..." 
            className="bg-transparent border-none outline-none w-full placeholder:text-zinc-400 text-zinc-800"
            onClick={() => setTab('search')}
          />
        </div>
      </div>

      {/* ── Stat Cards Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10 shrink-0">
        {[
          { label: 'Total Meetings', val: meetings.length, color: 'text-zinc-900', sub: '+12%', subColor: 'text-emerald-500' },
          { label: 'Processed', val: done, color: 'text-zinc-900', sub: '+2', subColor: 'text-emerald-500' },
          { label: 'In Progress', val: processing, color: 'text-zinc-900', sub: '-1', subColor: 'text-rose-500' },
          { label: 'Hours Saved', val: `${hoursSaved}h`, color: 'text-zinc-900', sub: '+8%', subColor: 'text-emerald-500' }
        ].map((s: any) => (
          <div key={s.label} className="p-6 rounded-[24px] bg-[#FAFAFC] border border-zinc-100 flex flex-col justify-between hover:bg-zinc-50 transition-colors shadow-[0_2px_10px_rgba(0,0,0,0.01)] min-h-[140px]">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-white rounded-[10px] shadow-sm border border-zinc-100">
                <Briefcase className="w-[16px] h-[16px] text-zinc-500" />
              </div>
              <span className="text-[13px] font-bold tracking-tight text-zinc-500">{s.label}</span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-[34px] font-black tracking-tight text-zinc-900 leading-none">{s.val}</span>
              <span className={`text-[12px] font-bold ${s.subColor}`}>{s.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Main Content Block (Replaced Graph) + Actions Sidebar ── */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-[400px]">
        
        {/* Meeting Activity (List or Search) */}
        <div className="flex-1 flex flex-col bg-white rounded-[24px] overflow-hidden">
          
          {/* Internal Header for Activity block */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 shrink-0 gap-4">
             <div className="flex gap-6 border-b border-zinc-100 w-full sm:w-auto">
               <button onClick={() => setTab('meetings')} className={`text-[15px] font-bold pb-3 border-b-2 transition-colors ${tab === 'meetings' ? 'border-zinc-900 text-zinc-900' : 'border-transparent text-zinc-400 hover:text-zinc-600'}`}>Meeting Activity</button>
               <button onClick={() => setTab('search')} className={`text-[15px] font-bold pb-3 border-b-2 transition-colors ${tab === 'search' ? 'border-zinc-900 text-zinc-900' : 'border-transparent text-zinc-400 hover:text-zinc-600'}`}>Semantic Search</button>
             </div>
             
             {/* Small mock dropdown resembling "This Month" in the design */}
             <div className="hidden sm:flex px-4 py-2 bg-[#FAFAFC] border border-zinc-200/80 rounded-full text-[13px] font-bold text-zinc-600 items-center shadow-sm cursor-pointer hover:bg-zinc-100 transition-colors">
               This Month <span className="text-[10px] ml-1 opacity-60">▼</span>
             </div>
          </div>

          <div className="flex-1 pr-1">
            <AnimatePresence mode="wait">
              {tab === 'meetings' ? (
                <motion.div key="meetings" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  {loading ? (
                    <div className="space-y-3">
                      {[1,2,3].map(i => <SkeletonCard key={i} />)}
                    </div>
                  ) : meetings.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center rounded-[24px] border border-dashed border-zinc-200 bg-[#FAFAFC]">
                      <div className="w-16 h-16 bg-white rounded-[20px] shadow-sm flex items-center justify-center mb-5 border border-zinc-100">
                        <Mic2 className="w-8 h-8 text-zinc-400" />
                      </div>
                      <h3 className="text-[18px] font-bold text-zinc-900 mb-1.5">No meetings yet</h3>
                      <p className="text-[14px] text-zinc-500 font-medium max-w-sm mb-6 leading-relaxed">Upload your first recording to generate AI transcripts, decisions, action items, and automated summaries.</p>
                      <button onClick={() => setUploadOpen(true)} className="bg-zinc-900 text-white px-7 py-3 rounded-full text-[14px] font-semibold hover:bg-black transition-transform active:scale-95 shadow-md flex items-center gap-2">
                        <Plus className="w-4 h-4"/> Upload Audio
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3 pb-12 w-full pt-1">
                      <AnimatePresence>
                        {meetings.map((m, i) => (
                          <motion.div key={m.id} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, x: -10 }} transition={{ delay: i * 0.03, duration: 0.2 }}>
                            {/* We wrap MeetingCard inside a nice styled bounding box if needed, or let MeetingCard render it since it matches tailwind */}
                            <MeetingCard meeting={m} onDelete={handleDelete} />
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div key="search" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="pb-10 min-h-[300px]">
                  <SearchBox />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Action Grid Blocks (Right sidebar elements from mockup) */}
        <div className="w-full lg:w-[150px] xl:w-[180px] grid grid-cols-2 lg:grid-cols-1 gap-4 shrink-0 auto-rows-max mt-2 lg:mt-0">
           <button onClick={() => setUploadOpen(true)} className="bg-[#FAFAFC] border border-zinc-100 rounded-[32px] p-6 flex flex-col items-center justify-center text-center hover:bg-zinc-50 hover:border-zinc-200 transition-all group shadow-[0_2px_10px_rgba(0,0,0,0.01)] min-h-[160px]">
              <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 group-hover:scale-105 transition-transform border border-zinc-100">
                <Mic2 className="w-[18px] h-[18px] text-zinc-700" />
              </div>
              <span className="text-[14px] font-bold text-zinc-800 leading-[1.2]">Upload<br/>Audio</span>
           </button>
           
           <button onClick={() => setTab('search')} className="bg-[#FAFAFC] border border-zinc-100 rounded-[32px] p-6 flex flex-col items-center justify-center text-center hover:bg-zinc-50 hover:border-zinc-200 transition-all group shadow-[0_2px_10px_rgba(0,0,0,0.01)] min-h-[160px]">
              <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 group-hover:scale-105 transition-transform border border-zinc-100">
                <Brain className="w-[18px] h-[18px] text-zinc-700" />
              </div>
              <span className="text-[14px] font-bold text-zinc-800 leading-[1.2]">New<br/>Summary</span>
           </button>
        </div>

      </div>

      <UploadMeetingModal open={uploadOpen} onOpenChange={setUploadOpen} onMeetingCreated={() => loadMeetings()} />
    </div>
  )
}
