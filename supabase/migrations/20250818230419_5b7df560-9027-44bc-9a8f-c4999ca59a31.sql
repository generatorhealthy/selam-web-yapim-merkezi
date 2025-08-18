-- Insert default questions for different specialty areas

-- Default questions for Psikolog specialty
INSERT INTO public.test_questions (test_id, question_text, question_type, options, step_number, is_required) 
SELECT 
  t.id,
  q.question_text,
  'multiple_choice',
  q.options::jsonb,
  q.step_number,
  true
FROM (
  SELECT 'Son zamanlarda kendinizi nasıl hissediyorsunuz?' as question_text, 
         '["Çok iyi", "İyi", "Normal", "Kötü", "Çok kötü"]'::jsonb as options, 
         1 as step_number
  UNION ALL
  SELECT 'Günlük aktivitelerinizi yapmakta zorlanıyor musunuz?', 
         '["Hiç zorlanmıyorum", "Bazen zorlanıyorum", "Sık sık zorlanıyorum", "Çok zorlanıyorum", "Hiç yapamıyorum"]'::jsonb, 
         2
  UNION ALL
  SELECT 'Uyku düzeniniz nasıl?', 
         '["Çok iyi uyuyorum", "Genelde iyi uyuyorum", "Bazen sorun yaşıyorum", "Sık sık uykusuzluk yaşıyorum", "Hiç uyuyamıyorum"]'::jsonb, 
         3
  UNION ALL
  SELECT 'Sosyal ilişkilerinizden memnun musunuz?', 
         '["Çok memnunum", "Memnunum", "Kısmen memnunum", "Memnun değilim", "Hiç memnun değilim"]'::jsonb, 
         4
  UNION ALL
  SELECT 'Stresle başa çıkma konusunda kendinizi nasıl değerlendiriyorsunuz?', 
         '["Çok iyi", "İyi", "Orta", "Kötü", "Çok kötü"]'::jsonb, 
         5
  UNION ALL
  SELECT 'Kaygı seviyeniz genel olarak nasıl?', 
         '["Hiç kaygılı değilim", "Az kaygılıyım", "Orta düzeyde kaygılıyım", "Çok kaygılıyım", "Sürekli kaygılıyım"]'::jsonb, 
         6
  UNION ALL
  SELECT 'Kendinize güveniniz nasıl?', 
         '["Çok yüksek", "Yüksek", "Orta", "Düşük", "Çok düşük"]'::jsonb, 
         7
  UNION ALL
  SELECT 'Hayattan aldığınız zevk nasıl?', 
         '["Çok yüksek", "Yüksek", "Orta", "Düşük", "Hiç zevk almıyorum"]'::jsonb, 
         8
  UNION ALL
  SELECT 'Odaklanma ve dikkat toplama konusunda nasılsınız?', 
         '["Çok iyi", "İyi", "Orta", "Kötü", "Çok kötü"]'::jsonb, 
         9
  UNION ALL
  SELECT 'Gelecekle ilgili umutlarınız nasıl?', 
         '["Çok umutluyum", "Umutluyum", "Kararsızım", "Umutsuzum", "Çok umutsuzum"]'::jsonb, 
         10
  UNION ALL
  SELECT 'İştahınız nasıl?', 
         '["Çok iyi", "İyi", "Normal", "Kötü", "Hiç iştahım yok"]'::jsonb, 
         11
  UNION ALL
  SELECT 'Enerji seviyeniz nasıl?', 
         '["Çok yüksek", "Yüksek", "Orta", "Düşük", "Çok düşük"]'::jsonb, 
         12
  UNION ALL
  SELECT 'Ailenizdeki ilişkiler nasıl?', 
         '["Çok iyi", "İyi", "Orta", "Problemli", "Çok problemli"]'::jsonb, 
         13
  UNION ALL
  SELECT 'Genel olarak yaşam kalitenizi nasıl değerlendiriyorsunuz?', 
         '["Mükemmel", "Çok iyi", "İyi", "Kötü", "Çok kötü"]'::jsonb, 
         14
  UNION ALL
  SELECT 'Bu değerlendirmeden sonra profesyonel yardım almayı düşünür müsünüz?', 
         '["Kesinlikle evet", "Muhtemelen evet", "Kararsızım", "Muhtemelen hayır", "Kesinlikle hayır"]'::jsonb, 
         15
) q
CROSS JOIN public.tests t
WHERE t.specialty_area = 'Psikolog' 
  AND t.specialist_id IS NOT NULL 
  AND NOT EXISTS (SELECT 1 FROM public.test_questions tq WHERE tq.test_id = t.id);

