'use client'

import { useState, useEffect } from 'react'
import { CheckSquare, Calendar, User, Clock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import type { ActionItem } from '@/lib/types'

type ActionWithMeeting = ActionItem & { meeting_title?: string; meeting_id: string }

export default function ActionItemsPage() {
  const [actions, setActions] = useState<ActionWithMeeting[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/action-items')
      .then(res => res.json())
      .then(data => {
        if (!Array.isArray(data)) throw new Error('Invalid response')
        setActions(data)
      })
      .catch(() => toast.error('Failed to load action items'))
      .finally(() => setLoading(false))
  }, [])

  const toggleComplete = async (action: ActionWithMeeting) => {
    const isCompleted = !action.completed
    setActions(actions.map(a => a.id === action.id ? { ...a, completed: isCompleted } : a))
    try {
      await fetch(`/api/meetings/${action.meeting_id}/actions/${action.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: isCompleted })
      })
    } catch {
      toast.error('Failed to update status')
      setActions(actions.map(a => a.id === action.id ? { ...a, completed: action.completed } : a))
    }
  }

  const completedCount = actions.filter(a => a.completed).length
  const pendingCount = actions.length - completedCount

  return (
    <div className="p-6 sm:p-10 flex flex-col min-h-full bg-white relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 mb-10 w-full mt-2">
        <div>
          <h3 className="text-[26px] sm:text-[30px] font-bold tracking-tight text-zinc-900 mb-1.5 leading-none">
            Action Items
          </h3>
          <p className="text-[15px] text-zinc-500 font-medium tracking-tight">Track tasks assigned across all your meetings</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10 shrink-0">
        {[
          { label: 'Total Tasks', val: actions.length, color: 'text-zinc-900', sub: 'overall' },
          { label: 'Pending', val: pendingCount, color: 'text-rose-500', sub: 'needs action' },
          { label: 'Completed', val: completedCount, color: 'text-emerald-500', sub: 'done' },
        ].map((s: any) => (
          <div key={s.label} className="p-6 rounded-[24px] bg-[#FAFAFC] border border-zinc-100 flex flex-col justify-between shadow-[0_2px_10px_rgba(0,0,0,0.01)] h-[140px]">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-white rounded-[10px] shadow-sm border border-zinc-100">
                <CheckSquare className="w-[16px] h-[16px] text-zinc-500" />
              </div>
              <span className="text-[13px] font-bold tracking-tight text-zinc-500">{s.label}</span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-[34px] font-black tracking-tight text-zinc-900 leading-none">{s.val}</span>
              <span className={`text-[12px] font-bold ${s.color}`}>{s.sub}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex-1 bg-white rounded-[24px] border border-zinc-100 bg-[#FAFAFC] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-zinc-100">
          <h4 className="font-bold text-[15px] text-zinc-900">Your Action Items</h4>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
             <div className="space-y-3">
               {[1,2,3].map(i => <div key={i} className="h-16 bg-zinc-100 rounded-xl animate-pulse" />)}
             </div>
          ) : actions.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center h-full">
               <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 text-emerald-500">
                  <CheckSquare className="w-6 h-6" />
               </div>
               <h3 className="text-[16px] font-bold text-zinc-900 mb-1">No tasks yet</h3>
               <p className="text-[14px] text-zinc-500 max-w-sm">Capture meetings and AI will automatically extract tasks assigned to you.</p>
            </div>
          ) : (
             <div className="space-y-3">
               <AnimatePresence>
                 {actions.map((item, i) => (
                   <motion.div key={item.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className={`flex items-start gap-4 p-4 rounded-2xl bg-white border border-black/5 shadow-sm transition-opacity ${item.completed ? 'opacity-60' : 'opacity-100'}`}>
                     <button onClick={() => toggleComplete(item)} className={`shrink-0 mt-0.5 w-6 h-6 rounded-[8px] border-2 flex items-center justify-center transition-colors ${item.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-zinc-300 hover:border-zinc-400'}`}>
                       {item.completed && <CheckSquare className="w-3.5 h-3.5" />}
                     </button>
                     <div className="flex-1">
                       <p className={`text-[15px] font-semibold mb-2 ${item.completed ? 'line-through text-zinc-400' : 'text-zinc-900'}`}>{item.task}</p>
                       <div className="flex flex-wrap items-center gap-3 text-[12px] font-medium text-zinc-500">
                         {item.owner && (
                           <div className="flex items-center gap-1.5 px-2 py-1 bg-zinc-100 rounded-md text-zinc-600">
                             <User className="w-3.5 h-3.5" />
                             {item.owner}
                           </div>
                         )}
                         {item.due_date && (
                           <div className="flex items-center gap-1.5 px-2 py-1 bg-rose-50 rounded-md text-rose-600">
                             <Calendar className="w-3.5 h-3.5" />
                             {item.due_date}
                           </div>
                         )}
                         <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 rounded-md text-blue-600 truncate max-w-[200px]">
                           <Clock className="w-3.5 h-3.5" />
                           From: {item.meeting_title}
                         </div>
                       </div>
                     </div>
                   </motion.div>
                 ))}
               </AnimatePresence>
             </div>
          )}
        </div>
      </div>
    </div>
  )
}
