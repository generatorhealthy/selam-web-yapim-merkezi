UPDATE public.orders 
SET status = 'approved', 
    approved_at = NOW(), 
    payment_method = 'credit_card'
WHERE id = '27cadf4e-640e-443e-bc30-95d7451c3b8b' 
  AND status = 'pending';