import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { recurringHttpPort, settleHoppaRecurring } from "../_shared/hoppaRecurring.ts";
import { hoppaDbPort } from "../_shared/hoppaDb.ts";
// Hoppa her tekrarın sonucunu JSON POST eder. İçeriğe güvenilmez; yalnız ORDER_REF_NUMBER ile sunucu sorgusu yapılır.
Deno.serve(async (req) => {
  try {
    const raw = await req.text();
    let ref = "";
    try { ref = String(JSON.parse(raw)?.ORDER_REF_NUMBER ?? ""); } catch { ref = new URLSearchParams(raw).get("ORDER_REF_NUMBER") ?? ""; }
    const merchant = Deno.env.get("HOPPA_MERCHANT"), key = Deno.env.get("HOPPA_MERCHANT_KEY");
    if (!merchant || !key) return Response.json({ ok: false }, { status: 503 });
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const r = await settleHoppaRecurring(ref, { db: hoppaDbPort(admin),
      rec: recurringHttpPort(merchant, key, Deno.env.get("HOPPA_BASE_URL") || "https://posservice.esnekpos.com") });
    console.log("hoppa recurring callback:", r.first ?? "-", r.renewals, r.reason ?? "");
    return Response.json({ ok: true });
  } catch (e) {
    console.error("hoppa recurring callback error:", String((e as Error).message || "").slice(0, 80));
    return Response.json({ ok: false }, { status: 500 });
  }
});
