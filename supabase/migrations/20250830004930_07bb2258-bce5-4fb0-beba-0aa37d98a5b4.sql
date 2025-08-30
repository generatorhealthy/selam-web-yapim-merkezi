-- Uzmanların gerçek sipariş fiyatlarına göre paket fiyatlarını güncelle

-- Murat Ekinci'nin paket fiyatını 2998'e güncelle (gerçek sipariş fiyatı)
UPDATE public.specialists 
SET package_price = 2998 
WHERE name = 'Murat Ekinci';

-- Nur Şeyda Peker'in paket fiyatını 2998'e güncelle (gerçek sipariş fiyatı)
UPDATE public.specialists 
SET package_price = 2998 
WHERE name = 'Nur Şeyda Peker';

-- Uzm. Bağımlılık Danışmanı Erkan Arıkan'ın paket fiyatını 3000'e güncelle (gerçek sipariş fiyatı)
UPDATE public.specialists 
SET package_price = 3000 
WHERE name = 'Uzm. Bağımlılık Danışmanı Erkan Arıkan';