-- Reset community_confirmed reports to submitted
UPDATE reports SET status = 'submitted' WHERE status = 'community_confirmed';

-- Remove community_confirmed from the status CHECK constraint
ALTER TABLE reports DROP CONSTRAINT IF EXISTS reports_status_check;
ALTER TABLE reports ADD CONSTRAINT reports_status_check
  CHECK (status IN ('submitted','under_review','approved','denied','resolved','stale'));
