-- Boş ilgi alanı (interests) olan aktif uzmanları branşlarına göre otomatik doldur
-- Kategori 1: Aile / İlişki / Çift Danışmanı
UPDATE public.specialists
SET interests = ARRAY[
  'Cinsel Sağlık Danışmanlığı','Aile Problemleri','Cinsel işlev bozuklukları','Bağlanma sorunları',
  'Dikkat Eksikliği Hiperaktivite Bozukluğu (DEHB)','Bireysel Danışmanlık','Ailede yas süreci',
  'Aile-Çift Danışmanlığı','Cinsel isteksizlik','Aile Rehberliği','Boşanma Danışmanlığı',
  'Boşanma Oryantasyonu ve Evlilik Krizleri','Aile İçi İletişimsizlik','Çocuk Ergen Danışmanlığı',
  'Aile Danışmanlığı','Aile İçi İletişim','Ebeveyn danışmanlığı','Aile ergen çatışması',
  'Çift Danışmanlığı','Aile içinde yaşanan travma','Boşanmanın çocuklar üzerinde etkisi',
  'Aile duygusal istismar'
]::text[]
WHERE is_active = true
  AND (interests IS NULL OR array_length(interests, 1) IS NULL OR array_length(interests, 1) = 0)
  AND (
    LOWER(specialty) LIKE '%aile%'
    OR LOWER(specialty) LIKE '%ilişki danış%'
    OR LOWER(specialty) LIKE '%iliski danis%'
    OR LOWER(specialty) LIKE '%çift danış%'
    OR LOWER(specialty) LIKE '%cift danis%'
    OR LOWER(specialty) LIKE '%evlilik danış%'
  );

-- Kategori 2: Psikolojik Danışman / PDR
UPDATE public.specialists
SET interests = ARRAY[
  'Depresyon','Sosyal Fobi','Panik Atak','Aile İçi İletişim Sorunları','Stres','Sınav Kaygısı',
  'Özgüven Sorunu (Kendine Güven Sorunu)','Obsesif-Kompulsif Bozukluk','Yaygın Anksiyete Bozukluğu',
  'Anksiyete','Otizm Spektrum Bozukluğu','Davranış Bozuklukları','Okula Uyum Sorunları',
  'Okul Başarısızlığı','Kişilik Bozuklukları','Motivasyon Eksikliği','Çocuk Ve Ergen Psikolojisi',
  'Çocuklarda Yeme Problemleri','Çocuklarda Uyku Problemleri','Çocukluk Dönemi Korkuları',
  'Anne-Baba Eğitimi ve Danışmanlığı','Travma Sonrası Stres Bozukluğu','Yas (Matem)',
  'Öfke','Performans Kaygısı','Öğrenme Güçlüğü','Dikkat Eksikliği','Fobiler'
]::text[]
WHERE is_active = true
  AND (interests IS NULL OR array_length(interests, 1) IS NULL OR array_length(interests, 1) = 0)
  AND (
    LOWER(specialty) LIKE '%psikolojik danış%'
    OR LOWER(specialty) LIKE '%psikolojik danis%'
    OR LOWER(specialty) LIKE '%pdr%'
  );

-- Kategori 3: Psikolog / Klinik Psikolog / Psikoterapist / Psikiyatr (en geniş kapsam, en sona)
UPDATE public.specialists
SET interests = ARRAY[
  'Anksiyete (Kaygı) Bozuklukları','Bağlanma Sorunları','Bilişsel ve Davranışçı Terapi','Bireysel Terapi',
  'Çocuk - Ergen Psikolojisi','Depresyon','EMDR Terapisi','Ergenlik Sorunları ve Sınav Kaygısı',
  'Evlilik (Çift) Danışmanlığı','İlişki Problemleri','Oyun Terapisi','Öfke Kontrol Bozukluğu',
  'Ölüm Ve Yas','Sınav Kaygısı','Sosyal Fobi','Stres','Travma','Travma Sonrası Stres Bozukluğu',
  'Aile Danışmanlığı','Boşanma Oryantasyonu ve Evlilik Krizleri','Cinsel danışmanlık',
  'Dikkat Eksikliği','Doğum Öncesi ve Sonrası Süreçler','Duygu Durum Bozuklukları',
  'Ebeveyn Danışmanlığı','Fobiler','İletişim Problemleri','Obsesif Kompulsif Bozukluk',
  'Panik Atak','Şema Terapi','Yetişkin Danışmanlığı'
]::text[]
WHERE is_active = true
  AND (interests IS NULL OR array_length(interests, 1) IS NULL OR array_length(interests, 1) = 0)
  AND (
    LOWER(specialty) LIKE '%psikolog%'
    OR LOWER(specialty) LIKE '%psikoterapist%'
    OR LOWER(specialty) LIKE '%psikiyatr%'
  );