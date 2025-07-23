-- Psikolojik Danışmanlık testlerine kalan 8 soruyu ekle

-- Test 1: Anksiyete Düzeyi Değerlendirme Testi - 8 soru daha ekle
INSERT INTO public.test_questions (test_id, question_text, question_type, options, step_number) 
SELECT t.id, 'Fiziksel semptomlar (kalp çarpıntısı, terleme, titreme) yaşıyor musunuz?', 'multiple_choice', 
'[{"text": "Hiçbir zaman", "value": "never"}, {"text": "Nadiren", "value": "rarely"}, {"text": "Sık sık", "value": "often"}, {"text": "Sürekli", "value": "constantly"}]'::jsonb, 3
FROM tests t WHERE t.title = 'Anksiyete Düzeyi Değerlendirme Testi';

INSERT INTO public.test_questions (test_id, question_text, question_type, options, step_number) 
SELECT t.id, 'Gelecek hakkında endişeleriniz ne düzeyde?', 'multiple_choice', 
'[{"text": "Hiç endişelenmem", "value": "no_worry"}, {"text": "Az endişelenirim", "value": "little_worry"}, {"text": "Çok endişelenirim", "value": "much_worry"}, {"text": "Sürekli endişeliyim", "value": "constant_worry"}]'::jsonb, 4
FROM tests t WHERE t.title = 'Anksiyete Düzeyi Değerlendirme Testi';

INSERT INTO public.test_questions (test_id, question_text, question_type, options, step_number) 
SELECT t.id, 'Kaygılı olduğunuzda konsantrasyon problemi yaşar mısınız?', 'multiple_choice', 
'[{"text": "Hiç yaşamam", "value": "never"}, {"text": "Bazen yaşarım", "value": "sometimes"}, {"text": "Sık sık yaşarım", "value": "often"}, {"text": "Her zaman yaşarım", "value": "always"}]'::jsonb, 5
FROM tests t WHERE t.title = 'Anksiyete Düzeyi Değerlendirme Testi';

INSERT INTO public.test_questions (test_id, question_text, question_type, options, step_number) 
SELECT t.id, 'Sosyal ortamlarda kaygı hissediyor musunuz?', 'multiple_choice', 
'[{"text": "Hiç hissetmem", "value": "never"}, {"text": "Bazen hissederim", "value": "sometimes"}, {"text": "Çoğu zaman hissederim", "value": "usually"}, {"text": "Her zaman hissederim", "value": "always"}]'::jsonb, 6
FROM tests t WHERE t.title = 'Anksiyete Düzeyi Değerlendirme Testi';

INSERT INTO public.test_questions (test_id, question_text, question_type, options, step_number) 
SELECT t.id, 'Kaygınız nedeniyle iştahınızda değişiklik oluyor mu?', 'multiple_choice', 
'[{"text": "Değişiklik yok", "value": "no_change"}, {"text": "Biraz azalıyor", "value": "slightly_decreased"}, {"text": "Çok azalıyor", "value": "much_decreased"}, {"text": "Tamamen kayboluyor", "value": "complete_loss"}]'::jsonb, 7
FROM tests t WHERE t.title = 'Anksiyete Düzeyi Değerlendirme Testi';

INSERT INTO public.test_questions (test_id, question_text, question_type, options, step_number) 
SELECT t.id, 'Kaygı nedeniyle karar verme güçlüğü yaşıyor musunuz?', 'multiple_choice', 
'[{"text": "Hiç yaşamıyorum", "value": "never"}, {"text": "Bazen yaşıyorum", "value": "sometimes"}, {"text": "Sık sık yaşıyorum", "value": "often"}, {"text": "Her zaman yaşıyorum", "value": "always"}]'::jsonb, 8
FROM tests t WHERE t.title = 'Anksiyete Düzeyi Değerlendirme Testi';

