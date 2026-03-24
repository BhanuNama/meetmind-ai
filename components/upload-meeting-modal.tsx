'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  X, Upload, Mic, StopCircle, CheckCircle2, Loader2, FileAudio, Trash2,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

interface Props {
  open: boolean
  onOpenChange: (o: boolean) => void
  onMeetingCreated: () => void
}

type Step = 'form' | 'uploading' | 'processing' | 'done'

export function UploadMeetingModal({ open, onOpenChange, onMeetingCreated }: Props) {
  const [title, setTitle]         = useState('')
  const [file, setFile]           = useState<File | null>(null)
  const [audioUrl, setAudioUrl]   = useState<string | null>(null)
  const [isRecorded, setIsRecorded] = useState(false)
  const [dragging, setDragging]   = useState(false)
  const [recording, setRecording] = useState(false)
  const [recSecs, setRecSecs]     = useState(0)
  const [step, setStep]           = useState<Step>('form')
  const [progress, setProgress]   = useState(0)

  const fileRef     = useRef<HTMLInputElement>(null)
  const mediaRef    = useRef<MediaRecorder | null>(null)
  const chunksRef   = useRef<BlobPart[]>([])
  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null)

  // Revoke object URL on cleanup
  useEffect(() => () => { if (audioUrl) URL.revokeObjectURL(audioUrl) }, [audioUrl])

  const reset = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setTitle(''); setFile(null); setAudioUrl(null)
    setIsRecorded(false); setDragging(false)
    setRecording(false); setRecSecs(0)
    setStep('form'); setProgress(0)
    chunksRef.current = []
  }

  const close = () => { reset(); onOpenChange(false) }

  const pickFile = (f: File) => {
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setAudioUrl(URL.createObjectURL(f))
    setFile(f)
    setIsRecorded(false)
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '))
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files?.[0]
    if (f) pickFile(f)
  }, [title, audioUrl])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      chunksRef.current = []
      mr.ondataavailable = e => chunksRef.current.push(e.data)
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const name = `Recording ${new Date().toLocaleTimeString()}.webm`
        const f = new File([blob], name, { type: 'audio/webm' })
        if (audioUrl) URL.revokeObjectURL(audioUrl)
        const url = URL.createObjectURL(blob)
        setAudioUrl(url)
        setFile(f)
        setIsRecorded(true)
        if (!title) setTitle(name.replace(/\.[^.]+$/, ''))
        stream.getTracks().forEach(t => t.stop())
        if (timerRef.current) clearInterval(timerRef.current)
        setRecording(false)
      }
      mr.start()
      mediaRef.current = mr
      setRecording(true)
      setRecSecs(0)
      timerRef.current = setInterval(() => setRecSecs(s => s + 1), 1000)
    } catch {
      toast.error('Microphone access denied', {
        description: 'Allow microphone access in your browser settings.',
      })
    }
  }

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    mediaRef.current?.stop()
  }

  const discardAudio = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setFile(null)
    setAudioUrl(null)
    setIsRecorded(false)
    setRecSecs(0)
  }

  const submit = async () => {
    if (!title.trim() || !file) return
    setStep('uploading')

    let prog = 0
    const tick = setInterval(() => {
      prog = Math.min(prog + Math.random() * 10, 88)
      setProgress(prog)
    }, 350)

    try {
      // Step 1: create the meeting record to get a meetingId
      const createRes = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim() }),
      })
      if (!createRes.ok) {
        const e = await createRes.json()
        throw new Error(e.error ?? 'Failed to create meeting')
      }
      const { id: meetingId } = await createRes.json()

      // Step 2: upload audio with the meetingId
      // API reads: formData.get('file'), formData.get('meetingId'), formData.get('title')
      const fd = new FormData()
      fd.append('title', title.trim())
      fd.append('meetingId', meetingId)
      fd.append('file', file)           // must match formData.get('file') in the API

      const uploadRes = await fetch('/api/upload', { method: 'POST', body: fd })
      clearInterval(tick)
      if (!uploadRes.ok) {
        const e = await uploadRes.json()
        throw new Error(e.error ?? 'Upload failed')
      }
      setProgress(100)
      setStep('processing')
      setTimeout(() => {
        setStep('done')
        onMeetingCreated()
        setTimeout(close, 1800)
      }, 1200)
    } catch (err: any) {
      clearInterval(tick)
      toast.error(err.message ?? 'Upload failed')
      setStep('form')
      setProgress(0)
    }
  }

  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  if (!mounted) return null

  const modal = (
    <AnimatePresence>
      {open && <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ padding: '16px' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0"
          style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)' }}
          onClick={close}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />

        {/* Dialog */}
        <motion.div
          className="relative w-full flex flex-col"
          style={{
            maxWidth: 440,
            maxHeight: 'calc(100vh - 32px)',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 20,
            boxShadow: 'var(--shadow-lg)',
            overflow: 'hidden',
          }}
          initial={{ scale: 0.93, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.93, opacity: 0, y: 16 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 shrink-0"
            style={{ borderBottom: '1px solid var(--border)' }}>
            <div>
              <p className="text-[15px] font-black" style={{ color: 'var(--text-1)' }}>New Meeting</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>Upload audio or record live</p>
            </div>
            <button onClick={close}
              className="btn-ghost h-8 w-8 rounded-xl flex items-center justify-center">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Step indicator */}
          <div className="flex items-center px-5 pt-4 shrink-0">
            {(['Upload', 'Process', 'Done'] as const).map((label, i) => {
              const active = (step === 'form' || step === 'uploading') && i === 0
                          || step === 'processing' && i === 1
                          || step === 'done' && i === 2
              const done   = (step === 'processing' || step === 'done') && i === 0
                          || step === 'done' && i === 1
              return (
                <div key={label} className="flex items-center">
                  <div className="flex items-center gap-1.5">
                    <div className="h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-black transition-all duration-300"
                      style={{
                        background: done ? 'var(--success)' : active ? 'var(--accent)' : 'var(--surface-2)',
                        color:      done || active ? '#fff' : 'var(--text-3)',
                      }}>
                      {done ? '✓' : i + 1}
                    </div>
                    <span className="text-[11px] font-semibold transition-colors duration-300"
                      style={{ color: done ? 'var(--success)' : active ? 'var(--text-1)' : 'var(--text-3)' }}>
                      {label}
                    </span>
                  </div>
                  {i < 2 && <div className="w-8 h-px mx-2" style={{ background: 'var(--border-2)' }} />}
                </div>
              )
            })}
          </div>

          {/* Scrollable body */}
          <div className="overflow-y-auto flex-1 p-5">
            <AnimatePresence mode="wait">
              {(step === 'form' || step === 'uploading') && (
                <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="space-y-4">

                  {/* Title */}
                  <div>
                    <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--text-2)' }}>
                      Meeting title
                    </label>
                    <input
                      className="input-base w-full h-10 px-3 text-sm"
                      placeholder="e.g. Q2 Planning"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      disabled={step === 'uploading'}
                    />
                  </div>

                  {/* File / audio area */}
                  {!file ? (
                    <>
                      {/* Drop zone */}
                      <div
                        onDragOver={e => { e.preventDefault(); setDragging(true) }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={onDrop}
                        onClick={() => !recording && fileRef.current?.click()}
                        className="flex flex-col items-center justify-center gap-2 py-7 rounded-2xl transition-all duration-150 cursor-pointer"
                        style={{
                          border: `2px dashed ${dragging ? 'var(--accent)' : 'var(--border-2)'}`,
                          background: dragging ? 'var(--accent-light)' : 'var(--surface-2)',
                          opacity: recording ? 0.45 : 1,
                          pointerEvents: recording ? 'none' : 'auto',
                        }}
                      >
                        <div className="h-10 w-10 rounded-xl flex items-center justify-center"
                          style={{ background: 'var(--surface-3)' }}>
                          <Upload className="h-5 w-5" style={{ color: 'var(--text-2)' }} />
                        </div>
                        <p className="text-sm font-bold" style={{ color: 'var(--text-1)' }}>
                          {dragging ? 'Drop here' : 'Click or drop audio'}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-3)' }}>MP3, M4A, WAV, WebM · max 100 MB</p>
                        <input ref={fileRef} type="file" accept="audio/*" className="hidden"
                          onChange={e => e.target.files?.[0] && pickFile(e.target.files[0])} />
                      </div>

                      {/* Divider */}
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
                        <span className="text-xs font-semibold" style={{ color: 'var(--text-3)' }}>or record</span>
                        <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
                      </div>

                      {/* Record button */}
                      {recording ? (
                        <div className="rounded-2xl p-4 flex items-center justify-between"
                          style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger-border)' }}>
                          <div className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full animate-pulse" style={{ background: 'var(--danger)' }} />
                            <div>
                              <p className="text-sm font-bold" style={{ color: 'var(--text-1)' }}>Recording…</p>
                              <p className="text-xs font-mono" style={{ color: 'var(--danger)' }}>{fmt(recSecs)}</p>
                            </div>
                          </div>
                          <button
                            onClick={stopRecording}
                            className="flex items-center gap-2 h-9 px-4 rounded-xl text-sm font-semibold"
                            style={{ background: 'var(--danger)', color: '#fff' }}>
                            <StopCircle className="h-4 w-4" />
                            Stop
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={startRecording}
                          className="w-full h-10 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 btn-ghost"
                          style={{ border: '1.5px solid var(--border-2)' }}>
                          <Mic className="h-4 w-4" />
                          Start recording
                        </button>
                      )}
                    </>
                  ) : (
                    /* ── Audio preview ── */
                    <div className="rounded-2xl overflow-hidden"
                      style={{ border: '1px solid var(--border)' }}>
                      {/* File info */}
                      <div className="flex items-center gap-3 p-4"
                        style={{ borderBottom: audioUrl ? '1px solid var(--border)' : 'none' }}>
                        <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                          style={{ background: isRecorded ? 'var(--danger-bg)' : 'var(--accent-light)',
                                   border: `1px solid ${isRecorded ? 'var(--danger-border)' : 'var(--accent-border)'}` }}>
                          {isRecorded
                            ? <Mic className="h-5 w-5" style={{ color: 'var(--danger)' }} />
                            : <FileAudio className="h-5 w-5" style={{ color: 'var(--accent)' }} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold truncate" style={{ color: 'var(--text-1)' }}>{file.name}</p>
                          <p className="text-xs" style={{ color: 'var(--text-3)' }}>
                            {isRecorded ? `Recorded · ${fmt(recSecs)}` : `${(file.size / 1024 / 1024).toFixed(1)} MB`}
                          </p>
                        </div>
                        <button
                          onClick={discardAudio}
                          className="h-8 w-8 rounded-xl flex items-center justify-center transition-colors shrink-0"
                          style={{ color: 'var(--danger)', background: 'var(--danger-bg)' }}
                          title="Discard">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Audio player */}
                      {audioUrl && (
                        <div className="px-4 pb-4 pt-3">
                          <audio
                            controls
                            src={audioUrl}
                            className="w-full"
                            style={{ height: 36, borderRadius: 8 }}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Upload progress */}
                  {step === 'uploading' && (
                    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
                      <div className="flex justify-between text-[11px] font-semibold mb-1.5"
                        style={{ color: 'var(--text-3)' }}>
                        <span>Uploading to server…</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-3)' }}>
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: 'var(--accent)' }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.4 }}
                        />
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {step === 'processing' && (
                <motion.div key="processing" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }} className="flex flex-col items-center py-10 text-center gap-3">
                  <div className="h-14 w-14 rounded-2xl flex items-center justify-center"
                    style={{ background: 'var(--accent-light)', border: '1px solid var(--accent-border)' }}>
                    <Loader2 className="h-7 w-7 animate-spin" style={{ color: 'var(--accent)' }} />
                  </div>
                  <p className="text-[15px] font-black" style={{ color: 'var(--text-1)' }}>AI is processing</p>
                  <p className="text-sm leading-relaxed max-w-xs" style={{ color: 'var(--text-2)' }}>
                    Transcribing audio and extracting insights. Runs in the background — safe to close.
                  </p>
                </motion.div>
              )}

              {step === 'done' && (
                <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center py-10 text-center gap-3">
                  <motion.div
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 24 }}
                    className="h-14 w-14 rounded-2xl flex items-center justify-center"
                    style={{ background: 'var(--success-bg)', border: '1px solid var(--success-border)' }}>
                    <CheckCircle2 className="h-7 w-7" style={{ color: 'var(--success)' }} />
                  </motion.div>
                  <p className="text-[15px] font-black" style={{ color: 'var(--text-1)' }}>Meeting uploaded!</p>
                  <p className="text-sm" style={{ color: 'var(--text-3)' }}>AI will process it in the background.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          {(step === 'form' || step === 'uploading') && (
            <div className="flex justify-end gap-2 px-5 pb-5 pt-2 shrink-0"
              style={{ borderTop: '1px solid var(--border)' }}>
              <button onClick={close} className="btn-ghost h-9 px-4 rounded-xl text-sm font-semibold"
                style={{ border: '1.5px solid var(--border-2)' }}>
                Cancel
              </button>
              {step === 'uploading' ? (
                <button disabled className="btn-accent h-9 px-5 rounded-xl text-sm font-semibold flex items-center gap-2 opacity-70">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Uploading…
                </button>
              ) : (
                <button
                  onClick={submit}
                  disabled={!title.trim() || !file || recording}
                  className="btn-accent h-9 px-5 rounded-xl text-sm font-semibold flex items-center gap-2"
                  style={{ opacity: !title.trim() || !file || recording ? 0.45 : 1 }}
                >
                  <Upload className="h-3.5 w-3.5" />
                  Upload & Process
                </button>
              )}
            </div>
          )}
        </motion.div>
      </motion.div>}
    </AnimatePresence>
  )

  return createPortal(modal, document.body)
}
