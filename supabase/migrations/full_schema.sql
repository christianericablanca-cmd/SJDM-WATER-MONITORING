-- ===== Full WaterWatch SJDM Schema (safe to re-run) =====

-- 1. Core tables
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id_display TEXT UNIQUE NOT NULL,
  barangay TEXT NOT NULL,
  street_sitio TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  issue_type TEXT NOT NULL CHECK (issue_type IN ('no_water','low_pressure','dirty_water','water_leak','pipe_infrastructure','other')),
  description TEXT,
  photo_url TEXT,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted','under_review','approved','denied','resolved','stale')),
  started_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS report_sequence (
  id INT PRIMARY KEY DEFAULT 1,
  last_value INT NOT NULL DEFAULT 0
);
INSERT INTO report_sequence (id, last_value) VALUES (1, 0) ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('water_refilling','mineral_water_delivery','water_tanker','laundry_services')),
  address TEXT NOT NULL,
  barangay TEXT NOT NULL,
  contact TEXT, facebook TEXT,
  latitude DOUBLE PRECISION, longitude DOUBLE PRECISION,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  last_verified TIMESTAMPTZ, delivery_available BOOLEAN,
  operating_hours TEXT, coverage_area TEXT, delivery_schedule TEXT, payment_options TEXT, estimated_fee TEXT,
  claimed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL, content TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'WaterWatch SJDM',
  is_official BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, category TEXT NOT NULL CHECK (category IN ('water_provider','government','emergency')),
  phone TEXT, address TEXT, website TEXT, messenger TEXT,
  latitude DOUBLE PRECISION, longitude DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin','business')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL, action TEXT NOT NULL DEFAULT 'submit_report',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS report_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(report_id, session_id)
);

