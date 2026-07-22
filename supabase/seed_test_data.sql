-- Clear all existing data and seed 30 fresh test reports
-- Run the entire script in Supabase SQL Editor. Safe to re-run.

DELETE FROM report_confirmations;
DELETE FROM reports;
ALTER SEQUENCE IF EXISTS reports_id_seq RESTART;
UPDATE report_sequence SET last_value = 0 WHERE id = 1;

DO $$
DECLARE
  rec RECORD;
  seq INT;
BEGIN
  SELECT last_value + 30 INTO seq FROM report_sequence WHERE id = 1;
  UPDATE report_sequence SET last_value = seq WHERE id = 1;

  FOR rec IN SELECT * FROM (VALUES
    (1,  'Kaypian',       'Phase 1',        14.8138, 121.0455, 'no_water',         'primewater',    'submitted',          true,  false, NULL,                                                                   'Wala pong tubig simula kahapon.', NOW() - INTERVAL '1 day'),
    (2,  'Kaypian',       'Sitio Bayan',    14.8145, 121.0460, 'low_pressure',     'primewater',    'community_confirmed', true,  false, NULL,                                                                   'Mahina pressure ng tubig.', NOW() - INTERVAL '2 days'),
    (3,  'Muzon',         'Blk 5',          14.8200, 121.0380, 'dirty_water',      'metro_pacific', 'submitted',          true,  false, NULL,                                                                   'Brown po ang tubig.', NOW() - INTERVAL '3 days'),
    (4,  'Muzon',         'St. Joseph St.', 14.8210, 121.0370, 'water_leak',       'metro_pacific', 'community_confirmed', true,  false, NULL,                                                                   'Tumutulo ang tubo sa kalsada.', NOW() - INTERVAL '4 days'),
    (5,  'Lawang Pari',   'Blk 10',         14.8160, 121.0420, 'no_water',         'primewater',    'resolved',           true,  false, NULL,                                                                   'Naayos na po ang tubig.', NOW() - INTERVAL '5 days'),
    (6,  'Graceville',    'Phase 3',        14.8180, 121.0440, 'pipe_infrastructure','primewater',  'submitted',          true,  false, NULL,                                                                   'Sira ang main pipe.', NOW() - INTERVAL '6 days'),
    (7,  'Minuyan',       'Sitio Pag-asa',  14.8220, 121.0350, 'other',            'metro_pacific', 'submitted',          true,  false, NULL,                                                                   'Walang tubig ilang araw na.', NOW() - INTERVAL '7 days'),
    (8,  'Poblacion',     'Blk 3',          14.8230, 121.0360, 'no_water',         'primewater',    'community_confirmed', true,  false, NULL,                                                                   'Wala pong tubig sa buong blk.', NOW() - INTERVAL '8 days'),
    (9,  'Sto. Niño',     'Blk 12',         14.8220, 121.0380, 'low_pressure',     'metro_pacific', 'under_review',       false, true,  'Duplicate report — already reported in nearby area.',                     'Mahina pressure.', NOW() - INTERVAL '9 days'),
    (10, 'Sta. Cruz',     'St. John St.',   14.8240, 121.0390, 'dirty_water',      'primewater',    'submitted',          false, false, NULL,                                                                   'Madumi ang tubig.', NOW() - INTERVAL '10 days'),
    (11, 'San Pedro',     'Phase 2',        14.8250, 121.0400, 'no_water',         'metro_pacific', 'submitted',          true,  false, NULL,                                                                   'Wala pong tubig.', NOW() - INTERVAL '11 days'),
    (12, 'San Manuel',    'Sitio Bayan',    14.8260, 121.0410, 'water_leak',       'primewater',    'resolved',           true,  false, NULL,                                                                   'Tumutulo ang tubo. Naayos na.', NOW() - INTERVAL '12 days'),
    (13, 'San Rafael',    'Blk 7',          14.8270, 121.0420, 'low_pressure',     'metro_pacific', 'submitted',          true,  false, NULL,                                                                   'Mahina ang daloy.', NOW() - INTERVAL '13 days'),
    (14, 'Bagong Buhay',  'St. Mary St.',   14.8280, 121.0430, 'no_water',         'primewater',    'community_confirmed', true,  false, NULL,                                                                   'Sira ang linya.', NOW() - INTERVAL '14 days'),
    (15, 'Fatima',        'Blk 2',          14.8290, 121.0440, 'dirty_water',      'metro_pacific', 'submitted',          true,  false, NULL,                                                                   'Brown water since last week.', NOW() - INTERVAL '15 days'),
    (16, 'Tungkong Mangga', 'Sitio Maligaya', 14.8300, 121.0450, 'pipe_infrastructure','primewater',  'submitted',          false, false, NULL,                                                                   'Sumabog ang tubo.', NOW() - INTERVAL '1 day'),
    (17, 'Sapang Palay',  'Phase 4',        14.8310, 121.0460, 'no_water',         'metro_pacific', 'community_confirmed', true,  false, NULL,                                                                   'Wala pong tubig.', NOW() - INTERVAL '2 days'),
    (18, 'Poblacion',     'St. Rose St.',   14.8320, 121.0470, 'other',            'primewater',    'submitted',          true,  false, NULL,                                                                   'Intermittent supply.', NOW() - INTERVAL '3 days'),
    (19, 'Maharlika',     'Blk 15',         14.8330, 121.0480, 'low_pressure',     'metro_pacific', 'submitted',          true,  false, NULL,                                                                   'Mahina pressure.', NOW() - INTERVAL '4 days'),
    (20, 'Dulong Bayan',  'Sitio Bayan',    14.8340, 121.0490, 'no_water',         'primewater',    'resolved',           true,  false, NULL,                                                                   'Okay na po.', NOW() - INTERVAL '5 days'),
    (21, 'San Isidro',    'Blk 20',         14.8350, 121.0500, 'water_leak',       'metro_pacific', 'submitted',          true,  false, NULL,                                                                   'Tumutulo ang tubo.', NOW() - INTERVAL '6 days'),
    (22, 'San Martin',    'Phase 1',        14.8360, 121.0510, 'dirty_water',      'primewater',    'community_confirmed', true,  false, NULL,                                                                   'Madumi ang tubig.', NOW() - INTERVAL '7 days'),
    (23, 'San Roque',     'St. Paul St.',   14.8370, 121.0520, 'no_water',         'metro_pacific', 'submitted',          true,  false, NULL,                                                                   'Wala pong tubig.', NOW() - INTERVAL '8 days'),
    (24, 'Kaypian',       'Blk 8',          14.8140, 121.0458, 'low_pressure',     'primewater',    'submitted',          false, false, NULL,                                                                   'Mahina pressure.', NOW() - INTERVAL '9 days'),
    (25, 'Muzon',         'Sitio Bayan',    14.8205, 121.0375, 'no_water',         'metro_pacific', 'stale',              true,  false, NULL,                                                                   'Wala pong tubig.', NOW() - INTERVAL '10 days'),
    (26, 'Lawang Pari',   'Blk 4',          14.8165, 121.0425, 'pipe_infrastructure','metro_pacific','under_review',      false, false, NULL,                                                                   'Sira ang linya ng tubig.', NOW() - INTERVAL '11 days'),
    (27, 'Graceville',    'St. Anne St.',   14.8185, 121.0445, 'no_water',         'primewater',    'stale',              true,  false, NULL,                                                                   'Wala pong tubig.', NOW() - INTERVAL '12 days'),
    (28, 'Minuyan',       'Blk 9',          14.8225, 121.0355, 'other',            'metro_pacific', 'community_confirmed', true,  false, NULL,                                                                   'Inconsistent supply.', NOW() - INTERVAL '13 days'),
    (29, 'Poblacion',     'Sitio Bayan',    14.8235, 121.0365, 'no_water',         'primewater',    'submitted',          true,  false, NULL,                                                                   'Wala pong tubig.', NOW() - INTERVAL '14 days'),
    (30, 'Sto. Niño',     'Blk 14',         14.8225, 121.0385, 'dirty_water',      'metro_pacific', 'submitted',          false, false, NULL,                                                                   'Brown water.', NOW() - INTERVAL '15 days')
  ) AS t(id, barangay, street, lat, lng, issue, provider, status, verified, denied, denied_reason, description, started_at)
  LOOP
    INSERT INTO reports (
      report_id_display, barangay, street_sitio, latitude, longitude,
      issue_type, description, status, water_provider,
      verified, denied, denied_reason,
      started_at, created_at, updated_at, confirmation_count
    ) VALUES (
      'SJDM-WATER-' || LPAD((seq - 30 + rec.id)::TEXT, 5, '0'),
      rec.barangay, rec.street, rec.lat, rec.lng, rec.issue,
      rec.description, rec.status, rec.provider,
      rec.verified, rec.denied, rec.denied_reason,
      rec.started_at, rec.started_at, NOW(),
      CASE WHEN rec.status = 'community_confirmed' THEN 3 WHEN rec.status = 'resolved' THEN 5 ELSE 0 END
    );
  END LOOP;
END;
$$;
