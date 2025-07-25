-- Aile Danışmanları için 10 test oluştur
INSERT INTO tests (title, description, category, specialty_area, status, is_active, specialist_id) VALUES
('Aile İçi İletişim Değerlendirme Testi', 'Aile üyeleri arasındaki iletişim kalitesini ve dinamiklerini değerlendiren kapsamlı test', 'Aile İletişimi', 'Aile Danışmanı', 'approved', true, NULL),
('Evlilik Uyumu Analizi', 'Çiftler arası uyumu, beklentileri ve ilişki dinamiklerini analiz eden test', 'Evlilik Danışmanlığı', 'Aile Danışmanı', 'approved', true, NULL),
('Çocuk Davranış Değerlendirmesi', 'Çocuklardaki davranış problemlerini ve aile içi etkilerini değerlendiren test', 'Çocuk Gelişimi', 'Aile Danışmanı', 'approved', true, NULL),
('Aile Çatışma Çözüm Testi', 'Aile içi çatışmaları çözme becerilerini ve stratejilerini değerlendiren test', 'Çatışma Yönetimi', 'Aile Danışmanı', 'approved', true, NULL),
('Ebeveynlik Becerileri Ölçeği', 'Ebeveynlik yaklaşımlarını ve becerilerini değerlendiren kapsamlı test', 'Ebeveynlik', 'Aile Danışmanı', 'approved', true, NULL),
('Aile Değerleri ve İnançlar Testi', 'Aile içi değer sistemlerini ve inançları analiz eden test', 'Değer Sistemleri', 'Aile Danışmanı', 'approved', true, NULL),
('Adölesan Aile İlişkileri Testi', 'Ergenlik dönemindeki çocuklarla aile dinamiklerini değerlendiren test', 'Ergenlik', 'Aile Danışmanı', 'approved', true, NULL),
('Aile Stresi ve Başa Çıkma Testi', 'Aile içi stres faktörlerini ve başa çıkma mekanizmalarını değerlendiren test', 'Stres Yönetimi', 'Aile Danışmanı', 'approved', true, NULL),
('Boşanma Süreci Değerlendirmesi', 'Boşanma sürecindeki dinamikleri ve çocuklar üzerindeki etkilerini değerlendiren test', 'Boşanma Danışmanlığı', 'Aile Danışmanı', 'approved', true, NULL),
('Aile Bağlılığı ve Destek Sistemi Testi', 'Aile bağlarının gücünü ve destek sistemlerini değerlendiren test', 'Aile Bağları', 'Aile Danışmanı', 'approved', true, NULL);

-- Psikolojik Danışmanlık için 10 test oluştur
INSERT INTO tests (title, description, category, specialty_area, status, is_active, specialist_id) VALUES
('Kişisel Gelişim ve Motivasyon Testi', 'Bireyin kişisel gelişim alanlarını ve motivasyon düzeyini değerlendiren test', 'Kişisel Gelişim', 'Psikolojik Danışmanlık', 'approved', true, NULL),
('Yaşam Boyu Öğrenme Değerlendirmesi', 'Öğrenme stillerini ve yaşam boyu öğrenme yaklaşımlarını analiz eden test', 'Öğrenme', 'Psikolojik Danışmanlık', 'approved', true, NULL),
('Kariyer Yönelimi ve İlgi Alanları Testi', 'Kariyer tercihlerini ve meslek yönelimlerini belirleyen kapsamlı test', 'Kariyer Danışmanlığı', 'Psikolojik Danışmanlık', 'approved', true, NULL),
('Sosyal Beceriler Değerlendirmesi', 'Sosyal etkileşim becerilerini ve iletişim kalitesini değerlendiren test', 'Sosyal Beceriler', 'Psikolojik Danışmanlık', 'approved', true, NULL),
('Özgüven ve Benlik Saygısı Testi', 'Özgüven düzeyini ve benlik algısını değerlendiren detaylı test', 'Özgüven', 'Psikolojik Danışmanlık', 'approved', true, NULL),
('Stres Yönetimi ve Başa Çıkma Becerileri', 'Stresle başa çıkma stratejilerini ve dayanıklılık düzeyini değerlendiren test', 'Stres Yönetimi', 'Psikolojik Danışmanlık', 'approved', true, NULL),
('Duygusal Zeka Değerlendirmesi', 'Duygusal farkındalık ve yönetim becerilerini değerlendiren test', 'Duygusal Zeka', 'Psikolojik Danışmanlık', 'approved', true, NULL),
('Yaşam Doyumu ve Mutluluk Ölçeği', 'Yaşam memnuniyetini ve mutluluk düzeyini değerlendiren test', 'Yaşam Doyumu', 'Psikolojik Danışmanlık', 'approved', true, NULL),
('Kişiler Arası İlişkiler Testi', 'İlişki kurma becerilerini ve sosyal uyumu değerlendiren test', 'İlişkiler', 'Psikolojik Danışmanlık', 'approved', true, NULL),
('Hedef Belirleme ve Planlama Testi', 'Hedef koyma becerilerini ve gelecek planlamasını değerlendiren test', 'Planlama', 'Psikolojik Danışmanlık', 'approved', true, NULL);

