-- Add category column for grouping
ALTER TABLE public.seo_branches ADD COLUMN IF NOT EXISTS category text DEFAULT 'Diğer';

-- Insert comprehensive branch list (skip if slug exists)
INSERT INTO public.seo_branches (slug, name, category, sort_order) VALUES
-- Ruh Sağlığı / Psikoloji (mevcut + ek)
('cinsel-terapist-2', 'Cinsel Terapi Sertifikalı Tıp Doktoru', 'Psikoloji & Danışmanlık', 8),
('psikoonkoloji', 'Psikoonkoloji', 'Psikoloji & Danışmanlık', 9),
('psikiyatri', 'Psikiyatri', 'Psikoloji & Danışmanlık', 10),
('psikoterapi', 'Psikoterapi', 'Psikoloji & Danışmanlık', 11),
('cocuk-ergen-psikiyatri', 'Çocuk ve Ergen Psikiyatristi', 'Psikoloji & Danışmanlık', 12),

-- Diğer Danışmanlık & Terapi
('aile-danismani-psikolog', 'Aile Danışmanı (Psikolog)', 'Danışmanlık', 20),
('cocuk-gelisim', 'Çocuk Gelişim', 'Danışmanlık', 21),
('cocuk-gelisim-uzmani', 'Çocuk Gelişim Uzmanı', 'Danışmanlık', 22),
('dil-konusma-terapisi', 'Dil ve Konuşma Terapisi', 'Danışmanlık', 23),
('ergoterapi', 'Ergoterapi', 'Danışmanlık', 24),
('pedagoji', 'Pedagoji', 'Danışmanlık', 25),

-- Diyetisyen & Beslenme
('diyetisyen', 'Diyetisyen', 'Beslenme', 30),

-- Fizik Tedavi & Rehabilitasyon
('fizyoterapi', 'Fizyoterapi', 'Fizik Tedavi', 40),
('pediatrik-fizyoterapi', 'Pediatrik Fizyoterapi', 'Fizik Tedavi', 41),
('osteopati', 'Osteopati', 'Fizik Tedavi', 42),
('kayropraktik', 'Kayropraktik Uzmanı', 'Fizik Tedavi', 43),
('podoloji', 'Podoloji', 'Fizik Tedavi', 44),
('fiziksel-tip-rehabilitasyon', 'Fiziksel Tıp ve Rehabilitasyon', 'Fizik Tedavi', 45),

-- Genel Tıp & Aile Hekimliği
('aile-hekimligi', 'Aile Hekimliği', 'Tıp Doktoru', 60),
('dahiliye', 'Dahiliye - İç Hastalıkları', 'Tıp Doktoru', 61),
('pratisyen-hekimlik', 'Pratisyen Hekimlik', 'Tıp Doktoru', 62),
('genel-cerrahi', 'Genel Cerrahi', 'Tıp Doktoru', 63),
('akupunktur', 'Akupunktur', 'Tıp Doktoru', 64),
('fitoterapi', 'Fitoterapi', 'Tıp Doktoru', 65),
('mezoterapi', 'Mezoterapi', 'Tıp Doktoru', 66),
('ozon-terapisi', 'Ozon Terapisi', 'Tıp Doktoru', 67),
('hacamat', 'Kupa Terapi (Hacamat)', 'Tıp Doktoru', 68),
('algoloji', 'Algoloji', 'Tıp Doktoru', 69),
('androloji', 'Androloji', 'Tıp Doktoru', 70),
('geriatri', 'Geriatri', 'Tıp Doktoru', 71),
('halk-sagligi', 'Halk Sağlığı', 'Tıp Doktoru', 72),

-- Çocuk Sağlığı
('cocuk-sagligi', 'Çocuk Sağlığı ve Hastalıkları', 'Çocuk Sağlığı', 80),
('cocuk-acil', 'Çocuk Acil', 'Çocuk Sağlığı', 81),
('yenidogan', 'Yeni Doğan', 'Çocuk Sağlığı', 82),
('neonatoloji', 'Neonatoloji', 'Çocuk Sağlığı', 83),
('cocuk-onkolojisi', 'Çocuk Onkolojisi', 'Çocuk Sağlığı', 84),
('cocuk-norolojisi', 'Çocuk Nörolojisi', 'Çocuk Sağlığı', 85),
('cocuk-kardiyoloji', 'Çocuk Kardiyolojisi', 'Çocuk Sağlığı', 86),
('cocuk-endokrinolojisi', 'Çocuk Endokrinolojisi', 'Çocuk Sağlığı', 87),
('cocuk-immunoloji-alerji', 'Çocuk İmmünolojisi ve Alerjisi', 'Çocuk Sağlığı', 88),

-- Kadın Sağlığı
('kadin-dogum', 'Kadın Hastalıkları ve Doğum', 'Kadın Sağlığı', 100),
('perinatoloji', 'Perinatoloji - Riskli Gebelikler', 'Kadın Sağlığı', 101),
('ureme-endokrinolojisi', 'Üreme Endokrinolojisi ve İnfertilite', 'Kadın Sağlığı', 102),
('jinekolojik-onkoloji', 'Jinekolojik Onkoloji Cerrahisi', 'Kadın Sağlığı', 103),

