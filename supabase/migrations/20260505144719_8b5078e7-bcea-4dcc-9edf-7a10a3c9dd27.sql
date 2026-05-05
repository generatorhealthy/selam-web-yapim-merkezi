-- 1) Trigger fonksiyonunu güncelle: Klinik Psikolog'u da Psikolog testleriyle eşleştir
CREATE OR REPLACE FUNCTION public.create_specialist_tests()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Psikolog VEYA Klinik Psikolog ise Psikolog testlerini ekle
  IF NEW.specialty IN ('Psikolog', 'Klinik Psikolog') THEN
    INSERT INTO public.tests (title, description, category, specialty_area, status, is_active, specialist_id)
    SELECT 
      title || ' - ' || NEW.name,
      description,
      category,
      specialty_area,
      'approved',
      true,
      NEW.id
    FROM public.tests 
    WHERE specialty_area = 'Psikolog' AND specialist_id IS NULL
    LIMIT 10;
    
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
             '["Çok iyi", "İyi", "Normal", "Kötü", "Çok kötü"]'::jsonb as options, 1 as step_number
      UNION ALL SELECT 'Günlük aktivitelerinizi yapmakta zorlanıyor musunuz?', '["Hiç zorlanmıyorum", "Bazen zorlanıyorum", "Sık sık zorlanıyorum", "Çok zorlanıyorum", "Hiç yapamıyorum"]'::jsonb, 2
      UNION ALL SELECT 'Uyku düzeniniz nasıl?', '["Çok iyi uyuyorum", "Genelde iyi uyuyorum", "Bazen sorun yaşıyorum", "Sık sık uykusuzluk yaşıyorum", "Hiç uyuyamıyorum"]'::jsonb, 3
      UNION ALL SELECT 'Sosyal ilişkilerinizden memnun musunuz?', '["Çok memnunum", "Memnunum", "Kısmen memnunum", "Memnun değilim", "Hiç memnun değilim"]'::jsonb, 4
      UNION ALL SELECT 'Stresle başa çıkma konusunda kendinizi nasıl değerlendiriyorsunuz?', '["Çok iyi", "İyi", "Orta", "Kötü", "Çok kötü"]'::jsonb, 5
      UNION ALL SELECT 'Kaygı seviyeniz genel olarak nasıl?', '["Hiç kaygılı değilim", "Az kaygılıyım", "Orta düzeyde kaygılıyım", "Çok kaygılıyım", "Sürekli kaygılıyım"]'::jsonb, 6
      UNION ALL SELECT 'Kendinize güveniniz nasıl?', '["Çok yüksek", "Yüksek", "Orta", "Düşük", "Çok düşük"]'::jsonb, 7
      UNION ALL SELECT 'Hayattan aldığınız zevk nasıl?', '["Çok yüksek", "Yüksek", "Orta", "Düşük", "Hiç zevk almıyorum"]'::jsonb, 8
      UNION ALL SELECT 'Odaklanma ve dikkat toplama konusunda nasılsınız?', '["Çok iyi", "İyi", "Orta", "Kötü", "Çok kötü"]'::jsonb, 9
      UNION ALL SELECT 'Gelecekle ilgili umutlarınız nasıl?', '["Çok umutluyum", "Umutluyum", "Kararsızım", "Umutsuzum", "Çok umutsuzum"]'::jsonb, 10
      UNION ALL SELECT 'İştahınız nasıl?', '["Çok iyi", "İyi", "Normal", "Kötü", "Hiç iştahım yok"]'::jsonb, 11
      UNION ALL SELECT 'Enerji seviyeniz nasıl?', '["Çok yüksek", "Yüksek", "Orta", "Düşük", "Çok düşük"]'::jsonb, 12
      UNION ALL SELECT 'Ailenizdeki ilişkiler nasıl?', '["Çok iyi", "İyi", "Orta", "Problemli", "Çok problemli"]'::jsonb, 13
      UNION ALL SELECT 'Genel olarak yaşam kalitenizi nasıl değerlendiriyorsunuz?', '["Mükemmel", "Çok iyi", "İyi", "Kötü", "Çok kötü"]'::jsonb, 14
      UNION ALL SELECT 'Bu değerlendirmeden sonra profesyonel yardım almayı düşünür müsünüz?', '["Kesinlikle evet", "Muhtemelen evet", "Kararsızım", "Muhtemelen hayır", "Kesinlikle hayır"]'::jsonb, 15
    ) q
    CROSS JOIN public.tests t
    WHERE t.specialty_area = 'Psikolog' 
      AND t.specialist_id = NEW.id 
      AND NOT EXISTS (SELECT 1 FROM public.test_questions tq WHERE tq.test_id = t.id);

  ELSIF NEW.specialty = 'Aile Danışmanı' THEN
    INSERT INTO public.tests (title, description, category, specialty_area, status, is_active, specialist_id)
    SELECT title || ' - ' || NEW.name, description, category, specialty_area, 'approved', true, NEW.id
    FROM public.tests WHERE specialty_area = 'Aile Danışmanı' AND specialist_id IS NULL LIMIT 10;

  ELSIF NEW.specialty = 'Psikolojik Danışmanlık' THEN
    INSERT INTO public.tests (title, description, category, specialty_area, status, is_active, specialist_id)
    SELECT title || ' - ' || NEW.name, description, category, specialty_area, 'approved', true, NEW.id
    FROM public.tests WHERE specialty_area = 'Psikolojik Danışmanlık' AND specialist_id IS NULL LIMIT 10;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 2) Mevcut Klinik Psikolog uzmanlara geriye dönük testleri ekle
