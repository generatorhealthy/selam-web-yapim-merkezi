
-- Aile Danışmanı kategorisi (tüm varyasyonlar)
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
  AND (specialty ILIKE '%aile dan%' OR specialty ILIKE '%ilişki dan%' OR specialty ILIKE '%çift/aile%');

-- Psikolojik Danışmanlık kategorisi (tüm varyasyonlar)
UPDATE public.specialists SET interests = ARRAY[
'Depresyon','Sosyal Fobi','Panik Atak','Aile İçi İletişim Sorunları','Stres','Sınav Kaygısı',
'Özgüven Sorunu (Kendine Güven Sorunu)','Obsesif-Kompulsif Bozukluk','Yaygın Anksiyete Bozukluğu',
'Anksiyete','Otizm Spektrum Bozukluğu','Otizm','Vajinismus','Davranış Bozuklukları',
'Okula Uyum Sorunları','Okul Başarısızlığı','Kişilik Bozuklukları','Motivasyon Eksikliği',
'Erken Boşalma','Unutkanlık','Psikolojik Bozukluk','Vücut (Beden) Disformik Bozukluğu',
'Somatizasyon Bozukluğu','Agorafobi','Özgül Fobi','Cinsel İşlev Bozukluğu',
'Çocuk Ve Ergen Psikolojisi','Çocuklarda Yeme Problemleri','Çocuklarda Uyku Problemleri',
'Cinsel Terapi Danışmanlığı','Cinsel İstismar','Cinsel İsteksizlik','Cinsel Travmalar',
'Cinsel Soğukluk','Kadınlarda Cinsel İsteksizlik','Çocukluk Dönemi Korkuları',
'Kadınlarda Cinsel Ağrı','Hipokondriazis','Dikkat Eksikliği','Dikkat Dağınıklığı',
'Anne-Baba Eğitimi ve Danışmanlığı','Travma Sonrası Stres Bozukluğu','Borderline','Yas (Matem)',
'Distimik Bozukluk (Kronik Depresyon)','Kişilerarası İlişkilerde Bozukluklar','Baş Dönmeleri',
'Majör Depresif Bozukluk','Ağlama ve Öfke Nöbetleri','Telefon Bağımlılığı','Fobiler','Öfke',
'Performans Kaygısı','Eş ve Çift Kıskançlığı','Koronofobi','Sigara Bağımlılığı','Öğrenme Güçlüğü',
'Kadın Uyarılma - Orgazm Bozukluğu','Kronik yorgunluk sendromu','Saldırganlık','Çekingenlik',
'Lohusalık sendromu','Hiperseksüalite','Saç ve Kıl Koparma Hastalığı (Trikotillomani)',
'Duygulanım Bozukluğu - Manik Depresif Hastalığı','İş ve Çalışan Psikolojik Problemleri',
'Adipsi (Susama Yokluğu)','Tırnak Yeme','Oyun Bağımlılığı','Çocukluk Çağı Travmaları','İrkçılık',
'Kişisel bakım sürdürmeme'
]::text[]
WHERE (interests IS NULL OR array_length(interests,1) IS NULL)
  AND specialty ILIKE '%psikolojik dan%';
