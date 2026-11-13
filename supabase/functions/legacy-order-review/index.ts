import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { legacyOrderIds } from './scope.ts';
import { mayReviewOrders, classifyLegacyOrder } from '../_shared/legacyOrderReview.ts';
Deno.serve(async req => {
  const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return reply({ error: 'Method not allowed' }, 405);
  try {
    const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '').trim();
    if (!token) return reply({ error: 'Unauthorized' }, 401);
    const url = Deno.env.get('SUPABASE_URL'), key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !key) return reply({ error: 'Unavailable' }, 503);
    const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: { user }, error: authError } = await admin.auth.getUser(token);
    if (authError || !user) return reply({ error: 'Unauthorized' }, 401);
    const { data: profile, error: profileError } = await admin.from('user_profiles').select('role,is_approved').eq('user_id', user.id).maybeSingle();
    if (profileError || !mayReviewOrders(profile)) return reply({ error: 'Forbidden' }, 403);
    const body = await req.json();
    if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).length) return reply({ error: 'Invalid request' }, 400);
    const { data: orders, error } = await admin.from('orders').select('id,customer_email,status,payment_status').in('id', legacyOrderIds);
    if (error) return reply({ error: 'Unavailable' }, 503);
    const specialists = [];
    for (let from = 0; ; from += 500) {
      const { data, error: readError } = await admin.from('specialists').select('id,user_id,name,email').order('id').range(from, from + 499);
      if (readError) return reply({ error: 'Unavailable' }, 503);
      specialists.push(...(data ?? []));
      if (!data || data.length < 500) break;
    }
    const rows = (orders ?? []).map(order => classifyLegacyOrder(order, specialists));
    return reply({ scopeCount: 64, rows, missingCount: 64 - rows.length });
  } catch { return reply({ error: 'Unavailable' }, 503); }
});
