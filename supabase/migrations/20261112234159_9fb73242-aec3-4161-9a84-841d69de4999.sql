DO $migration$
DECLARE definition text;
BEGIN
 SELECT pg_get_functiondef('public.guard_payment_client_writes()'::regprocedure) INTO definition;
 definition:=replace(definition,'  IF privileged THEN RETURN NEW; END IF;', E'  IF TG_TABLE_NAME = ''user_profiles'' AND TG_OP = ''INSERT''\n    AND session_user = ''supabase_auth_admin'' AND current_setting(''role'',true) IN (''none'',''supabase_auth_admin'')\n    AND NEW.role::text IN (''user'',''specialist'',''patient'') AND NOT COALESCE(NEW.is_approved,false)\n    AND EXISTS(SELECT 1 FROM auth.users u WHERE u.id=NEW.user_id AND lower(trim(u.email))=lower(trim(NEW.email))) THEN\n    RETURN NEW;\n  END IF;\n  IF privileged THEN RETURN NEW; END IF;');
 IF definition NOT LIKE '%session_user = ''supabase_auth_admin''%' THEN RAISE EXCEPTION 'guard_definition_mismatch'; END IF;
 EXECUTE definition;
END $migration$;
DROP FUNCTION public.guard_profile_signup_lifecycle();