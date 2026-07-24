-- Add reported user info to chat_reports
ALTER TABLE chat_reports ADD COLUMN IF NOT EXISTS author_hash TEXT;
ALTER TABLE chat_reports ADD COLUMN IF NOT EXISTS author_label TEXT;

CREATE INDEX IF NOT EXISTS idx_chat_reports_author_hash ON chat_reports(author_hash);

-- Table for blocked users (by fingerprint/IP hash)
CREATE TABLE IF NOT EXISTS chat_blocks (
  author_hash TEXT PRIMARY KEY,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE chat_blocks ENABLE ROW LEVEL SECURITY;
