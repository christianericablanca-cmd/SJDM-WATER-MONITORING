-- Add water_storage to businesses category check constraint
ALTER TABLE businesses DROP CONSTRAINT IF EXISTS businesses_category_check;
ALTER TABLE businesses ADD CONSTRAINT businesses_category_check
  CHECK (category IN ('water_refilling','mineral_water_delivery','water_tanker','water_storage','laundry_services'));

-- Update full_schema.sql reference
COMMENT ON TABLE businesses IS 'categories: water_refilling, mineral_water_delivery, water_tanker, water_storage, laundry_services';
