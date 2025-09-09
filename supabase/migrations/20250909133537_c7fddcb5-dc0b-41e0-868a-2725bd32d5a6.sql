-- Update legal_proceedings status allowed values to include 'KESİNLEŞTİ'
ALTER TABLE public.legal_proceedings
  DROP CONSTRAINT IF EXISTS legal_proceedings_status_check;

ALTER TABLE public.legal_proceedings
  ADD CONSTRAINT legal_proceedings_status_check
  CHECK (
    status IN (
      'İCRA_AÇILDI',
      'İTİRAZ_ETTİ',
      'İTİRAZ_DAVASI_AÇILDI',
      'DAVA_AÇILDI',
      'HACİZ_YAPILDI',
      'ÖDEME_BEKLENİYOR',
      'KESİNLEŞTİ',
      'İCRA_TAMAMLANDI',
      'YENİ_İCRA_TALEBİ'
    )
  );