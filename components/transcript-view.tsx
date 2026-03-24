'use client'

import { useState, useRef, useCallback } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { Transcript } from '@/lib/types'

interface TranscriptViewProps {
  transcript: Transcript
}

export function TranscriptView({ transcript }: TranscriptViewProps) {
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  const paragraphs = transcript.content
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)

  const highlight = useCallback(
    (text: string) => {
      if (!search.trim()) return <span>{text}</span>

      const parts = text.split(new RegExp(`(${escapeRegex(search)})`, 'gi'))
      return (
        <>
          {parts.map((part, i) =>
            part.toLowerCase() === search.toLowerCase() ? (
              <mark key={i} className="bg-yellow-200 text-yellow-900 rounded px-0.5">
                {part}
              </mark>
            ) : (
              <span key={i}>{part}</span>
            )
          )}
        </>
      )
    },
    [search]
  )

  const matchCount = search.trim()
    ? (transcript.content.match(new RegExp(escapeRegex(search), 'gi')) ?? []).length
    : 0

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search transcript…"
          className="pl-9 pr-9"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {search && (
        <p className="text-xs text-muted-foreground">
          {matchCount > 0 ? `${matchCount} match${matchCount !== 1 ? 'es' : ''} found` : 'No matches found'}
        </p>
      )}

      <div
        ref={containerRef}
        className="max-h-[500px] overflow-y-auto rounded-lg border bg-muted/20 p-4 space-y-3"
      >
        {paragraphs.map((para, i) => (
          <p
            key={i}
            className={cn(
              'text-sm leading-relaxed text-foreground/90',
              search && !para.toLowerCase().includes(search.toLowerCase()) && 'opacity-30'
            )}
          >
            {highlight(para)}
          </p>
        ))}
      </div>
    </div>
  )
}

function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
