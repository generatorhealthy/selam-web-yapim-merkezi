import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";
import { requestHash, toKurus, verifyResponseHash } from "../_shared/garantiHash.ts";

const URL_ = Deno.env.get("SUPABASE_URL")!;
const db = createClient(URL_, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const SITE = "https://doktorumol.com.tr";
const FN = `${URL_}/functions/v1/garanti-payment`;
const CFG = { merchantId: "4071038", terminalId: "10558929", provUser: "PROVOOS", currency: "949", mode: "PROD",
  endpoint: "https://sanalposprov.garanti.com.tr/servlet/gt3dengine", totalPayments: 12 };
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

async function isAdmin(req: Request) {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return null;
  const { data } = await db.auth.getUser(token);
  if (!data.user) return null;
  const { data: p } = await db.from("user_profiles").select("role,is_approved").eq("user_id", data.user.id).maybeSingle();
  return p?.role === "admin" && p.is_approved ? data.user.id : null;
}

const ymd = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, "");

async function start(orderId: string, req: Request, adminId: string | null) {
  const { data: s } = await db.from("garanti_settings").select("enabled").maybeSingle();
  const isTest = !s?.enabled;
  if (isTest && !adminId) return json({ error: "Garanti BBVA ödemesi henüz aktif değil" }, 403);
  const { data: o } = await db.from("orders").select("id,status,amount,customer_name,customer_email,customer_phone,package_name").eq("id", orderId).maybeSingle();
  if (!o || o.status !== "pending") return json({ error: "Sipariş ödemeye uygun değil" }, 409);
  const amount = Number(o.amount);
  if (!(amount > 0)) return json({ error: "Tutar doğrulanamadı" }, 409);
  const { data: existing } = await db.from("garanti_subscriptions").select("status,bank_order_id").eq("order_id", o.id).maybeSingle();
  if (existing && existing.status !== "initializing") return json({ error: "Bu sipariş için ödeme zaten işlendi" }, 409);
  const bankOrderId = existing?.bank_order_id ?? ("GB" + o.id.replace(/-/g, "").slice(0, 22).toUpperCase());
  if (!existing) {
    const { error } = await db.from("garanti_subscriptions").insert({ order_id: o.id, bank_order_id: bankOrderId, customer_name: o.customer_name,
      customer_email: o.customer_email, customer_phone: o.customer_phone, package_name: o.package_name, monthly_amount: amount,
      total_payments: CFG.totalPayments, is_test: isTest });
    if (error) return json({ error: "Ödeme başlatılamadı" }, 500);
  }
  const back = `${FN}?action=callback`;
  const amt = toKurus(amount);
  const type = "sales", installment = "";
  const hash = await requestHash({ terminalId: CFG.terminalId, orderId: bankOrderId, amount: amt, currency: CFG.currency, successUrl: back, errorUrl: back,
    type, installment, storeKey: Deno.env.get("GARANTI_STORE_KEY") ?? "", password: Deno.env.get("GARANTI_OOS_PASSWORD") ?? "" });
  const fields: Record<string, string> = {
    mode: CFG.mode, apiversion: "512", secure3dsecuritylevel: "3D_OOS_PAY", terminalprovuserid: CFG.provUser, terminaluserid: CFG.provUser,
    terminalmerchantid: CFG.merchantId, terminalid: CFG.terminalId, orderid: bankOrderId, successurl: back, errorurl: back,
    customeremailaddress: o.customer_email ?? "", customeripaddress: req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "",
    companyname: "DOKTORUM OL", lang: "tr", txntimestamp: new Date().toISOString().replace(/\.\d+Z$/, "Z"), refreshtime: "1",
    secure3dhash: hash, txnamount: amt, txntype: type, txncurrencycode: CFG.currency, txninstallmentcount: installment,
    recurringtype: "R", totalpaymentnum: String(CFG.totalPayments), frequencytype: "M", frequencyinterval: "1", startdate: ymd(new Date()),
  };
  return json({ action: CFG.endpoint, fields, test: isTest });
}

