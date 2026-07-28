-- Seed verified emergency contacts for SJDM, Bulacan
-- Sources: csjdm.gov.ph, bfp.gov.ph, pdrrmo.bulacan.gov.ph, sanjosewater.gov.ph

INSERT INTO emergency_contacts (name, category, phone, address, website, messenger)
SELECT * FROM (VALUES
  -- Water Providers
  ('San Jose Water (SJDM Water District)', 'water_provider', '0917-506-9797 / 044-815-0376', 'Road 1, Minuyan, San Jose del Monte, Bulacan', 'https://sanjosewater.gov.ph', NULL),
  ('San Jose Water — Francisco Homes Office', 'water_provider', '0917-506-9292 / 044-815-2171', 'Phase G, Francisco Homes, SJDM, Bulacan', 'https://sanjosewater.gov.ph', NULL),

  -- Government
  ('LGU Trunkline', 'government', '044-919-7370 to 79 / 044-919-7380 to 89', 'New Government Center, Dulong Bayan, SJDM, Bulacan', 'https://csjdm.gov.ph', NULL),
  ('SJDM LGU — Mayor''s Office', 'government', '(044) 815-2136 / 815-6469', 'New Government Center, Dulong Bayan, SJDM, Bulacan', 'https://csjdm.gov.ph', NULL),
  ('City Health Office (CHO)', 'government', '0956-986-9417', 'New Government Center, Dulong Bayan, SJDM, Bulacan', NULL, NULL),
  ('CTM-SCOO — Traffic Management', 'government', '0936-631-0799 / (044) 305-6474', 'New Government Center, Dulong Bayan, SJDM, Bulacan', NULL, NULL),

  -- Emergency Services
  ('CDRRMO — City Disaster Risk Reduction & Management', 'emergency', '0932-600-0119 / 0955-206-7200', 'CDRRMO Building, Sapang Palay Proper, SJDM, Bulacan', 'https://csjdm.gov.ph', 'https://m.me/csjdmdrrmo'),
  ('BFP — Bureau of Fire Protection SJDM', 'emergency', '0932-373-2444 / (044) 307-3503', 'Daang Barangay, Poblacion 1, SJDM, Bulacan', NULL, NULL),
  ('PNP — SJDM City Police Station', 'emergency', '0916-432-0401 / 0998-967-3210', 'SJDM Police Station, Bulacan', NULL, NULL),
  ('Bulacan 911 — Provincial Emergency Call Center', 'emergency', '(044) 791-0566 / 0905-333-3319', 'Provincial Capitol, Malolos, Bulacan', 'https://e911.gov.ph', NULL),
  ('CDRRMO Alternate Hotline', 'emergency', '0955-206-7200', 'CDRRMO Office, SJDM, Bulacan', NULL, NULL)
) AS v(name, category, phone, address, website, messenger)
WHERE NOT EXISTS (SELECT 1 FROM emergency_contacts LIMIT 1);
