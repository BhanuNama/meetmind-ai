'use client'

import { useState, useRef, useCallback } from 'react'
import { Mic, Square, Pause, Play, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface AudioRecorderProps {
  onRecordingComplete: (blob: Blob, filename: string) => void
}

type RecorderState = 'idle' | 'recording' | 'paused' | 'stopped'

export function AudioRecorder({ onRecordingComplete }: AudioRecorderProps) {
  const [state, setState] = useState<RecorderState>('idle')
  const [duration, setDuration] = useState(0)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0')
    const s = (secs % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm'

      const recorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = recorder
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType })
        const url = URL.createObjectURL(blob)
        setAudioUrl(url)
        setState('stopped')
        stream.getTracks().forEach((t) => t.stop())
        if (timerRef.current) clearInterval(timerRef.current)
      }

      recorder.start(250)
      setState('recording')

      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000)
    } catch (err) {
      console.error('Microphone access denied:', err)
      toast.error('Microphone access required', {
        description: 'Please allow microphone access in your browser settings and try again.',
      })
    }
  }, [])

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.pause()
      setState('paused')
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'paused') {
      mediaRecorderRef.current.resume()
      setState('recording')
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000)
    }
  }, [])

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop()
  }, [])

  const useRecording = useCallback(() => {
    if (!chunksRef.current.length) return
    const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
    const filename = `recording-${new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-')}.webm`
    onRecordingComplete(blob, filename)
    // Reset
    setState('idle')
    setDuration(0)
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setAudioUrl(null)
    chunksRef.current = []
  }, [audioUrl, onRecordingComplete])

  const discardRecording = useCallback(() => {
    setState('idle')
    setDuration(0)
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setAudioUrl(null)
    chunksRef.current = []
  }, [audioUrl])

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        {state === 'idle' && (
          <Button
            variant="outline"
            onClick={startRecording}
            className="gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <Mic className="h-4 w-4" />
            Record Audio
          </Button>
        )}

        {(state === 'recording' || state === 'paused') && (
          <>
            <div
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium',
                state === 'recording'
                  ? 'bg-red-50 border-red-200 text-red-700'
                  : 'bg-yellow-50 border-yellow-200 text-yellow-700'
              )}
            >
              <span
                className={cn(
                  'h-2 w-2 rounded-full',
                  state === 'recording' ? 'bg-red-500 animate-pulse' : 'bg-yellow-500'
                )}
              />
              {formatDuration(duration)}
            </div>

            {state === 'recording' ? (
              <Button variant="outline" size="icon" onClick={pauseRecording} className="h-9 w-9">
                <Pause className="h-4 w-4" />
              </Button>
            ) : (
              <Button variant="outline" size="icon" onClick={resumeRecording} className="h-9 w-9">
                <Play className="h-4 w-4" />
              </Button>
            )}

            <Button variant="outline" size="icon" onClick={stopRecording} className="h-9 w-9 border-red-200 text-red-600 hover:bg-red-50">
              <Square className="h-4 w-4" />
            </Button>
          </>
        )}

        {state === 'stopped' && (
          <>
            {audioUrl && (
              <audio src={audioUrl} controls className="h-8 flex-1 max-w-xs" />
            )}
            <Button onClick={useRecording} size="sm" className="gap-2 bg-indigo-600 hover:bg-indigo-700">
              <Upload className="h-3.5 w-3.5" />
              Use Recording
            </Button>
            <Button variant="ghost" size="sm" onClick={discardRecording} className="text-muted-foreground">
              Discard
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
