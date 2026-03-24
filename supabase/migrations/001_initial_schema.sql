-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Users table (synced from Clerk via webhook)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY, -- Clerk user ID
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Meetings table
CREATE TABLE IF NOT EXISTS meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled Meeting',
  audio_url TEXT,
  duration_seconds INTEGER,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'done', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transcripts table
CREATE TABLE IF NOT EXISTS transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE UNIQUE,
  content TEXT NOT NULL,
  speakers_json JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Action items table
CREATE TABLE IF NOT EXISTS action_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  task TEXT NOT NULL,
  owner TEXT,
  due_date DATE,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Decisions table
CREATE TABLE IF NOT EXISTS decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  decision_text TEXT NOT NULL,
  context TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Meeting extractions (summary, blockers, sentiment)
CREATE TABLE IF NOT EXISTS meeting_extractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE UNIQUE,
  summary TEXT,
  blockers JSONB DEFAULT '[]',
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'tense')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Meeting embeddings for RAG search
CREATE TABLE IF NOT EXISTS meeting_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
  chunk_text TEXT NOT NULL,
  embedding vector(1536),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- HNSW index for fast cosine similarity search
CREATE INDEX IF NOT EXISTS meeting_embeddings_hnsw_idx
  ON meeting_embeddings USING hnsw (embedding vector_cosine_ops);

-- Meeting attendees
CREATE TABLE IF NOT EXISTS meeting_attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(meeting_id, email)
);

-- Processing jobs queue
CREATE TABLE IF NOT EXISTS processing_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'done', 'failed')),
  error TEXT,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER meetings_updated_at
  BEFORE UPDATE ON meetings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER processing_jobs_updated_at
  BEFORE UPDATE ON processing_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_extractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE processing_jobs ENABLE ROW LEVEL SECURITY;

-- Users can read/update their own profile
CREATE POLICY "Users own profile" ON users
  FOR ALL USING (id = auth.uid()::TEXT);

-- Meetings: users can only see their own
CREATE POLICY "Users own meetings" ON meetings
  FOR ALL USING (user_id = auth.uid()::TEXT);

-- Related tables inherit meeting ownership check
CREATE POLICY "Meeting owner transcripts" ON transcripts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM meetings WHERE meetings.id = meeting_id AND meetings.user_id = auth.uid()::TEXT)
  );

CREATE POLICY "Meeting owner action items" ON action_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM meetings WHERE meetings.id = meeting_id AND meetings.user_id = auth.uid()::TEXT)
  );

CREATE POLICY "Meeting owner decisions" ON decisions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM meetings WHERE meetings.id = meeting_id AND meetings.user_id = auth.uid()::TEXT)
  );

CREATE POLICY "Meeting owner extractions" ON meeting_extractions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM meetings WHERE meetings.id = meeting_id AND meetings.user_id = auth.uid()::TEXT)
  );

CREATE POLICY "Meeting owner embeddings" ON meeting_embeddings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM meetings WHERE meetings.id = meeting_id AND meetings.user_id = auth.uid()::TEXT)
  );

CREATE POLICY "Meeting owner attendees" ON meeting_attendees
  FOR ALL USING (
    EXISTS (SELECT 1 FROM meetings WHERE meetings.id = meeting_id AND meetings.user_id = auth.uid()::TEXT)
  );

CREATE POLICY "Meeting owner jobs" ON processing_jobs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM meetings WHERE meetings.id = meeting_id AND meetings.user_id = auth.uid()::TEXT)
  );

-- Semantic search function
CREATE OR REPLACE FUNCTION match_meeting_embeddings(
  query_embedding vector(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5,
  filter_user_id TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  meeting_id UUID,
  chunk_text TEXT,
  similarity FLOAT,
  meeting_title TEXT,
  meeting_created_at TIMESTAMPTZ
)
LANGUAGE sql STABLE
AS $$
  SELECT
    me.id,
    me.meeting_id,
    me.chunk_text,
    1 - (me.embedding <=> query_embedding) AS similarity,
    m.title AS meeting_title,
    m.created_at AS meeting_created_at
  FROM meeting_embeddings me
  JOIN meetings m ON m.id = me.meeting_id
  WHERE
    (filter_user_id IS NULL OR m.user_id = filter_user_id)
    AND 1 - (me.embedding <=> query_embedding) > match_threshold
  ORDER BY me.embedding <=> query_embedding
  LIMIT match_count;
$$;
