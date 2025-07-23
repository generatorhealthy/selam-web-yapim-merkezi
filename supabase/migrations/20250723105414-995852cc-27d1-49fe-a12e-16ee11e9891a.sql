-- Psikolojik Danışmanlık için 10 test oluştur
INSERT INTO public.tests (title, description, category, specialty_area, status, is_active) VALUES
('Anksiyete Düzeyi Değerlendirme Testi', 'Kişinin anksiyete seviyesini ve kaygı durumlarını analiz eden kapsamlı değerlendirme', 'Anksiyete', 'Psikolojik Danışmanlık', 'approved', true),
('Depresyon Belirtileri Tarama Testi', 'Depresif belirtilerin erken tespiti ve şiddetini değerlendiren detaylı analiz', 'Depresyon', 'Psikolojik Danışmanlık', 'approved', true),
('Stres Yönetimi Değerlendirme Testi', 'Stres kaynaklarını ve başa çıkma stratejilerini değerlendiren test', 'Stres', 'Psikolojik Danışmanlık', 'approved', true),
('Öz Güven ve Benlik Saygısı Testi', 'Kişinin öz güven düzeyini ve benlik algısını değerlendiren test', 'Benlik', 'Psikolojik Danışmanlık', 'approved', true),
('Sosyal Anksiyete Değerlendirme Testi', 'Sosyal durumlardaki kaygı düzeyini ve sosyal fobilerini analiz eden test', 'Sosyal Kaygı', 'Psikolojik Danışmanlık', 'approved', true),
('Travma Sonrası Stres Değerlendirme Testi', 'Travmatik yaşantıların etkilerini ve PTSD belirtilerini değerlendiren test', 'Travma', 'Psikolojik Danışmanlık', 'approved', true),
('Motivasyon ve Yaşam Doyumu Testi', 'Kişinin yaşam motivasyonunu ve doyum düzeyini değerlendiren analiz', 'Motivasyon', 'Psikolojik Danışmanlık', 'approved', true),
('Öfke Yönetimi Değerlendirme Testi', 'Öfke kontrolü ve yönetim becerilerini değerlendiren kapsamlı test', 'Öfke Yönetimi', 'Psikolojik Danışmanlık', 'approved', true),
('Uyku Kalitesi ve Düzeni Testi', 'Uyku kalitesini ve uyku bozukluklarını değerlendiren detaylı analiz', 'Uyku', 'Psikolojik Danışmanlık', 'approved', true),
('Kişisel Gelişim Potansiyeli Testi', 'Kişisel büyüme alanlarını ve gelişim potansiyelini değerlendiren test', 'Kişisel Gelişim', 'Psikolojik Danışmanlık', 'approved', true);

-- Her test için örnek sorular ekle
-- Test 1: Anksiyete Düzeyi Değerlendirme Testi
INSERT INTO public.test_questions (test_id, question_text, question_type, options, step_number) 
SELECT t.id, 'Son bir hafta içinde kendinizi ne kadar kaygılı hissettiniz?', 'multiple_choice', 
'[{"text": "Hiç kaygılı hissetmedim", "value": "none"}, {"text": "Hafif düzeyde kaygılı", "value": "mild"}, {"text": "Orta düzeyde kaygılı", "value": "moderate"}, {"text": "Çok kaygılı", "value": "severe"}]'::jsonb, 1
FROM tests t WHERE t.title = 'Anksiyete Düzeyi Değerlendirme Testi';

INSERT INTO public.test_questions (test_id, question_text, question_type, options, step_number) 
SELECT t.id, 'Günlük aktivitelerinizi kaygı nedeniyle aksatma sıklığınız nedir?', 'multiple_choice', 
'[{"text": "Hiçbir zaman", "value": "never"}, {"text": "Nadiren", "value": "rarely"}, {"text": "Bazen", "value": "sometimes"}, {"text": "Sık sık", "value": "frequently"}]'::jsonb, 2
FROM tests t WHERE t.title = 'Anksiyete Düzeyi Değerlendirme Testi';