async function callback(req: Request) {
  const go = (q: string) => Response.redirect(`${SITE}/odeme-basarili?garanti=${q}`, 303);
  const form: Record<string, string> = {};
  try { (await req.formData()).forEach((v, k) => { form[k] = String(v); }); } catch { return go("hata"); }
  const oid = form["oid"] || form["orderid"];
  if (!/^GB[0-9A-F]{22}$/.test(oid ?? "")) return go("hata");
  const { data: s } = await db.from("garanti_subscriptions").select("*").eq("bank_order_id", oid).maybeSingle();
  if (!s) return go("hata");
  const verified = await verifyResponseHash(form, Deno.env.get("GARANTI_STORE_KEY") ?? "");
  const amountOk = !form["txnamount"] || form["txnamount"] === toKurus(Number(s.monthly_amount));
  const ok = verified && amountOk && form["procreturncode"] === "00";
  await db.from("garanti_transactions").insert({ subscription_id: s.id, bank_order_id: oid, kind: "initial", amount: s.monthly_amount, success: ok,
    hash_verified: verified, proc_return_code: form["procreturncode"] ?? null, md_status: form["mdstatus"] ?? null, auth_code: form["authcode"] ?? null,
    host_ref: form["hostrefnum"] ?? null, error_message: ok ? null : (form["errmsg"] || form["mderrormessage"] || (!verified ? "Hash doğrulanamadı" : "Tutar uyuşmadı")).slice(0, 300) });
  if (s.status !== "initializing") return go(s.status === "paid" ? "ok" : "hata");
  if (!ok) {
    await db.from("garanti_subscriptions").update({ last_error_code: form["procreturncode"] ?? null, last_error: (form["errmsg"] || form["mderrormessage"] || "").slice(0, 300), updated_at: new Date().toISOString() }).eq("id", s.id);
    return go("hata");
  }
  const next = new Date(); next.setMonth(next.getMonth() + 1);
  // Single-flight: only the first verified callback moves initializing -> paid (no double booking).
  await db.from("garanti_subscriptions").update({ status: "paid", paid_count: 1, recurring_status: "requested", next_charge_at: next.toISOString().slice(0, 10),
    auth_code: form["authcode"] ?? null, host_ref: form["hostrefnum"] ?? null, last_error: null, last_error_code: null, updated_at: new Date().toISOString() })
    .eq("id", s.id).eq("status", "initializing");
  if (!s.is_test) await db.from("orders").update({ payment_status: "paid", payment_transaction_id: oid }).eq("id", s.order_id);
  return go("ok");
}

const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("start"), orderId: z.string().uuid() }),
  z.object({ action: z.literal("settings"), enabled: z.boolean().optional(), package_providers: z.record(z.enum(["hoppa", "garanti", "bank_transfer"])).optional() }),
  z.object({ action: z.enum(["query", "refund", "cancel_recurring"]), id: z.string().uuid() }),
]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (new URL(req.url).searchParams.get("action") === "callback") return callback(req);
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400);
  const b = parsed.data;
  const adminId = await isAdmin(req);
  if (b.action === "start") return start(b.orderId, req, adminId);
  if (!adminId) return json({ error: "Yetkisiz" }, 403);
  if (b.action === "settings") {
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString(), updated_by: adminId };
    if (b.enabled !== undefined) patch.enabled = b.enabled;
    if (b.package_providers) patch.package_providers = b.package_providers;
    const { error } = await db.from("garanti_settings").update(patch).eq("id", true);
    return error ? json({ error: "Kaydedilemedi" }, 500) : json({ ok: true });
  }
  // orderinq / refund / recurring cancel XML parameters are not yet verified with the bank: do not pretend.
  return json({ error: "Bu işlem banka teyidi bekliyor; henüz etkin değil.", result: "unavailable" }, 501);
});
