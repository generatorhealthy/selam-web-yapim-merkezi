-- Danışan bilgilerini saklamak için client_referrals tablosuna kolonlar ekle
ALTER TABLE public.client_referrals 
ADD COLUMN IF NOT EXISTS client_name TEXT,
ADD COLUMN IF NOT EXISTS client_surname TEXT,
ADD COLUMN IF NOT EXISTS client_contact TEXT;

COMMENT ON COLUMN public.client_referrals.client_name IS 'Yönlendirilen danışanın adı';
COMMENT ON COLUMN public.client_referrals.client_surname IS 'Yönlendirilen danışanın soyadı';
COMMENT ON COLUMN public.client_referrals.client_contact IS 'Yönlendirilen danışanın iletişim bilgisi (telefon)';