-- Add water_provider column to reports table
ALTER TABLE reports ADD COLUMN IF NOT EXISTS water_provider text NOT NULL DEFAULT 'unknown'
  CHECK (water_provider IN ('primewater', 'metro_pacific', 'other', 'unknown'));
