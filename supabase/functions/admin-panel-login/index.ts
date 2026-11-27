import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3';
import { signChallenge, verifyChallenge, digest } from '../_shared/adminLoginChallenge.ts';
import { verifyTotp, sha256Hex, signGateTicket, verifyGateTicket, jwtSessionId, GATE_SESSION_HOURS } from '../_shared/totp.ts';

const bodySchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('challenge') }).strict(),
  z.object({ action: z.literal('gate_status') }).strict(),
  z.object({ action: z.literal('gate'), code: z.string().min(6).max(20) }).strict(),
  z.object({ action: z.literal('login'), email: z.string().email().max(254), password: z.string().min(1).max(1024), token: z.string().max(1500), solution: z.number().int().nonnegative(), gateTicket: z.string().max(400).optional() }).strict(),
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
    const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: gateCfg, error: gateErr } = await admin.from('panel_gate_config').select('enabled,totp_secret,backup_code_hashes').eq('id', 1).maybeSingle();
    if (gateErr) return reply({ error: failureMessage }, 503);
    const gateOn = gateCfg?.enabled === true && !!gateCfg.totp_secret;
    if (parsed.data.action === 'gate_status') return reply({ required: gateOn });
    if (parsed.data.action === 'gate') {
      if (!gateOn) return reply({ ticket: await signGateTicket(secret) });
      const ip = (req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim();
      const key = await sha256Hex('gate:' + ip);
      const { data: f } = await admin.from('panel_gate_failures').select('failures,locked_until').eq('key', key).maybeSingle();
      if (f?.locked_until && new Date(f.locked_until).getTime() > Date.now()) return reply({ error: 'Çok fazla hatalı deneme. 15 dakika sonra tekrar deneyin.' }, 429);
      const code = parsed.data.code.replace(/\s|-/g, '');
      let ok = await verifyTotp(gateCfg!.totp_secret!, code);
      if (!ok && /^[a-z0-9]{10}$/i.test(code)) {
        const h = await sha256Hex(code.toLowerCase());
        const hashes: string[] = gateCfg!.backup_code_hashes ?? [];
        if (hashes.includes(h)) {
          ok = true;
          await admin.from('panel_gate_config').update({ backup_code_hashes: hashes.filter(x => x !== h), updated_at: new Date().toISOString() }).eq('id', 1);
        }
      }
      if (!ok) {
        const failures = (f?.locked_until && new Date(f.locked_until).getTime() <= Date.now() ? 0 : (f?.failures ?? 0)) + 1;
        await admin.from('panel_gate_failures').upsert({ key, failures, locked_until: failures >= 5 ? new Date(Date.now() + 15 * 60_000).toISOString() : null, updated_at: new Date().toISOString() });
        return reply({ error: 'Kod hatalı.' }, 401);
      }
      if (f) await admin.from('panel_gate_failures').delete().eq('key', key);
      return reply({ ticket: await signGateTicket(secret) });
    }
    const body = parsed.data;
    if (gateOn && !(body.gateTicket && await verifyGateTicket(secret, body.gateTicket))) return reply({ error: failureMessage, gate: true }, 401);
    const challenge = await verifyChallenge(secret, body.token, body.solution);
    if (!challenge) return reply({ error: failureMessage }, 400);
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
    if (gateOn) {
      const sid = jwtSessionId(data.session.access_token);
      const { error: gsErr } = sid ? await admin.from('panel_gate_sessions').insert({ session_id: sid, user_id: data.user!.id, expires_at: new Date(Date.now() + GATE_SESSION_HOURS * 3600_000).toISOString() }) : { error: true };
      if (gsErr) { await auth.auth.signOut(); return reply({ error: failureMessage }, 503); }
    }
    return reply({ session: { access_token: data.session.access_token, refresh_token: data.session.refresh_token } });
  } catch { return reply({ error: failureMessage }, 503); }
});