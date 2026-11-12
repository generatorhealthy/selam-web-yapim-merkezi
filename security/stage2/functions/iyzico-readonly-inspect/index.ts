// SALT OKUNUR iyzico abonelik incelemesi — yalnız GET, yalnız yönetici, kişisel veri döndürmez.
// Amaç: gerçek yanıtta plan kodu, tahsilat referansı ve tutar alanlarının adını/varlığını görmek
// ve bunları siparişlerle karşılaştırmak. Hiçbir kayıt yazmaz, tahsilat/abonelik işlemi yapmaz.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { verifyAdminOrCron } from "../_shared/adminAuth.ts";
import { parseIyzicoSubscription, decideCallback } from "../_shared/paymentGuard.ts";

async function iyzicoGet(path: string, query = "") {
  const apiKey = Deno.env.get("IYZICO_API_KEY")!, secret = Deno.env.get("IYZICO_SECRET_KEY")!;
  const base = Deno.env.get("IYZIPAY_URI") || "https://api.iyzipay.com";
  const rnd = crypto.randomUUID().replace(/-/g, "");
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = Array.from(new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rnd + path))))
    .map((b) => b.toString(16).padStart(2, "0")).join("");
  const r = await fetch(`${base}${path}${query}`, { method: "GET", headers: {
    Authorization: `IYZWSv2 ${btoa(`apiKey:${apiKey}&randomKey:${rnd}&signature:${sig}`)}`, "x-iyzi-rnd": rnd, Accept: "application/json" } });
  return await r.json();
}
const keys = (o: any) => (o && typeof o === "object" ? Object.keys(o).sort() : []);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const auth = await verifyAdminOrCron(req);
  if (!auth.ok) return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: corsHeaders });

  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: orders } = await db.from("orders")
    .select("id, amount, package_type, status, subscription_month, approved_at, subscription_reference_code")
    .not("subscription_reference_code", "is", null).is("deleted_at", null)
    .order("created_at", { ascending: false }).limit(200);

  const bySub = new Map<string, any[]>();
  for (const o of orders ?? []) bySub.set(o.subscription_reference_code, [...(bySub.get(o.subscription_reference_code) ?? []), o]);
  const sample = [...bySub.keys()].slice(0, 25);

  const fieldSets = { subscription: new Set<string>(), order: new Set<string>(), attempt: new Set<string>() };
  const rows = [];
  for (const ref of sample) {
    const res = await iyzicoGet(`/v2/subscription/subscriptions/${ref}`);
    const sub = Array.isArray(res?.data?.items) ? res.data.items[0] : res?.data;
    keys(sub).forEach((k) => fieldSets.subscription.add(k));
    for (const o of sub?.orders ?? []) { keys(o).forEach((k) => fieldSets.order.add(k)); for (const a of o?.paymentAttempts ?? []) keys(a).forEach((k) => fieldSets.attempt.add(k)); }
    const v = parseIyzicoSubscription(res, ref);
    const dbOrders = bySub.get(ref)!;
    const latestApproved = dbOrders.filter((o) => o.status === "approved").sort((a, b) => Date.parse(b.approved_at) - Date.parse(a.approved_at))[0];
    rows.push({
      sub: ref.slice(0, 6) + "…",
      iyzicoStatus: sub?.subscriptionStatus ?? res?.status,
      planCode: v?.pricingPlanReferenceCode ?? null,
      latestChargePrice: v?.latestCharge?.price ?? null,
      latestChargeHasRef: !!v?.latestCharge?.referenceCode,
      latestChargeFailedOrWaiting: v?.latestChargeFailedOrWaiting ?? null,
      dbPackage: latestApproved?.package_type ?? dbOrders[0].package_type,
      dbAmount: latestApproved?.amount ?? dbOrders[0].amount,
      amountMatches: v?.latestCharge?.price != null && latestApproved ? Math.abs(Number(latestApproved.amount) - v.latestCharge.price) < 0.01 : null,
      // Simülasyon: bu tahsilat için bildirim şimdi tekrar gelse ne olurdu? (beklenen: duplicate)
      replaySimulation: latestApproved ? decideCallback({ verified: v, lastApprovedAtForSubscription: Date.parse(latestApproved.approved_at),
        pendingOrder: { id: "sim", amount: Number(latestApproved.amount), package_type: latestApproved.package_type, status: "pending" } }).action : null,
    });
  }
  const out = { fields: { subscription: [...fieldSets.subscription], order: [...fieldSets.order], attempt: [...fieldSets.attempt] }, rows };
  console.log("IYZICO_INSPECT_RESULT " + JSON.stringify(out));
  return new Response(JSON.stringify({
    fields: { subscription: [...fieldSets.subscription], order: [...fieldSets.order], attempt: [...fieldSets.attempt] }, rows,
  }, null, 2), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
