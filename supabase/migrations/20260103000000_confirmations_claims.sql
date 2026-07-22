-- Report confirmations (community "I have this too")
CREATE TABLE IF NOT EXISTS report_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(report_id, session_id)
);

CREATE INDEX IF NOT EXISTS idx_confirmations_report ON report_confirmations(report_id);
CREATE INDEX IF NOT EXISTS idx_confirmations_session ON report_confirmations(session_id);

-- Business claim requests (public submission, pending admin approval)
CREATE TABLE IF NOT EXISTS business_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('water_refilling','mineral_water_delivery','water_tanker','laundry_services')),
  address TEXT NOT NULL,
  barangay TEXT NOT NULL,
  contact TEXT,
  facebook TEXT,
  delivery_available BOOLEAN DEFAULT FALSE,
  operating_hours TEXT,
  coverage_area TEXT,
  estimated_fee TEXT,
  submitted_by_session TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_business_claims_status ON business_claims(status);

-- Track confirmation counts in reports table
ALTER TABLE reports ADD COLUMN IF NOT EXISTS confirmation_count INT NOT NULL DEFAULT 0;

-- Enable RLS
ALTER TABLE report_confirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_claims ENABLE ROW LEVEL SECURITY;

-- Public policies
CREATE POLICY "Public can insert confirmations" ON report_confirmations FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Public can view confirmations" ON report_confirmations FOR SELECT TO public USING (true);
CREATE POLICY "Public can insert business claims" ON business_claims FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Public can view business claims" ON business_claims FOR SELECT TO public USING (true);
CREATE POLICY "Admins can manage business claims" ON business_claims FOR ALL TO authenticated USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- Auto-update confirmation_count trigger
CREATE OR REPLACE FUNCTION update_confirmation_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE reports SET confirmation_count = confirmation_count + 1 WHERE id = NEW.report_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE reports SET confirmation_count = confirmation_count - 1 WHERE id = OLD.report_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_confirmation_count ON report_confirmations;
CREATE TRIGGER trg_confirmation_count
  AFTER INSERT OR DELETE ON report_confirmations
  FOR EACH ROW
  EXECUTE FUNCTION update_confirmation_count();
