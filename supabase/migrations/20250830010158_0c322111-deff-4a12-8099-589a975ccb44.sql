-- Sipariş geçen uzmanların paket fiyatlarını gerçek sipariş tutarlarına göre güncelle

-- Murat Ekinci'nin paket fiyatını düzelt (2398 -> 2998)
UPDATE public.specialists 
SET package_price = 2998 
WHERE name = 'Murat Ekinci';

-- Uzm. Bağımlılık Danışmanı Erkan Arıkan'ın paket fiyatını düzelt (3000 -> 2998)
UPDATE public.specialists 
SET package_price = 2998 
WHERE name = 'Uzm. Bağımlılık Danışmanı Erkan Arıkan';

-- Bu uzmanların automatic_orders tablolarındaki tutarları da güncelle
UPDATE public.automatic_orders 
SET amount = 2998 
WHERE customer_name = 'Murat Ekinci';

UPDATE public.automatic_orders 
SET amount = 2998 
WHERE customer_name = 'Uzm. Bağımlılık Danışmanı Erkan Arıkan';