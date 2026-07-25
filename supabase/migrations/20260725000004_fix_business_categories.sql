-- Merge mineral_water_delivery into water_refilling + add water_storage

-- Migrate existing data
UPDATE businesses SET category = 'water_refilling' WHERE category = 'mineral_water_delivery';
UPDATE business_claims SET category = 'water_refilling' WHERE category = 'mineral_water_delivery';

-- Rebuild businesses check constraint
ALTER TABLE businesses DROP CONSTRAINT IF EXISTS businesses_category_check;
ALTER TABLE businesses ADD CONSTRAINT businesses_category_check
  CHECK (category IN ('water_refilling','water_tanker','water_storage','laundry_services'));

-- Rebuild business_claims check constraint
ALTER TABLE business_claims DROP CONSTRAINT IF EXISTS business_claims_category_check;
ALTER TABLE business_claims ADD CONSTRAINT business_claims_category_check
  CHECK (category IN ('water_refilling','water_tanker','water_storage','laundry_services'));

-- Update references
COMMENT ON TABLE businesses IS 'categories: water_refilling, water_tanker, water_storage, laundry_services';
COMMENT ON TABLE business_claims IS 'categories: water_refilling, water_tanker, water_storage, laundry_services';
