CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
BEGIN
  INSERT INTO public.user_profiles (user_id, role, is_approved, name, email)
  VALUES (
    NEW.id, 
    CASE 
      WHEN NEW.raw_user_meta_data->>'role' = 'specialist' THEN 'specialist'::public.user_role
      WHEN NEW.raw_user_meta_data->>'role' = 'admin' THEN 'admin'::public.user_role
      ELSE 'user'::public.user_role
    END,
    false,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'User profile creation failed: %', SQLERRM;
    RETURN NEW;
END;
$function$;