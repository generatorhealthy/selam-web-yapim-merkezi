// Issues single-use, short-lived server tokens so an anonymous visitor's consent
// choice can be recorded with server-verifiable proof. The token is 32 random
// bytes; only its SHA-256 is stored. Caller-supplied visitor ids, emails or IPs
// are never accepted — the token itself is the whole proof.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const PURPOSES = ["analytics", "advertising"] as const;
const TTL_MINUTES = 15;

async function sha256(text: string): Promise<string> {
  const bytes = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)));
  return Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return json({ error: "service_unavailable" }, 503);
  let raw: unknown;
  try { raw = await req.json(); } catch { return json({ error: "invalid_json" }, 400); }
  const purpose = (raw as Record<string, unknown>)?.purpose;
  if (!PURPOSES.includes(purpose as typeof PURPOSES[number])) return json({ error: "invalid_purpose" }, 400);
  const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  try {
    const tokenBytes = new Uint8Array(32);
    crypto.getRandomValues(tokenBytes);
    const token = Array.from(tokenBytes, b => b.toString(16).padStart(2, "0")).join("");
    const expiresAt = new Date(Date.now() + TTL_MINUTES * 60_000).toISOString();
    const { data, error } = await admin.from("consent_transactions").insert({
      token_hash: await sha256(token), purpose, expires_at: expiresAt,
    }).select("id").single();
    if (error || !data) return json({ error: "transaction_issue_failed" }, 500);
    return json({ transaction_id: data.id, token, expires_at: expiresAt }, 201);
  } catch { return json({ error: "transaction_service_failed" }, 500); }
});