-- Cilt & Estetik
('dermatoloji', 'Dermatoloji', 'Cilt & Estetik', 120),
('plastik-rekonstruktif-cerrahi', 'Plastik Rekonstrüktif ve Estetik Cerrahi', 'Cilt & Estetik', 121),
('medikal-estetik', 'Sertifikalı Medikal Estetik', 'Cilt & Estetik', 122),
('saç-ekimi', 'Saç Ekimi', 'Cilt & Estetik', 123),

-- Kalp & Damar
('kardiyoloji', 'Kardiyoloji', 'Kalp & Damar', 140),
('kalp-damar-cerrahisi', 'Kalp Damar Cerrahisi', 'Kalp & Damar', 141),
('damar-cerrahisi', 'Damar Cerrahisi', 'Kalp & Damar', 142),

-- Beyin, Sinir & Ortopedi
('noroloji', 'Nöroloji (Beyin ve Sinir Hastalıkları)', 'Beyin & Sinir', 160),
('beyin-sinir-cerrahisi', 'Beyin ve Sinir Cerrahisi', 'Beyin & Sinir', 161),
('ortopedi-travmatoloji', 'Ortopedi ve Travmatoloji', 'Ortopedi', 162),
('spor-hekimligi', 'Spor Hekimliği', 'Ortopedi', 163),
('romatoloji', 'Romatoloji', 'Ortopedi', 164),

-- Göz, KBB
('goz-hastaliklari', 'Göz Hastalıkları', 'Göz & KBB', 180),
('kbb', 'Kulak Burun Boğaz Hastalıkları - KBB', 'Göz & KBB', 181),
('odyoloji', 'Odyoloji', 'Göz & KBB', 182),

-- İç Organ & Sindirim
('gastroenteroloji', 'Gastroenteroloji', 'Sindirim & İç Organ', 200),
('hepatoloji', 'Hepatoloji', 'Sindirim & İç Organ', 201),
('endokrinoloji-metabolizma', 'Endokrinoloji ve Metabolizma Hastalıkları', 'Sindirim & İç Organ', 202),
('nefroloji', 'Nefroloji', 'Sindirim & İç Organ', 203),
('uroloji', 'Üroloji', 'Sindirim & İç Organ', 204),

-- Solunum & Göğüs
('gogus-hastaliklari', 'Göğüs Hastalıkları', 'Solunum', 220),
('alerji-hastaliklari', 'Alerji Hastalıkları', 'Solunum', 221),
('immunoloji', 'İmmünoloji', 'Solunum', 222),

-- Onkoloji
('tibbi-onkoloji', 'Tıbbi Onkoloji', 'Onkoloji', 240),
('radyasyon-onkolojisi', 'Radyasyon Onkolojisi', 'Onkoloji', 241),
('cerrahi-onkoloji', 'Cerrahi Onkoloji', 'Onkoloji', 242),
('meme-cerrahisi', 'Meme Cerrahisi', 'Onkoloji', 243),

-- Diş Hekimliği
('dis-hekimi', 'Diş Hekimi', 'Diş Hekimliği', 260),
('agiz-dis-cene-cerrahisi', 'Ağız, Diş ve Çene Cerrahisi', 'Diş Hekimliği', 261),
('ortodonti', 'Ortodonti', 'Diş Hekimliği', 262),
('endodonti', 'Endodonti (Kanal Tedavisi)', 'Diş Hekimliği', 263),
('periodontoloji', 'Periodontoloji (Dişeti Hastalıkları)', 'Diş Hekimliği', 264),
('pedodonti', 'Pedodonti (Çocuk Diş Hekimliği)', 'Diş Hekimliği', 265),
('oral-implantoloji', 'Oral İmplantoloji', 'Diş Hekimliği', 266),
('dis-protez-uzmani', 'Diş Protez Uzmanı', 'Diş Hekimliği', 267),

-- Diğer
('biyoloji', 'Biyoloji', 'Diğer', 300),
('veteriner', 'Veteriner', 'Diğer', 301),
('butuncul-tip', 'Bütüncül Tıp', 'Diğer', 302),
('biorezonans', 'Biorezonans', 'Diğer', 303),
('geleneksel-tamamlayici-tip', 'Geleneksel ve Tamamlayıcı Tıp', 'Diğer', 304),
('fonksiyonel-tip', 'Fonksiyonel Tıp', 'Diğer', 305)
ON CONFLICT (slug) DO NOTHING;

-- Update existing branches with categories
UPDATE public.seo_branches SET category = 'Psikoloji & Danışmanlık' WHERE slug IN ('psikolog','klinik-psikolog','psikolojik-danisman','aile-danismani','iliski-danismani','cinsel-terapist','cocuk-ergen-psikolog');