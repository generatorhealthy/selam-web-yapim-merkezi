import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

interface RequestBody {
  email?: string | null;
  name?: string | null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    const { email, name }: RequestBody = await req.json();

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Helper to run the base query
    const baseSelect = () =>
      supabaseAdmin
        .from('orders')
        .select('*')
        .in('status', ['approved', 'completed'])
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

    let aggregated: any[] = [];

    // 1) Try exact email match (case-insensitive)
    if (email) {
      const { data, error } = await baseSelect().ilike('customer_email', email);
      if (error) {
        console.error('Email match query error:', error);
      } else if (data) {
        aggregated = aggregated.concat(data);
      }
    }

    // 2) Try name contains match as a fallback (best-effort)
    if ((!aggregated.length) && name) {
      const { data, error } = await baseSelect().ilike('customer_name', `%${name}%`);
      if (error) {
        console.error('Name match query error:', error);
      } else if (data) {
        aggregated = aggregated.concat(data);
      }
    }

    // Deduplicate by id if both queries returned rows
    const uniqueById = Array.from(new Map(aggregated.map((o) => [o.id, o])).values());

    return new Response(JSON.stringify(uniqueById), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (e) {
    console.error('get-specialist-contracts error:', e);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
