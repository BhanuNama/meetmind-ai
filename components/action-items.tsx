'use client'

import { useState } from 'react'
import { CheckCircle2, Circle, User, Calendar, CheckSquare } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import type { ActionItem } from '@/lib/types'

interface Props {
  meetingId: string
  actionItems: ActionItem[]
  onUpdate: (items: ActionItem[]) => void
}

export function ActionItems({ meetingId, actionItems, onUpdate }: Props) {
  const [toggling, setToggling] = useState<Set<string>>(new Set())

  const toggle = async (item: ActionItem) => {
    if (toggling.has(item.id)) return
    setToggling(p => new Set(p).add(item.id))
    const updated = actionItems.map(a =>
      a.id === item.id ? { ...a, completed: !a.completed } : a
    )
    onUpdate(updated)
    try {
      const res = await fetch(`/api/meetings/${meetingId}/action-items`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionItemId: item.id, completed: !item.completed }),
      })
      if (!res.ok) throw new Error()
      if (!item.completed) toast.success('Marked complete')
    } catch {
      onUpdate(actionItems)
      toast.error('Failed to update')
    } finally {
      setToggling(p => { const n = new Set(p); n.delete(item.id); return n })
    }
  }

  if (!actionItems.length) {
    return (
      <div className="flex flex-col items-center py-20 text-center bg-[#FAFAFC] rounded-[32px] border border-zinc-100">
        <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-5 border border-zinc-100">
          <CheckSquare className="h-6 w-6 text-zinc-400" />
        </div>
        <p className="text-[18px] font-bold text-zinc-900 mb-1">No action items extracted</p>
        <p className="text-[14px] text-zinc-500 max-w-sm">AI found no clear tasks assigned in this meeting.</p>
      </div>
    )
  }

  const done    = actionItems.filter(a => a.completed).length
  const pending = actionItems.length - done

  return (
    <div className="space-y-5">
      {/* Progress header */}
      <div className="flex items-center justify-between px-2 mb-2">
        <p className="text-[13px] font-bold text-zinc-500 uppercase tracking-wide">
          {done}/{actionItems.length} completed
        </p>
        <p className={`text-[13px] font-bold ${pending > 0 ? 'text-blue-600' : 'text-emerald-500'}`}>
          {pending > 0 ? `${pending} remaining` : 'All done!'}
        </p>
      </div>

      {/* Progress bar */}
      <div className="h-2 rounded-full overflow-hidden bg-zinc-100 mb-6">
        <motion.div
          className="h-full rounded-full bg-blue-500"
          initial={{ width: 0 }}
          animate={{ width: `${(done / actionItems.length) * 100}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>

      {/* Items */}
      <div className="space-y-3">
        <AnimatePresence>
          {actionItems.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => toggle(item)}
              className={`group flex items-start gap-4 p-5 rounded-[20px] cursor-pointer transition-all duration-200 border shadow-sm ${
                item.completed ? 'bg-zinc-50 border-zinc-200 opacity-60 hover:opacity-80' : 'bg-white border-zinc-200 hover:border-blue-200 hover:shadow-md'
              }`}
            >
              <div className="shrink-0 pt-0.5">
                {item.completed
                  ? <CheckCircle2 className="h-[22px] w-[22px] text-zinc-400" />
                  : <Circle className="h-[22px] w-[22px] text-zinc-300 group-hover:text-blue-400 transition-colors" />}
              </div>

              <div className="flex-1 min-w-0">
                <p className={`text-[15px] font-semibold leading-relaxed mb-3 ${
                  item.completed ? 'text-zinc-500 line-through' : 'text-zinc-900'
                }`}>
                  {item.task}
                </p>

                {/* Metadata pills */}
                {(item.owner || item.due_date) && (
                  <div className="flex items-center gap-2 flex-wrap">
                    {item.owner && (
                      <span className="flex items-center gap-1.5 text-[12px] font-bold px-3 py-1.5 rounded-lg bg-zinc-100 text-zinc-600">
                        <User className="h-[14px] w-[14px]" />
                        {item.owner}
                      </span>
                    )}
                    {item.due_date && (
                      <span className="flex items-center gap-1.5 text-[12px] font-bold px-3 py-1.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-100/50">
                        <Calendar className="h-[14px] w-[14px]" />
                        {item.due_date}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