-- Test 2: Depresyon Belirtileri Tarama Testi
INSERT INTO public.test_questions (test_id, question_text, question_type, options, step_number) 
SELECT t.id, 'Son iki hafta içinde keyif aldığınız aktivitelere karşı ilginiz nasıl?', 'multiple_choice', 
'[{"text": "İlgim hiç azalmadı", "value": "no_change"}, {"text": "Biraz azaldı", "value": "slightly_decreased"}, {"text": "Çok azaldı", "value": "much_decreased"}, {"text": "Hiç ilgim kalmadı", "value": "no_interest"}]'::jsonb, 1
FROM tests t WHERE t.title = 'Depresyon Belirtileri Tarama Testi';

INSERT INTO public.test_questions (test_id, question_text, question_type, options, step_number) 
SELECT t.id, 'Uyku düzeninizde nasıl bir değişiklik yaşıyorsunuz?', 'multiple_choice', 
'[{"text": "Normal uyuyorum", "value": "normal"}, {"text": "Fazla uyuyorum", "value": "oversleep"}, {"text": "Uykusuzluk yaşıyorum", "value": "insomnia"}, {"text": "Uyku düzenim tamamen bozuldu", "value": "completely_disrupted"}]'::jsonb, 2
FROM tests t WHERE t.title = 'Depresyon Belirtileri Tarama Testi';

-- Test 3: Stres Yönetimi Değerlendirme Testi
INSERT INTO public.test_questions (test_id, question_text, question_type, options, step_number) 
SELECT t.id, 'Stresli durumlarla başa çıkmada hangi yöntemi tercih edersiniz?', 'multiple_choice', 
'[{"text": "Nefes egzersizleri ve rahatlama teknikleri", "value": "breathing"}, {"text": "Spor ve fiziksel aktivite", "value": "exercise"}, {"text": "Sosyal destek arama", "value": "social_support"}, {"text": "Kaçınma ve yalıtım", "value": "avoidance"}]'::jsonb, 1
FROM tests t WHERE t.title = 'Stres Yönetimi Değerlendirme Testi';

INSERT INTO public.test_questions (test_id, question_text, question_type, options, step_number) 
SELECT t.id, 'Günlük yaşamda stres seviyenizi nasıl değerlendiriyorsunuz?', 'multiple_choice', 
'[{"text": "Düşük - nadiren stres yaşarım", "value": "low"}, {"text": "Orta - bazen stresli olabilirim", "value": "moderate"}, {"text": "Yüksek - sık sık stres yaşarım", "value": "high"}, {"text": "Çok yüksek - sürekli stres halindeyim", "value": "very_high"}]'::jsonb, 2
FROM tests t WHERE t.title = 'Stres Yönetimi Değerlendirme Testi';

-- Test 4: Öz Güven ve Benlik Saygısı Testi
INSERT INTO public.test_questions (test_id, question_text, question_type, options, step_number) 
SELECT t.id, 'Kendinizi başarılı bir insan olarak görüyor musunuz?', 'multiple_choice', 
'[{"text": "Evet, çok başarılıyım", "value": "very_successful"}, {"text": "Genellikle başarılıyım", "value": "usually_successful"}, {"text": "Orta düzeyde başarılıyım", "value": "moderately_successful"}, {"text": "Başarısız olduğumu düşünüyorum", "value": "unsuccessful"}]'::jsonb, 1
FROM tests t WHERE t.title = 'Öz Güven ve Benlik Saygısı Testi';

INSERT INTO public.test_questions (test_id, question_text, question_type, options, step_number) 
SELECT t.id, 'Yeni insanlarla tanışırken nasıl hissedersiniz?', 'multiple_choice', 
'[{"text": "Rahat ve kendimden emin", "value": "confident"}, {"text": "Biraz gergin ama uyum sağlarım", "value": "slightly_nervous"}, {"text": "Çok gergin ve endişeli", "value": "very_nervous"}, {"text": "Kaçınmaya çalışırım", "value": "avoidant"}]'::jsonb, 2
FROM tests t WHERE t.title = 'Öz Güven ve Benlik Saygısı Testi';