-- Default questions for Aile Danışmanı specialty  
INSERT INTO public.test_questions (test_id, question_text, question_type, options, step_number, is_required) 
SELECT 
  t.id,
  q.question_text,
  'multiple_choice',
  q.options::jsonb,
  q.step_number,
  true
FROM (
  SELECT 'Aile içi iletişiminizi nasıl değerlendiriyorsunuz?' as question_text,
         '["Çok iyi", "İyi", "Orta", "Kötü", "Çok kötü"]'::jsonb as options,
         1 as step_number
  UNION ALL
  SELECT 'Eşinizle/partnerinizle olan ilişkiniz nasıl?',
         '["Çok mutlu", "Mutlu", "Orta", "Mutsuz", "Çok mutsuz"]'::jsonb,
         2
  UNION ALL
  SELECT 'Çocuklarınızla olan ilişkiniz nasıl?',
         '["Mükemmel", "Çok iyi", "İyi", "Problemli", "Çok problemli"]'::jsonb,
         3
  UNION ALL
  SELECT 'Aile içinde alınan kararlarda görüşünüz alınır mı?',
         '["Her zaman", "Genellikle", "Bazen", "Nadiren", "Hiçbir zaman"]'::jsonb,
         4
  UNION ALL
  SELECT 'Aile içi sorunları çözmekte zorlanıyor musunuz?',
         '["Hiç zorlanmıyorum", "Bazen zorlanıyorum", "Sık zorlanıyorum", "Çok zorlanıyorum", "Çözemiyorum"]'::jsonb,
         5
  UNION ALL
  SELECT 'Ailenizde çatışmalar ne sıklıkta yaşanır?',
         '["Hiçbir zaman", "Nadiren", "Bazen", "Sık sık", "Sürekli"]'::jsonb,
         6
  UNION ALL
  SELECT 'Aile bütçenizi yönetmekte zorlanıyor musunuz?',
         '["Hiç zorlanmıyorum", "Bazen zorlanıyorum", "Sık zorlanıyorum", "Çok zorlanıyorum", "Yönetemiyorum"]'::jsonb,
         7
  UNION ALL
  SELECT 'Ebeveynlik konusunda kendinizi nasıl hissediyorsunuz?',
         '["Çok yeterli", "Yeterli", "Orta", "Yetersiz", "Çok yetersiz"]'::jsonb,
         8
  UNION ALL
  SELECT 'Aile zamanı geçirme konusunda memnun musunuz?',
         '["Çok memnunum", "Memnunum", "Orta", "Memnun değilim", "Hiç memnun değilim"]'::jsonb,
         9
  UNION ALL
  SELECT 'Aile değerlerinizin korunduğunu düşünüyor musunuz?',
         '["Kesinlikle evet", "Evet", "Kısmen", "Hayır", "Kesinlikle hayır"]'::jsonb,
         10
  UNION ALL
  SELECT 'Aile içinde destek hissediyor musunuz?',
         '["Tam destek", "Çok destek", "Orta destek", "Az destek", "Hiç destek yok"]'::jsonb,
         11
  UNION ALL
  SELECT 'Çocuklarınızın davranışlarından endişe duyuyor musunuz?',
         '["Hiç endişelenmiyorum", "Bazen endişeliyim", "Sık endişeliyim", "Çok endişeliyim", "Sürekli endişeliyim"]'::jsonb,
         12
  UNION ALL
  SELECT 'Aile içi rollerin adil dağıtıldığını düşünüyor musunuz?',
         '["Kesinlikle evet", "Evet", "Kısmen", "Hayır", "Kesinlikle hayır"]'::jsonb,
         13
  UNION ALL
  SELECT 'Gelecek planlarınızı ailenizle paylaşabiliyor musunuz?',
         '["Her zaman", "Genellikle", "Bazen", "Nadiren", "Hiçbir zaman"]'::jsonb,
         14
  UNION ALL
  SELECT 'Aile danışmanlığından fayda görebileceğinizi düşünüyor musunuz?',
         '["Kesinlikle evet", "Muhtemelen evet", "Kararsızım", "Muhtemelen hayır", "Kesinlikle hayır"]'::jsonb,
         15
) q
CROSS JOIN public.tests t
WHERE t.specialty_area = 'Aile Danışmanı' 
  AND t.specialist_id IS NOT NULL 
  AND NOT EXISTS (SELECT 1 FROM public.test_questions tq WHERE tq.test_id = t.id);

-- Default questions for Psikolojik Danışmanlık specialty
INSERT INTO public.test_questions (test_id, question_text, question_type, options, step_number, is_required) 
SELECT 
  t.id,
  q.question_text,
  'multiple_choice',
  q.options::jsonb,
  q.step_number,
  true
