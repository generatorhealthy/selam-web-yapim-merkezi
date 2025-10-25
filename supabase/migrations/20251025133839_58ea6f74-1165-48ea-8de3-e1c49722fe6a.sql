-- Danışan yönlendirme kayıtları için unique constraint'i kaldır
-- Her danışan için ayrı kayıt tutulabilmesi için
ALTER TABLE public.client_referrals 
DROP CONSTRAINT IF EXISTS client_referrals_specialist_id_year_month_key;

-- Her kaydın benzersiz olması için id kullanılacak (zaten primary key)
COMMENT ON TABLE public.client_referrals IS 'Her kayıt bir danışan yönlendirmesini temsil eder. Artık specialist_id, year, month kombinasyonu unique değil - her danışan için ayrı kayıt oluşturulur.';