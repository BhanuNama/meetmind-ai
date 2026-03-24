'use client'

import { SearchBox } from '@/components/search-box'
import { Sparkles, Search } from 'lucide-react'

export default function SearchPage() {
  return (
    <div className="p-6 sm:p-10 flex flex-col min-h-full bg-white relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 mb-10 w-full mt-2">
        <div>
          <h3 className="text-[26px] sm:text-[30px] font-bold tracking-tight text-zinc-900 mb-1.5 leading-none">
            Semantic Search
          </h3>
          <p className="text-[15px] text-zinc-500 font-medium tracking-tight">Ask questions in plain English across all your meetings</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10 shrink-0">
        <div className="p-6 rounded-[24px] bg-[#FAFAFC] border border-zinc-100 flex flex-col justify-between shadow-[0_2px_10px_rgba(0,0,0,0.01)] min-h-[140px]">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-white rounded-[10px] shadow-sm border border-zinc-100">
              <Sparkles className="w-[16px] h-[16px] text-blue-500" />
            </div>
            <span className="text-[13px] font-bold tracking-tight text-zinc-500">AI Powered</span>
          </div>
          <p className="text-[15px] font-semibold text-zinc-900 leading-[1.4]">
            Using pgvector embeddings to understand the meaning behind your queries, not just matching keywords.
          </p>
        </div>
        <div className="p-6 rounded-[24px] bg-[#FAFAFC] border border-zinc-100 flex flex-col justify-between shadow-[0_2px_10px_rgba(0,0,0,0.01)] min-h-[140px]">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-white rounded-[10px] shadow-sm border border-zinc-100">
              <Search className="w-[16px] h-[16px] text-zinc-500" />
            </div>
            <span className="text-[13px] font-bold tracking-tight text-zinc-500">Global Context</span>
          </div>
          <p className="text-[15px] font-semibold text-zinc-900 leading-[1.4]">
            Search across your entire history of transcripts to synthesize cross-meeting knowledge.
          </p>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-[24px] border border-zinc-100 bg-[#FAFAFC] overflow-hidden flex flex-col pt-10 px-4 sm:px-10 pb-10">
        <SearchBox />
      </div>
    </div>
  )
}
