-- Sipariş oluşturulduğunda uzmanın paket fiyatını otomatik güncelle

CREATE OR REPLACE FUNCTION public.update_specialist_package_price_on_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Sipariş onaylandığında uzmanın paket fiyatını güncelle
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    -- Specialists tablosundaki paket fiyatını güncelle
    UPDATE public.specialists 
    SET package_price = NEW.amount
    WHERE name = NEW.customer_name;
    
    -- Automatic_orders tablosundaki tutarı güncelle
    UPDATE public.automatic_orders 
    SET amount = NEW.amount
    WHERE customer_name = NEW.customer_name;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger'ı oluştur
DROP TRIGGER IF EXISTS trigger_update_specialist_package_price ON public.orders;

CREATE TRIGGER trigger_update_specialist_package_price
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION update_specialist_package_price_on_order();