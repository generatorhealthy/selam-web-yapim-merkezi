CREATE OR REPLACE FUNCTION public.auto_create_customer_on_order_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status = 'approved' AND COALESCE(OLD.status, '') <> 'approved' THEN
    IF COALESCE(NEW.subscription_month, 1) = 1 OR NEW.is_first_order = true THEN
      IF NOT EXISTS (
        SELECT 1
        FROM public.automatic_orders
        WHERE customer_email = NEW.customer_email
      ) THEN
        INSERT INTO public.automatic_orders (
          customer_name,
          customer_email,
          customer_phone,
          customer_tc_no,
          customer_address,
          customer_city,
          customer_type,
          company_name,
          company_tax_no,
          company_tax_office,
          package_name,
          package_type,
          amount,
          payment_method,
          monthly_payment_day,
          registration_date,
          total_months,
          current_month,
          paid_months,
          is_active
        ) VALUES (
          NEW.customer_name,
          NEW.customer_email,
          NEW.customer_phone,
          NEW.customer_tc_no,
          NEW.customer_address,
          NEW.customer_city,
          COALESCE(NEW.customer_type, 'individual'),
          NEW.company_name,
          NEW.company_tax_no,
          NEW.company_tax_office,
          NEW.package_name,
          NEW.package_type,
          NEW.amount,
          COALESCE(NEW.payment_method, 'bank_transfer'),
          COALESCE(
            (SELECT payment_day FROM public.specialists WHERE email = NEW.customer_email LIMIT 1),
            EXTRACT(DAY FROM NOW())::int
          ),
          COALESCE(NEW.created_at, NOW()),
          24,
          1,
          ARRAY[1]::integer[],
          true
        );
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;