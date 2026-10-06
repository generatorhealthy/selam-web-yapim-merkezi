// AI Reklam Merkezi arka uç:
//  - sync: Meta'dan günlük reklam harcamasını çeker (yalnızca okuma) + onaylı ödemeleri Meta'ya Purchase olarak bildirir
//  - analyze: kampanya performansına göre yapay zekâ BÜYÜT/KORU/İZLE/AZALT/DURDUR/YETERSİZ VERİ önerisi üretir
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod";
import { verifyAdminOrCron } from "../_shared/adminAuth.ts";

const AD_ACCOUNT_ID = "939321929194033";
const DATASET_ID = "1053321257408384";
const GRAPH = "https://graph.facebook.com/v26.0";
// Bu tarihten önce onaylanan siparişler Meta'ya bildirilmez (geçmişi topluca göndermemek için)
const PURCHASE_START = "2026-10-07T00:00:00Z";

const Body = z.object({
  action: z.enum(["sync", "analyze"]),
  days: z.number().int().min(1).max(90).optional(),
});

const json = (d: unknown, status = 200) =>
  new Response(JSON.stringify(d), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

async function sha256(v: string) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(v));
  return Array.from(new Uint8Array(d)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
function normPhone(raw?: string | null) {
  let p = String(raw || "").replace(/\D/g, "");
  if (!p) return "";
  if (p.startsWith("90")) return p;
  if (p.startsWith("0")) p = p.slice(1);
  return p.length === 10 ? "90" + p : p;
}

async function syncInsights(admin: any, token: string) {
  const since = new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10);
  const until = new Date().toISOString().slice(0, 10);
  const fields = "campaign_id,campaign_name,adset_id,adset_name,ad_id,ad_name,spend,impressions,clicks,actions";
  let url: string | null =
    `${GRAPH}/act_${AD_ACCOUNT_ID}/insights?level=ad&time_increment=1&limit=500&fields=${fields}` +
    `&time_range=${encodeURIComponent(JSON.stringify({ since, until }))}&access_token=${token}`;
  let rows = 0;
  while (url) {
    const res = await fetch(url);
    const body = await res.json();
    if (!res.ok) throw new Error(`Meta [${res.status}]: ${body?.error?.message || JSON.stringify(body)}`);
    const data = (body.data || []).map((r: any) => ({
      date: r.date_start,
      ad_id: r.ad_id,
      ad_name: r.ad_name,
      adset_id: r.adset_id,
      adset_name: r.adset_name,
      campaign_id: r.campaign_id,
      campaign_name: r.campaign_name,
      spend: Number(r.spend || 0),
      impressions: Number(r.impressions || 0),
      clicks: Number(r.clicks || 0),
      meta_leads: Number((r.actions || []).find((a: any) => a.action_type === "lead")?.value || 0),
      synced_at: new Date().toISOString(),
    }));
    if (data.length) {
      const { error } = await admin.from("meta_daily_metrics").upsert(data, { onConflict: "date,ad_id" });
      if (error) throw new Error(error.message);
      rows += data.length;
    }
    url = body.paging?.next || null;
  }
  return rows;
}

