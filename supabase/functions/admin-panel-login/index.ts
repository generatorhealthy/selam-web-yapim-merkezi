import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3';
import { signChallenge, verifyChallenge, digest } from '../_shared/adminLoginChallenge.ts';

const bodySchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('challenge') }).strict(),
  z.object({ action: z.literal('login'), email: z.string().email().max(254), password: z.string().min(1).max(1024), token: z.string().max(1500), solution: z.number().int().nonnegative() }).strict(),
]);
const failureMessage = 'Giriş doğrulanamadı. Bilgilerinizi kontrol edip tekrar deneyin.';
Deno.serve(async req => {
  const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return reply({ error: failureMessage }, 405);
  const secret = Deno.env.get('ADMIN_LOGIN_CHALLENGE_SECRET');
  const url = Deno.env.get('SUPABASE_URL'), serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'), anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (!secret || !url || !serviceKey || !anonKey) return reply({ error: failureMessage }, 503);
  try {
    if (Number(req.headers.get('content-length') || 0) > 8000) return reply({ error: failureMessage }, 400);
    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) return reply({ error: failureMessage }, 400);
    if (parsed.data.action === 'challenge') return reply(await signChallenge(secret));
    const body = parsed.data;
    const challenge = await verifyChallenge(secret, body.token, body.solution);
    if (!challenge) return reply({ error: failureMessage }, 400);
    const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: consumed, error: claimError } = await admin.rpc('consume_admin_login_challenge', { p_nonce_hash: await digest(challenge.nonce), p_expires_at: new Date(challenge.expiresAt).toISOString() });
    if (claimError) return reply({ error: failureMessage }, 503);
    if (consumed !== true) return reply({ error: failureMessage }, 409);
    const auth = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await auth.auth.signInWithPassword({ email: body.email, password: body.password });
    let permitted = false;
    if (!error && data.user && data.session) {
      const { data: profile, error: profileError } = await admin.from('user_profiles').select('role,is_approved').eq('user_id', data.user.id).maybeSingle();
      permitted = !profileError && profile?.is_approved === true && ['admin','staff','legal','muhasebe','partner'].includes(profile.role);
    }
    if (!permitted || !data.session) {
      if (data.session) await auth.auth.signOut();
      // No email, IP, password, token or provider error details in logs.
      console.info(JSON.stringify({ event: 'panel_login_rejected', step: Math.min(challenge.failures + 1, 100) }));
      return reply({ error: failureMessage, ...(await signChallenge(secret, Math.min(challenge.failures + 1, 100))) }, 401);
    }
    return reply({ session: { access_token: data.session.access_token, refresh_token: data.session.refresh_token } });
  } catch { return reply({ error: failureMessage }, 503); }
});