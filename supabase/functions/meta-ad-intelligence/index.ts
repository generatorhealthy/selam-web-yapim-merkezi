// AI Reklam Merkezi arka uç (Marketing API YALNIZCA OKUMA):
//  status | test | listAccounts | selectAccount | sync | analyze
//  sync: Meta insights + reklam görselleri (upsert) + CAPI olay kuyruğu (QualifiedLead, CompleteRegistration yedek, InitiateCheckout, Purchase)
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod";
import { verifyAdminOrCron } from "../_shared/adminAuth.ts";
import { attributedRoas, hasTrackedSample } from "../_shared/adAttribution.ts";
import { classifyCapiResponse } from "../_shared/capiResponse.ts";
import { decide, reasonLine } from "../_shared/adDecision.ts";
import { isOtherProjectRow } from "../_shared/adExclusions.ts";

const DATASET_ID = "1053321257408384";
const V = "v26.0";
const QUEUE_START = "2026-10-07T00:00:00Z"; // bu tarihten önceki olaylar Meta'ya topluca gönderilmez
const MAX_ATTEMPTS = 5;

const Body = z.object({
  action: z.enum(["status", "test", "listAccounts", "selectAccount", "sync", "analyze", "diag"]),
  days: z.number().int().min(1).max(90).optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  level: z.enum(["campaign", "adset", "ad"]).optional(),
  accountId: z.string().regex(/^\d{5,25}$/).optional(),
  accountName: z.string().max(200).optional(),
});

