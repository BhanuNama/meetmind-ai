'use client'

import { useState } from 'react'
import { Plus, X, Mail, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import type { MeetingAttendee } from '@/lib/types'

interface AttendeesManagerProps {
  meetingId: string
  attendees: MeetingAttendee[]
}

export function AttendeesManager({ meetingId, attendees: initialAttendees }: AttendeesManagerProps) {
  const [attendees, setAttendees] = useState(initialAttendees)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const addAttendee = async () => {
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Please enter a valid email address')
      return
    }

    setIsAdding(true)
    try {
      const res = await fetch(`/api/meetings/${meetingId}/attendees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), name: name.trim() || null }),
      })
      if (!res.ok) throw new Error('Failed to add attendee')
      const newAttendee = await res.json()
      setAttendees((prev) => [...prev, newAttendee])
      setEmail('')
      setName('')
      setShowForm(false)
      toast.success('Attendee added')
    } catch {
      toast.error('Failed to add attendee')
    } finally {
      setIsAdding(false)
    }
  }

  const removeAttendee = async (id: string) => {
    setAttendees((prev) => prev.filter((a) => a.id !== id))
    try {
      const res = await fetch(`/api/meetings/${meetingId}/attendees?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
    } catch {
      toast.error('Failed to remove attendee')
      // Note: reload attendees on error
    }
  }

  return (
    <div className="space-y-3">
      {attendees.length === 0 && !showForm ? (
        <p className="text-sm text-muted-foreground">No attendees added yet.</p>
      ) : (
        <div className="space-y-2">
          {attendees.map((a) => (
            <div key={a.id} className="flex items-center gap-2 p-2 rounded-lg border bg-background">
              <div className="h-7 w-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-semibold shrink-0">
                {(a.name ?? a.email)[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                {a.name && <p className="text-sm font-medium truncate">{a.name}</p>}
                <p className="text-xs text-muted-foreground truncate">{a.email}</p>
              </div>
              {a.notified_at && (
                <span className="flex items-center gap-1 text-xs text-green-600">
                  <CheckCircle className="h-3 w-3" />
                  Notified {formatDistanceToNow(new Date(a.notified_at), { addSuffix: true })}
                </span>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                onClick={() => removeAttendee(a.id)}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {showForm ? (
        <div className="space-y-2 p-3 rounded-lg border bg-muted/20">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name (optional)"
            className="h-8 text-sm"
          />
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            type="email"
            className="h-8 text-sm"
            onKeyDown={(e) => e.key === 'Enter' && addAttendee()}
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={addAttendee} disabled={isAdding} className="gap-1.5 h-7 text-xs bg-indigo-600 hover:bg-indigo-700">
              <Mail className="h-3 w-3" />
              Add
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowForm(false)} className="h-7 text-xs">
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowForm(true)}
          className="gap-1.5 h-8 text-xs"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Attendee
        </Button>
      )}
    </div>
  )
}
