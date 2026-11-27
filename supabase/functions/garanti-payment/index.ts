import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";
import { requestHash, toKurus, verifyResponseHash } from "../_shared/garantiHash.ts";
import { buildXml, historySales, summarize, type XmlReq } from "../_shared/garantiXml.ts";

const URL_ = Deno.env.get("SUPABASE_URL")!;
const db = createClient(URL_, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const SITE = "https://doktorumol.com.tr";
const FN = `${URL_}/functions/v1/garanti-payment`;
const CFG = { merchantId: "4071038", terminalId: "10558929", currency: "949", mode: "PROD", totalPayments: 12,
  oosEndpoint: "https://sanalposprov.garanti.com.tr/servlet/gt3dengine", xmlEndpoint: "https://sanalposprov.garanti.com.tr/VPServlet" };
// Which prov user signs the OOS form is unconfirmed (doc sample: PROVAUT). The control payment lets the admin try either.
const OOS_USER = (Deno.env.get("GARANTI_OOS_USER") === "PROVOOS" ? "PROVOOS" : "PROVAUT") as "PROVAUT" | "PROVOOS";
const pw = (u: "PROVAUT" | "PROVOOS" | "PROVRFN") => Deno.env.get(u === "PROVAUT" ? "GARANTI_PROVISION_PASSWORD" : u === "PROVOOS" ? "GARANTI_OOS_PASSWORD" : "GARANTI_REFUND_PASSWORD") ?? "";
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
const now = () => new Date().toISOString();
const ymd = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, "");
const ipOf = (req: Request) => req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1";

async function isAdmin(req: Request) {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return null;
  const { data } = await db.auth.getUser(token);
  if (!data.user) return null;
  const { data: p } = await db.from("user_profiles").select("role,is_approved").eq("user_id", data.user.id).maybeSingle();
  return p?.role === "admin" && p.is_approved ? data.user.id : null;
}

async function oosForm(o: { orderId: string; amountTl: number; email: string; ip: string; recurring: boolean; provUser: "PROVAUT" | "PROVOOS" }) {
  const back = `${FN}?action=callback`, amt = toKurus(o.amountTl), type = "sales", installment = "";
  const hash = await requestHash({ terminalId: CFG.terminalId, orderId: o.orderId, amount: amt, currency: CFG.currency, successUrl: back, errorUrl: back,
    type, installment, storeKey: Deno.env.get("GARANTI_STORE_KEY") ?? "", password: pw(o.provUser) });
  const fields: Record<string, string> = { mode: CFG.mode, apiversion: "512", secure3dsecuritylevel: "3D_OOS_PAY", terminalprovuserid: o.provUser,
    terminaluserid: o.provUser, terminalmerchantid: CFG.merchantId, terminalid: CFG.terminalId, orderid: o.orderId, successurl: back, errorurl: back,
    customeremailaddress: o.email, customeripaddress: o.ip, companyname: "DOKTORUM OL", lang: "tr", txntimestamp: now().replace(/\.\d+Z$/, "Z"),
    refreshtime: "1", secure3dhash: hash, txnamount: amt, txntype: type, txncurrencycode: CFG.currency, txninstallmentcount: installment };
  if (o.recurring) Object.assign(fields, { recurringtype: "R", totalpaymentnum: String(CFG.totalPayments), frequencytype: "M", frequencyinterval: "1", startdate: ymd(new Date()) });
  return { action: CFG.oosEndpoint, fields };
}

async function xml(type: XmlReq["type"], orderId: string, amountKurus: string, ip: string) {
  const user = type === "refund" ? "PROVRFN" : "PROVAUT";
  const body = await buildXml({ mode: CFG.mode, provUser: user, password: pw(user), terminalId: CFG.terminalId, merchantId: CFG.merchantId, orderId,
    type, amount: amountKurus, currency: CFG.currency, ip, email: "info@doktorumol.com.tr" });
  const res = await fetch(CFG.xmlEndpoint, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: "data=" + encodeURIComponent(body),
    signal: AbortSignal.timeout(20000) });
  return await res.text();
}