-- Psikologlar için 10 test oluştur
INSERT INTO tests (title, description, category, specialty_area, status, is_active, specialist_id) VALUES
('Kişilik Yapısı Analizi', 'Temel kişilik özelliklerini ve karakteristiklerini analiz eden kapsamlı test', 'Kişilik', 'Psikolog', 'approved', true, NULL),
('Depresyon ve Anksiyete Tarama Testi', 'Depresif belirtileri ve anksiyete düzeyini değerlendiren klinik test', 'Ruh Sağlığı', 'Psikolog', 'approved', true, NULL),
('Bilişsel Fonksiyonlar Değerlendirmesi', 'Dikkat, hafıza ve problem çözme becerilerini değerlendiren test', 'Bilişsel Değerlendirme', 'Psikolog', 'approved', true, NULL),
('Travma ve Stres Tepkileri Testi', 'Travmatik deneyimlerin etkilerini ve stres tepkilerini değerlendiren test', 'Travma', 'Psikolog', 'approved', true, NULL),
('Sosyal Anksiyete Değerlendirmesi', 'Sosyal ortamlardaki anksiyete düzeyini ve kaçınma davranışlarını değerlendiren test', 'Sosyal Anksiyete', 'Psikolog', 'approved', true, NULL),
('Uyku Kalitesi ve Bozuklukları Testi', 'Uyku düzenini ve kalitesini değerlendiren detaylı test', 'Uyku', 'Psikolog', 'approved', true, NULL),
('Obsesif Kompülsif Belirtiler Testi', 'OKB belirtilerini ve düzeyini değerlendiren klinik test', 'OKB', 'Psikolog', 'approved', true, NULL),
('Duygu Düzenleme Becerileri Testi', 'Duygusal tepkileri ve düzenleme stratejilerini değerlendiren test', 'Duygu Düzenleme', 'Psikolog', 'approved', true, NULL),
('Öfke Yönetimi Değerlendirmesi', 'Öfke tetikleyicilerini ve kontrol becerilerini değerlendiren test', 'Öfke Yönetimi', 'Psikolog', 'approved', true, NULL),
('Benlik İmajı ve Kimlik Testi', 'Benlik algısını ve kimlik gelişimini değerlendiren psikolojik test', 'Benlik', 'Psikolog', 'approved', true, NULL);

