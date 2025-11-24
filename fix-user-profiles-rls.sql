-- Fix user_profiles RLS policies for admin login
-- Run this in Supabase SQL Editor

-- Remove all existing SELECT policies
DROP POLICY IF EXISTS "User profiles read policy" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Authenticated users can read profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Authenticated users read profiles" ON public.user_profiles;

-- Create a single, simple SELECT policy
-- Allows all authenticated users to read user_profiles (required for login flow)
CREATE POLICY "Enable read for authenticated users"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (true);

-- Verify the policy was created
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'user_profiles' AND cmd = 'SELECT';
