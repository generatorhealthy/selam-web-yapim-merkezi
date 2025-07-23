-- Aile Danışmanları için 10 test oluştur
INSERT INTO public.tests (title, description, category, specialty_area, status, is_active) VALUES
('Aile İçi İletişim Değerlendirme Testi', 'Aile üyeleri arasındaki iletişim kalitesini ve tarzını değerlendiren kapsamlı test', 'İletişim', 'Aile Danışmanı', 'approved', true),
('Evlilik Uyumu Değerlendirme Testi', 'Çiftler arasındaki uyum düzeyini ve ilişki kalitesini ölçen detaylı analiz', 'İlişki', 'Aile Danışmanı', 'approved', true),
('Çocuk Gelişimi ve Aile Dinamikleri Testi', 'Çocuğun gelişimi üzerinde aile dinamiklerinin etkisini değerlendiren test', 'Gelişim', 'Aile Danışmanı', 'approved', true),
('Aile Çatışması Çözüm Testi', 'Aile içi çatışmaları çözme becerilerini ve stratejilerini değerlendiren test', 'Çatışma Çözümü', 'Aile Danışmanı', 'approved', true),
('Ebeveynlik Stilleri Değerlendirme Testi', 'Farklı ebeveynlik yaklaşımlarını ve etkilerini analiz eden kapsamlı test', 'Ebeveynlik', 'Aile Danışmanı', 'approved', true),
('Aile Stresi ve Başa Çıkma Testi', 'Aile üyelerinin stres düzeylerini ve başa çıkma mekanizmalarını değerlendiren test', 'Stres Yönetimi', 'Aile Danışmanı', 'approved', true),
('Aile Değerleri ve İnanç Sistemi Testi', 'Aile değerlerinin uyumunu ve inanç sistemlerinin etkisini analiz eden test', 'Değerler', 'Aile Danışmanı', 'approved', true),
('Ergen ve Aile İlişkileri Testi', 'Ergenlik dönemindeki çocuklar ile aileler arasındaki ilişkileri değerlendiren test', 'Ergenlik', 'Aile Danışmanı', 'approved', true),
('Aile Bütçesi ve Mali Stres Testi', 'Ailelerin finansal durumlarının ilişkiler üzerindeki etkisini değerlendiren test', 'Finansal', 'Aile Danışmanı', 'approved', true),
('Aile Sosyal Destek Sistemi Testi', 'Ailelerin sosyal destek ağlarını ve bunların aile dinamiklerine etkisini analiz eden test', 'Sosyal Destek', 'Aile Danışmanı', 'approved', true);

-- Her test için örnek sorular ekle
-- Test 1: Aile İçi İletişim Değerlendirme Testi
INSERT INTO public.test_questions (test_id, question_text, question_type, options, step_number) 
SELECT t.id, 'Ailenizde günlük konuşmalar ne sıklıkta gerçekleşir?', 'multiple_choice', 
'[{"text": "Her gün düzenli olarak", "value": "daily"}, {"text": "Haftada birkaç kez", "value": "few_times"}, {"text": "Sadece gerekli durumlarda", "value": "necessary"}, {"text": "Çok nadir", "value": "rare"}]'::jsonb, 1
FROM tests t WHERE t.title = 'Aile İçi İletişim Değerlendirme Testi';

INSERT INTO public.test_questions (test_id, question_text, question_type, options, step_number) 
SELECT t.id, 'Aile üyeleri birbirlerini dinlerken nasıl davranır?', 'multiple_choice', 
'[{"text": "Dikkatle ve sabırla dinler", "value": "attentive"}, {"text": "Ara sıra kesintiye uğratır", "value": "sometimes_interrupt"}, {"text": "Genellikle dikkatini dağıtır", "value": "distracted"}, {"text": "Dinlemez, kendi konuşur", "value": "not_listening"}]'::jsonb, 2
FROM tests t WHERE t.title = 'Aile İçi İletişim Değerlendirme Testi';