-- Aile Danışmanları testleri için sorular
INSERT INTO test_questions (test_id, question_text, question_type, options, step_number, is_required) 
SELECT 
    t.id as test_id,
    CASE 
        WHEN t.title = 'Aile İçi İletişim Değerlendirme Testi' THEN
            CASE q.step_number
                WHEN 1 THEN 'Aile içinde problemlerinizi ne sıklıkla açık bir şekilde konuşursunuz?'
                WHEN 2 THEN 'Aile üyeleriniz birbirlerini dinlerken ne kadar sabırlıdır?'
                WHEN 3 THEN 'Aile içinde anlaşmazlık yaşandığında genellikle nasıl çözülür?'
                WHEN 4 THEN 'Aile üyeleriniz duygularını ifade etmekte zorlanır mı?'
                WHEN 5 THEN 'Aile toplantıları veya önemli konuşmaları ne sıklıkla yaparsınız?'
                WHEN 6 THEN 'Aile içinde herkes görüşünü rahatça söyleyebilir mi?'
                WHEN 7 THEN 'Aile üyeleriniz birbirlerine karşı ne kadar saygılıdır?'
                WHEN 8 THEN 'Aile içinde teknoloji kullanımı iletişimi nasıl etkiliyor?'
                WHEN 9 THEN 'Aile üyeleriniz birbirlerinin başarılarını nasıl karşılar?'
                WHEN 10 THEN 'Aile içinde çatışma sonrası barışma süreci nasıl işler?'
            END
        WHEN t.title = 'Evlilik Uyumu Analizi' THEN
            CASE q.step_number
                WHEN 1 THEN 'Eşinizle ne sıklıkla kaliteli zaman geçirirsiniz?'
                WHEN 2 THEN 'Mali konularda eşinizle ne sıklıkla anlaşmazlık yaşarsınız?'
                WHEN 3 THEN 'Eşinizin size olan sevgisini ne sıklıkla hissedersiniz?'
                WHEN 4 THEN 'Önemli kararları eşinizle birlikte alır mısınız?'
                WHEN 5 THEN 'Eşinizle fiziksel yakınlığınızdan memnun musunuz?'
                WHEN 6 THEN 'Eşinizin ailesi ile ilişkiniz nasıl?'
                WHEN 7 THEN 'Gelecek planlarınızda eşinizle ne kadar uyumlusunuz?'
                WHEN 8 THEN 'Eşiniz sizi ne kadar destekliyor hissediyorsunuz?'
                WHEN 9 THEN 'Eşinizle çocuk yetiştirme konusunda ne kadar hemfikiriniz?'
                WHEN 10 THEN 'Evliliğinizin genel durumunu nasıl değerlendirirsiniz?'
            END
        WHEN t.title = 'Çocuk Davranış Değerlendirmesi' THEN
            CASE q.step_number
                WHEN 1 THEN 'Çocuğunuz kurallara uymakta zorlanır mı?'
                WHEN 2 THEN 'Çocuğunuz öfke nöbetleri geçirir mi?'
                WHEN 3 THEN 'Çocuğunuz dikkatini uzun süre bir şeye verebilir mi?'
                WHEN 4 THEN 'Çocuğunuz diğer çocuklarla oynarken problem yaşar mı?'
                WHEN 5 THEN 'Çocuğunuz yetişkinlere karşı saygılı davranır mı?'
                WHEN 6 THEN 'Çocuğunuz okulda davranış problemleri yaşıyor mu?'
                WHEN 7 THEN 'Çocuğunuz duygularını kontrol etmekte zorlanır mı?'
                WHEN 8 THEN 'Çocuğunuz yeni durumlara uyum sağlamakta zorlanır mı?'
                WHEN 9 THEN 'Çocuğunuz sorumluluklarını yerine getirir mi?'
                WHEN 10 THEN 'Çocuğunuzun davranışları aile hayatını olumsuz etkiler mi?'
            END
        ELSE 'Genel soru'
    END as question_text,
    'multiple_choice' as question_type,
    '[
        {"value": "her_zaman", "label": "Her zaman"},
        {"value": "siklikla", "label": "Sıklıkla"},
        {"value": "bazen", "label": "Bazen"},
        {"value": "nadiren", "label": "Nadiren"},
        {"value": "hicbir_zaman", "label": "Hiçbir zaman"}
    ]'::jsonb as options,
    q.step_number,
    true as is_required
FROM tests t
CROSS JOIN (
    SELECT generate_series(1, 10) as step_number
) q
WHERE t.specialty_area = 'Aile Danışmanı' 
AND t.title IN ('Aile İçi İletişim Değerlendirme Testi', 'Evlilik Uyumu Analizi', 'Çocuk Davranış Değerlendirmesi');

