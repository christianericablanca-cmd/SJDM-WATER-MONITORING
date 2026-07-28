-- Backfill missing business coordinates from barangay centers
UPDATE businesses SET
  latitude = CASE barangay
    WHEN 'Santo Cristo' THEN 14.828 WHEN 'Assumption' THEN 14.814
    WHEN 'Bagong Buhay' THEN 14.823 WHEN 'Citrus' THEN 14.806
    WHEN 'Ciudad Real' THEN 14.788 WHEN 'Dulong Bayan' THEN 14.819
    WHEN 'Fatima' THEN 14.799 WHEN 'Francisco Homes-Guijo' THEN 14.808
    WHEN 'Francisco Homes-Mulawin' THEN 14.805 WHEN 'Francisco Homes-Narra' THEN 14.810
    WHEN 'Francisco Homes-Yakal' THEN 14.802 WHEN 'Gaya-gaya' THEN 14.825
    WHEN 'Graceville' THEN 14.830 WHEN 'Gumaoc Central' THEN 14.820
    WHEN 'Gumaoc East' THEN 14.822 WHEN 'Gumaoc West' THEN 14.818
    WHEN 'Kaybanban' THEN 14.815 WHEN 'Kaypian' THEN 14.828
    WHEN 'Lawang Pari' THEN 14.812 WHEN 'Maharlika' THEN 14.817
    WHEN 'Minuyan' THEN 14.810 WHEN 'Minuyan II' THEN 14.807
    WHEN 'Minuyan III' THEN 14.809 WHEN 'Minuyan IV' THEN 14.808
    WHEN 'Minuyan V' THEN 14.811 WHEN 'Muzon' THEN 14.824
    WHEN 'Muzon East' THEN 14.826 WHEN 'Muzon South' THEN 14.822
    WHEN 'Muzon West' THEN 14.823 WHEN 'Paradise III' THEN 14.804
    WHEN 'Poblacion' THEN 14.814 WHEN 'Poblacion I' THEN 14.813
    WHEN 'St. Martin de Porres' THEN 14.800 WHEN 'Sapang Palay' THEN 14.820
    WHEN 'San Isidro' THEN 14.816 WHEN 'San Manuel' THEN 14.821
    WHEN 'San Martin' THEN 14.819 WHEN 'San Pedro' THEN 14.825
    WHEN 'San Rafael' THEN 14.827 WHEN 'San Roque' THEN 14.813
    WHEN 'Sta. Cruz' THEN 14.811 WHEN 'Sto. Niño' THEN 14.806
    WHEN 'Sto. Niño II' THEN 14.805 WHEN 'Tungkong Mangga' THEN 14.829
  END,
  longitude = CASE barangay
    WHEN 'Santo Cristo' THEN 121.032 WHEN 'Assumption' THEN 121.045
    WHEN 'Bagong Buhay' THEN 121.038 WHEN 'Citrus' THEN 121.052
    WHEN 'Ciudad Real' THEN 121.058 WHEN 'Dulong Bayan' THEN 121.047
    WHEN 'Fatima' THEN 121.055 WHEN 'Francisco Homes-Guijo' THEN 121.057
    WHEN 'Francisco Homes-Mulawin' THEN 121.059 WHEN 'Francisco Homes-Narra' THEN 121.056
    WHEN 'Francisco Homes-Yakal' THEN 121.060 WHEN 'Gaya-gaya' THEN 121.042
    WHEN 'Graceville' THEN 121.030 WHEN 'Gumaoc Central' THEN 121.040
    WHEN 'Gumaoc East' THEN 121.043 WHEN 'Gumaoc West' THEN 121.038
    WHEN 'Kaybanban' THEN 121.044 WHEN 'Kaypian' THEN 121.036
    WHEN 'Lawang Pari' THEN 121.049 WHEN 'Maharlika' THEN 121.041
    WHEN 'Minuyan' THEN 121.048 WHEN 'Minuyan II' THEN 121.050
    WHEN 'Minuyan III' THEN 121.049 WHEN 'Minuyan IV' THEN 121.051
    WHEN 'Minuyan V' THEN 121.047 WHEN 'Muzon' THEN 121.035
    WHEN 'Muzon East' THEN 121.037 WHEN 'Muzon South' THEN 121.033
    WHEN 'Muzon West' THEN 121.031 WHEN 'Paradise III' THEN 121.054
    WHEN 'Poblacion' THEN 121.045 WHEN 'Poblacion I' THEN 121.046
    WHEN 'St. Martin de Porres' THEN 121.053 WHEN 'Sapang Palay' THEN 121.036
    WHEN 'San Isidro' THEN 121.043 WHEN 'San Manuel' THEN 121.034
    WHEN 'San Martin' THEN 121.039 WHEN 'San Pedro' THEN 121.033
    WHEN 'San Rafael' THEN 121.031 WHEN 'San Roque' THEN 121.047
    WHEN 'Sta. Cruz' THEN 121.050 WHEN 'Sto. Niño' THEN 121.052
    WHEN 'Sto. Niño II' THEN 121.053 WHEN 'Tungkong Mangga' THEN 121.029
  END
WHERE latitude IS NULL OR longitude IS NULL;

-- Mark businesses from approved claims as verified
UPDATE businesses SET verified = true WHERE verified = false AND EXISTS (
  SELECT 1 FROM business_claims bc
  WHERE bc.name = businesses.name AND bc.barangay = businesses.barangay AND bc.status = 'approved'
);
