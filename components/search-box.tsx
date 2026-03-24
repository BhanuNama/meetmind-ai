'use client'

import { useState } from 'react'
import { Search, Sparkles, Loader2, ArrowUpRight, Brain } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { toast } from 'sonner'

interface SearchResult {
  meetingId:   string
  meetingTitle: string
  chunk:        string
  similarity:   number
}

interface SearchResponse {
  answer:  string
  sources: SearchResult[]
}

export function SearchBox() {
  const [query, setQuery]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [result, setResult]     = useState<SearchResponse | null>(null)

  const search = async () => {
    if (!query.trim()) return
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      })
      if (!res.ok) {
        const e = await res.json()
        throw new Error(e.error ?? 'Search failed')
      }
      setResult(await res.json())
    } catch (err: any) {
      toast.error(err.message ?? 'Search failed')
    } finally {
      setLoading(false)
    }
  }

  const pct = (s: number) => `${Math.round(s * 100)}%`
  const scoreColor = (s: number) =>
    s > 0.75 ? 'text-emerald-600 bg-emerald-50' : s > 0.5 ? 'text-blue-600 bg-blue-50' : 'text-zinc-500 bg-zinc-100'

  return (
    <div className="space-y-6 w-full max-w-4xl mx-auto">
      {/* Input */}
      <div className="relative flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-zinc-400 group-focus-within:text-blue-500 transition-colors" />
          <input
            className="w-full h-14 pl-12 pr-4 text-[15px] font-medium text-zinc-900 bg-white border border-zinc-200 rounded-[20px] shadow-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all placeholder:text-zinc-400 placeholder:font-normal"
            placeholder="Ask anything… e.g. 'What was agreed about the mobile app?'"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search()}
          />
        </div>
        <button
          onClick={search}
          disabled={loading || !query.trim()}
          className="bg-zinc-900 text-white h-14 px-8 rounded-[20px] text-[15px] font-semibold flex items-center justify-center gap-2.5 transition-all hover:bg-black active:scale-95 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 className="h-[18px] w-[18px] animate-spin" /> : <Sparkles className="h-[18px] w-[18px]" />}
          {loading ? 'Searching…' : 'Search'}
        </button>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* AI Answer */}
            {result.answer && (
              <div className="rounded-[24px] overflow-hidden bg-white border border-blue-100 shadow-[0_8px_30px_rgba(59,130,246,0.08)]">
                <div className="flex items-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-50 to-white border-b border-blue-100">
                  <Brain className="h-5 w-5 text-blue-600" />
                  <p className="text-[15px] font-bold text-zinc-900">AI Answer</p>
                </div>
                <div className="px-6 py-6">
                  <p className="text-[16px] leading-[1.7] text-zinc-700 font-medium">
                    {result.answer}
                  </p>
                </div>
              </div>
            )}

            {/* Sources */}
            {result.sources.length > 0 && (
              <div>
                <p className="text-[12px] font-bold uppercase tracking-[0.15em] mb-4 text-zinc-500 pl-2">
                  {result.sources.length} Context Source{result.sources.length > 1 ? 's' : ''}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.sources.map((src, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="group p-5 rounded-[20px] bg-[#FAFAFC] border border-zinc-100 shadow-sm hover:shadow-md hover:border-zinc-200 transition-all cursor-pointer flex flex-col"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <Link href={`/dashboard/meetings/${src.meetingId}`}
                          className="flex items-center gap-1.5 hover:underline"
                          onClick={e => e.stopPropagation()}>
                          <p className="text-[14px] font-bold text-zinc-900 line-clamp-1 pr-2">
                            {src.meetingTitle}
                          </p>
                        </Link>
                        <span className={`text-[11px] font-black px-2.5 py-1 rounded-lg shrink-0 ${scoreColor(src.similarity)}`}>
                          {pct(src.similarity)} Match
                        </span>
                      </div>
                      <p className="text-[13px] leading-[1.6] text-zinc-500 line-clamp-4 font-medium italic">
                        "{src.chunk}"
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {!result.answer && result.sources.length === 0 && (
              <div className="flex flex-col items-center py-20 text-center bg-[#FAFAFC] rounded-[32px] border border-zinc-100">
                <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-5 border border-zinc-100">
                  <Search className="h-6 w-6 text-zinc-400" />
                </div>
                <p className="text-[18px] font-bold text-zinc-900 mb-2">No matches found</p>
                <p className="text-[15px] text-zinc-500 max-w-sm">
                  Try rephrasing your question or make sure your meetings have finished processing.
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
