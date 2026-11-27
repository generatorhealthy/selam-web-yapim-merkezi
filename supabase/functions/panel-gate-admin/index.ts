import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";
import { newSecret, verifyTotp, sha256Hex, jwtSessionId, panelGateOk, GATE_SESSION_HOURS } from "../_shared/totp.ts";

// Admin-only management of the Divan panel Authenticator gate.
const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("status") }).strict(),
  z.object({ action: z.literal("setup_start") }).strict(),
  z.object({ action: z.literal("setup_confirm"), code: z.string().regex(/^\d{6}$/) }).strict(),
  z.object({ action: z.literal("new_backup_codes"), code: z.string().regex(/^\d{6}$/) }).strict(),
  z.object({ action: z.literal("disable"), code: z.string().regex(/^\d{6}$/) }).strict(),
]);

const makeBackupCodes = () => Array.from({ length: 8 }, () =>
  [...crypto.getRandomValues(new Uint8Array(10))].map((b) => "abcdefghjkmnpqrstuvwxyz23456789"[b % 31]).join(""));

Deno.serve(async (req) => {
  const reply = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" } });
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return reply({ error: "Geçersiz istek" }, 405);
  try {
    const url = Deno.env.get("SUPABASE_URL")!, anon = Deno.env.get("SUPABASE_ANON_KEY")!, svcKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!token || token === svcKey) return reply({ error: "Yetkilendirme gerekli" }, 401);
    const { data: { user } } = await createClient(url, anon, { global: { headers: { Authorization: authHeader } } }).auth.getUser();
    if (!user) return reply({ error: "Geçersiz oturum" }, 401);
    const svc = createClient(url, svcKey, { auth: { persistSession: false } });
    const { data: profile } = await svc.from("user_profiles").select("role,is_approved").eq("user_id", user.id).maybeSingle();
    if (profile?.role !== "admin" || profile.is_approved !== true) return reply({ error: "Bu işlem yalnızca yönetici içindir" }, 403);
    if (!(await panelGateOk(svc, user.id, "admin", token))) return reply({ error: "Panel güvenlik kodu doğrulanmadı" }, 403);

    const parsed = Body.safeParse(await req.json());
    if (!parsed.success) return reply({ error: parsed.error.flatten().fieldErrors }, 400);
    const b = parsed.data;
    const { data: cfg } = await svc.from("panel_gate_config").select("enabled,totp_secret,pending_secret,backup_code_hashes").eq("id", 1).maybeSingle();
    const now = new Date().toISOString();

    if (b.action === "status") return reply({ enabled: !!cfg?.enabled, backupLeft: cfg?.backup_code_hashes?.length ?? 0 });

    if (b.action === "setup_start") {
      if (cfg?.enabled) return reply({ error: "Kilit zaten açık" }, 409);
      const secret = newSecret();
      await svc.from("panel_gate_config").update({ pending_secret: secret, updated_at: now }).eq("id", 1);
      const uri = `otpauth://totp/${encodeURIComponent("Doktorum Ol:Divan Paneli")}?secret=${secret}&issuer=${encodeURIComponent("Doktorum Ol")}&algorithm=SHA1&digits=6&period=30`;
      return reply({ secret, uri });
    }

    if (b.action === "setup_confirm") {
      if (cfg?.enabled) return reply({ error: "Kilit zaten açık" }, 409);
      if (!cfg?.pending_secret || !(await verifyTotp(cfg.pending_secret, b.code))) return reply({ error: "Kod hatalı. Uygulamadaki güncel kodu girin." }, 400);
      const codes = makeBackupCodes();
      const sid = jwtSessionId(token);
      if (!sid) return reply({ error: "Oturum okunamadı, yeniden giriş yapın" }, 400);
      // Keep the admin who enables it signed in.
      await svc.from("panel_gate_sessions").upsert({ session_id: sid, user_id: user.id, expires_at: new Date(Date.now() + GATE_SESSION_HOURS * 3600_000).toISOString() });
      await svc.from("panel_gate_config").update({
        enabled: true, totp_secret: cfg.pending_secret, pending_secret: null,
        backup_code_hashes: await Promise.all(codes.map((c) => sha256Hex(c))), updated_at: now,
      }).eq("id", 1);
      return reply({ enabled: true, backupCodes: codes });
    }

    if (!cfg?.enabled || !cfg.totp_secret) return reply({ error: "Kilit kapalı" }, 409);
    if (!(await verifyTotp(cfg.totp_secret, b.code))) return reply({ error: "Kod hatalı" }, 400);

    if (b.action === "new_backup_codes") {
      const codes = makeBackupCodes();
      await svc.from("panel_gate_config").update({ backup_code_hashes: await Promise.all(codes.map((c) => sha256Hex(c))), updated_at: now }).eq("id", 1);
      return reply({ backupCodes: codes });
    }
    await svc.from("panel_gate_config").update({ enabled: false, totp_secret: null, backup_code_hashes: [], updated_at: now }).eq("id", 1);
    return reply({ enabled: false });
  } catch {
    return reply({ error: "Beklenmeyen hata" }, 500);
  }
});