FROM (
  SELECT 'Hayatınızdaki değişimlerle başa çıkmakta zorlanıyor musunuz?' as question_text,
         '["Hiç zorlanmıyorum", "Bazen zorlanıyorum", "Sık zorlanıyorum", "Çok zorlanıyorum", "Hiç başa çıkamıyorum"]'::jsonb as options,
         1 as step_number
  UNION ALL
  SELECT 'Kararlar almakta zorlanıyor musunuz?',
         '["Hiç zorlanmıyorum", "Bazen zorlanıyorum", "Sık zorlanıyorum", "Çok zorlanıyorum", "Karar alamıyorum"]'::jsonb,
         2
  UNION ALL
  SELECT 'Kişisel hedeflerinize ulaşmakta kendinizi nasıl hissediyorsunuz?',
         '["Çok başarılı", "Başarılı", "Orta", "Başarısız", "Çok başarısız"]'::jsonb,
         3
  UNION ALL
  SELECT 'İnsanlarla ilişki kurmakta zorlanıyor musunuz?',
         '["Hiç zorlanmıyorum", "Bazen zorlanıyorum", "Sık zorlanıyorum", "Çok zorlanıyorum", "İlişki kuramıyorum"]'::jsonb,
         4
  UNION ALL
  SELECT 'Duygularınızı ifade etmekte zorlanıyor musunuz?',
         '["Hiç zorlanmıyorum", "Bazen zorlanıyorum", "Sık zorlanıyorum", "Çok zorlanıyorum", "İfade edemiyorum"]'::jsonb,
         5
  UNION ALL
  SELECT 'Geçmiş yaşantılarınızın şu anki hayatınızı ne kadar etkilediğini düşünüyorsunuz?',
         '["Hiç etkilemiyor", "Az etkiliyor", "Orta etkiliyor", "Çok etkiliyor", "Tamamen etkiliyor"]'::jsonb,
         6
  UNION ALL
  SELECT 'Kendinizi geliştirme konusunda ne kadar isteklisiniz?',
         '["Çok istekliyim", "İstekliyim", "Orta", "İsteksizim", "Hiç istekli değilim"]'::jsonb,
         7
  UNION ALL
  SELECT 'Yaşadığınız problemlerin çözümünde ne kadar umutlusunuz?',
         '["Çok umutluyum", "Umutluyum", "Orta", "Umutsuzum", "Çok umutsuzum"]'::jsonb,
         8
  UNION ALL
  SELECT 'Başkalarından yardım almakta zorlanıyor musunuz?',
         '["Hiç zorlanmıyorum", "Bazen zorlanıyorum", "Sık zorlanıyorum", "Çok zorlanıyorum", "Yardım alamıyorum"]'::jsonb,
         9
  UNION ALL
  SELECT 'Kendinizi tanıma konusunda ne düzeyde olduğunuzu düşünüyorsunuz?',
         '["Çok iyi tanıyorum", "İyi tanıyorum", "Orta", "Az tanıyorum", "Hiç tanımıyorum"]'::jsonb,
         10
  UNION ALL
  SELECT 'Yaşam motivasyonunuz nasıl?',
         '["Çok yüksek", "Yüksek", "Orta", "Düşük", "Çok düşük"]'::jsonb,
         11
  UNION ALL
  SELECT 'Problem çözme becerilerinizi nasıl değerlendiriyorsunuz?',
         '["Mükemmel", "Çok iyi", "İyi", "Kötü", "Çok kötü"]'::jsonb,
         12
  UNION ALL
  SELECT 'Duygusal dengenizi sağlamakta zorlanıyor musunuz?',
         '["Hiç zorlanmıyorum", "Bazen zorlanıyorum", "Sık zorlanıyorum", "Çok zorlanıyorum", "Denge sağlayamıyorum"]'::jsonb,
         13
  UNION ALL
  SELECT 'Yaşam kaliteni artırmak için neler yapmak istiyorsunuz?',
         '["Çok şey yapmak istiyorum", "Birkaç şey yapmak istiyorum", "Kararsızım", "Fazla bir şey yapmak istemiyorum", "Hiçbir şey yapmak istemiyorum"]'::jsonb,
         14
  UNION ALL
  SELECT 'Psikolojik danışmanlık hizmetinden fayda görebileceğinizi düşünüyor musunuz?',
         '["Kesinlikle evet", "Muhtemelen evet", "Kararsızım", "Muhtemelen hayır", "Kesinlikle hayır"]'::jsonb,
         15
) q
CROSS JOIN public.tests t
WHERE t.specialty_area = 'Psikolojik Danışmanlık' 
  AND t.specialist_id IS NOT NULL 
  AND NOT EXISTS (SELECT 1 FROM public.test_questions tq WHERE tq.test_id = t.id);