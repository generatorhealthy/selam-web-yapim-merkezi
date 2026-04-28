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

// Strip professional titles/abbreviations to get the bare person name
const stripTitles = (raw: string): string => {
  return raw
    .replace(/\b(Prof\.?|Doç\.?|Dr\.?|Uzm\.?|Psk\.?|Psik\.?|Dan\.?|Av\.?|Op\.?|Yrd\.?|Doc\.?)\s*/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    const { email, name }: RequestBody = await req.json();
    console.log('get-specialist-contracts called with:', { email, name });

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Helper to run the base query
    const baseSelect = () =>
      supabaseAdmin
        .from('orders')
        .select('*')
        .in('status', ['pending', 'approved', 'completed'])
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

    // 2) Always try name-based match too (titles stripped) — handles the case
    //    where the specialist paid using a different email address.
    if (name) {
      const cleanName = stripTitles(name);
      const tokens = cleanName.split(' ').filter((t) => t.length >= 3);

      // Use first + last meaningful tokens to keep match focused
      const searchTerms: string[] = [];
      if (tokens.length >= 2) {
        searchTerms.push(tokens[0]); // first name
        searchTerms.push(tokens[tokens.length - 1]); // surname
      } else if (tokens.length === 1) {
        searchTerms.push(tokens[0]);
      }

      for (const term of searchTerms) {
        const { data, error } = await baseSelect().ilike('customer_name', `%${term}%`);
        if (error) {
          console.error('Name match query error:', error);
        } else if (data) {
          aggregated = aggregated.concat(data);
        }
      }

      // Filter: keep only rows whose customer_name contains ALL search terms
      // (so "Ahmet Yılmaz" won't accidentally match unrelated "Ahmet Demir")
      if (searchTerms.length > 1) {
        aggregated = aggregated.filter((o) => {
          const cn = (o.customer_name || '').toLowerCase();
          return searchTerms.every((t) => cn.includes(t.toLowerCase()));
        });
      }
    }

    // Deduplicate by id
    const uniqueById = Array.from(new Map(aggregated.map((o) => [o.id, o])).values());

    console.log(`Returning ${uniqueById.length} order(s) for ${email || name}`);

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
