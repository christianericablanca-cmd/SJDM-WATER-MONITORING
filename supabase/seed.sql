-- Seed data for WaterWatch SJDM
-- Run after the main schema.

-- Barangay reference coordinates (approximate centers)
-- Used as defaults when exact location isn't provided
-- This is a reference table, not used directly by the app

-- Emergency Contacts (verified from csjdm.gov.ph, bfp.gov.ph, pdrrmo.bulacan.gov.ph)
INSERT INTO emergency_contacts (name, category, phone, address, website) VALUES
('Metro Pacific Bulacan Water', 'water_provider', NULL, 'San Jose del Monte, Bulacan', 'https://facebook.com/metropacificsjdm'),
('CDRRMO — City Disaster Risk Reduction Office', 'emergency', '0936-600-0119 / 0955-206-7200', 'New Government Center, Dulong Bayan, SJDM', NULL),
('BFP — Bureau of Fire Protection', 'emergency', '0932-373-2444 / (044) 307-3503', 'Daang Barangay, Poblacion 1, SJDM', NULL),
('PNP — City Police Station', 'emergency', '0916-432-0401 / 0998-967-3210', 'SJDM Police Station', NULL),
('City Health Office (CHO)', 'emergency', '0956-986-9417', 'City Health Office, SJDM', NULL),
('CTM-SCOO — Traffic Management', 'government', '0936-631-0799 / (044) 305-6474', 'New Government Center, Dulong Bayan, SJDM', NULL),
('LGU Trunkline', 'government', '044-919-7370 to 89', 'New Government Center, Dulong Bayan, SJDM', NULL),
('SJDM LGU — Mayor''s Office', 'government', '(044) 815-2136 / 815-6469', 'New Government Center, Dulong Bayan, SJDM', 'https://csjdm.gov.ph'),
('Provincial DRRMO (Bulacan)', 'emergency', '911 / (044) 791-0566', 'Provincial Capitol, Malolos, Bulacan', 'https://pdrrmo.bulacan.gov.ph'),
('CDRRMO Alternate Hotline', 'emergency', '0955-206-7200', 'CDRRMO Office, SJDM', NULL)
ON CONFLICT DO NOTHING;

-- Sample businesses (assistance directory)
INSERT INTO businesses (name, category, address, barangay, contact, verified, delivery_available, operating_hours) VALUES
('AquaPure Refilling Station', 'water_refilling', 'Block 1 Lot 2, Muzon', 'Muzon', '0917-123-1111', true, true, '6:00 AM - 8:00 PM'),
('ClearWater Delivery', 'mineral_water_delivery', 'Unit 3, Graceville Commercial', 'Graceville', '0918-222-3333', true, true, '7:00 AM - 6:00 PM'),
('Tanker Express SJDM', 'water_tanker', 'Sapang Palay Road', 'Sapang Palay', '0920-444-5555', true, true, '24 hours'),
('Wash & Fold Laundry', 'laundry_services', 'Minuyan Proper', 'Minuyan', '0921-666-7777', true, true, '8:00 AM - 7:00 PM'),
('H2O Station', 'water_refilling', 'Kaypian Market', 'Kaypian', '0923-888-9999', true, false, '6:00 AM - 9:00 PM'),
('SpringFresh Delivery', 'mineral_water_delivery', 'Tungkong Mangga', 'Tungkong Mangga', '0925-000-1111', true, true, '7:00 AM - 5:00 PM')
ON CONFLICT DO NOTHING;

-- Welcome announcement
INSERT INTO announcements (title, content, source, is_official) VALUES
('Important Emergency Hotlines', 'Para sa mga emergency sa San Jose del Monte, narito ang mga importanteng numero: CDRRMO (Rescue): 0936-600-0119 / 0955-206-7200 | BFP (Bumbero): 0932-373-2444 | PNP (Pulis): 0916-432-0401 | CHO (Health): 0956-986-9417 | LGU Trunkline: 044-919-7370 to 89. Ang Metro Pacific Bulacan Water ay walang pampublikong hotline sa ngayon — bisitahin ang kanilang Facebook page (fb.com/metropacificsjdm) para sa updates.', 'WaterWatch SJDM', true)
ON CONFLICT DO NOTHING;
