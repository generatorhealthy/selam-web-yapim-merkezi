-- Mevcut Psikolog uzmanları için testleri kopyala
INSERT INTO tests (title, description, category, specialty_area, status, is_active, specialist_id)
SELECT 
  t.title || ' - ' || s.name as title,
  t.description,
  t.category,
  t.specialty_area,
  'approved' as status,
  true as is_active,
  s.id as specialist_id
FROM specialists s
CROSS JOIN tests t
WHERE s.specialty = 'Psikolog' 
AND t.specialty_area = 'Psikolog' 
AND t.specialist_id IS NULL
AND NOT EXISTS (
  SELECT 1 FROM tests existing 
  WHERE existing.specialist_id = s.id 
  AND existing.specialty_area = 'Psikolog'
);

-- Mevcut Aile Danışmanı uzmanları için testleri kopyala
INSERT INTO tests (title, description, category, specialty_area, status, is_active, specialist_id)
SELECT 
  t.title || ' - ' || s.name as title,
  t.description,
  t.category,
  t.specialty_area,
  'approved' as status,
  true as is_active,
  s.id as specialist_id
FROM specialists s
CROSS JOIN tests t
WHERE s.specialty = 'Aile Danışmanı' 
AND t.specialty_area = 'Aile Danışmanı' 
AND t.specialist_id IS NULL
AND NOT EXISTS (
  SELECT 1 FROM tests existing 
  WHERE existing.specialist_id = s.id 
  AND existing.specialty_area = 'Aile Danışmanı'
);

-- Mevcut Psikolojik Danışmanlık uzmanları için testleri kopyala
INSERT INTO tests (title, description, category, specialty_area, status, is_active, specialist_id)
SELECT 
  t.title || ' - ' || s.name as title,
  t.description,
  t.category,
  t.specialty_area,
  'approved' as status,
  true as is_active,
  s.id as specialist_id
FROM specialists s
CROSS JOIN tests t
WHERE s.specialty = 'Psikolojik Danışmanlık' 
AND t.specialty_area = 'Psikolojik Danışmanlık' 
AND t.specialist_id IS NULL
AND NOT EXISTS (
  SELECT 1 FROM tests existing 
  WHERE existing.specialist_id = s.id 
  AND existing.specialty_area = 'Psikolojik Danışmanlık'
);

-- Yeni kopyalanan testler için test sorularını da kopyala
INSERT INTO test_questions (test_id, question_text, question_type, options, step_number, is_required)
SELECT 
  new_test.id as test_id,
  tq.question_text,
  tq.question_type,
  tq.options,
  tq.step_number,
  tq.is_required
FROM tests new_test
JOIN tests original_test ON (
  new_test.title LIKE '%' || original_test.title || '%' 
  AND new_test.specialty_area = original_test.specialty_area
  AND original_test.specialist_id IS NULL
)
JOIN test_questions tq ON tq.test_id = original_test.id
WHERE new_test.specialist_id IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM test_questions existing_q 
  WHERE existing_q.test_id = new_test.id
);