-- Test 2: Evlilik Uyumu Değerlendirme Testi
INSERT INTO public.test_questions (test_id, question_text, question_type, options, step_number) 
SELECT t.id, 'Eşinizle ortak kararlar alırken ne kadar uyum içindesiniz?', 'multiple_choice', 
'[{"text": "Çok uyumlu, kolayca karar veririz", "value": "very_harmonious"}, {"text": "Genellikle anlaşırız", "value": "usually_agree"}, {"text": "Bazen zorluk yaşarız", "value": "sometimes_difficult"}, {"text": "Çok zorlanırız, çatışma yaşarız", "value": "very_difficult"}]'::jsonb, 1
FROM tests t WHERE t.title = 'Evlilik Uyumu Değerlendirme Testi';

INSERT INTO public.test_questions (test_id, question_text, question_type, options, step_number) 
SELECT t.id, 'Eşinizle duygusal bağınızı nasıl değerlendiriyorsunuz?', 'multiple_choice', 
'[{"text": "Çok güçlü duygusal bağımız var", "value": "very_strong"}, {"text": "İyi bir bağımız var", "value": "good"}, {"text": "Orta düzeyde", "value": "moderate"}, {"text": "Zayıf duygusal bağ", "value": "weak"}]'::jsonb, 2
FROM tests t WHERE t.title = 'Evlilik Uyumu Değerlendirme Testi';

-- Test 3: Çocuk Gelişimi ve Aile Dinamikleri Testi
INSERT INTO public.test_questions (test_id, question_text, question_type, options, step_number) 
SELECT t.id, 'Çocuğunuzun gelişimini desteklemek için aile olarak ne kadar zaman ayırıyorsunuz?', 'multiple_choice', 
'[{"text": "Her gün kaliteli zaman geçiririz", "value": "daily_quality"}, {"text": "Haftada birkaç kez", "value": "few_times_week"}, {"text": "Hafta sonları", "value": "weekends"}, {"text": "Çok az zaman ayırabiliyoruz", "value": "very_little"}]'::jsonb, 1
FROM tests t WHERE t.title = 'Çocuk Gelişimi ve Aile Dinamikleri Testi';

INSERT INTO public.test_questions (test_id, question_text, question_type, options, step_number) 
SELECT t.id, 'Aile içinde çocuğunuzun görüşleri ne kadar dikkate alınır?', 'multiple_choice', 
'[{"text": "Her zaman dikkate alırız", "value": "always"}, {"text": "Çoğu zaman dinleriz", "value": "mostly"}, {"text": "Bazen dikkate alırız", "value": "sometimes"}, {"text": "Nadiren dinleriz", "value": "rarely"}]'::jsonb, 2
FROM tests t WHERE t.title = 'Çocuk Gelişimi ve Aile Dinamikleri Testi';

-- Test 4: Aile Çatışması Çözüm Testi
INSERT INTO public.test_questions (test_id, question_text, question_type, options, step_number) 
SELECT t.id, 'Aile içinde çatışma yaşandığında hangi yaklaşımı benimsersiniz?', 'multiple_choice', 
'[{"text": "Sakinleşip konuşarak çözmeye çalışırız", "value": "calm_discussion"}, {"text": "Herkesin görüşünü dinler, ortak çözüm ararız", "value": "listen_all"}, {"text": "Genellikle sessiz kalır, geçmesini bekleriz", "value": "wait_silent"}, {"text": "Tartışma büyür, çözüm bulamayız", "value": "escalate"}]'::jsonb, 1
FROM tests t WHERE t.title = 'Aile Çatışması Çözüm Testi';

INSERT INTO public.test_questions (test_id, question_text, question_type, options, step_number) 
SELECT t.id, 'Çatışma sonrası aile üyeleri nasıl davranır?', 'multiple_choice', 
'[{"text": "Özür diler ve barışırız", "value": "apologize_reconcile"}, {"text": "Zaman geçince normal döneriz", "value": "time_heals"}, {"text": "Konuyu bir daha açmayız", "value": "avoid_topic"}, {"text": "Uzun süre küslük yaşarız", "value": "long_resentment"}]'::jsonb, 2
FROM tests t WHERE t.title = 'Aile Çatışması Çözüm Testi';

