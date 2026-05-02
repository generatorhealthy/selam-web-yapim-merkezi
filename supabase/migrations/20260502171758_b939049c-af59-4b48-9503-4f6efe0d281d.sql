UPDATE public.orders
SET status = 'approved',
    approved_at = COALESCE(approved_at, now()),
    updated_at = now()
WHERE id = '4ec0508b-edad-490f-9e60-3633112d9261'
  AND status = 'pending';

UPDATE public.bank_transfer_notifications
SET status = 'matched',
    matched_order_id = '4ec0508b-edad-490f-9e60-3633112d9261',
    matched_at = COALESCE(matched_at, now()),
    match_method = 'manual_recovery_akbank_template',
    notes = 'Akbank hesabınıza şablonundaki isim ayrıştırma hatası sonrası manuel eşleştirildi.',
    amount_diff = 0
WHERE id = '69d0fccc-88ee-41e6-adee-e22e082b64a4';