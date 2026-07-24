-- Index for auto-cleanup query (deleted=false + old creation date)
CREATE INDEX IF NOT EXISTS idx_chat_messages_cleanup ON chat_messages(deleted, created_at) WHERE deleted = FALSE;
