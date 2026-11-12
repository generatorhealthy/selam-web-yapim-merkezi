// TASLAK — yayınlanmadı. Onay kaydını sunucuda yazar: zaman, IP, metin sürümü ve
// SHA-256 özeti sunucu tarafından belirlenir; istemcinin gönderdiği özet kabul edilmez.
import { createClient } from "npm:@supabase/supabase-js@2";
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
// Yayındaki metinlerin sürüm → özet tablosu (yayın günü SHA256SUMS'tan doldurulur).
const DOCS: Record<string, { version: string; sha256: string }> = {
  disclosure: { version: "PENDING", sha256: "PENDING" },
  explicit_consent: { version: "PENDING", sha256: "PENDING" },
};
const PURPOSES = new Set(["health_test", "health_appointment", "marketing_etk", "ads_analytics"]);
const ACTIONS = new Set(["grant", "withdraw", "disclosure_shown"]);
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  const j = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });
  try {
    const { purpose, action, source } = await req.json();
    if (!PURPOSES.has(purpose) && action !== "disclosure_shown") return j({ error: "invalid purpose" }, 400);
    if (!ACTIONS.has(action)) return j({ error: "invalid action" }, 400);
    const doc = action === "disclosure_shown" ? DOCS.disclosure : DOCS.explicit_consent;
    if (doc.sha256 === "PENDING") return j({ error: "documents not published" }, 503);
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    let userId: string | null = null;
    const auth = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (auth) { const { data } = await admin.auth.getUser(auth); userId = data.user?.id ?? null; }
    const transaction_id = crypto.randomUUID();
    const { data, error } = await admin.from("user_consent_logs").insert({
      user_id: userId, consent_type: action === "disclosure_shown" ? "disclosure" : "explicit_consent",
      purpose: purpose ?? null, action, accepted: action !== "withdraw",
      consent_version: doc.version, document_hash: doc.sha256, transaction_id,
      ip_address: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
      user_agent: req.headers.get("user-agent")?.slice(0, 300) ?? null,
      source: typeof source === "string" ? source.slice(0, 40) : null,
    }).select("id").maybeSingle();
    if (error) throw error;
    return j({ consent_log_id: data?.id, transaction_id });
  } catch (_e) { return j({ error: "consent record failed" }, 500); }
});