async function start(orderId: string, req: Request, adminId: string | null) {
  const { data: s } = await db.from("garanti_settings").select("enabled").maybeSingle();
  if (!s?.enabled) return json({ error: "Garanti BBVA ödemesi henüz aktif değil" }, 403); // real 7.500 TL test stays locked until activation
  const { data: o } = await db.from("orders").select("id,status,amount,customer_name,customer_email,customer_phone,package_name").eq("id", orderId).maybeSingle();
  if (!o || o.status !== "pending") return json({ error: "Sipariş ödemeye uygun değil" }, 409);
  const amount = Number(o.amount);
  if (!(amount > 0)) return json({ error: "Tutar doğrulanamadı" }, 409);
  const { data: existing } = await db.from("garanti_subscriptions").select("status,bank_order_id").eq("order_id", o.id).maybeSingle();
  if (existing && existing.status !== "initializing") return json({ error: "Bu sipariş için ödeme zaten işlendi" }, 409);
  const bankOrderId = existing?.bank_order_id ?? ("GB" + o.id.replace(/-/g, "").slice(0, 22).toUpperCase());
  if (!existing) {
    const { error } = await db.from("garanti_subscriptions").insert({ order_id: o.id, bank_order_id: bankOrderId, customer_name: o.customer_name,
      customer_email: o.customer_email, customer_phone: o.customer_phone, package_name: o.package_name, monthly_amount: amount, total_payments: CFG.totalPayments });
    if (error) return json({ error: "Ödeme başlatılamadı" }, 500);
  }
  return json(await oosForm({ orderId: bankOrderId, amountTl: amount, email: o.customer_email ?? "", ip: ipOf(req), recurring: true, provUser: OOS_USER }));
}

async function callback(req: Request) {
  const go = (q: string, control = false) => Response.redirect(control ? `${SITE}/divan_paneli/garanti-odemeleri?kontrol=${q}` : `${SITE}/odeme-basarili?garanti=${q}`, 303);
  const form: Record<string, string> = {};
  try { (await req.formData()).forEach((v, k) => { form[k] = String(v); }); } catch { return go("hata"); }
  const oid = form["oid"] || form["orderid"] || "";
  const verified = await verifyResponseHash(form, Deno.env.get("GARANTI_STORE_KEY") ?? "");
  const fields = { hash_verified: verified, proc_return_code: form["procreturncode"] ?? null, md_status: form["mdstatus"] ?? null, auth_code: form["authcode"] ?? null, host_ref: form["hostrefnum"] ?? null };
  const errText = (ok: boolean) => ok ? null : (form["errmsg"] || form["mderrormessage"] || (!verified ? "Hash doğrulanamadı" : "Tutar uyuşmadı")).slice(0, 300);

  if (/^GC[0-9A-F]{22}$/.test(oid)) {
    const { data: c } = await db.from("garanti_control_payments").select("*").eq("bank_order_id", oid).maybeSingle();
    if (!c) return go("hata", true);
    const ok = verified && form["procreturncode"] === "00" && (!form["txnamount"] || form["txnamount"] === toKurus(Number(c.amount)));
    await db.from("garanti_control_payments").update({ ...fields, status: ok ? "paid" : "failed", error_message: errText(ok), updated_at: now() }).eq("id", c.id).eq("status", "initializing");
    return go(ok ? "ok" : "hata", true);
  }
  if (!/^GB[0-9A-F]{22}$/.test(oid)) return go("hata");
  const { data: s } = await db.from("garanti_subscriptions").select("*").eq("bank_order_id", oid).maybeSingle();
  if (!s) return go("hata");
  const ok = verified && form["procreturncode"] === "00" && (!form["txnamount"] || form["txnamount"] === toKurus(Number(s.monthly_amount)));
  await db.from("garanti_transactions").insert({ subscription_id: s.id, bank_order_id: oid, kind: "initial", amount: s.monthly_amount, success: ok, ...fields, error_message: errText(ok) });
  if (s.status !== "initializing") return go(s.status === "paid" ? "ok" : "hata");
  if (!ok) { await db.from("garanti_subscriptions").update({ last_error_code: fields.proc_return_code, last_error: errText(false), updated_at: now() }).eq("id", s.id); return go("hata"); }
  const next = new Date(); next.setMonth(next.getMonth() + 1);
  await db.from("garanti_subscriptions").update({ status: "paid", paid_count: 1, recurring_status: "requested", next_charge_at: next.toISOString().slice(0, 10),
    auth_code: fields.auth_code, host_ref: fields.host_ref, last_error: null, last_error_code: null, updated_at: now() }).eq("id", s.id).eq("status", "initializing");
  await db.from("orders").update({ payment_status: "paid", payment_transaction_id: oid }).eq("id", s.order_id);
  return go("ok");
}

