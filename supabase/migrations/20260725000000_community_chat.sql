-- Community chat (anonymous) tables

CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room TEXT NOT NULL DEFAULT 'sjdm',
  message TEXT NOT NULL,
  barangay TEXT,
  author_hash TEXT NOT NULL,
  author_label TEXT,
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_room_created_at ON chat_messages(room, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_author_hash ON chat_messages(author_hash);

CREATE TABLE IF NOT EXISTS chat_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  reason TEXT,
  reporter_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_reports_message_id ON chat_reports(message_id);

-- Enable RLS (API routes will write using service role, but we still lock down client access by default)
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_reports ENABLE ROW LEVEL SECURITY;

-- Read-only policy for messages (only non-deleted). Writes are via server routes.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'chat_messages' AND policyname = 'read_chat_messages'
  ) THEN
    CREATE POLICY read_chat_messages
      ON chat_messages
      FOR SELECT
      TO anon, authenticated
      USING (deleted = FALSE);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'chat_reports' AND policyname = 'no_client_access_chat_reports'
  ) THEN
    -- No select/insert/update/delete policies for chat_reports by default.
    -- Reports are created/read through server routes.
    CREATE POLICY no_client_access_chat_reports
      ON chat_reports
      FOR SELECT
      TO anon, authenticated
      USING (FALSE);
  END IF;
END $$;