INSERT INTO public.test_questions (test_id, question_text, question_type, options, step_number) 
SELECT t.id, 'Kaygılı hissettiğinizde dinlenme ve rahatlamada zorlanır mısınız?', 'multiple_choice', 
'[{"text": "Zorlanmam", "value": "no_difficulty"}, {"text": "Biraz zorlanırım", "value": "slight_difficulty"}, {"text": "Çok zorlanırım", "value": "much_difficulty"}, {"text": "Hiç rahatleyamam", "value": "cannot_relax"}]'::jsonb, 9
FROM tests t WHERE t.title = 'Anksiyete Düzeyi Değerlendirme Testi';

INSERT INTO public.test_questions (test_id, question_text, question_type, options, step_number) 
SELECT t.id, 'Kaygınızın günlük yaşamınıza etkisi nasıl?', 'multiple_choice', 
'[{"text": "Hiç etki etmiyor", "value": "no_impact"}, {"text": "Az etkiliyor", "value": "little_impact"}, {"text": "Orta düzeyde etkiliyor", "value": "moderate_impact"}, {"text": "Çok fazla etkiliyor", "value": "high_impact"}]'::jsonb, 10
FROM tests t WHERE t.title = 'Anksiyete Düzeyi Değerlendirme Testi';

-- Test 2: Depresyon Belirtileri Tarama Testi - 8 soru daha ekle
INSERT INTO public.test_questions (test_id, question_text, question_type, options, step_number) 
SELECT t.id, 'Kendinizi değersiz veya suçlu hissediyor musunuz?', 'multiple_choice', 
'[{"text": "Hiçbir zaman", "value": "never"}, {"text": "Nadiren", "value": "rarely"}, {"text": "Sık sık", "value": "often"}, {"text": "Hep", "value": "always"}]'::jsonb, 3
FROM tests t WHERE t.title = 'Depresyon Belirtileri Tarama Testi';

INSERT INTO public.test_questions (test_id, question_text, question_type, options, step_number) 
SELECT t.id, 'Enerji seviyeniz nasıl?', 'multiple_choice', 
'[{"text": "Normal", "value": "normal"}, {"text": "Biraz düşük", "value": "slightly_low"}, {"text": "Çok düşük", "value": "very_low"}, {"text": "Hiç enerjim yok", "value": "no_energy"}]'::jsonb, 4
FROM tests t WHERE t.title = 'Depresyon Belirtileri Tarama Testi';

INSERT INTO public.test_questions (test_id, question_text, question_type, options, step_number) 
SELECT t.id, 'Günlük işlerinizi yapmakta zorlanıyor musunuz?', 'multiple_choice', 
'[{"text": "Zorlanmıyorum", "value": "no_difficulty"}, {"text": "Biraz zorlanıyorum", "value": "slight_difficulty"}, {"text": "Çok zorlanıyorum", "value": "much_difficulty"}, {"text": "Hiç yapamıyorum", "value": "cannot_do"}]'::jsonb, 5
FROM tests t WHERE t.title = 'Depresyon Belirtileri Tarama Testi';

INSERT INTO public.test_questions (test_id, question_text, question_type, options, step_number) 
SELECT t.id, 'Sosyal çevrenizdeki insanlardan uzaklaşma isteği var mı?', 'multiple_choice', 
'[{"text": "Yok", "value": "no"}, {"text": "Bazen", "value": "sometimes"}, {"text": "Sık sık", "value": "often"}, {"text": "Sürekli", "value": "constantly"}]'::jsonb, 6
FROM tests t WHERE t.title = 'Depresyon Belirtileri Tarama Testi';

INSERT INTO public.test_questions (test_id, question_text, question_type, options, step_number) 
SELECT t.id, 'Gelecek konusunda umutlu musunuz?', 'multiple_choice', 
'[{"text": "Çok umutluyum", "value": "very_hopeful"}, {"text": "Umutluyum", "value": "hopeful"}, {"text": "Pek umutlu değilim", "value": "not_very_hopeful"}, {"text": "Hiç umutlu değilim", "value": "hopeless"}]'::jsonb, 7
FROM tests t WHERE t.title = 'Depresyon Belirtileri Tarama Testi';

