UPDATE reports SET water_provider = 'primewater' WHERE water_provider IN ('other', 'unknown');

ALTER TABLE reports DROP CONSTRAINT IF EXISTS reports_water_provider_check;
ALTER TABLE reports ADD CONSTRAINT reports_water_provider_check CHECK (water_provider IN ('primewater', 'metro_pacific'));

ALTER TABLE reports ALTER COLUMN water_provider SET DEFAULT 'primewater';