CREATE TABLE IF NOT EXISTS business_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, category TEXT NOT NULL CHECK (category IN ('water_refilling','mineral_water_delivery','water_tanker','laundry_services')),
  address TEXT NOT NULL, barangay TEXT NOT NULL, contact TEXT, facebook TEXT,
  delivery_available BOOLEAN DEFAULT FALSE, operating_hours TEXT, coverage_area TEXT, estimated_fee TEXT,
  submitted_by_session TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  latitude DOUBLE PRECISION, longitude DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Indexes (IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_reports_barangay ON reports(barangay);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_issue_type ON reports(issue_type);
CREATE INDEX IF NOT EXISTS idx_reports_verified ON reports(verified);
CREATE INDEX IF NOT EXISTS idx_businesses_category ON businesses(category);
CREATE INDEX IF NOT EXISTS idx_businesses_barangay ON businesses(barangay);
CREATE INDEX IF NOT EXISTS idx_businesses_verified ON businesses(verified);
CREATE INDEX IF NOT EXISTS idx_announcements_is_official ON announcements(is_official);
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier_action ON rate_limits(identifier, action);
CREATE INDEX IF NOT EXISTS idx_rate_limits_created_at ON rate_limits(created_at);
CREATE INDEX IF NOT EXISTS idx_confirmations_report ON report_confirmations(report_id);
CREATE INDEX IF NOT EXISTS idx_confirmations_session ON report_confirmations(session_id);
CREATE INDEX IF NOT EXISTS idx_business_claims_status ON business_claims(status);

-- 3. Column additions (safe to re-run)
ALTER TABLE reports ADD COLUMN IF NOT EXISTS confirmation_count INT NOT NULL DEFAULT 0;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE reports ADD COLUMN IF NOT EXISTS water_provider text NOT NULL DEFAULT 'unknown' CHECK (water_provider IN ('primewater', 'metro_pacific', 'other', 'unknown'));
ALTER TABLE reports ADD COLUMN IF NOT EXISTS verified boolean NOT NULL DEFAULT false;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS denied boolean DEFAULT false;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS denied_reason TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS photo_url text;
ALTER TABLE business_claims ADD COLUMN IF NOT EXISTS photo_url text;
UPDATE reports SET denied = false WHERE denied IS NULL;

-- 4. RLS
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_confirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_claims ENABLE ROW LEVEL SECURITY;

-- 5. Policies (drop first to avoid duplicate errors)
DROP POLICY IF EXISTS "Public can insert reports" ON reports;
DROP POLICY IF EXISTS "Public can view reports" ON reports;
DROP POLICY IF EXISTS "Admins can update reports" ON reports;
CREATE POLICY "Public can insert reports" ON reports FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Public can view reports" ON reports FOR SELECT TO public USING (true);
CREATE POLICY "Admins can update reports" ON reports FOR UPDATE TO authenticated USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

DROP POLICY IF EXISTS "Public can view businesses" ON businesses;
DROP POLICY IF EXISTS "Admins can insert businesses" ON businesses;
DROP POLICY IF EXISTS "Admins can update businesses" ON businesses;
CREATE POLICY "Public can view businesses" ON businesses FOR SELECT TO public USING (true);
CREATE POLICY "Admins can insert businesses" ON businesses FOR INSERT TO authenticated WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Admins can update businesses" ON businesses FOR UPDATE TO authenticated USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

DROP POLICY IF EXISTS "Public can view announcements" ON announcements;
DROP POLICY IF EXISTS "Admins can insert announcements" ON announcements;
DROP POLICY IF EXISTS "Admins can update announcements" ON announcements;
CREATE POLICY "Public can view announcements" ON announcements FOR SELECT TO public USING (true);
CREATE POLICY "Admins can insert announcements" ON announcements FOR INSERT TO authenticated WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Admins can update announcements" ON announcements FOR UPDATE TO authenticated USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

DROP POLICY IF EXISTS "Public can view emergency contacts" ON emergency_contacts;
DROP POLICY IF EXISTS "Admins can manage emergency contacts" ON emergency_contacts;
CREATE POLICY "Public can view emergency contacts" ON emergency_contacts FOR SELECT TO public USING (true);
CREATE POLICY "Admins can manage emergency contacts" ON emergency_contacts FOR ALL TO authenticated USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

DROP POLICY IF EXISTS "Profiles visible to authenticated" ON profiles;
CREATE POLICY "Profiles visible to authenticated" ON profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Public can insert confirmations" ON report_confirmations;
DROP POLICY IF EXISTS "Public can view confirmations" ON report_confirmations;
CREATE POLICY "Public can insert confirmations" ON report_confirmations FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Public can view confirmations" ON report_confirmations FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Public can insert business claims" ON business_claims;
DROP POLICY IF EXISTS "Public can view business claims" ON business_claims;
DROP POLICY IF EXISTS "Admins can manage business claims" ON business_claims;
CREATE POLICY "Public can insert business claims" ON business_claims FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Public can view business claims" ON business_claims FOR SELECT TO public USING (true);
CREATE POLICY "Admins can manage business claims" ON business_claims FOR ALL TO authenticated USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- 6. Functions & triggers
CREATE OR REPLACE FUNCTION get_next_report_sequence() RETURNS INT LANGUAGE plpgsql AS $$
DECLARE next_val INT; BEGIN UPDATE report_sequence SET last_value = last_value + 1 WHERE id = 1 RETURNING last_value INTO next_val; RETURN next_val; END;
$$;

CREATE OR REPLACE FUNCTION cleanup_rate_limits() RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN DELETE FROM rate_limits WHERE created_at < NOW() - INTERVAL '24 hours'; END; $$;

CREATE OR REPLACE FUNCTION handle_new_user() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$ BEGIN INSERT INTO public.profiles (id, role) VALUES (NEW.id, 'user'); RETURN NEW; END; $$;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE OR REPLACE FUNCTION update_confirmation_count() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN IF TG_OP = 'INSERT' THEN UPDATE reports SET confirmation_count = confirmation_count + 1, updated_at = NOW(), status = CASE WHEN status IN ('resolved', 'stale') THEN 'under_review' ELSE status END, resolved_at = CASE WHEN status IN ('resolved', 'stale') THEN NULL ELSE resolved_at END, verified = CASE WHEN status IN ('resolved', 'stale') THEN false ELSE verified END WHERE id = NEW.report_id; ELSIF TG_OP = 'DELETE' THEN UPDATE reports SET confirmation_count = confirmation_count - 1 WHERE id = OLD.report_id; END IF; RETURN NULL; END; $$;
DROP TRIGGER IF EXISTS trg_confirmation_count ON report_confirmations;
CREATE TRIGGER trg_confirmation_count AFTER INSERT OR DELETE ON report_confirmations FOR EACH ROW EXECUTE FUNCTION update_confirmation_count();