INSERT INTO public.test_questions (test_id, question_text, question_type, options, step_number) 
SELECT t.id, 'Dikkat ve konsantrasyon problemleri yaşıyor musunuz?', 'multiple_choice', 
'[{"text": "Yaşamıyorum", "value": "no"}, {"text": "Bazen yaşıyorum", "value": "sometimes"}, {"text": "Sık sık yaşıyorum", "value": "often"}, {"text": "Sürekli yaşıyorum", "value": "constantly"}]'::jsonb, 8
FROM tests t WHERE t.title = 'Depresyon Belirtileri Tarama Testi';

INSERT INTO public.test_questions (test_id, question_text, question_type, options, step_number) 
SELECT t.id, 'Ağlama nöbetleri geçiriyor musunuz?', 'multiple_choice', 
'[{"text": "Hiç", "value": "never"}, {"text": "Nadiren", "value": "rarely"}, {"text": "Bazen", "value": "sometimes"}, {"text": "Sık sık", "value": "often"}]'::jsonb, 9
FROM tests t WHERE t.title = 'Depresyon Belirtileri Tarama Testi';

INSERT INTO public.test_questions (test_id, question_text, question_type, options, step_number) 
SELECT t.id, 'Fiziksel ağrılar (baş, boyun, sırt ağrısı) yaşıyor musunuz?', 'multiple_choice', 
'[{"text": "Yaşamıyorum", "value": "no"}, {"text": "Nadiren", "value": "rarely"}, {"text": "Bazen", "value": "sometimes"}, {"text": "Sık sık", "value": "often"}]'::jsonb, 10
FROM tests t WHERE t.title = 'Depresyon Belirtileri Tarama Testi';

-- Test 3: Stres Yönetimi Değerlendirme Testi - 8 soru daha ekle
INSERT INTO public.test_questions (test_id, question_text, question_type, options, step_number) 
SELECT t.id, 'Stres kaynaklarınızı tanımlayabiliyor musunuz?', 'multiple_choice', 
'[{"text": "Kolayca tanımlayabiliyorum", "value": "easily"}, {"text": "Genellikle tanımlayabiliyorum", "value": "usually"}, {"text": "Bazen tanımlayabiliyorum", "value": "sometimes"}, {"text": "Tanımlayamıyorum", "value": "cannot"}]'::jsonb, 3
FROM tests t WHERE t.title = 'Stres Yönetimi Değerlendirme Testi';

INSERT INTO public.test_questions (test_id, question_text, question_type, options, step_number) 
SELECT t.id, 'Stresli durumlarda ne kadar sürede sakinleşebiliyorsunuz?', 'multiple_choice', 
'[{"text": "Hemen sakinleşiyorum", "value": "immediately"}, {"text": "Birkaç dakika", "value": "few_minutes"}, {"text": "Yarım saat", "value": "half_hour"}, {"text": "Saatler sürer", "value": "hours"}]'::jsonb, 4
FROM tests t WHERE t.title = 'Stres Yönetimi Değerlendirme Testi';

INSERT INTO public.test_questions (test_id, question_text, question_type, options, step_number) 
SELECT t.id, 'Stres anında mantıklı kararlar verebiliyor musunuz?', 'multiple_choice', 
'[{"text": "Evet, rahatlıkla", "value": "easily"}, {"text": "Genellikle evet", "value": "usually"}, {"text": "Bazen", "value": "sometimes"}, {"text": "Hayır, veremiyorum", "value": "no"}]'::jsonb, 5
FROM tests t WHERE t.title = 'Stres Yönetimi Değerlendirme Testi';

INSERT INTO public.test_questions (test_id, question_text, question_type, options, step_number) 
SELECT t.id, 'Stresle başa çıkmak için hangi aktiviteleri tercih edersiniz?', 'multiple_choice', 
'[{"text": "Meditasyon ve nefes egzersizleri", "value": "meditation"}, {"text": "Müzik dinlemek", "value": "music"}, {"text": "Arkadaşlarla konuşmak", "value": "talking"}, {"text": "Hiçbir şey yapmam", "value": "nothing"}]'::jsonb, 6
FROM tests t WHERE t.title = 'Stres Yönetimi Değerlendirme Testi';

