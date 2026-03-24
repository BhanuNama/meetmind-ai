<div align="center">

<br/>

# 🧠 MeetMind AI

**Turn every meeting into structured intelligence — automatically.**

MeetMind AI is a full-stack AI-powered meeting intelligence platform that transcribes audio recordings, extracts actionable insights, and lets you semantically search across all your meetings using natural language.

<br/>

[![Next.js](https://img.shields.io/badge/Next.js%2016-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Groq](https://img.shields.io/badge/Groq-F54E33?style=for-the-badge&logo=groq&logoColor=white)](https://groq.com/)
[![Clerk](https://img.shields.io/badge/Clerk-6C47FF?style=for-the-badge&logo=clerk&logoColor=white)](https://clerk.dev/)

</div>

---

## ✨ What It Does

Upload any meeting audio file and MeetMind AI automatically:

1. **Transcribes** the audio using OpenAI's Whisper (via Groq) with word-level timestamps
2. **Extracts** a structured AI summary — decisions, action items, blockers, and meeting sentiment
3. **Embeds** the transcript into a vector store for semantic search
4. **Answers** natural-language questions about your meetings via a RAG pipeline
5. **Emails** action items and summaries to attendees automatically

---

## 🚀 Features

### 🎙️ Audio Transcription
- Powered by **Whisper Large v3** via Groq's ultra-fast inference
- Supports **MP3, MP4, M4A, WAV, WebM, OGG** formats
- Returns word-level timestamps and segmented transcript with speaker metadata

### 🤖 AI Meeting Extraction
- Driven by **Llama 3.3 70B Versatile** (via Groq)
- Extracts in structured JSON (validated with **Zod**):
  - 📝 **Summary** — 2–4 sentence recap
  - ✅ **Action items** — with owner and due date
  - 🏛️ **Key decisions** made during the meeting
  - 🚧 **Blockers and risks** flagged
  - 💬 **Sentiment** — `positive`, `neutral`, or `tense`
- **Map-reduce chunking** for long transcripts: chunks are processed in parallel with Llama 3.1 8B, then merged by the 70B model for accuracy

### 🔍 Semantic Search & RAG
- Transcripts are chunked (150 words, 20-word overlap) and embedded using **`all-MiniLM-L6-v2`** from HuggingFace Transformers
- Embeddings are stored in **Supabase pgvector** and queried with cosine similarity
- Natural language questions are answered using a **Retrieval-Augmented Generation** pipeline — the AI cites the exact meetings its answer comes from
- Results are scored and color-coded by match confidence

### 📊 Live Dashboard
- Real-time meeting status polling (3s interval) while processing is in flight
- Stats: total meetings, processed count, in-progress count, and hours saved
- Animated meeting list with skeleton loading states (Framer Motion)
- Switchable view between **Meeting Activity** and **Semantic Search**

### 📋 Action Items Tracker
- View all action items across all meetings in one unified view
- Mark tasks as complete with optimistic UI updates
- Tracks owner, due date, and parent meeting

### 👥 Attendee Management & Email Notifications
- Add attendee emails per meeting
- Automated email delivery of summaries and action items via **Resend**
- Tracks notification timestamps per attendee

### 🔐 Authentication
- Full authentication via **Clerk** (sign up, sign in, session management)
- Webhook-based user sync to Supabase via **Svix**
- All data is strictly scoped to the authenticated user

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                         Next.js 16 App                        │
│                  (App Router + React 19 + TS)                 │
├────────────────────────────┬─────────────────────────────────┤
│        Frontend            │          API Routes              │
│  • Dashboard (stats, list) │  POST /api/upload                │
│  • Meeting detail view     │  GET  /api/meetings              │
│  • Semantic search (RAG)   │  GET  /api/meetings/[id]         │
│  • Action items tracker    │  DELETE /api/meetings/[id]       │
│  • Attendee management     │  POST /api/search                │
│  • Framer Motion UI        │  POST /api/action-items/[id]     │
│  • Clerk Auth              │  POST /api/webhook               │
└────────────────────────────┴─────────────────────────────────┘
                              │
              ┌───────────────┼───────────────────┐
              ▼               ▼                   ▼
       ┌─────────────┐ ┌────────────────┐ ┌──────────────┐
       │  Supabase   │ │  Groq Cloud    │ │  HuggingFace │
       │  (Postgres  │ │  Whisper v3    │ │  Transformers│
       │  + pgvector)│ │  Llama 3.3 70B │ │  MiniLM-L6   │
       └─────────────┘ └────────────────┘ └──────────────┘
              │
       ┌──────┴────────┐
       │    Resend     │
       │  (Email API)  │
       └───────────────┘
```

### AI Pipeline (per upload)

```
Audio File Upload
      │
      ▼
[1] transcribeAudio()          → Whisper Large v3 via Groq
      │
      ▼
[2] extractMeetingInsights()   → Llama 3.3 70B (map-reduce for long transcripts)
      │                           ├─ map:    Llama 3.1 8B (parallel per chunk)
      │                           └─ reduce: Llama 3.3 70B (dedup & merge)
      ▼
[3] embedAndStoreTranscript()  → MiniLM-L6-v2 → Supabase pgvector
      │
      ▼
[4] Store results in Supabase  → meetings, transcripts, action_items,
                                  decisions, meeting_extractions, meeting_embeddings
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript 5 |
| **UI** | React 19, Tailwind CSS v4, Framer Motion |
| **Components** | shadcn/ui, Lucide React, Sonner (toasts) |
| **Auth** | Clerk + Svix webhooks |
| **Database** | Supabase (PostgreSQL + pgvector) |
| **ORM/Client** | `@supabase/supabase-js` + `@supabase/ssr` |
| **AI - Transcription** | Groq Whisper Large v3 |
| **AI - Extraction** | Groq Llama 3.3 70B Versatile / Llama 3.1 8B Instant |
| **AI - Embeddings** | HuggingFace `all-MiniLM-L6-v2` (384-dim) |
| **AI - RAG Q&A** | Groq Llama 3.3 70B + Supabase `match_meeting_embeddings` RPC |
| **Email** | Resend |
| **Validation** | Zod |
| **Data Fetching** | TanStack Query v5 |
| **Dates** | date-fns |

---

## 📁 Project Structure

```
meetmind-ai/
├── app/
│   ├── (auth)/               # Clerk sign-in / sign-up pages
│   ├── api/
│   │   ├── meetings/         # CRUD for meetings
│   │   ├── upload/           # Audio upload + async AI pipeline
│   │   ├── search/           # Semantic search + RAG answer
│   │   ├── action-items/     # Action item completion toggle
│   │   └── webhook/          # Clerk → Supabase user sync
│   ├── dashboard/
│   │   ├── page.tsx          # Main dashboard (stats, meeting list, search)
│   │   ├── meetings/[id]/    # Full meeting detail (transcript, insights)
│   │   ├── action-items/     # Cross-meeting action item view
│   │   └── layout.tsx        # Sidebar layout
│   ├── globals.css           # Design system, CSS tokens
│   ├── layout.tsx            # Root layout with Clerk + theme providers
│   └── page.tsx              # Landing page
├── components/
│   ├── upload-meeting-modal.tsx   # Multi-step upload flow
│   ├── meeting-card.tsx           # Meeting list item
│   ├── search-box.tsx             # Semantic search UI + RAG results
│   ├── action-items.tsx           # Action item list with completion
│   ├── transcript-view.tsx        # Segmented transcript display
│   ├── attendees-manager.tsx      # Attendee CRUD + email trigger
│   ├── audio-recorder.tsx         # In-browser audio recording
│   ├── sidebar.tsx                # Dashboard navigation
│   └── ui/                        # shadcn/ui base components
├── lib/
│   ├── ai/
│   │   ├── transcribe.ts     # Groq Whisper transcription
│   │   ├── extract.ts        # Llama extraction + map-reduce
│   │   ├── embed.ts          # MiniLM embeddings + pgvector search
│   │   └── answer.ts         # RAG answer generation
│   ├── supabase/             # Supabase client (browser + server + service)
│   ├── email/                # Resend email templates
│   └── types.ts              # Shared TypeScript interfaces
└── supabase/
    ├── migrations/           # Database schema migrations
    └── functions/            # Supabase Edge Functions
```

---

## ⚙️ Getting Started

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com/) project with pgvector enabled
- A [Groq](https://console.groq.com/) API key
- A [Clerk](https://dashboard.clerk.com/) application
- A [Resend](https://resend.com/) API key

### 1. Clone the repository

```bash
git clone https://github.com/your-username/meetmind-ai.git
cd meetmind-ai
npm install
```

### 2. Configure environment variables

Copy the example file and fill in your credentials:

```bash
cp .env.local.example .env.local
```

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SECRET=

# Groq
GROQ_API_KEY=

# Resend
RESEND_API_KEY=
RESEND_FROM_EMAIL=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Set up the database

Run the migrations in your Supabase project:

```bash
# Enable pgvector extension in Supabase SQL editor:
create extension if not exists vector;
```

Apply the migration files in `supabase/migrations/` via the Supabase dashboard or CLI.

Create the semantic search RPC function:

```sql
create or replace function match_meeting_embeddings(
  query_embedding vector(384),
  match_threshold float,
  match_count int,
  filter_user_id text
)
returns table (
  id uuid,
  meeting_id uuid,
  chunk_text text,
  similarity float,
  meeting_title text,
  meeting_created_at timestamptz
)
language sql stable
as $$
  select
    me.id, me.meeting_id, me.chunk_text,
    1 - (me.embedding <=> query_embedding) as similarity,
    m.title as meeting_title,
    m.created_at as meeting_created_at
  from meeting_embeddings me
  join meetings m on m.id = me.meeting_id
  where m.user_id = filter_user_id
    and 1 - (me.embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
$$;
```

### 4. Run the development server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the app.

---

## 🗄️ Database Schema

| Table | Purpose |
|---|---|
| `meetings` | Core meeting records (title, status, duration, audio URL) |
| `transcripts` | Full transcript text + speaker segments JSON |
| `meeting_extractions` | AI-generated summary, sentiment, blockers |
| `action_items` | Tasks with owner, due date, completion status |
| `decisions` | Key decisions extracted from transcripts |
| `meeting_attendees` | Attendee emails + notification tracking |
| `meeting_embeddings` | 384-dim MiniLM vectors for semantic search (pgvector) |

---

## 🧪 Key Implementation Highlights

- **Map-Reduce Extraction** — Long transcripts (>12k chars) are split into overlapping 3k-char chunks, processed in parallel with Llama 3.1 8B, then merged and deduplicated by Llama 3.3 70B. This prevents context window overflows while preserving accuracy.

- **Real-time Status Polling** — The dashboard polls every 3 seconds only when meetings are `processing` or `pending`, and stops automatically when all are `done`.

- **Optimistic UI** — Deleting a meeting removes it from the list instantly, with a rollback on error — no loading spinners.

- **Retrieval-Augmented Generation** — The semantic search pipeline embeds the user's question, finds the top-5 cosine-similar transcript chunks, and feeds them as grounded context into Llama 3.3 70B, which cites its sources in the response.

- **Retry Logic** — The extraction pipeline retries up to 3× with exponential backoff on Groq API or JSON parse errors, ensuring reliability.

- **Server-Side Auth** — All API routes validate the Clerk session server-side and scope every DB query to `user_id`, ensuring strict data isolation.

---

## 📄 License

MIT License — feel free to use, modify, and distribute.

---

<div align="center">

Built with ❤️ using Next.js, Groq, Supabase, and Clerk.

</div>
