import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { authenticatedSubject, documentFor, eventId, parseInput, sha256 } from "./policy.ts";

Deno.serve(async (req) => {
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return json({ error: "service_unavailable" }, 503);
  const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  try {
    let raw: unknown;
    try { raw = await req.json(); } catch { return json({ error: "invalid_json" }, 400); }
    const input = parseInput(raw);
    if (!input) return json({ error: "invalid_consent_request" }, 400);
    const document = documentFor(input);
    if (!document?.published || !document.hash) return json({ error: "documents_not_published" }, 503);

    // Identity: verified account, or a server-issued single-use anonymous token.
    // Caller-supplied user id, email, IP or consent flags are never evidence.
    const authorization = req.headers.get("authorization");
    let userId: string | null = null;
    let email: string | null = null;
    let subject: string;
    let verification: string;
    let authed = false;
    if (authorization?.startsWith("Bearer ")) {
      const { data: auth } = await admin.auth.getUser(authorization.slice(7));
      userId = authenticatedSubject(auth.user);
      if (userId) {
        authed = true;
        email = auth.user?.email ?? null;
        subject = userId!;
        verification = "server_getUser";
      }
    }
    if (!authed) {
      // Anonim yol: yalnızca sunucunun ürettiği, tek kullanımlık işlem jetonu kanıttır.
      // (İstemci SDK'sı oturum yokken anon anahtarı Bearer olarak gönderir; bu kimlik sayılmaz.)
      if (!input.transaction_token) return json({ error: "unauthorized" }, 401);
      const tokenHash = await sha256(input.transaction_token);
      // Consume atomically: only the first request marking this token succeeds.
      const { data: consumed, error: consumeError } = await admin
        .from("consent_transactions")
        .update({ consumed_at: new Date().toISOString() })
        .eq("token_hash", tokenHash)
        .eq("purpose", input.purpose)
        .is("consumed_at", null)
        .gt("expires_at", new Date().toISOString())
        .select("id")
        .maybeSingle();
      if (consumeError) return json({ error: "consent_record_failed" }, 500);
      if (!consumed) return json({ error: "invalid_transaction_token" }, 401);
      subject = `anon:${tokenHash}`;
      verification = "anonymous_server_token";
    }

    const id = await eventId(subject, input);
    const { error } = await admin.from("user_consent_logs").insert({
      id, user_id: userId, email,
      consent_type: input.action === "disclosure_shown" ? "disclosure" : input.purpose,
      consent_version: document.version, document_hash: document.hash,
      accepted: input.action !== "withdraw", source: "record_consent",
      // The gateway's trusted IP-header contract is not verified: store unknown,
      // rather than recording caller-controlled forwarded headers as evidence.
      ip_address: null, user_agent: req.headers.get("user-agent")?.slice(0,300) ?? null,
      metadata: { transaction_id: input.transaction_id, purpose: input.purpose, action: input.action,
        verification_method: verification, ip_verification: "unavailable",
        user_agent_verified: false },
    });
    if (error?.code === "23505") {
      const { data: existing, error: lookupError } = await admin.from("user_consent_logs")
        .select("id,document_hash,consent_version").eq("id", id).maybeSingle();
      if (lookupError || !existing) return json({ error: "consent_record_failed" }, 500);
      if (existing.document_hash !== document.hash || existing.consent_version !== document.version)
        return json({ error: "transaction_document_conflict" }, 409);
      return json({ consent_log_id: existing.id, duplicate: true });
    }
    if (error) return json({ error: "consent_record_failed" }, 500);
    return json({ consent_log_id: id, duplicate: false }, 201);
  } catch { return json({ error: "consent_service_failed" }, 500); }
});
