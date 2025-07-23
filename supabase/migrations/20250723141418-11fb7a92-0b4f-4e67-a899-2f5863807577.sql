-- Delete test customer entries from automatic_orders
DELETE FROM public.automatic_orders 
WHERE customer_name IN (
  'Fatih Murat',
  'asgkasdkjg kadgksd',
  'Fatih Öngel', 
  'fatih öngel',
  'Ayfer Aydın',
  'Nur Aslan',
  'Psk. Sedanur Sürme',
  'Kl. Psk. Merve Küçükçelik',
  'Aile Danışmanı Revan Kaptanoğlu',
  'Aile Danışmanı İpek Can',
  'Test Üyeliği'
);

-- Create function to delete automatic_orders when specialist is deleted
CREATE OR REPLACE FUNCTION public.delete_automatic_order_on_specialist_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete related automatic_orders when specialist is deleted
  DELETE FROM public.automatic_orders 
  WHERE customer_name = OLD.name;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically delete automatic_orders when specialist is deleted
DROP TRIGGER IF EXISTS trigger_delete_automatic_order_on_specialist_delete ON public.specialists;
CREATE TRIGGER trigger_delete_automatic_order_on_specialist_delete
  BEFORE DELETE ON public.specialists
  FOR EACH ROW
  EXECUTE FUNCTION public.delete_automatic_order_on_specialist_delete();

-- Create function to delete automatic_orders when user is deleted (cascading from specialists)
CREATE OR REPLACE FUNCTION public.delete_specialist_and_orders_on_user_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete related automatic_orders first (by specialist name)
  DELETE FROM public.automatic_orders ao
  WHERE EXISTS (
    SELECT 1 FROM public.specialists s 
    WHERE s.user_id = OLD.id AND ao.customer_name = s.name
  );
  
  -- Delete specialist records
  DELETE FROM public.specialists 
  WHERE user_id = OLD.id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users table to cascade deletions
-- Note: This will be handled through user_profiles table instead since we can't directly trigger on auth.users
CREATE OR REPLACE FUNCTION public.cleanup_on_profile_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete related automatic_orders first (by specialist name)
  DELETE FROM public.automatic_orders ao
  WHERE EXISTS (
    SELECT 1 FROM public.specialists s 
    WHERE s.user_id = OLD.user_id AND ao.customer_name = s.name
  );
  
  -- Delete specialist records
  DELETE FROM public.specialists 
  WHERE user_id = OLD.user_id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on user_profiles to handle cascading deletions
DROP TRIGGER IF EXISTS trigger_cleanup_on_profile_delete ON public.user_profiles;
CREATE TRIGGER trigger_cleanup_on_profile_delete
  BEFORE DELETE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.cleanup_on_profile_delete();