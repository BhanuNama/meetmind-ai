export type MeetingStatus = 'pending' | 'processing' | 'done' | 'failed'
export type MeetingSentiment = 'positive' | 'neutral' | 'tense'

export interface Meeting {
  id: string
  user_id: string
  title: string
  audio_url: string | null
  duration_seconds: number | null
  status: MeetingStatus
  error_message: string | null
  created_at: string
  updated_at: string
}

export interface Transcript {
  id: string
  meeting_id: string
  content: string
  speakers_json: SpeakerSegment[] | null
  created_at: string
}

export interface SpeakerSegment {
  speaker: string
  start: number
  end: number
  text: string
}

export interface ActionItem {
  id: string
  meeting_id: string
  task: string
  owner: string | null
  due_date: string | null
  completed: boolean
  created_at: string
}

export interface Decision {
  id: string
  meeting_id: string
  decision_text: string
  context: string | null
  created_at: string
}

export interface MeetingExtraction {
  id: string
  meeting_id: string
  summary: string | null
  blockers: string[]
  sentiment: MeetingSentiment | null
  created_at: string
}

export interface MeetingAttendee {
  id: string
  meeting_id: string
  email: string
  name: string | null
  notified_at: string | null
  created_at: string
}

export interface MeetingFull extends Meeting {
  transcript?: Transcript
  action_items?: ActionItem[]
  decisions?: Decision[]
  extraction?: MeetingExtraction
  attendees?: MeetingAttendee[]
}

export interface SearchResult {
  id: string
  meeting_id: string
  chunk_text: string
  similarity: number
  meeting_title: string
  meeting_created_at: string
}

export interface LLMExtractionResult {
  summary: string
  decisions: string[]
  action_items: Array<{
    task: string
    owner: string | null
    due_date: string | null
  }>
  blockers: string[]
  sentiment: MeetingSentiment
}
