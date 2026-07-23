-- Add resolved column to bug_reports table
ALTER TABLE bug_reports ADD COLUMN resolved boolean NOT NULL DEFAULT false;

-- Update existing rows to be unresolved
UPDATE bug_reports SET resolved = false WHERE resolved IS NULL;
