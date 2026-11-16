CREATE OR REPLACE FUNCTION public.invoice_queue_update_only(old_row jsonb, new_row jsonb)
RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path=public AS $$
 SELECT coalesce(
 old_row->>'payment_method' IN ('bank_transfer','banka_havalesi')
 AND old_row->>'status' IN ('approved','completed')
 AND old_row->>'deleted_at' IS NULL
 AND old_row->>'invoice_number' IS NULL
 AND coalesce((old_row->>'invoice_sent')::boolean,false)=false
 AND (new_row->>'invoice_sent')::boolean=true
 AND new_row->>'invoice_date' IS NOT NULL
 AND (old_row - ARRAY['invoice_sent','invoice_date','updated_at']) = (new_row - ARRAY['invoice_sent','invoice_date','updated_at']),false);
$$;
REVOKE ALL ON FUNCTION public.invoice_queue_update_only(jsonb,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.invoice_queue_update_only(jsonb,jsonb) TO service_role;
DO $$
DECLARE definition text; marker text := E'  -- Onaylı yönetici (admin rolü) sipariş üzerinde tam yetkilidir.';
BEGIN
 SELECT pg_get_functiondef('public.require_bank_verification()'::regprocedure) INTO definition;
 IF strpos(definition,marker)=0 OR strpos(definition,'invoice_queue_update_only')>0 THEN
 RAISE EXCEPTION 'unexpected_bank_guard_definition'; END IF;
 definition:=replace(definition,marker,E'  -- Only a trusted invoice-queue-only update may bypass payment revalidation.\n  IF TG_OP=\'UPDATE\' AND coalesce(auth.role()=\'service_role\',false)\n    AND public.invoice_queue_update_only(to_jsonb(OLD),to_jsonb(NEW)) THEN\n    RETURN NEW;\n  END IF;\n' || marker);
 EXECUTE definition;
END $$;