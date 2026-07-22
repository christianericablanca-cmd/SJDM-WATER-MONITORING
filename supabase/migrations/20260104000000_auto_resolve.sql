-- Auto-resolve: add updated_at for tracking last confirmation
ALTER TABLE reports ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Update the confirmation trigger to also set updated_at and re-activate resolved reports (requires admin re-approval)
CREATE OR REPLACE FUNCTION update_confirmation_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE reports SET
      confirmation_count = confirmation_count + 1,
      updated_at = NOW(),
      status = CASE WHEN status IN ('resolved', 'stale') THEN 'under_review' ELSE status END,
      resolved_at = CASE WHEN status IN ('resolved', 'stale') THEN NULL ELSE resolved_at END,
      verified = CASE WHEN status IN ('resolved', 'stale') THEN false ELSE verified END
    WHERE id = NEW.report_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE reports SET confirmation_count = confirmation_count - 1 WHERE id = OLD.report_id;
  END IF;
  RETURN NULL;
END;
$$;