const json = (d: unknown, status = 200) =>
  new Response(JSON.stringify(d), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

// ---- Meta Graph erişimi: önce Lovable Meta Ads bağlantısı, yoksa eski erişim anahtarı ----
type MetaErr = { http_status: number; code?: number; subcode?: number; type?: string; message: string; fbtrace_id?: string };
class MetaError extends Error { constructor(public info: MetaErr) { super(info.message); } }

const clean = (v?: string | null) => (v || "").trim().replace(/^Bearer\s+/i, "").replace(/^["']|["']$/g, "").trim();
function token(): string | undefined {
  return clean(Deno.env.get("META_ACCESS_TOKEN")) || clean(Deno.env.get("META_ADS_ACCESS_TOKEN")) || undefined;
}
function source() {
  if (Deno.env.get("META_ACCESS_TOKEN")) return "META_ACCESS_TOKEN";
  if (Deno.env.get("META_ADS_ACCESS_TOKEN")) return "META_ADS_ACCESS_TOKEN";
  return "none";
}
const API_V = () => (Deno.env.get("META_API_VERSION") || V).replace(/^\/?/, "");
async function graph(pathAndQuery: string): Promise<any> {
  const t = token();
  if (!t) throw new MetaError({ http_status: 0, message: "Meta reklam hesabı bağlı değil." });
  const sep = pathAndQuery.includes("?") ? "&" : "?";
  // Doğrudan Meta Marketing API — yalnızca GET (okuma)
  const res = await fetch(`https://graph.facebook.com/${API_V()}${pathAndQuery}${sep}access_token=${encodeURIComponent(t)}`, { method: "GET" });
  const text = await res.text();
  let body: any; try { body = JSON.parse(text); } catch { body = { raw: text.slice(0, 300) }; }
  if (!res.ok || body?.error) {
    const e = body?.error || {};
    const info: MetaErr = { http_status: res.status, code: e.code, subcode: e.error_subcode, type: e.type, message: e.message || body?.raw || "Bilinmeyen hata", fbtrace_id: e.fbtrace_id };
    console.error("Meta Graph hatası:", JSON.stringify(info));
    throw new MetaError(info);
  }
  return body;
}
async function graphPaged(first: string, maxPages = 20) {
  const out: any[] = [];
  let body = await graph(first);
  out.push(...(body.data || []));
  let pages = 1;
  while (body.paging?.cursors?.after && body.paging?.next && pages < maxPages) {
    const sep = first.includes("?") ? "&" : "?";
    body = await graph(`${first}${sep}after=${encodeURIComponent(body.paging.cursors.after)}`);
    out.push(...(body.data || []));
    pages++;
  }
  return out;
}
function diagnose(i: MetaErr): string {
  if (i.http_status === 0) return "Meta bağlantısı kurulmamış.";
  if (/API access blocked/i.test(i.message)) return "Meta, bu erişim anahtarının bağlı olduğu uygulamanın API erişimini engellemiş (uygulama kısıtlanmış/devre dışı veya inceleme gerekiyor). Eski anahtar yerine Lovable Meta Ads bağlantısı kurulmalı.";
  if (i.code === 190) return "Erişim anahtarı geçersiz veya süresi dolmuş — Meta bağlantısını yenileyin.";
  if (i.code === 200 || i.code === 10 || (i.code && i.code >= 200 && i.code < 300)) return "İzin eksik (ads_read) veya bu reklam hesabına erişim verilmemiş.";
  if (i.code === 100) return "Reklam hesabı kimliği yanlış ya da bu bağlantı o hesabı göremiyor.";
  if (i.code === 17 || i.code === 4 || i.code === 613 || i.code === 80004) return "Meta istek sınırı — birkaç dakika sonra tekrar deneyin.";
  return "Meta isteği reddetti.";
}

// ---- yardımcılar ----
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
const ymd = (d: Date) => d.toISOString().slice(0, 10);

async function getSettings(admin: any) {
  const { data } = await admin.from("ad_intel_settings").select("*").eq("id", 1).maybeSingle();
  const envAcc = (Deno.env.get("META_AD_ACCOUNT_ID") || "").replace(/^act_/, "");
  return { ...(data || {}), ad_account_id: (data?.ad_account_id || envAcc || null) };
}

// ---- Insights senkronu (okuma) ----
async function syncInsights(admin: any, accountId: string, days: number) {
  const since = ymd(new Date(Date.now() - (days - 1) * 864e5));
  const until = ymd(new Date());
  const fields = "date_start,date_stop,account_id,campaign_id,campaign_name,adset_id,adset_name,ad_id,ad_name,spend,impressions,reach,frequency,clicks,inline_link_clicks,cost_per_inline_link_click,ctr,cpc,cpm,actions,action_values";
  const rows = await graphPaged(
    `/act_${accountId}/insights?level=ad&time_increment=1&limit=500&fields=${fields}&time_range=${encodeURIComponent(JSON.stringify({ since, until }))}`,
  );
  const num = (v: any) => (v === undefined || v === null || v === "" ? null : Number(v));
  const data = rows.map((r: any) => ({
    date: r.date_start, date_stop: r.date_stop, account_id: r.account_id, cost_per_link_click: num(r.cost_per_inline_link_click), raw_actions: r.actions ?? null, raw_action_values: r.action_values ?? null, ad_id: r.ad_id, ad_name: r.ad_name, adset_id: r.adset_id, adset_name: r.adset_name,
    campaign_id: r.campaign_id, campaign_name: r.campaign_name,
    spend: Number(r.spend || 0), impressions: Number(r.impressions || 0), clicks: Number(r.clicks || 0),
    reach: num(r.reach), frequency: num(r.frequency), link_clicks: num(r.inline_link_clicks),
    ctr: num(r.ctr), cpc: num(r.cpc), cpm: num(r.cpm),
    meta_leads: Number((r.actions || []).find((a: any) => a.action_type === "lead")?.value || 0),
    synced_at: new Date().toISOString(),
  }));
  for (let i = 0; i < data.length; i += 500) {
    const { error } = await admin.from("meta_daily_metrics").upsert(data.slice(i, i + 500), { onConflict: "date,ad_id" });
    if (error) throw new Error(error.message);
  }
  // Reklam görselleri (hata verirse sessiz geç)
  try {
    const ads = await graphPaged(`/act_${accountId}/ads?fields=id,name,effective_status,creative{id,thumbnail_url}&limit=200`, 5);
    const cr = ads.map((a: any) => ({
      ad_id: a.id, ad_name: a.name, creative_id: a.creative?.id ?? null, thumbnail_url: a.creative?.thumbnail_url ?? null,
      effective_status: a.effective_status ?? null, updated_at: new Date().toISOString(),
    }));
    if (cr.length) await admin.from("meta_ad_creatives").upsert(cr, { onConflict: "ad_id" });
  } catch (e) { console.error("Görsel okunamadı:", (e as Error).message); }
  return data.length;
}

// ---- CAPI olay kuyruğu ----
async function enqueue(admin: any, rows: any[]) {
  if (!rows.length) return 0;
  const { data, error } = await admin.from("meta_capi_events").upsert(rows, { onConflict: "event_key", ignoreDuplicates: true }).select("id");
  if (error) console.error("Kuyruk hatası:", error.message);
  return data?.length || 0;
}
async function testUserIds(admin: any): Promise<Set<string>> {
  const { data } = await admin.from("lead_attribution").select("user_id").eq("is_test", true).not("user_id", "is", null);
  return new Set((data || []).map((r: any) => r.user_id));
}
async function buildQueue(admin: any, settings: any) {
  const tests = await testUserIds(admin);
  let n = 0;
  // Purchase — yalnızca onaylanmış (başarılı) ödemeler
  const { data: orders } = await admin.from("orders").select("id, amount, customer_email, approved_at")
    .in("status", ["approved", "completed"]).is("deleted_at", null).gte("approved_at", QUEUE_START).limit(200);
  const emails = [...new Set((orders || []).map((o: any) => String(o.customer_email || "").toLowerCase()))];
  const { data: profs } = emails.length
    ? await admin.from("user_profiles").select("user_id, email").in("email", emails) : { data: [] };
  const uidByEmail = new Map((profs || []).map((p: any) => [String(p.email).toLowerCase(), p.user_id]));
  n += await enqueue(admin, (orders || []).filter((o: any) => Number(o.amount) > 0).map((o: any) => {
    const uid = uidByEmail.get(String(o.customer_email || "").toLowerCase()) ?? null;
    return { event_key: `purchase_${o.id}`, event_name: "Purchase", event_id: `purchase_${o.id}`, user_id: uid, order_id: o.id,
      value: Number(o.amount), payload: { email: o.customer_email, event_time: o.approved_at }, is_test: uid ? tests.has(uid) : false };
  }));
  // InitiateCheckout — her ödeme ekranı oturumu için bir kez
  const { data: chk } = await admin.from("analytics_events").select("user_id, anonymous_session_id, created_at, is_test")
    .eq("event_name", "checkout_started").gte("created_at", QUEUE_START).not("user_id", "is", null).limit(500);
  n += await enqueue(admin, (chk || []).map((e: any) => ({
    event_key: `checkout_${e.anonymous_session_id}`, event_name: "InitiateCheckout", event_id: `checkout_${e.anonymous_session_id}`,
    user_id: e.user_id, payload: { event_time: e.created_at }, is_test: e.is_test || tests.has(e.user_id),
  })));
  // QualifiedLead — eşik geçildiğinde kişi başı bir kez
  const thr = Number(settings.qualified_threshold ?? 60);
  const { data: leads, error } = await admin.rpc("get_lead_intelligence", { p_days: 30 });
  if (error) console.error("Puan okunamadı:", error.message);
  n += await enqueue(admin, (leads || []).filter((l: any) => l.score >= thr && new Date(l.created_at) >= new Date(QUEUE_START)).map((l: any) => ({
    event_key: `qualified_${l.user_id}`, event_name: "QualifiedLead", event_id: `qualified_${l.user_id}`, user_id: l.user_id,
    payload: { score: l.score }, is_test: tests.has(l.user_id),
  })));
  return n;
}
async function sendQueue(admin: any) {
  const token = Deno.env.get("META_CAPI_ACCESS_TOKEN");
  if (!token) return { sent: 0, failed: 0, note: "META_CAPI_ACCESS_TOKEN yok" };
  const { data: items } = await admin.from("meta_capi_events").select("*")
    .in("status", ["pending", "retrying"]).lt("attempts", MAX_ATTEMPTS).order("created_at").limit(50);
  let sent = 0, failed = 0;
  for (const it of items || []) {
    if (it.is_test) { await admin.from("meta_capi_events").update({ status: "sent", meta_status: "TEST_NOT_SENT", last_error: "test — Meta'ya gönderilmedi", sent_at: new Date().toISOString() }).eq("id", it.id); continue; }
    let email = it.payload?.email as string | undefined, phone: string | undefined, fbc: string | undefined, fbp: string | undefined;
    let fullName: string | undefined, city: string | undefined, ip: string | undefined;
    if (it.order_id) {
      // Siparişteki gerçek müşteri bilgileri (yalnız eşleştirme için, hash'lenerek)
      const { data: o } = await admin.from("orders").select("customer_name, customer_phone, customer_city, contract_ip_address").eq("id", it.order_id).maybeSingle();
      fullName = o?.customer_name || undefined; phone = o?.customer_phone || undefined;
      city = o?.customer_city || undefined; ip = o?.contract_ip_address || undefined;
    }
    if (it.user_id) {
      const { data: p } = await admin.from("user_profiles").select("email, phone, name").eq("user_id", it.user_id).limit(1).maybeSingle();
      email = email || p?.email; phone = phone || p?.phone;
      const { data: a } = await admin.from("lead_attribution").select("first_touch,last_touch").eq("user_id", it.user_id).order("last_visit_at", { ascending: false }).limit(1).maybeSingle();
      fbc = a?.last_touch?.fbc || a?.first_touch?.fbc; fbp = a?.last_touch?.fbp || a?.first_touch?.fbp;
      if (!fbc || !fbp) {
        const { data: ev } = await admin.from("analytics_events").select("fbc,fbp").eq("user_id", it.user_id).or("fbc.not.is.null,fbp.not.is.null").order("created_at", { ascending: false }).limit(1).maybeSingle();
        fbc = fbc || ev?.fbc || undefined; fbp = fbp || ev?.fbp || undefined;
      }
    }
    // Hazır (hash'lenmiş) yük varsa onu kullan — tarayıcıdan gelip başarısız olan Lead/CompleteRegistration tekrarları
    let event = it.payload?.prebuilt;
    if (!event) {
      const em = String(email || "").trim().toLowerCase(), ph = normPhone(phone);
      const parts = String(fullName || "").trim().toLocaleLowerCase("tr").split(/\s+/).filter(Boolean);
      const fn = parts[0], ln = parts.length > 1 ? parts[parts.length - 1] : undefined;
      const ct = String(city || "").toLocaleLowerCase("tr").replace(/[^a-zçğıöşü]/g, "");
      const user_data: Record<string, unknown> = {
        em: em ? [await sha256(em)] : undefined, ph: ph ? [await sha256(ph)] : undefined,
        fn: fn ? [await sha256(fn)] : undefined, ln: ln ? [await sha256(ln)] : undefined, ct: ct ? [await sha256(ct)] : undefined,
        country: [await sha256("tr")], external_id: it.user_id ? [await sha256(it.user_id)] : undefined,
        fbc, fbp, client_ip_address: ip,
      };
      Object.keys(user_data).forEach((k) => user_data[k] === undefined && delete user_data[k]);
      const t = it.payload?.event_time ? new Date(it.payload.event_time) : new Date(it.created_at);
      event = {
        event_name: it.event_name, event_id: it.event_id,
        event_time: Math.floor(Math.max(t.getTime(), Date.now() - 6 * 864e5) / 1000),
        action_source: "website", event_source_url: it.event_name === "Purchase" || it.event_name === "InitiateCheckout" ? "https://doktorumol.com.tr/checkout" : "https://doktorumol.com.tr/kayit-ol",
        user_data,
        ...(it.event_name === "Purchase" ? { custom_data: { currency: "TRY", value: Number(it.value), order_id: it.order_id } } : {}),
        ...(it.event_name === "QualifiedLead" ? { custom_data: { lead_score: it.payload?.score } } : {}),
      };
    }
    const res = await fetch(`https://graph.facebook.com/${V}/${DATASET_ID}/events?access_token=${token}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ data: [event] }),
    });
    const r = classifyCapiResponse(res.status, await res.text());
    const attempts = it.attempts + 1;
    const now = new Date().toISOString();
    const evidence = {
      meta_status: r.meta_status, http_status: r.http_status, events_received: r.events_received,
      meta_messages: r.meta_messages, fbtrace_id: r.fbtrace_id, dataset_id: DATASET_ID,
      event_time: new Date(Number(event.event_time) * 1000).toISOString(), last_attempt_at: now, attempts,
    };
    if (r.meta_status !== "META_REJECTED") {
      sent++;
      await admin.from("meta_capi_events").update({ ...evidence, status: "sent", last_error: null, sent_at: now }).eq("id", it.id);
    } else {
      failed++;
      await admin.from("meta_capi_events").update({ ...evidence, status: attempts >= MAX_ATTEMPTS ? "failed" : "retrying", last_error: r.error }).eq("id", it.id);
    }
  }
  return { sent, failed };
}

// ---- AI analizi ----
// Karar backend'de deterministik hesaplanır (_shared/adDecision.ts); AI yalnız açıklama yazar.
const RecSchema = {
  type: "object", additionalProperties: false, required: ["explanations"],
  properties: { explanations: { type: "array", items: { type: "object", additionalProperties: false,
    required: ["entity_id", "explanation"],
    properties: { entity_id: { type: "string" }, explanation: { type: "string" } } } } },
};
const div = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 100) / 100 : null);
const pctOf = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 1000) / 10 : null);

async function analyze(admin: any, from: string, to: string, level: string) {
  const s = await getSettings(admin);
  const ds = { target_cac: Number(s.target_cac), min_leads_for_decision: Number(s.min_leads_for_decision), min_purchases_for_scale: Number(s.min_purchases_for_scale),
    min_spend_for_pause: Number(s.min_spend_for_pause), min_days_active: Number(s.min_days_active), min_roas_for_scale: Number(s.min_roas_for_scale ?? 1.5),
    min_roas_for_keep: Number(s.min_roas_for_keep ?? 1), high_conf_min_paid: Number(s.high_conf_min_paid ?? 5), min_attribution_completeness: Number(s.min_attribution_completeness ?? 60) };
  let { data: perf, error } = await admin.rpc("get_ad_performance", { p_from: from, p_to: to, p_level: level, p_parent: null, p_model: "last" });
  if (error) throw new Error(error.message);
  // Ayrı projeye ait kampanyalar (Bihter) AI analizine girmez; veri silinmez
  const { data: other } = await admin.from("meta_daily_metrics").select("campaign_id").ilike("campaign_name", "%bihter%").limit(1000);
  const otherIds = new Set<string>((other || []).map((o: any) => String(o.campaign_id)));
  perf = (perf || []).filter((r: any) => !isOtherProjectRow(r, otherIds, level));
  if (!perf?.length) return { recommendations: [], note: "Bu dönemde gerçek Meta reklam verisi yok; öneri üretilmedi." };
  const [{ data: coverage, error: coverageError }, { data: compRows }] = await Promise.all([
    admin.rpc("get_ad_attribution_coverage", { p_from: from, p_to: to, p_level: level, p_parent: null }),
    admin.rpc("get_ad_attribution_completeness", { p_from: from, p_to: to }),
  ]);
  if (coverageError) throw new Error(coverageError.message);
  const comp: any = (compRows || [])[0] || {};
  const completeness = pctOf(Number(comp.attributed_leads || 0), Number(comp.eligible_leads || 0));
  const coverageById = new Map((coverage || []).map((r: any) => [r.entity_id, r]));
  const rows = perf.slice(0, 40).map((r: any) => {
    const c: any = coverageById.get(r.entity_id);
    const tracked = { attribution_started_at: c?.attribution_started_at, tracked_visits: Number(c?.tracked_visits || 0), tracked_spend: Number(c?.tracked_spend || 0), tracked_active_days: Number(c?.tracked_active_days || 0) };
    const input = { spend: Number(r.spend), leads: Number(r.leads), qualified: Number(r.qualified), registrations: Number(r.registrations), profiles: Number(r.profiles),
      checkouts: Number(r.checkouts), paid: Number(r.paid), net_revenue: Number(r.revenue), active_days: Number(r.active_days),
      tracked_visits: tracked.tracked_visits, tracked_spend: tracked.tracked_spend, has_tracked_sample: hasTrackedSample(tracked, s), attribution_completeness_pct: completeness };
    const d = decide(input, ds);
    return { entity_id: r.entity_id, name: r.entity_name, input, decision: d.decision, confidence: d.confidence, basis: d.basis, factors: d.factors, reason_line: reasonLine(input),
      metrics: { ...input, gross_revenue: Number(r.gross_revenue), refund_amount: Number(r.refund_amount), qualified_paid: Number(r.qualified_paid), visits: Number(r.visits),
        impressions: Number(r.impressions), clicks: Number(r.clicks), link_clicks: Number(r.link_clicks), ctr_pct: div(Number(r.clicks) * 100, Number(r.impressions)),
        cpl: div(input.spend, input.leads), cpql: div(input.spend, input.qualified), cac: div(input.spend, input.paid), net_roas: attributedRoas(input.net_revenue, input.spend, input.paid) } };
  });
  // AI açıklaması isteğe bağlı: hata olursa karar ve gerekçe satırı yine kaydedilir
  const explain = new Map<string, string>();
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (key) {
    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "fetch" },
        body: JSON.stringify({
          model: "openai/gpt-6-astra", stream: true, store: false, reasoning: { effort: "low" },
          instructions:
            "Sen Doktorumol.com.tr'nin Meta reklam analistisin. Her satırın kararı (decision) ve güveni (confidence) sistem tarafından hesaplandı; bunları DEĞİŞTİREMEZ, sorgulayamazsın. " +
            "Görevin yalnızca kararın nedenini sade Türkçe ile en fazla 2 cümlede açıklamak. Yalnız verilen sayıları kullan, yeni rakam üretme, hesap yapma; null değer 'N/A' demektir. " +
            "basis alanı kararın dayanağını belirtir (paid, qualified, registrations, insufficient). CTR/CPC'yi yalnız yardımcı bilgi olarak anabilirsin.",
          input: `Seviye: ${level}. Dönem: ${from} – ${to}. Eşikler: ${JSON.stringify(ds)}\nSatırlar: ${JSON.stringify(rows.map((r: any) => ({ entity_id: r.entity_id, name: r.name, decision: r.decision, confidence: r.confidence, basis: r.basis, reason_line: r.reason_line, factors: r.factors })))}`,
          text: { format: { type: "json_schema", name: "ad_explanations", strict: true, schema: RecSchema } },
        }),
      });
      if (res.ok && res.body) {
        const reader = res.body.getReader(); const dec = new TextDecoder();
        let buf = "", out = "";
        while (true) {
          const { done, value } = await reader.read(); if (done) break;
          buf += dec.decode(value, { stream: true });
          const lines = buf.split("\n"); buf = lines.pop() || "";
          for (const l of lines) {
            if (!l.startsWith("data:")) continue;
            const d = l.slice(5).trim(); if (!d || d === "[DONE]") continue;
            try { const ev = JSON.parse(d); if (ev.type === "response.output_text.delta") out += ev.delta || ""; } catch { /* */ }
          }
        }
        for (const e of (JSON.parse(out || '{"explanations":[]}').explanations || [])) explain.set(e.entity_id, String(e.explanation).slice(0, 600));
      } else console.error("AI açıklama hatası", res.status);
    } catch (e) { console.error("AI açıklama hatası", (e as Error).message); }
  }
  const recs = rows.map((m: any) => ({
    level, entity_id: m.entity_id, entity_name: m.name, campaign_id: level === "campaign" ? m.entity_id : null, campaign_name: level === "campaign" ? m.name : null,
    decision: m.decision, confidence: m.confidence, reason: explain.get(m.entity_id) || m.reason_line, decision_reason_metrics: m.reason_line,
    confidence_factors: { ...m.factors, basis: m.basis }, metrics: m.metrics, period_days: Math.max(1, Math.round((Date.parse(to) - Date.parse(from)) / 864e5) + 1) }));
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
    const b = parsed.data;
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const settings = await getSettings(admin);

    if (b.action === "status") {
      return json({ source: source(), ad_account_id: settings.ad_account_id ? `•••${String(settings.ad_account_id).slice(-4)}` : null,
        ad_account_name: settings.ad_account_name, last_sync_at: settings.last_sync_at, last_sync_status: settings.last_sync_status, last_error: settings.last_error });
    }
    if (b.action === "diag") {
      const fp = async (name: string) => {
        const raw = Deno.env.get(name); if (!raw) return { name, present: false };
        const c = clean(raw);
        const h = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(c)))).slice(0, 4).map((x) => x.toString(16).padStart(2, "0")).join("");
        return { name, present: true, length: c.length, raw_length: raw.length, starts_EAA: c.startsWith("EAA"), had_whitespace_or_quotes: raw !== c, sha_prefix: h };
      };
      const results: any[] = [];
      const acc = (Deno.env.get("META_AD_ACCOUNT_ID") || "").replace(/^act_/, "");
      for (const path of ["/me?fields=id,name", "/me/adaccounts?fields=id,name,account_status,currency", `/act_${acc}/insights?fields=spend,impressions,clicks,cpc,cpm,ctr&date_preset=last_7d`]) {
        const t = token() || "";
        const r = await fetch(`https://graph.facebook.com/${API_V()}${path}${path.includes("?") ? "&" : "?"}access_token=${encodeURIComponent(t)}`);
        results.push({ path, status: r.status, body: JSON.parse(await r.text()) });
      }
      return json({ api_version: API_V(), account_env: acc, settings_account: settings.ad_account_id, source: source(), tokens: [await fp("META_ACCESS_TOKEN"), await fp("META_ADS_ACCESS_TOKEN")], results });
    }
    if (b.action === "test") {
      const steps: { name: string; ok: boolean; detail?: string }[] = [];
      try {
        const me = await graph("/me?fields=id,name");
        steps.push({ name: "Meta bağlantısı", ok: true, detail: me?.name ? `Hesap: ${me.name}` : undefined });
        try {
          const perms = await graph("/me/permissions");
          const granted = (perms.data || []).filter((p: any) => p.status === "granted").map((p: any) => p.permission);
          steps.push({ name: "ads_read izni", ok: granted.includes("ads_read") || granted.includes("ads_management"), detail: granted.join(", ") || "izin listesi boş" });
        } catch (e) { steps.push({ name: "İzin listesi", ok: false, detail: (e as Error).message }); }
        if (!settings.ad_account_id) steps.push({ name: "Reklam hesabı seçimi", ok: false, detail: "Henüz reklam hesabı seçilmedi." });
        else {
          const acc = await graph(`/act_${settings.ad_account_id}?fields=name,account_status,currency`);
          steps.push({ name: "Reklam hesabına erişim", ok: true, detail: `${acc.name} (${acc.currency})` });
          const c = await graph(`/act_${settings.ad_account_id}/campaigns?fields=id,name&limit=1`);
          steps.push({ name: "Kampanya verileri okunabiliyor", ok: true, detail: `${(c.data || []).length ? "kampanya bulundu" : "hesapta kampanya yok"}` });
        }
        return json({ ok: steps.every((s) => s.ok), steps });
      } catch (e) {
        const info = e instanceof MetaError ? e.info : { http_status: 0, message: (e as Error).message };
        steps.push({ name: "Hata", ok: false, detail: info.message });
        return json({ ok: false, steps, error: info, diagnosis: diagnose(info as MetaErr), source: source() });
      }
    }
    if (b.action === "listAccounts") {
      try {
        const accs = await graphPaged("/me/adaccounts?fields=account_id,name,currency,account_status&limit=100", 3);
        return json({ accounts: accs.map((a: any) => ({ id: a.account_id, name: a.name, currency: a.currency, status: a.account_status })) });
      } catch (e) {
        const info = e instanceof MetaError ? e.info : { http_status: 0, message: (e as Error).message };
        return json({ accounts: [], error: info, diagnosis: diagnose(info as MetaErr) });
      }
    }
    if (b.action === "selectAccount") {
      if (!b.accountId) return json({ error: "accountId gerekli" }, 400);
      await admin.from("ad_intel_settings").update({ ad_account_id: b.accountId, ad_account_name: b.accountName ?? null, updated_at: new Date().toISOString() }).eq("id", 1);
      return json({ ok: true });
    }
    if (b.action === "sync") {
      const result: Record<string, unknown> = { source: source() };
      if (!settings.ad_account_id) { result.metricError = "Reklam hesabı seçilmedi."; }
      else {
        try {
          result.metricRows = await syncInsights(admin, settings.ad_account_id, b.days ?? 3);
          await admin.from("ad_intel_settings").update({ last_sync_at: new Date().toISOString(), last_sync_status: "ok", last_error: null, connection_source: source() }).eq("id", 1);
        } catch (e) {
          const info = e instanceof MetaError ? e.info : { http_status: 0, message: (e as Error).message };
          result.metricError = info.message; result.error = info; result.diagnosis = diagnose(info as MetaErr);
          await admin.from("ad_intel_settings").update({ last_sync_status: "error", last_error: `${diagnose(info as MetaErr)} (${info.message})`.slice(0, 500), connection_source: source() }).eq("id", 1);
        }
      }
      try { result.queued = await buildQueue(admin, settings); result.capi = await sendQueue(admin); }
      catch (e) { result.capiError = (e as Error).message; }
      return json(result);
    }
    const to = b.to ?? ymd(new Date());
    const from = b.from ?? ymd(new Date(Date.now() - ((b.days ?? 30) - 1) * 864e5));
    return json(await analyze(admin, from, to, b.level ?? "campaign"));
  } catch (e) {
    console.error(e);
    return json({ error: (e as Error).message }, 500);
  }
});