INSERT INTO public.tests (title, description, category, specialty_area, status, is_active, specialist_id)
SELECT 
  t.title || ' - ' || s.name,
  t.description,
  t.category,
  t.specialty_area,
  'approved',
  true,
  s.id
FROM public.specialists s
CROSS JOIN public.tests t
WHERE s.specialty = 'Klinik Psikolog'
  AND t.specialty_area = 'Psikolog' 
  AND t.specialist_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.tests existing 
    WHERE existing.specialist_id = s.id 
      AND existing.specialty_area = 'Psikolog'
      AND existing.title = t.title || ' - ' || s.name
  );

-- 3) Yeni eklenen testler için varsayılan soruları ekle
INSERT INTO public.test_questions (test_id, question_text, question_type, options, step_number, is_required) 
SELECT 
  t.id,
  q.question_text,
  'multiple_choice',
  q.options::jsonb,
  q.step_number,
  true
FROM (
  SELECT 'Son zamanlarda kendinizi nasıl hissediyorsunuz?' as question_text, '["Çok iyi", "İyi", "Normal", "Kötü", "Çok kötü"]'::jsonb as options, 1 as step_number
  UNION ALL SELECT 'Günlük aktivitelerinizi yapmakta zorlanıyor musunuz?', '["Hiç zorlanmıyorum", "Bazen zorlanıyorum", "Sık sık zorlanıyorum", "Çok zorlanıyorum", "Hiç yapamıyorum"]'::jsonb, 2
  UNION ALL SELECT 'Uyku düzeniniz nasıl?', '["Çok iyi uyuyorum", "Genelde iyi uyuyorum", "Bazen sorun yaşıyorum", "Sık sık uykusuzluk yaşıyorum", "Hiç uyuyamıyorum"]'::jsonb, 3
  UNION ALL SELECT 'Sosyal ilişkilerinizden memnun musunuz?', '["Çok memnunum", "Memnunum", "Kısmen memnunum", "Memnun değilim", "Hiç memnun değilim"]'::jsonb, 4
  UNION ALL SELECT 'Stresle başa çıkma konusunda kendinizi nasıl değerlendiriyorsunuz?', '["Çok iyi", "İyi", "Orta", "Kötü", "Çok kötü"]'::jsonb, 5
  UNION ALL SELECT 'Kaygı seviyeniz genel olarak nasıl?', '["Hiç kaygılı değilim", "Az kaygılıyım", "Orta düzeyde kaygılıyım", "Çok kaygılıyım", "Sürekli kaygılıyım"]'::jsonb, 6
  UNION ALL SELECT 'Kendinize güveniniz nasıl?', '["Çok yüksek", "Yüksek", "Orta", "Düşük", "Çok düşük"]'::jsonb, 7
  UNION ALL SELECT 'Hayattan aldığınız zevk nasıl?', '["Çok yüksek", "Yüksek", "Orta", "Düşük", "Hiç zevk almıyorum"]'::jsonb, 8
  UNION ALL SELECT 'Odaklanma ve dikkat toplama konusunda nasılsınız?', '["Çok iyi", "İyi", "Orta", "Kötü", "Çok kötü"]'::jsonb, 9
  UNION ALL SELECT 'Gelecekle ilgili umutlarınız nasıl?', '["Çok umutluyum", "Umutluyum", "Kararsızım", "Umutsuzum", "Çok umutsuzum"]'::jsonb, 10
  UNION ALL SELECT 'İştahınız nasıl?', '["Çok iyi", "İyi", "Normal", "Kötü", "Hiç iştahım yok"]'::jsonb, 11
  UNION ALL SELECT 'Enerji seviyeniz nasıl?', '["Çok yüksek", "Yüksek", "Orta", "Düşük", "Çok düşük"]'::jsonb, 12
  UNION ALL SELECT 'Ailenizdeki ilişkiler nasıl?', '["Çok iyi", "İyi", "Orta", "Problemli", "Çok problemli"]'::jsonb, 13
  UNION ALL SELECT 'Genel olarak yaşam kalitenizi nasıl değerlendiriyorsunuz?', '["Mükemmel", "Çok iyi", "İyi", "Kötü", "Çok kötü"]'::jsonb, 14
  UNION ALL SELECT 'Bu değerlendirmeden sonra profesyonel yardım almayı düşünür müsünüz?', '["Kesinlikle evet", "Muhtemelen evet", "Kararsızım", "Muhtemelen hayır", "Kesinlikle hayır"]'::jsonb, 15
) q
CROSS JOIN public.tests t
INNER JOIN public.specialists s ON s.id = t.specialist_id
WHERE s.specialty = 'Klinik Psikolog'
  AND t.specialty_area = 'Psikolog' 
  AND NOT EXISTS (SELECT 1 FROM public.test_questions tq WHERE tq.test_id = t.id);