INSERT INTO public.test_questions (test_id, question_text, question_type, options, step_number) 
SELECT t.id, 'Stresin fiziksel etkilerini (kas gerginliği, baş ağrısı) yaşıyor musunuz?', 'multiple_choice', 
'[{"text": "Hiç yaşamıyorum", "value": "never"}, {"text": "Nadiren", "value": "rarely"}, {"text": "Sık sık", "value": "often"}, {"text": "Sürekli", "value": "constantly"}]'::jsonb, 7
FROM tests t WHERE t.title = 'Stres Yönetimi Değerlendirme Testi';

INSERT INTO public.test_questions (test_id, question_text, question_type, options, step_number) 
SELECT t.id, 'İş/okul stresinin ev yaşamınıza etkisi nasıl?', 'multiple_choice', 
'[{"text": "Hiç etki etmiyor", "value": "no_effect"}, {"text": "Az etkiliyor", "value": "little_effect"}, {"text": "Orta düzeyde etkiliyor", "value": "moderate_effect"}, {"text": "Çok etkiliyor", "value": "high_effect"}]'::jsonb, 8
FROM tests t WHERE t.title = 'Stres Yönetimi Değerlendirme Testi';

INSERT INTO public.test_questions (test_id, question_text, question_type, options, step_number) 
SELECT t.id, 'Stresli dönemlerde uyku kaliteniz nasıl etkilenir?', 'multiple_choice', 
'[{"text": "Etkilenmez", "value": "not_affected"}, {"text": "Biraz etkilenir", "value": "slightly_affected"}, {"text": "Çok etkilenir", "value": "much_affected"}, {"text": "Hiç uyuyamam", "value": "cannot_sleep"}]'::jsonb, 9
FROM tests t WHERE t.title = 'Stres Yönetimi Değerlendirme Testi';

INSERT INTO public.test_questions (test_id, question_text, question_type, options, step_number) 
SELECT t.id, 'Stres yönetimi tekniklerini öğrenmeye ne kadar açıksınız?', 'multiple_choice', 
'[{"text": "Çok açığım", "value": "very_open"}, {"text": "Açığım", "value": "open"}, {"text": "Kısmen açığım", "value": "somewhat_open"}, {"text": "Açık değilim", "value": "not_open"}]'::jsonb, 10
FROM tests t WHERE t.title = 'Stres Yönetimi Değerlendirme Testi';

-- Test 4: Öz Güven ve Benlik Saygısı Testi - 8 soru daha ekle
INSERT INTO public.test_questions (test_id, question_text, question_type, options, step_number) 
SELECT t.id, 'Hatalarınızı kabul etmekte zorlanır mısınız?', 'multiple_choice', 
'[{"text": "Zorlanmam", "value": "no_difficulty"}, {"text": "Biraz zorlanırım", "value": "slight_difficulty"}, {"text": "Çok zorlanırım", "value": "much_difficulty"}, {"text": "Hiç kabul edemem", "value": "cannot_accept"}]'::jsonb, 3
FROM tests t WHERE t.title = 'Öz Güven ve Benlik Saygısı Testi';

INSERT INTO public.test_questions (test_id, question_text, question_type, options, step_number) 
SELECT t.id, 'Eleştirilere nasıl tepki verirsiniz?', 'multiple_choice', 
'[{"text": "Olumlu karşılarım", "value": "positive"}, {"text": "Nötr karşılarım", "value": "neutral"}, {"text": "Olumsuz karşılarım", "value": "negative"}, {"text": "Çok kırılırım", "value": "very_hurt"}]'::jsonb, 4
FROM tests t WHERE t.title = 'Öz Güven ve Benlik Saygısı Testi';