-- Test 5: Sosyal Anksiyete Değerlendirme Testi
INSERT INTO public.test_questions (test_id, question_text, question_type, options, step_number) 
SELECT t.id, 'Kalabalık ortamlarda kendinizi nasıl hissedersiniz?', 'multiple_choice', 
'[{"text": "Rahat ve doğal", "value": "comfortable"}, {"text": "Biraz gergin ama idare ederim", "value": "slightly_uncomfortable"}, {"text": "Çok gergin ve kaygılı", "value": "very_anxious"}, {"text": "Dayanamam, kaçmak isterim", "value": "want_to_escape"}]'::jsonb, 1
FROM tests t WHERE t.title = 'Sosyal Anksiyete Değerlendirme Testi';

INSERT INTO public.test_questions (test_id, question_text, question_type, options, step_number) 
SELECT t.id, 'Başkalarının sizi yargıladığını düşünme sıklığınız nedir?', 'multiple_choice', 
'[{"text": "Hiçbir zaman", "value": "never"}, {"text": "Nadiren", "value": "rarely"}, {"text": "Sık sık", "value": "often"}, {"text": "Sürekli", "value": "constantly"}]'::jsonb, 2
FROM tests t WHERE t.title = 'Sosyal Anksiyete Değerlendirme Testi';

-- Test 6: Travma Sonrası Stres Değerlendirme Testi
INSERT INTO public.test_questions (test_id, question_text, question_type, options, step_number) 
SELECT t.id, 'Geçmişte yaşadığınız zor deneyimler hakkında istemeden düşünme sıklığınız nedir?', 'multiple_choice', 
'[{"text": "Hiçbir zaman", "value": "never"}, {"text": "Nadiren", "value": "rarely"}, {"text": "Bazen", "value": "sometimes"}, {"text": "Sık sık", "value": "frequently"}]'::jsonb, 1
FROM tests t WHERE t.title = 'Travma Sonrası Stres Değerlendirme Testi';

INSERT INTO public.test_questions (test_id, question_text, question_type, options, step_number) 
SELECT t.id, 'Uyku sırasında kâbus görme veya uyanma sıklığınız nasıl?', 'multiple_choice', 
'[{"text": "Hiç yaşamıyorum", "value": "never"}, {"text": "Nadiren", "value": "rarely"}, {"text": "Haftalık birkaç kez", "value": "weekly"}, {"text": "Neredeyse her gece", "value": "nightly"}]'::jsonb, 2
FROM tests t WHERE t.title = 'Travma Sonrası Stres Değerlendirme Testi';

-- Test 7: Motivasyon ve Yaşam Doyumu Testi
INSERT INTO public.test_questions (test_id, question_text, question_type, options, step_number) 
SELECT t.id, 'Sabah uyanırken geleceğe dair hisleriniz nasıl?', 'multiple_choice', 
'[{"text": "Heyecanlı ve umutlu", "value": "excited"}, {"text": "Olumlu ve planlı", "value": "positive"}, {"text": "Nötr, ne iyi ne kötü", "value": "neutral"}, {"text": "Olumsuz ve isteksiz", "value": "negative"}]'::jsonb, 1
FROM tests t WHERE t.title = 'Motivasyon ve Yaşam Doyumu Testi';

INSERT INTO public.test_questions (test_id, question_text, question_type, options, step_number) 
SELECT t.id, 'Hedeflerinize ulaşma konusunda kendinizi nasıl görüyorsunuz?', 'multiple_choice', 
'[{"text": "Kararlı ve azimli", "value": "determined"}, {"text": "Genellikle motive", "value": "usually_motivated"}, {"text": "Ara sıra istekli", "value": "sometimes_motivated"}, {"text": "Motivasyon eksikliği yaşıyorum", "value": "lack_motivation"}]'::jsonb, 2
FROM tests t WHERE t.title = 'Motivasyon ve Yaşam Doyumu Testi';

