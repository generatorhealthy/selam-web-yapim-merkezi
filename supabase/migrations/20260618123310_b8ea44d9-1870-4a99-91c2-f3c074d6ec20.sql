DO $$
DECLARE
  v_spec_id uuid := '0096d721-6e13-4fdf-92e4-ae934e721ae1';
  v_spec_area text := 'Psikolojik Danışmanlık ve Mentorluk';
  t1 uuid := gen_random_uuid();
  t2 uuid := gen_random_uuid();
  t3 uuid := gen_random_uuid();
BEGIN
  INSERT INTO public.tests (id, title, description, category, specialty_area, specialist_id, status, is_active)
  VALUES
    (t1, 'Stres Düzeyi Testi', 'Günlük yaşamınızdaki stres seviyenizi değerlendirmenize yardımcı olan kısa bir test.', 'Psikolojik Testler', v_spec_area, v_spec_id, 'approved', true),
    (t2, 'Özgüven Testi', 'Kendinize olan güveninizi ve öz değer algınızı ölçen bir değerlendirme.', 'Psikolojik Testler', v_spec_area, v_spec_id, 'approved', true),
    (t3, 'Kaygı Düzeyi Testi', 'Son dönemdeki kaygı belirtilerinizi değerlendiren bir test.', 'Psikolojik Testler', v_spec_area, v_spec_id, 'approved', true);

  INSERT INTO public.test_questions (test_id, question_text, question_type, options, step_number, is_required) VALUES
    (t1, 'Son zamanlarda kendinizi ne sıklıkla gergin hissediyorsunuz?', 'multiple_choice', '["Hiç","Nadiren","Bazen","Sık sık","Her zaman"]', 1, true),
    (t1, 'Stresle başa çıkmakta zorlanıyor musunuz?', 'multiple_choice', '["Hiç zorlanmıyorum","Bazen zorlanıyorum","Sık sık zorlanıyorum","Çok zorlanıyorum","Sürekli zorlanıyorum"]', 2, true),
    (t1, 'Uyku düzeniniz stresten etkileniyor mu?', 'multiple_choice', '["Hiç etkilenmiyor","Nadiren","Bazen","Sık sık","Her zaman"]', 3, true),
    (t1, 'Günlük sorumluluklarınız size bunaltıcı geliyor mu?', 'multiple_choice', '["Hiç","Nadiren","Bazen","Sık sık","Her zaman"]', 4, true),

    (t2, 'Aldığınız kararlara güvenir misiniz?', 'multiple_choice', '["Her zaman","Çoğunlukla","Bazen","Nadiren","Hiçbir zaman"]', 1, true),
    (t2, 'Yeni ortamlarda kendinizi rahat hisseder misiniz?', 'multiple_choice', '["Her zaman","Çoğunlukla","Bazen","Nadiren","Hiçbir zaman"]', 2, true),
    (t2, 'Başarılarınızı takdir eder misiniz?', 'multiple_choice', '["Her zaman","Çoğunlukla","Bazen","Nadiren","Hiçbir zaman"]', 3, true),
    (t2, 'Eleştirilerle başa çıkabiliyor musunuz?', 'multiple_choice', '["Çok kolay","Kolay","Orta","Zor","Çok zor"]', 4, true),

    (t3, 'Son zamanlarda nedensiz endişe yaşıyor musunuz?', 'multiple_choice', '["Hiç","Nadiren","Bazen","Sık sık","Her zaman"]', 1, true),
    (t3, 'Rahatlamakta güçlük çekiyor musunuz?', 'multiple_choice', '["Hiç","Nadiren","Bazen","Sık sık","Her zaman"]', 2, true),
    (t3, 'Kalp çarpıntısı veya huzursuzluk yaşıyor musunuz?', 'multiple_choice', '["Hiç","Nadiren","Bazen","Sık sık","Her zaman"]', 3, true),
    (t3, 'Olumsuz şeylerin olacağına dair endişeniz oluyor mu?', 'multiple_choice', '["Hiç","Nadiren","Bazen","Sık sık","Her zaman"]', 4, true);
END $$;