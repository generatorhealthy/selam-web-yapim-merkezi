WITH ao AS (
  SELECT *
  FROM public.automatic_orders
  WHERE is_active = true
    AND monthly_payment_day = 20
    AND current_month < total_months
), last_orders AS (
  SELECT o.customer_email, MAX(o.subscription_month) AS last_sub
  FROM public.orders o
  JOIN ao ON lower(o.customer_email) = lower(ao.customer_email)
  WHERE o.deleted_at IS NULL
  GROUP BY o.customer_email
), to_create AS (
  SELECT 
    ao.*, 
    COALESCE(last_orders.last_sub, ao.current_month) + 1 AS next_month
  FROM ao
  LEFT JOIN last_orders ON lower(last_orders.customer_email) = lower(ao.customer_email)
  WHERE NOT (COALESCE(last_orders.last_sub, ao.current_month) + 1 = ANY(ao.paid_months))
    AND (COALESCE(last_orders.last_sub, ao.current_month) + 1) <= ao.total_months
    AND NOT EXISTS (
      SELECT 1 FROM public.orders o
      WHERE lower(o.customer_email) = lower(ao.customer_email)
        AND o.subscription_month = COALESCE(last_orders.last_sub, ao.current_month) + 1
        AND o.deleted_at IS NULL
        AND DATE(o.created_at) = CURRENT_DATE
    )
), inserted AS (
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
  )
  SELECT 
    customer_name,
    customer_email,
    customer_phone,
    package_name,
    package_type,
    amount,
    'pending',
    payment_method,
    customer_type,
    customer_address,
    customer_city,
    customer_tc_no,
    company_name,
    company_tax_no,
    company_tax_office,
    false,
    next_month,
    '127.0.0.1'
  FROM to_create
  RETURNING customer_email, subscription_month
), updated AS (
  UPDATE public.automatic_orders ao2
  SET current_month = GREATEST(ao2.current_month, i.subscription_month),
      updated_at = NOW()
  FROM inserted i
  WHERE lower(i.customer_email) = lower(ao2.customer_email)
  RETURNING 1
)
SELECT (SELECT count(*) FROM inserted) AS created_count;