/** Read-only: orderhistoryinq; records only bank-confirmed (ReturnCode 00, non-voided) sales. Never charges. */
async function reconcile(s: any, ip: string) {
  const raw = await xml("orderhistoryinq", s.bank_order_id, toKurus(Number(s.monthly_amount)), ip);
  const sales = historySales(raw).filter((t) => t.amount === toKurus(Number(s.monthly_amount)));
  for (const t of sales) {
    await db.from("garanti_transactions").upsert({ subscription_id: s.id, bank_order_id: s.bank_order_id, kind: "recurring", amount: s.monthly_amount, success: true,
      hash_verified: false, proc_return_code: "00", host_ref: t.retref, error_message: null }, { onConflict: "bank_order_id,kind,host_ref", ignoreDuplicates: true });
  }
  const paid = Math.min(sales.length, s.total_payments);
  const patch: Record<string, unknown> = { last_query: { at: now(), sales: sales.length, summary: summarize(raw) }, last_reconciled_at: now(), updated_at: now() };
  if (paid > s.paid_count) {
    const next = new Date(s.created_at); next.setMonth(next.getMonth() + paid);
    Object.assign(patch, { paid_count: paid, next_charge_at: paid >= s.total_payments ? null : next.toISOString().slice(0, 10), status: paid >= s.total_payments ? "completed" : s.status });
  }
  await db.from("garanti_subscriptions").update(patch).eq("id", s.id);
  return { sales: sales.length, paid: Math.max(paid, s.paid_count), summary: summarize(raw) };
}

