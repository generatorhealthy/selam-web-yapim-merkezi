import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { hoppaHttpPort, settleHoppaReturn } from "../_shared/hoppaCheckout.ts";
import { hoppaDbPort } from "../_shared/hoppaDb.ts";
const SITE = "https://doktorumol.com.tr";
const go = (to: string) => new Response(null, { status: 303, headers: { Location: to } });
Deno.serve(async (req) => {
  let ref = "";
  try {
    const raw = req.method === "POST" ? await req.text() : "";
    ref = new URLSearchParams(raw).get("ORDER_REF_NUMBER") || new URL(req.url).searchParams.get("ORDER_REF_NUMBER") || "";
    const merchant = Deno.env.get("HOPPA_MERCHANT"), key = Deno.env.get("HOPPA_MERCHANT_KEY");
    if (!merchant || !key) return go(`${SITE}/odeme/ozel-firsat?odeme=basarisiz`);
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const db = hoppaDbPort(admin);
    const r = await settleHoppaReturn(ref, { db, hoppa: hoppaHttpPort(merchant, key, Deno.env.get("HOPPA_BASE_URL") || "https://posservice.esnekpos.com") });
    console.log("hoppa return:", r.outcome, r.reason ?? "");
    if ((r.outcome === "applied" || r.outcome === "duplicate") && r.orderId) {
      const o = await db.readOrder(r.orderId);
      const orderData = { id: r.orderId, orderNumber: `DRP-${r.orderId.slice(0, 8).toUpperCase()}`, package: o?.package_name ?? "",
        amount: Number(o?.amount ?? 0), paymentMethod: "credit_card", customerName: o?.customer_name ?? "" };
      return go(`${SITE}/odeme-basarili?orderData=${encodeURIComponent(JSON.stringify(orderData))}`);
    }
    const o = r.orderId ? await db.readOrder(r.orderId) : null;
    const pkg = o?.package_type === "kayit-linki" ? "kayit-linki" : "ozel-firsat";
    return go(`${SITE}/odeme/${pkg}?odeme=basarisiz`);
  } catch (e) {
    console.error("hoppa return error:", (e as Error).message?.slice(0, 120));
    return go(`${SITE}/odeme/ozel-firsat?odeme=basarisiz`);
  }
});
