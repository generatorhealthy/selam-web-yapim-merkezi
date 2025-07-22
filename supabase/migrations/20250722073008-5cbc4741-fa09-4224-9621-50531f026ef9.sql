-- Fix Supabase security warnings

-- 1. Move pg_net extension to extensions schema
CREATE SCHEMA IF NOT EXISTS extensions;
ALTER EXTENSION pg_net SET SCHEMA extensions;

-- 2. Enable leaked password protection for Auth
UPDATE auth.config 
SET enable_signup = true, 
    enable_password_check = true;