INSERT INTO public.test_questions (test_id, question_text, question_type, options, step_number) 
SELECT t.id, 'Kendinizi başkalarıyla karşılaştırır mısınız?', 'multiple_choice', 
'[{"text": "Hiç karşılaştırmam", "value": "never"}, {"text": "Nadiren", "value": "rarely"}, {"text": "Bazen", "value": "sometimes"}, {"text": "Sürekli", "value": "constantly"}]'::jsonb, 5
FROM tests t WHERE t.title = 'Öz Güven ve Benlik Saygısı Testi';

INSERT INTO public.test_questions (test_id, question_text, question_type, options, step_number) 
SELECT t.id, 'Kendi görüşlerinizi savunabiliyor musunuz?', 'multiple_choice', 
'[{"text": "Kolayca savunabiliyorum", "value": "easily"}, {"text": "Genellikle savunabiliyorum", "value": "usually"}, {"text": "Bazen savunabiliyorum", "value": "sometimes"}, {"text": "Savunamıyorum", "value": "cannot"}]'::jsonb, 6
FROM tests t WHERE t.title = 'Öz Güven ve Benlik Saygısı Testi';

INSERT INTO public.test_questions (test_id, question_text, question_type, options, step_number) 
SELECT t.id, 'Fiziksel görünümünüzden memnun musunuz?', 'multiple_choice', 
'[{"text": "Çok memnunum", "value": "very_satisfied"}, {"text": "Memnunum", "value": "satisfied"}, {"text": "Kısmen memnunum", "value": "partially_satisfied"}, {"text": "Memnun değilim", "value": "not_satisfied"}]'::jsonb, 7
FROM tests t WHERE t.title = 'Öz Güven ve Benlik Saygısı Testi';

INSERT INTO public.test_questions (test_id, question_text, question_type, options, step_number) 
SELECT t.id, 'Yeni şeyler denemekten korkar mısınız?', 'multiple_choice', 
'[{"text": "Hiç korkmam", "value": "not_afraid"}, {"text": "Biraz korkarım", "value": "slightly_afraid"}, {"text": "Çok korkarım", "value": "very_afraid"}, {"text": "Hiç denemem", "value": "never_try"}]'::jsonb, 8
FROM tests t WHERE t.title = 'Öz Güven ve Benlik Saygısı Testi';

INSERT INTO public.test_questions (test_id, question_text, question_type, options, step_number) 
SELECT t.id, 'Başarılarınızı takdir ediyor musunuz?', 'multiple_choice', 
'[{"text": "Her zaman takdir ederim", "value": "always"}, {"text": "Çoğu zaman", "value": "usually"}, {"text": "Bazen", "value": "sometimes"}, {"text": "Hiç takdir etmem", "value": "never"}]'::jsonb, 9
FROM tests t WHERE t.title = 'Öz Güven ve Benlik Saygısı Testi';

INSERT INTO public.test_questions (test_id, question_text, question_type, options, step_number) 
SELECT t.id, 'Kendinize olan güveniniz son zamanlarda nasıl?', 'multiple_choice', 
'[{"text": "Arttı", "value": "increased"}, {"text": "Aynı kaldı", "value": "same"}, {"text": "Azaldı", "value": "decreased"}, {"text": "Çok azaldı", "value": "much_decreased"}]'::jsonb, 10
FROM tests t WHERE t.title = 'Öz Güven ve Benlik Saygısı Testi';

-- Test 5: Sosyal Anksiyete Değerlendirme Testi - 8 soru daha ekle
INSERT INTO public.test_questions (test_id, question_text, question_type, options, step_number) 
SELECT t.id, 'Toplum içinde konuşma yapmaktan kaçınır mısınız?', 'multiple_choice', 
'[{"text": "Kaçınmam", "value": "no"}, {"text": "Bazen kaçınırım", "value": "sometimes"}, {"text": "Çoğu zaman kaçınırım", "value": "usually"}, {"text": "Her zaman kaçınırım", "value": "always"}]'::jsonb, 3
FROM tests t WHERE t.title = 'Sosyal Anksiyete Değerlendirme Testi';

