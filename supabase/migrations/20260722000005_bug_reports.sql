-- Bug reports submitted by users
CREATE TABLE IF NOT EXISTS bug_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT NOT NULL,
  contact TEXT,
  page TEXT,
  identifier TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE bug_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can insert bug reports" ON bug_reports;
CREATE POLICY "Public can insert bug reports" ON bug_reports FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view bug reports" ON bug_reports;
CREATE POLICY "Admins can view bug reports" ON bug_reports FOR SELECT TO authenticated USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);
