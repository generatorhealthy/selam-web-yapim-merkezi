-- Otomatik sipariş oluşturan trigger'ı sil
DROP TRIGGER IF EXISTS trigger_create_automatic_order_schedule ON public.orders;

-- Mevcut aktif otomatik siparişleri devre dışı bırak
UPDATE public.automatic_orders 
SET is_active = false, updated_at = now()
WHERE is_active = true;