INSERT INTO public.test_questions (test_id, question_text, question_type, options, step_number) 
SELECT t.id, 'Yemek yerken başkalarının sizi izlemesi sizi rahatsız eder mi?', 'multiple_choice', 
'[{"text": "Rahatsız etmez", "value": "not_bothered"}, {"text": "Biraz rahatsız eder", "value": "slightly_bothered"}, {"text": "Çok rahatsız eder", "value": "very_bothered"}, {"text": "Dayanamam", "value": "unbearable"}]'::jsonb, 4
FROM tests t WHERE t.title = 'Sosyal Anksiyete Değerlendirme Testi';

INSERT INTO public.test_questions (test_id, question_text, question_type, options, step_number) 
SELECT t.id, 'Telefonda konuşurken gerginlik yaşar mısınız?', 'multiple_choice', 
'[{"text": "Yaşamam", "value": "no"}, {"text": "Bazen yaşarım", "value": "sometimes"}, {"text": "Sık sık yaşarım", "value": "often"}, {"text": "Her zaman yaşarım", "value": "always"}]'::jsonb, 5
FROM tests t WHERE t.title = 'Sosyal Anksiyete Değerlendirme Testi';

INSERT INTO public.test_questions (test_id, question_text, question_type, options, step_number) 
SELECT t.id, 'Sosyal medyada paylaşım yaparken endişe duyar mısınız?', 'multiple_choice', 
'[{"text": "Duymam", "value": "no"}, {"text": "Bazen duyarım", "value": "sometimes"}, {"text": "Sık sık duyarım", "value": "often"}, {"text": "Bu yüzden paylaşım yapmam", "value": "dont_share"}]'::jsonb, 6
FROM tests t WHERE t.title = 'Sosyal Anksiyete Değerlendirme Testi';

INSERT INTO public.test_questions (test_id, question_text, question_type, options, step_number) 
SELECT t.id, 'Grup aktivitelerine katılımınız nasıl?', 'multiple_choice', 
'[{"text": "Aktif katılırım", "value": "active"}, {"text": "Bazen katılırım", "value": "sometimes"}, {"text": "Nadiren katılırım", "value": "rarely"}, {"text": "Hiç katılmam", "value": "never"}]'::jsonb, 7
FROM tests t WHERE t.title = 'Sosyal Anksiyete Değerlendirme Testi';

INSERT INTO public.test_questions (test_id, question_text, question_type, options, step_number) 
SELECT t.id, 'Hata yaptığınızda başkalarının tepkisinden endişe eder misiniz?', 'multiple_choice', 
'[{"text": "Endişe etmem", "value": "no"}, {"text": "Biraz endişe ederim", "value": "slightly"}, {"text": "Çok endişe ederim", "value": "very"}, {"text": "Aşırı endişe ederim", "value": "extremely"}]'::jsonb, 8
FROM tests t WHERE t.title = 'Sosyal Anksiyete Değerlendirme Testi';

INSERT INTO public.test_questions (test_id, question_text, question_type, options, step_number) 
SELECT t.id, 'Sosyal durumlar öncesinde hazırlık yapma ihtiyacı duyar mısınız?', 'multiple_choice', 
'[{"text": "Duymam", "value": "no"}, {"text": "Bazen duyarım", "value": "sometimes"}, {"text": "Çoğu zaman duyarım", "value": "usually"}, {"text": "Her zaman duyarım", "value": "always"}]'::jsonb, 9
FROM tests t WHERE t.title = 'Sosyal Anksiyete Değerlendirme Testi';

INSERT INTO public.test_questions (test_id, question_text, question_type, options, step_number) 
SELECT t.id, 'Sosyal kaygınızın yaşam kalitenize etkisi nasıl?', 'multiple_choice', 
'[{"text": "Hiç etki etmiyor", "value": "no_impact"}, {"text": "Az etkiliyor", "value": "little_impact"}, {"text": "Orta düzeyde etkiliyor", "value": "moderate_impact"}, {"text": "Çok fazla etkiliyor", "value": "high_impact"}]'::jsonb, 10
FROM tests t WHERE t.title = 'Sosyal Anksiyete Değerlendirme Testi';