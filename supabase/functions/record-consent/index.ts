import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { authenticatedSubject, DOCUMENTS, eventId, parseInput, sha256 } from "./policy.ts";

Deno.serve(async (req) => {
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  const authorization = req.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return json({ error: "unauthorized" }, 401);
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return json({ error: "service_unavailable" }, 503);
  const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  try {
    // Server-read identity: never accept user ID, email, role or IP in the body.
    const { data: auth, error: authError } = await admin.auth.getUser(authorization.slice(7));
    const userId = authenticatedSubject(auth.user);
    if (authError || !userId) return json({ error: "unauthorized" }, 401);
    let raw: unknown;
    try { raw = await req.json(); } catch { return json({ error: "invalid_json" }, 400); }
    const input = parseInput(raw);
    if (!input) return json({ error: "invalid_consent_request" }, 400);
    const document = DOCUMENTS[input.action === "disclosure_shown" ? "disclosure" : "explicit_consent"];
    if (!document?.published || !document.text) return json({ error: "documents_not_published" }, 503);
    const documentHash = await sha256(document.text);
    const id = await eventId(userId, input);
    const { error } = await admin.from("user_consent_logs").insert({
      id, user_id: userId, email: auth.user?.email ?? null,
      consent_type: input.action === "disclosure_shown" ? "disclosure" : input.purpose,
      consent_version: document.version, document_hash: documentHash,
      accepted: input.action !== "withdraw", source: "record_consent",
      // The gateway's trusted IP-header contract is not verified: store unknown,
      // rather than recording caller-controlled forwarded headers as evidence.
      ip_address: null, user_agent: req.headers.get("user-agent")?.slice(0,300) ?? null,
      metadata: { transaction_id: input.transaction_id, purpose: input.purpose, action: input.action,
        verification_method: "server_getUser", ip_verification: "unavailable",
        user_agent_verified: false },
    });
    if (error?.code === "23505") {
      const { data: existing, error: lookupError } = await admin.from("user_consent_logs")
        .select("id,document_hash,consent_version").eq("id", id).eq("user_id", userId).maybeSingle();
      if (lookupError || !existing) return json({ error: "consent_record_failed" }, 500);
      if (existing.document_hash !== documentHash || existing.consent_version !== document.version)
        return json({ error: "transaction_document_conflict" }, 409);
      return json({ consent_log_id: existing.id, duplicate: true });
    }
    if (error) return json({ error: "consent_record_failed" }, 500);
    return json({ consent_log_id: id, duplicate: false }, 201);
  } catch { return json({ error: "consent_service_failed" }, 500); }
});