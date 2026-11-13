DO $migration$
DECLARE definition text; old_block text; new_block text;
BEGIN
SELECT pg_get_functiondef('public.guard_payment_client_writes()'::regprocedure) INTO definition;
old_block := E'  IF TG_TABLE_NAME = ''user_profiles'' AND TG_OP = ''INSERT''\n    AND session_user = ''supabase_auth_admin'' AND current_setting(''role'',true) IN (''none'',''supabase_auth_admin'')\n    AND NEW.role::text IN (''user'',''specialist'',''patient'') AND NOT COALESCE(NEW.is_approved,false)\n    AND EXISTS(SELECT 1 FROM auth.users u WHERE u.id=NEW.user_id AND lower(trim(u.email))=lower(trim(NEW.email))) THEN\n    RETURN NEW;\n  END IF;';
new_block := E'  IF TG_TABLE_NAME = ''user_profiles'' THEN\n    IF TG_OP = ''INSERT'' AND session_user = ''supabase_auth_admin''\n      AND current_setting(''role'',true) IN (''none'',''supabase_auth_admin'')\n      AND NEW.role::text IN (''user'',''specialist'',''patient'') AND NOT COALESCE(NEW.is_approved,false)\n      AND EXISTS(SELECT 1 FROM auth.users u WHERE u.id=NEW.user_id AND lower(trim(u.email))=lower(trim(NEW.email))) THEN\n      RETURN NEW;\n    END IF;\n  END IF;';
IF position(old_block in definition)=0 THEN RAISE EXCEPTION 'guard_definition_mismatch'; END IF;
EXECUTE replace(definition,old_block,new_block);
END $migration$;