-- Test 5: Ebeveynlik Stilleri Değerlendirme Testi
INSERT INTO public.test_questions (test_id, question_text, question_type, options, step_number) 
SELECT t.id, 'Çocuğunuza kuralları nasıl açıklarsınız?', 'multiple_choice', 
'[{"text": "Nedenlerini açıklar, birlikte konuşuruz", "value": "explain_discuss"}, {"text": "Kuralları net belirler, açıklarım", "value": "clear_rules"}, {"text": "Esnek yaklaşır, duruma göre değiştiririm", "value": "flexible"}, {"text": "Çok fazla kural koymam", "value": "few_rules"}]'::jsonb, 1
FROM tests t WHERE t.title = 'Ebeveynlik Stilleri Değerlendirme Testi';

INSERT INTO public.test_questions (test_id, question_text, question_type, options, step_number) 
SELECT t.id, 'Çocuğunuz hata yaptığında nasıl tepki verirsiniz?', 'multiple_choice', 
'[{"text": "Sabırla açıklar, öğrenmesine yardım ederim", "value": "patient_teaching"}, {"text": "Hatanın sonuçlarını gösteririm", "value": "show_consequences"}, {"text": "Anlık tepki verir, sonra konuşurum", "value": "immediate_reaction"}, {"text": "Genellikle görmezden gelirim", "value": "ignore"}]'::jsonb, 2
FROM tests t WHERE t.title = 'Ebeveynlik Stilleri Değerlendirme Testi';

-- Test 6: Aile Stresi ve Başa Çıkma Testi
INSERT INTO public.test_questions (test_id, question_text, question_type, options, step_number) 
SELECT t.id, 'Aile olarak stresli dönemlerde nasıl davranırsınız?', 'multiple_choice', 
'[{"text": "Birbirimizi destekler, birlikte çözüm ararız", "value": "support_together"}, {"text": "Herkes kendi yöntemiyle başa çıkar", "value": "individual_coping"}, {"text": "Stresi paylaşır, rahatlarız", "value": "share_stress"}, {"text": "Genellikle gerginlik artar", "value": "increased_tension"}]'::jsonb, 1
FROM tests t WHERE t.title = 'Aile Stresi ve Başa Çıkma Testi';

INSERT INTO public.test_questions (test_id, question_text, question_type, options, step_number) 
SELECT t.id, 'Stresli zamanlarda aile içi iletişim nasıl etkilenir?', 'multiple_choice', 
'[{"text": "Daha çok konuşur, paylaşırız", "value": "more_communication"}, {"text": "Normal seviyede kalır", "value": "normal_level"}, {"text": "Biraz azalır ama halledebiliriz", "value": "slightly_reduced"}, {"text": "Çok azalır, sessizlik olur", "value": "much_reduced"}]'::jsonb, 2
FROM tests t WHERE t.title = 'Aile Stresi ve Başa Çıkma Testi';

-- Test 7: Aile Değerleri ve İnanç Sistemi Testi
INSERT INTO public.test_questions (test_id, question_text, question_type, options, step_number) 
SELECT t.id, 'Aile üyelerinizin değer yargıları ne kadar uyumlu?', 'multiple_choice', 
'[{"text": "Çok uyumlu, aynı değerleri paylaşırız", "value": "very_aligned"}, {"text": "Çoğunlukla uyumlu", "value": "mostly_aligned"}, {"text": "Bazı konularda farklılık var", "value": "some_differences"}, {"text": "Çok farklı değerlerimiz var", "value": "very_different"}]'::jsonb, 1
FROM tests t WHERE t.title = 'Aile Değerleri ve İnanç Sistemi Testi';

INSERT INTO public.test_questions (test_id, question_text, question_type, options, step_number) 
SELECT t.id, 'Önemli kararları alırken hangi değerler öncelikli olur?', 'multiple_choice', 
'[{"text": "Aile birliği ve mutluluk", "value": "family_unity"}, {"text": "Dürüstlük ve doğruluk", "value": "honesty"}, {"text": "Başarı ve ilerleme", "value": "success"}, {"text": "Güvenlik ve istikrar", "value": "security"}]'::jsonb, 2
FROM tests t WHERE t.title = 'Aile Değerleri ve İnanç Sistemi Testi';

