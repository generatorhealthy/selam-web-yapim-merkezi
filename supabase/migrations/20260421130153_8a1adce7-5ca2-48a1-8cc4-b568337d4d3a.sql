
UPDATE public.specialists SET interests = ARRAY[
'Cinsel Sağlık Danışmanlığı','Aile Problemleri','Cinsel işlev bozuklukları','Bağlanma sorunları',
'Dikkat Eksikliği Hiperaktivite Bozukluğu (DEHB)','Bireysel Danışmanlık','Ailede yas süreci',
'Aile-Çift Danışmanlığı','Cinsel isteksizlik','Aile Rehberliği','Boşanma Danışmanlığı',
'Boşanma Oryantasyonu ve Evlilik Krizleri','Aile İçi İletişimsizlik','Çocuk Ergen Danışmanlığı',
'Aile Danışmanlığı','Aile İçi İletişim','Ebeveyn danışmanlığı','Aile ergen çatışması',
'Çift Danışmanlığı','Aile içinde yaşanan travma','Boşanmanın çocuklar üzerinde etkisi',
'Aile duygusal istismar'
]::text[]
WHERE (interests IS NULL OR array_length(interests,1) IS NULL)
  AND (
    specialty ILIKE '%aile%ilişki%'
    OR specialty ILIKE '%ilişki%dan%'
    OR specialty ILIKE '%kisisel danış%'
    OR specialty ILIKE '%kişisel danış%'
    OR specialty ILIKE '%bağımlılık%aile%'
    OR specialty ILIKE '%aile%sosyolog%'
    OR specialty ILIKE '%aile dan%'
  );