-- Test 8: Öfke Yönetimi Değerlendirme Testi
INSERT INTO public.test_questions (test_id, question_text, question_type, options, step_number) 
SELECT t.id, 'Öfkelendiğinizde tepki verme şekliniz nasıl?', 'multiple_choice', 
'[{"text": "Sakin kalır, sorunu konuşarak çözerim", "value": "calm_discussion"}, {"text": "Biraz yüksek sesle konuşurum ama kontrolümü kaybetmem", "value": "raised_voice"}, {"text": "Çok sinirlenip bağırırım", "value": "shouting"}, {"text": "Kontrolümü kaybeder, agresif davranırım", "value": "aggressive"}]'::jsonb, 1
FROM tests t WHERE t.title = 'Öfke Yönetimi Değerlendirme Testi';

INSERT INTO public.test_questions (test_id, question_text, question_type, options, step_number) 
SELECT t.id, 'Öfke nöbetiniz ne kadar sürer?', 'multiple_choice', 
'[{"text": "Birkaç dakika içinde geçer", "value": "few_minutes"}, {"text": "Yarım saat kadar sürer", "value": "half_hour"}, {"text": "Birkaç saat etkisinde kalırım", "value": "few_hours"}, {"text": "Günlerce sürebilir", "value": "days"}]'::jsonb, 2
FROM tests t WHERE t.title = 'Öfke Yönetimi Değerlendirme Testi';

-- Test 9: Uyku Kalitesi ve Düzeni Testi
INSERT INTO public.test_questions (test_id, question_text, question_type, options, step_number) 
SELECT t.id, 'Uykuya dalma süreniz ortalama ne kadar?', 'multiple_choice', 
'[{"text": "5-10 dakika içinde", "value": "very_fast"}, {"text": "10-30 dakika", "value": "normal"}, {"text": "30-60 dakika", "value": "slow"}, {"text": "1 saatten fazla", "value": "very_slow"}]'::jsonb, 1
FROM tests t WHERE t.title = 'Uyku Kalitesi ve Düzeni Testi';

INSERT INTO public.test_questions (test_id, question_text, question_type, options, step_number) 
SELECT t.id, 'Sabah uyandığınızda kendinizi nasıl hissedersiniz?', 'multiple_choice', 
'[{"text": "Dinç ve enerjik", "value": "refreshed"}, {"text": "Normal, uyanık", "value": "normal"}, {"text": "Biraz yorgun", "value": "slightly_tired"}, {"text": "Çok yorgun ve bitkin", "value": "exhausted"}]'::jsonb, 2
FROM tests t WHERE t.title = 'Uyku Kalitesi ve Düzeni Testi';

-- Test 10: Kişisel Gelişim Potansiyeli Testi
INSERT INTO public.test_questions (test_id, question_text, question_type, options, step_number) 
SELECT t.id, 'Kendinizi geliştirme konusunda ne kadar isteklisiniz?', 'multiple_choice', 
'[{"text": "Çok istekli, sürekli öğrenmeye açığım", "value": "very_eager"}, {"text": "İstekli, fırsatları değerlendiririm", "value": "eager"}, {"text": "Orta düzeyde ilgili", "value": "moderately_interested"}, {"text": "Pek istekli değilim", "value": "not_interested"}]'::jsonb, 1
FROM tests t WHERE t.title = 'Kişisel Gelişim Potansiyeli Testi';

INSERT INTO public.test_questions (test_id, question_text, question_type, options, step_number) 
SELECT t.id, 'Değişime karşı tutumunuz nasıl?', 'multiple_choice', 
'[{"text": "Değişimi severim, heyecan verici", "value": "love_change"}, {"text": "Değişime açığım, uyum sağlarım", "value": "open_to_change"}, {"text": "Değişimden biraz rahatsız olurum", "value": "uncomfortable_with_change"}, {"text": "Değişimi hiç sevmem, kaçınırım", "value": "resist_change"}]'::jsonb, 2
FROM tests t WHERE t.title = 'Kişisel Gelişim Potansiyeli Testi';