-- WaterWatch SJDM - Supabase Database Schema
-- Run this in the Supabase SQL Editor to set up the database.

-- 1. Reports table
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id_display TEXT UNIQUE NOT NULL,
  barangay TEXT NOT NULL,
  street_sitio TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  issue_type TEXT NOT NULL CHECK (issue_type IN ('no_water','low_pressure','dirty_water','water_leak','pipe_infrastructure','other')),
  description TEXT,
  photo_url TEXT,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted','under_review','community_confirmed','resolved')),
  started_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX idx_reports_barangay ON reports(barangay);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_created_at ON reports(created_at DESC);
CREATE INDEX idx_reports_issue_type ON reports(issue_type);

-- 2. Report sequence counter (for generating SJDM-WATER-XXXXX IDs)
CREATE TABLE report_sequence (
  id INT PRIMARY KEY DEFAULT 1,
  last_value INT NOT NULL DEFAULT 0
);

INSERT INTO report_sequence (id, last_value) VALUES (1, 0)
ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION get_next_report_sequence()
RETURNS INT
LANGUAGE plpgsql
AS $$
DECLARE
  next_val INT;
BEGIN
  UPDATE report_sequence SET last_value = last_value + 1 WHERE id = 1 RETURNING last_value INTO next_val;
  RETURN next_val;
END;
$$;

-- 3. Businesses table (assistance directory)
CREATE TABLE businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('water_refilling','mineral_water_delivery','water_tanker','laundry_services')),
  address TEXT NOT NULL,
  barangay TEXT NOT NULL,
  contact TEXT,
  facebook TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  last_verified TIMESTAMPTZ,
  delivery_available BOOLEAN,
  operating_hours TEXT,
  coverage_area TEXT,
  delivery_schedule TEXT,
  payment_options TEXT,
  estimated_fee TEXT,
  claimed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_businesses_category ON businesses(category);
CREATE INDEX idx_businesses_barangay ON businesses(barangay);
CREATE INDEX idx_businesses_verified ON businesses(verified);

-- 4. Announcements table
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'WaterWatch SJDM',
  is_official BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX idx_announcements_is_official ON announcements(is_official);
CREATE INDEX idx_announcements_created_at ON announcements(created_at DESC);

-- 5. Emergency contacts table
CREATE TABLE emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('water_provider','government','emergency')),
  phone TEXT,
  address TEXT,
  website TEXT,
  messenger TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Profiles table (for admin users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin','business')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_role ON profiles(role);

-- 7. Storage bucket for report photos
-- Run in Supabase Storage section:
-- Create bucket: report-photos
-- Set public: true
-- Max file size: 2MB
-- Allowed MIME types: image/jpeg, image/png, image/webp

-- 8. Row Level Security (RLS)
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Public can insert reports (for anonymous reporting)
CREATE POLICY "Public can insert reports" ON reports FOR INSERT TO public WITH CHECK (true);

-- Public can view limited report data
CREATE POLICY "Public can view reports" ON reports FOR SELECT TO public USING (true);

-- Only admins can update reports
CREATE POLICY "Admins can update reports" ON reports FOR UPDATE TO authenticated USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- Public can view businesses
CREATE POLICY "Public can view businesses" ON businesses FOR SELECT TO public USING (true);

-- Only admins can modify businesses
CREATE POLICY "Admins can insert businesses" ON businesses FOR INSERT TO authenticated WITH CHECK (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);
CREATE POLICY "Admins can update businesses" ON businesses FOR UPDATE TO authenticated USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- Public can view announcements
CREATE POLICY "Public can view announcements" ON announcements FOR SELECT TO public USING (true);

-- Only admins can modify announcements
CREATE POLICY "Admins can insert announcements" ON announcements FOR INSERT TO authenticated WITH CHECK (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);
CREATE POLICY "Admins can update announcements" ON announcements FOR UPDATE TO authenticated USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- Public can view emergency contacts
CREATE POLICY "Public can view emergency contacts" ON emergency_contacts FOR SELECT TO public USING (true);

-- Only admins can modify emergency contacts
CREATE POLICY "Admins can manage emergency contacts" ON emergency_contacts FOR ALL TO authenticated USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- Profiles visible to authenticated users
CREATE POLICY "Profiles visible to authenticated" ON profiles FOR SELECT TO authenticated USING (true);

-- 9. Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, role)
  VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