-- Test 8: Ergen ve Aile İlişkileri Testi
INSERT INTO public.test_questions (test_id, question_text, question_type, options, step_number) 
SELECT t.id, 'Ergen çocuğunuzla iletişim kurma konusunda nasıl hissediyorsunuz?', 'multiple_choice', 
'[{"text": "Rahatça konuşabiliyoruz", "value": "comfortable"}, {"text": "Çoğu zaman iyi anlaşıyoruz", "value": "mostly_good"}, {"text": "Bazen zorluk yaşıyorum", "value": "sometimes_difficult"}, {"text": "Çok zor, anlaşamıyoruz", "value": "very_difficult"}]'::jsonb, 1
FROM tests t WHERE t.title = 'Ergen ve Aile İlişkileri Testi';

INSERT INTO public.test_questions (test_id, question_text, question_type, options, step_number) 
SELECT t.id, 'Ergen çocuğunuzun bağımsızlık isteğine nasıl yaklaşıyorsunuz?', 'multiple_choice', 
'[{"text": "Destekliyor, kademeli özgürlük veriyorum", "value": "supportive_gradual"}, {"text": "Anlayışla karşılıyor, sınır koyuyorum", "value": "understanding_limits"}, {"text": "Endişeleniyor, kontrol etmeye çalışıyorum", "value": "worried_control"}, {"text": "Karşı çıkıyor, kısıtlıyorum", "value": "oppose_restrict"}]'::jsonb, 2
FROM tests t WHERE t.title = 'Ergen ve Aile İlişkileri Testi';

-- Test 9: Aile Bütçesi ve Mali Stres Testi
INSERT INTO public.test_questions (test_id, question_text, question_type, options, step_number) 
SELECT t.id, 'Mali konular hakkında aile içinde nasıl konuşursunuz?', 'multiple_choice', 
'[{"text": "Açık ve şeffaf bir şekilde", "value": "open_transparent"}, {"text": "Sadece gerekli durumlarda", "value": "when_necessary"}, {"text": "Çocukların yanında konuşmayız", "value": "not_around_children"}, {"text": "Hiç konuşmayız, tabu konu", "value": "never_discuss"}]'::jsonb, 1
FROM tests t WHERE t.title = 'Aile Bütçesi ve Mali Stres Testi';

INSERT INTO public.test_questions (test_id, question_text, question_type, options, step_number) 
SELECT t.id, 'Mali sıkıntı yaşadığınızda aile içi ilişkiler nasıl etkilenir?', 'multiple_choice', 
'[{"text": "Daha çok birbirimize destek oluruz", "value": "more_support"}, {"text": "Normal seviyede kalır", "value": "stays_normal"}, {"text": "Biraz gerginlik olur ama atlatabiliriz", "value": "some_tension"}, {"text": "Ciddi gerginlik ve çatışma yaşarız", "value": "serious_conflict"}]'::jsonb, 2
FROM tests t WHERE t.title = 'Aile Bütçesi ve Mali Stres Testi';

-- Test 10: Aile Sosyal Destek Sistemi Testi
INSERT INTO public.test_questions (test_id, question_text, question_type, options, step_number) 
SELECT t.id, 'Zor zamanlarda ailenizin başvurabileceği sosyal destek ağı nasıl?', 'multiple_choice', 
'[{"text": "Çok güçlü, çok sayıda destekçimiz var", "value": "very_strong"}, {"text": "İyi, birkaç güvenilir kişi var", "value": "good_support"}, {"text": "Sınırlı, birkaç kişiye güvenebiliriz", "value": "limited"}, {"text": "Çok zayıf, kendimize güveniyoruz", "value": "very_weak"}]'::jsonb, 1
FROM tests t WHERE t.title = 'Aile Sosyal Destek Sistemi Testi';

INSERT INTO public.test_questions (test_id, question_text, question_type, options, step_number) 
SELECT t.id, 'Sosyal etkinliklere aile olarak ne kadar katılıyorsunuz?', 'multiple_choice', 
'[{"text": "Düzenli olarak sosyal etkinliklere katılırız", "value": "regularly"}, {"text": "Arada sırada katılırız", "value": "occasionally"}, {"text": "Sadece özel günlerde", "value": "special_occasions"}, {"text": "Hiç katılmayız, evde kalmayı tercih ederiz", "value": "never"}]'::jsonb, 2
FROM tests t WHERE t.title = 'Aile Sosyal Destek Sistemi Testi';