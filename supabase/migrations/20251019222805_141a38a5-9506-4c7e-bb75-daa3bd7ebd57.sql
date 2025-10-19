-- Update generate_monthly_orders function to copy all data from previous orders
CREATE OR REPLACE FUNCTION public.generate_monthly_orders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  auto_order RECORD;
  next_month INTEGER;
  last_order RECORD;
  v_current_date DATE := CURRENT_DATE;
BEGIN
  -- 19 Ekim 2025'ten önce çalışmasın
  IF v_current_date < '2025-10-19'::DATE THEN
    RETURN;
  END IF;

  -- Her aylık ödeme kaydı için
  FOR auto_order IN 
    SELECT * FROM public.automatic_orders 
    WHERE is_active = true 
    AND current_month < total_months
  LOOP
    -- Bu müşterinin en son siparişini bul
    SELECT * INTO last_order
    FROM public.orders 
    WHERE customer_email = auto_order.customer_email 
      AND deleted_at IS NULL
    ORDER BY subscription_month DESC NULLS LAST, created_at DESC
    LIMIT 1;
    
    -- Eğer son sipariş varsa, bir sonraki ay olarak devam et
    IF last_order.id IS NOT NULL THEN
      next_month := COALESCE(last_order.subscription_month, 0) + 1;
    ELSE
      next_month := auto_order.current_month + 1;
    END IF;
    
    -- Maksimum ay sayısını aşmadığından emin ol
    IF next_month > auto_order.total_months THEN
      CONTINUE;
    END IF;
    
    -- Bu ay için sipariş zaten oluşturulmuş mu kontrol et
    IF EXISTS (
      SELECT 1 FROM public.orders
      WHERE customer_email = auto_order.customer_email
        AND subscription_month = next_month
        AND deleted_at IS NULL
        AND DATE(created_at) = v_current_date
    ) THEN
      CONTINUE;
    END IF;
    
    -- Ödeme günü bugün mü kontrol et (ayın günü)
    IF EXTRACT(DAY FROM v_current_date) = auto_order.monthly_payment_day THEN
      -- Bu ay için ödeme yapılmış mı kontrol et
      IF NOT (next_month = ANY(auto_order.paid_months)) THEN
        -- Yeni sipariş oluştur - eski siparişten tüm bilgileri kopyala
        IF last_order.id IS NOT NULL THEN
          -- Eski siparişten tüm bilgileri al
          INSERT INTO public.orders (
            customer_name,
            customer_email,
            customer_phone,
            package_name,
            package_type,
            amount,
            status,
            payment_method,
            customer_type,
            customer_address,
            customer_city,
            customer_tc_no,
            company_name,
            company_tax_no,
            company_tax_office,
            is_first_order,
            subscription_month,
            parent_order_id,
            contract_ip_address
          ) VALUES (
            last_order.customer_name,
            last_order.customer_email,
            last_order.customer_phone,
            last_order.package_name,
            last_order.package_type,
            last_order.amount,
            'pending',
            last_order.payment_method, -- Eski siparişten ödeme yöntemi
            last_order.customer_type,
            last_order.customer_address, -- Eski siparişten adres
            last_order.customer_city,
            last_order.customer_tc_no, -- Eski siparişten TC
            last_order.company_name,
            last_order.company_tax_no,
            last_order.company_tax_office,
            false, -- is_first_order
            next_month, -- subscription_month
            COALESCE(last_order.parent_order_id, last_order.id), -- parent_order_id
            last_order.contract_ip_address
          );
        ELSE
          -- Eski sipariş yoksa automatic_orders tablosundan bilgileri al
          INSERT INTO public.orders (
            customer_name,
            customer_email,
            customer_phone,
            package_name,
            package_type,
            amount,
            status,
            payment_method,
            customer_type,
            customer_address,
            customer_city,
            customer_tc_no,
            company_name,
            company_tax_no,
            company_tax_office,
            is_first_order,
            subscription_month,
            contract_ip_address
          ) VALUES (
            auto_order.customer_name,
            auto_order.customer_email,
            auto_order.customer_phone,
            auto_order.package_name,
            auto_order.package_type,
            auto_order.amount,
            'pending',
            auto_order.payment_method,
            auto_order.customer_type,
            auto_order.customer_address,
            auto_order.customer_city,
            auto_order.customer_tc_no,
            auto_order.company_name,
            auto_order.company_tax_no,
            auto_order.company_tax_office,
            false,
            next_month,
            '127.0.0.1'
          );
        END IF;
        
        -- Automatic orders current_month güncelle
        UPDATE public.automatic_orders
        SET current_month = next_month,
            updated_at = NOW()
        WHERE id = auto_order.id;
      END IF;
    END IF;
  END LOOP;
END;
$function$;