-- Add verified column to reports table
ALTER TABLE reports ADD COLUMN IF NOT EXISTS verified boolean NOT NULL DEFAULT false;

-- Index for quick filtering
CREATE INDEX IF NOT EXISTS idx_reports_verified ON reports (verified);

-- Backfill: mark all existing reports as verified so they remain visible
UPDATE reports SET verified = true WHERE verified = false;
