ALTER TABLE reports ADD COLUMN IF NOT EXISTS denied boolean DEFAULT false;

-- Existing reports with verified=false stay as not denied
UPDATE reports SET denied = false WHERE denied IS NULL;
