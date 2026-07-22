-- Add 'stale', 'denied', 'approved' statuses to reports table
ALTER TABLE reports DROP CONSTRAINT IF EXISTS reports_status_check;
ALTER TABLE reports ADD CONSTRAINT reports_status_check
  CHECK (status IN ('submitted','under_review','approved','denied','community_confirmed','resolved','stale'));

-- Add denied_reason column
ALTER TABLE reports ADD COLUMN IF NOT EXISTS denied_reason TEXT;

-- Update the confirmation trigger to re-activate stale/resolved reports
CREATE OR REPLACE FUNCTION update_confirmation_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE reports SET
      confirmation_count = confirmation_count + 1,
      updated_at = NOW(),
      status = CASE WHEN status IN ('resolved', 'stale') THEN 'under_review' ELSE status END,
      resolved_at = CASE WHEN status IN ('resolved', 'stale') THEN NULL ELSE resolved_at END,
      verified = CASE WHEN status IN ('resolved', 'stale') THEN false ELSE verified END,
      denied = CASE WHEN status IN ('resolved', 'stale') THEN false ELSE denied END
    WHERE id = NEW.report_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE reports SET confirmation_count = confirmation_count - 1 WHERE id = OLD.report_id;
  END IF;
  RETURN NULL;
END;
$$;
