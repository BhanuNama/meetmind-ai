'use client'

import { useRouter } from 'next/navigation'
import { Calendar, Clock, Trash2, ArrowUpRight, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import type { Meeting } from '@/lib/types'

const STATUS = {
  done:       { label: 'Processed',   color: 'text-emerald-700 bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500' },
  processing: { label: 'Processing…', color: 'text-blue-700 bg-blue-50 border-blue-200', dot: 'bg-blue-500'  },
  pending:    { label: 'Pending',      color: 'text-amber-700 bg-amber-50 border-amber-200', dot: 'bg-amber-500' },
  failed:     { label: 'Failed',       color: 'text-rose-700 bg-rose-50 border-rose-200', dot: 'bg-rose-500'  },
} as const

interface Props { meeting: Meeting; onDelete: (id: string) => void }

export function MeetingCard({ meeting, onDelete }: Props) {
  const router = useRouter()
  const s = STATUS[meeting.status as keyof typeof STATUS] ?? STATUS.pending

  const formattedDate = new Date(meeting.created_at).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
  })
  const duration = meeting.duration_seconds
    ? `${Math.floor(meeting.duration_seconds / 60)}m`
    : null

  return (
    <motion.div
      whileHover={{ scale: 1.005 }}
      whileTap={{ scale: 0.998 }}
      onClick={() => router.push(`/dashboard/meetings/${meeting.id}`)}
      className="group relative flex flex-col sm:flex-row sm:items-center gap-4 px-5 py-5 rounded-[24px] cursor-pointer transition-all duration-200 bg-white border border-zinc-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-md hover:border-zinc-200"
    >
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <p className="text-[16px] font-bold text-zinc-900 truncate">
            {meeting.title}
          </p>

          {/* Processing indicator */}
          {(meeting.status === 'processing' || meeting.status === 'pending') && (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-blue-500" />
          )}
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <span className={`flex items-center gap-1.5 text-[11px] font-bold px-2 py-0.5 rounded-[8px] border ${s.color}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
            {s.label}
          </span>
          <span className="flex items-center gap-1 text-[12px] font-medium text-zinc-500">
            <Calendar className="h-[14px] w-[14px]" />
            {formattedDate}
          </span>
          {duration && (
            <span className="flex items-center gap-1 text-[12px] font-medium text-zinc-500">
              <Clock className="h-[14px] w-[14px]" />
              {duration}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="h-9 w-9 rounded-full flex items-center justify-center transition-colors text-zinc-400 bg-[#FAFAFC] hover:bg-rose-50 hover:text-rose-500 border border-zinc-100 hover:border-rose-100"
          onClick={e => { e.stopPropagation(); onDelete(meeting.id) }}
          title="Delete Meeting"
        >
          <Trash2 className="h-4 w-4" />
        </motion.button>

        <div className="h-9 w-9 rounded-full flex items-center justify-center transition-all bg-[#FAFAFC] text-zinc-400 border border-zinc-100 group-hover:bg-blue-50 group-hover:text-blue-500 group-hover:border-blue-100">
          <ArrowUpRight className="h-[18px] w-[18px]" />
        </div>
      </div>
    </motion.div>
  )
}