async function reportPurchases(admin: any, capiToken: string) {
  const { data: orders, error } = await admin
    .from("orders")
    .select("id, amount, customer_email, customer_phone, customer_name, approved_at")
    .in("status", ["approved", "completed"])
    .is("deleted_at", null)
    .gte("approved_at", PURCHASE_START)
    .order("approved_at", { ascending: true })
    .limit(50);
  if (error) throw new Error(error.message);
  if (!orders?.length) return 0;
  const { data: done } = await admin.from("meta_purchase_reports").select("order_id").in("order_id", orders.map((o: any) => o.id));
  const doneSet = new Set((done || []).map((d: any) => d.order_id));
  let sent = 0;
  for (const o of orders) {
    if (doneSet.has(o.id) || !(Number(o.amount) > 0)) continue;
    const email = String(o.customer_email || "").trim().toLowerCase();
    const { data: prof } = await admin.from("user_profiles").select("user_id").ilike("email", email).limit(1).maybeSingle();
    let fbc: string | undefined, fbp: string | undefined;
    if (prof?.user_id) {
      const { data: att } = await admin.from("lead_attribution").select("first_touch,last_touch").eq("user_id", prof.user_id).limit(1).maybeSingle();
      fbc = att?.last_touch?.fbc || att?.first_touch?.fbc || undefined;
      fbp = att?.last_touch?.fbp || att?.first_touch?.fbp || undefined;
    }
    const phone = normPhone(o.customer_phone);
    const [fn, ...rest] = String(o.customer_name || "").trim().toLowerCase().split(/\s+/);
    const user_data: Record<string, unknown> = {
      em: email ? [await sha256(email)] : undefined,
      ph: phone ? [await sha256(phone)] : undefined,
      fn: fn ? [await sha256(fn)] : undefined,
      ln: rest.length ? [await sha256(rest.join(" "))] : undefined,
      country: [await sha256("tr")],
      external_id: prof?.user_id ? [await sha256(prof.user_id)] : undefined,
      fbc, fbp,
    };
    Object.keys(user_data).forEach((k) => user_data[k] === undefined && delete user_data[k]);
    const event_id = `purchase_${o.id}`;
    const payload = {
      data: [{
        event_name: "Purchase",
        event_time: Math.floor(new Date(o.approved_at).getTime() / 1000),
        event_id,
        action_source: "website",
        event_source_url: "https://doktorumol.com.tr/",
        user_data,
        custom_data: { currency: "TRY", value: Number(o.amount), order_id: o.id },
      }],
    };
    const res = await fetch(`${GRAPH}/${DATASET_ID}/events?access_token=${capiToken}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
    });
    const text = await res.text();
    if (!res.ok) console.error(`Purchase gönderilemedi [${res.status}]: ${text}`);
    await admin.from("meta_purchase_reports").upsert({
      order_id: o.id, event_id, amount: Number(o.amount), status: res.ok ? "sent" : "failed", response: text.slice(0, 1000),
    });
    if (res.ok) sent++;
  }
  return sent;
}

const RecSchema = {
  type: "object",
  additionalProperties: false,
  required: ["recommendations"],
  properties: {
    recommendations: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["campaign_id", "decision", "confidence", "reason"],
        properties: {
          campaign_id: { type: "string" },
          decision: { type: "string", enum: ["BUYUT", "KORU", "IZLE", "AZALT", "DURDUR", "YETERSIZ_VERI"] },
          confidence: { type: "string", enum: ["DUSUK", "ORTA", "YUKSEK"] },
          reason: { type: "string" },
        },
      },
    },
  },
};

async function analyze(admin: any, days: number, userId: string | null) {
  const { data: perf, error } = await admin.rpc("get_ad_performance", { p_days: days });
  if (error) throw new Error(error.message);
  if (!perf?.length) return { recommendations: [], note: "Bu dönemde reklam harcaması verisi yok." };
  const rows = perf.slice(0, 40).map((r: any) => ({
    campaign_id: r.campaign_id, campaign_name: r.campaign_name, spend_try: Number(r.spend),
    clicks: Number(r.clicks), meta_leads: Number(r.meta_leads), site_leads: Number(r.leads),
    registrations: Number(r.registrations), checkouts: Number(r.checkouts), paid_members: Number(r.paid),
    revenue_try: Number(r.revenue),
  }));
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) throw new Error("LOVABLE_API_KEY yok");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "fetch" },
    body: JSON.stringify({
      model: "openai/gpt-6-astra",
      stream: true,
      store: false,
      reasoning: { effort: "low" },
      instructions:
        "Sen Doktorumol.com.tr'nin (uzman/psikolog üyelik platformu) Meta reklam analistisin. Hedef: ücretli uzman üye kazanmak. " +
        "Her kampanya için karar ver: BUYUT, KORU, IZLE, AZALT, DURDUR veya YETERSIZ_VERI. Öncelik sırası: ücretli üye, CAC (harcama/ücretli üye), gelir, ROAS. " +
        "Ucuz lead tek başına başarı değildir. Az veri varsa (ör. harcama < 500 TL veya 20'den az tıklama) kesin karar verme: YETERSIZ_VERI veya IZLE, güven DUSUK. " +
        "Çok harcayıp hiç kayıt/ödeme getirmeyen kampanyayı AZALT/DURDUR olarak işaretle. reason alanı kısa, sade Türkçe, rakamlarla (en fazla 2 cümle). Her kampanya için tam bir öneri döndür.",
      input: `Dönem: son ${days} gün. Kampanyalar (JSON):\n${JSON.stringify(rows)}`,
      text: { format: { type: "json_schema", name: "ad_recs", strict: true, schema: RecSchema } },
    }),
  });
  if (!res.ok || !res.body) {
    const t = await res.text();
    throw new Error(res.status === 429 ? "Yapay zekâ şu an yoğun, biraz sonra tekrar deneyin." :
      res.status === 402 ? "Yapay zekâ kredisi bitti." : `AI [${res.status}]: ${t}`);
  }
  // SSE akışını oku, son metni topla
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "", out = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() || "";
    for (const l of lines) {
      if (!l.startsWith("data:")) continue;
      const d = l.slice(5).trim();
      if (!d || d === "[DONE]") continue;
      try {
        const ev = JSON.parse(d);
        if (ev.type === "response.output_text.delta") out += ev.delta || "";
      } catch { /* yoksay */ }
    }
  }
  const parsed = JSON.parse(out || '{"recommendations":[]}');
  const byId = new Map(rows.map((r: any) => [r.campaign_id, r]));
  const recs = (parsed.recommendations || []).filter((r: any) => byId.has(r.campaign_id)).map((r: any) => {
    const m: any = byId.get(r.campaign_id);
    return {
      campaign_id: r.campaign_id, campaign_name: m.campaign_name, decision: r.decision, confidence: r.confidence,
      reason: r.reason, metrics: m, period_days: days, created_by: userId,
    };
  });
  if (recs.length) await admin.from("ai_ad_recommendations").insert(recs);
  return { recommendations: recs };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = await verifyAdminOrCron(req);
    if (!auth.ok) return json({ error: "Yetkisiz" }, 401);
    const parsed = Body.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400);
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    if (parsed.data.action === "sync") {
      const adsToken = Deno.env.get("META_ADS_ACCESS_TOKEN");
      const capiToken = Deno.env.get("META_CAPI_ACCESS_TOKEN");
      const result: Record<string, unknown> = {};
      try { result.metricRows = adsToken ? await syncInsights(admin, adsToken) : "META_ADS_ACCESS_TOKEN yok"; }
      catch (e) { result.metricError = (e as Error).message; }
      try { result.purchasesSent = capiToken ? await reportPurchases(admin, capiToken) : "META_CAPI_ACCESS_TOKEN yok"; }
      catch (e) { result.purchaseError = (e as Error).message; }
      return json(result);
    }
    return json(await analyze(admin, parsed.data.days ?? 30, (auth as any).userId ?? null));
  } catch (e) {
    console.error(e);
    return json({ error: (e as Error).message }, 500);
  }
});
