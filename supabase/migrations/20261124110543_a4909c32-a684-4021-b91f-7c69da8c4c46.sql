DO $do$ DECLARE c text; col text; BEGIN
 SELECT conname, a.attname INTO c, col FROM pg_constraint k JOIN pg_attribute a ON a.attrelid=k.conrelid AND a.attnum=k.conkey[1]
 WHERE k.conrelid='public.appointment_delivery_claims'::regclass AND k.contype='f' AND k.confrelid='public.appointments'::regclass;
 EXECUTE format('ALTER TABLE public.appointment_delivery_claims DROP CONSTRAINT %I', c);
 EXECUTE format('ALTER TABLE public.appointment_delivery_claims ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES public.appointments(id) ON DELETE CASCADE', c, col);
END $do$;