-- Diğer Aile Danışmanı testleri için genel sorular
INSERT INTO test_questions (test_id, question_text, question_type, options, step_number, is_required)
SELECT 
    t.id as test_id,
    'Bu konuda kendinizi nasıl değerlendiriyorsunuz? (Soru ' || q.step_number || ')' as question_text,
    'multiple_choice' as question_type,
    '[
        {"value": "cok_iyi", "label": "Çok İyi"},
        {"value": "iyi", "label": "İyi"},
        {"value": "orta", "label": "Orta"},
        {"value": "zayif", "label": "Zayıf"},
        {"value": "cok_zayif", "label": "Çok Zayıf"}
    ]'::jsonb as options,
    q.step_number,
    true as is_required
FROM tests t
CROSS JOIN (
    SELECT generate_series(1, 10) as step_number
) q
WHERE t.specialty_area = 'Aile Danışmanı' 
AND t.title NOT IN ('Aile İçi İletişim Değerlendirme Testi', 'Evlilik Uyumu Analizi', 'Çocuk Davranış Değerlendirmesi');

-- Psikolojik Danışmanlık testleri için sorular
INSERT INTO test_questions (test_id, question_text, question_type, options, step_number, is_required)
SELECT 
    t.id as test_id,
    CASE 
        WHEN t.title = 'Kişisel Gelişim ve Motivasyon Testi' THEN
            'Kişisel gelişiminizle ilgili bu durumu ne sıklıkla yaşarsınız? (Soru ' || q.step_number || ')'
        WHEN t.title = 'Kariyer Yönelimi ve İlgi Alanları Testi' THEN
            'Kariyer planlamanızla ilgili bu konuyu ne kadar önemli buluyorsunuz? (Soru ' || q.step_number || ')'
        WHEN t.title = 'Sosyal Beceriler Değerlendirmesi' THEN
            'Sosyal ortamlarda bu durumu ne sıklıkla yaşarsınız? (Soru ' || q.step_number || ')'
        ELSE 'Bu konuda kendinizi nasıl değerlendiriyorsunuz? (Soru ' || q.step_number || ')'
    END as question_text,
    'multiple_choice' as question_type,
    '[
        {"value": "tamamen_katiliyorum", "label": "Tamamen Katılıyorum"},
        {"value": "katiliyorum", "label": "Katılıyorum"},
        {"value": "kararsizim", "label": "Kararsızım"},
        {"value": "katilmiyorum", "label": "Katılmıyorum"},
        {"value": "hic_katilmiyorum", "label": "Hiç Katılmıyorum"}
    ]'::jsonb as options,
    q.step_number,
    true as is_required
FROM tests t
CROSS JOIN (
    SELECT generate_series(1, 10) as step_number
) q
WHERE t.specialty_area = 'Psikolojik Danışmanlık';

-- Psikolog testleri için sorular
INSERT INTO test_questions (test_id, question_text, question_type, options, step_number, is_required)
SELECT 
    t.id as test_id,
    CASE 
        WHEN t.title = 'Depresyon ve Anksiyete Tarama Testi' THEN
            'Son 2 hafta içinde bu durumu ne sıklıkla yaşadınız? (Soru ' || q.step_number || ')'
        WHEN t.title = 'Bilişsel Fonksiyonlar Değerlendirmesi' THEN
            'Bu bilişsel beceriyle ilgili kendinizi nasıl değerlendiriyorsunuz? (Soru ' || q.step_number || ')'
        WHEN t.title = 'Travma ve Stres Tepkileri Testi' THEN
            'Stresli durumlarla karşılaştığınızda bu tepkiyi ne sıklıkla verirsiniz? (Soru ' || q.step_number || ')'
        ELSE 'Bu konuyla ilgili yaşantınızı nasıl değerlendirirsiniz? (Soru ' || q.step_number || ')'
    END as question_text,
    'multiple_choice' as question_type,
    '[
        {"value": "hicbir_zaman", "label": "Hiçbir zaman"},
        {"value": "birkaç_gun", "label": "Birkaç gün"},
        {"value": "gunlerin_yarisi", "label": "Günlerin yarısı"},
        {"value": "neredeyse_her_gun", "label": "Neredeyse her gün"},
        {"value": "her_gun", "label": "Her gün"}
    ]'::jsonb as options,
    q.step_number,
    true as is_required
FROM tests t
CROSS JOIN (
    SELECT generate_series(1, 10) as step_number
) q
WHERE t.specialty_area = 'Psikolog';