-- Add photo_url to businesses and business_claims
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS photo_url text;
ALTER TABLE business_claims ADD COLUMN IF NOT EXISTS photo_url text;