const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("start"), orderId: z.string().uuid() }),
  z.object({ action: z.literal("settings"), enabled: z.boolean().optional(), package_providers: z.record(z.enum(["hoppa", "garanti", "bank_transfer"])).optional() }),
  z.object({ action: z.literal("start_control"), amount: z.number().min(1).max(10), provUser: z.enum(["PROVAUT", "PROVOOS"]), confirm: z.literal(true) }),
  z.object({ action: z.literal("query"), kind: z.enum(["subscription", "control"]), id: z.string().uuid() }),
  z.object({ action: z.literal("refund"), kind: z.enum(["subscription", "control"]), id: z.string().uuid(), amount: z.number().positive(), confirm: z.literal(true) }),
  z.object({ action: z.literal("recurring_cancel"), id: z.string().uuid(), stage: z.enum(["requested", "confirmed"]), note: z.string().min(3).max(300) }),
  z.object({ action: z.literal("reconcile_all") }),
]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (new URL(req.url).searchParams.get("action") === "callback") return callback(req);
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400);
  const b = parsed.data;
  if (b.action === "reconcile_all") {
    const cron = Deno.env.get("CRON_SECRET");
    if (!cron || req.headers.get("x-cron-secret") !== cron) return json({ error: "Yetkisiz" }, 403);
    const { data: subs } = await db.from("garanti_subscriptions").select("*").in("status", ["paid"]).limit(200);
    let n = 0;
    for (const s of subs ?? []) { try { await reconcile(s, "127.0.0.1"); n++; } catch { console.error("garanti reconcile failed", s.bank_order_id); } }
    return json({ reconciled: n });
  }
  const adminId = await isAdmin(req);
  if (b.action === "start") return start(b.orderId, req, adminId);
  if (!adminId) return json({ error: "Yetkisiz" }, 403);

  if (b.action === "settings") {
    const patch: Record<string, unknown> = { updated_at: now(), updated_by: adminId };
    if (b.enabled !== undefined) patch.enabled = b.enabled;
    if (b.package_providers) patch.package_providers = b.package_providers;
    const { error } = await db.from("garanti_settings").update(patch).eq("id", true);
    return error ? json({ error: "Kaydedilemedi" }, 500) : json({ ok: true });
  }
  if (b.action === "start_control") {
    const bankOrderId = "GC" + crypto.randomUUID().replace(/-/g, "").slice(0, 22).toUpperCase();
    const { error } = await db.from("garanti_control_payments").insert({ bank_order_id: bankOrderId, amount: b.amount, prov_user: b.provUser, started_by: adminId });
    if (error) return json({ error: "Kontrol ödemesi oluşturulamadı" }, 500);
    return json(await oosForm({ orderId: bankOrderId, amountTl: b.amount, email: "info@doktorumol.com.tr", ip: ipOf(req), recurring: false, provUser: b.provUser }));
  }
  const table = b.action === "recurring_cancel" || b.kind === "subscription" ? "garanti_subscriptions" : "garanti_control_payments";
  const { data: row } = await db.from(table).select("*").eq("id", b.id).maybeSingle();
  if (!row) return json({ error: "Kayıt bulunamadı" }, 404);

  if (b.action === "query") {
    try {
      if (table === "garanti_subscriptions") return json({ result: "ok", ...(await reconcile(row, ipOf(req))) });
      const raw = await xml("orderinq", row.bank_order_id, toKurus(Number(row.amount)), ipOf(req));
      const summary = summarize(raw);
      await db.from(table).update({ last_query: { at: now(), summary }, updated_at: now() }).eq("id", row.id);
      return json({ result: "ok", summary });
    } catch { return json({ error: "Bankaya ulaşılamadı", result: "unavailable" }, 502); }
  }
  if (b.action === "refund") {
    const paidTotal = table === "garanti_subscriptions" ? Number(row.monthly_amount) : Number(row.amount);
    if (!["paid", "completed"].includes(row.status)) return json({ error: "Yalnız ödenmiş işlemler iade edilebilir" }, 409);
    if (b.amount + Number(row.refunded_amount) > paidTotal + 1e-9) return json({ error: "İade tutarı ödenen tutarı aşamaz" }, 409);
    let raw: string;
    try { raw = await xml("refund", row.bank_order_id, toKurus(b.amount), ipOf(req)); } catch { return json({ error: "Banka yanıtı alınamadı; iadeyi tekrar denemeden önce Sorgula ile kontrol edin.", result: "unknown" }, 502); }
    const summary = summarize(raw);
    const ok = summary.returnCode === "00";
    if (ok) await db.from(table).update({ refunded_amount: Number(row.refunded_amount) + b.amount, updated_at: now() }).eq("id", row.id);
    if (table === "garanti_subscriptions") await db.from("garanti_transactions").insert({ subscription_id: row.id, bank_order_id: row.bank_order_id, kind: "refund", amount: b.amount, success: ok,
      proc_return_code: summary.returnCode, host_ref: summary.retref, error_message: ok ? null : (summary.errorMsg || summary.sysErr || "İade reddedildi").slice(0, 300) });
    return json(ok ? { result: "ok", summary } : { error: summary.errorMsg || summary.sysErr || "İade reddedildi", code: summary.returnCode }, ok ? 200 : 409);
  }
  // No documented API stops a recurring instruction: admin cancels in the bank panel, then confirms here.
  const patch = b.stage === "requested"
    ? { recurring_status: "cancel_pending_bank", recurring_cancel_note: b.note, updated_at: now() }
    : { recurring_status: "cancelled_confirmed", status: "cancelled", next_charge_at: null, recurring_cancel_note: b.note, updated_at: now() };
  await db.from("garanti_subscriptions").update(patch).eq("id", row.id);
  return json({ result: "ok" });
});
