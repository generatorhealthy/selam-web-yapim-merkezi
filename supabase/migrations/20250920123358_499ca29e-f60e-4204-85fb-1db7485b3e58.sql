-- Add ARABULUCULUK_SÜRECİNDE to the legal proceedings status constraint
ALTER TABLE public.legal_proceedings 
DROP CONSTRAINT IF EXISTS legal_proceedings_status_check;

ALTER TABLE public.legal_proceedings 
ADD CONSTRAINT legal_proceedings_status_check 
CHECK (status IN (
  'YENİ_İCRA_TALEBİ',
  'İCRA_AÇILDI', 
  'İTİRAZ_ETTİ',
  'İTİRAZ_DAVASI_AÇILDI',
  'DAVA_AÇILDI',
  'ARABULUCULUK_SÜRECİNDE',
  'HACİZ_YAPILDI',
  'ÖDEME_BEKLENİYOR',
  'TAHSİLAT',
  'KESİNLEŞTİ',
  'İCRA_TAMAMLANDI'
));