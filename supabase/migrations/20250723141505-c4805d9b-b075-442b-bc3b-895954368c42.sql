-- Fix security warnings by setting search_path for all functions

-- Update delete_automatic_order_on_specialist_delete function with proper search_path
CREATE OR REPLACE FUNCTION public.delete_automatic_order_on_specialist_delete()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Delete related automatic_orders when specialist is deleted
  DELETE FROM public.automatic_orders 
  WHERE customer_name = OLD.name;
  
  RETURN OLD;
END;
$$;

-- Update delete_specialist_and_orders_on_user_delete function with proper search_path
CREATE OR REPLACE FUNCTION public.delete_specialist_and_orders_on_user_delete()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;

-- Update cleanup_on_profile_delete function with proper search_path
CREATE OR REPLACE FUNCTION public.cleanup_on_profile_delete()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;