ALTER TABLE reports ADD COLUMN IF NOT EXISTS submitted_by_fingerprint text;

CREATE INDEX IF NOT EXISTS idx_reports_fingerprint_active ON reports (submitted_by_fingerprint) WHERE status IN ('submitted', 'under_review', 'approved');
