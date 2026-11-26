import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { buildCommonPayment, buildSavedCardCharge, hoppa, isPaid, orderRef, pickUsableCard, type HoppaMerchant, type HoppaCustomer } from "../_shared/hoppaClient.ts";
import { addMonth, chargeKey, nextRetry, paymentUrl, providerFailure, requireCardList } from "./logic.ts";

const URL_ = Deno.env.get("SUPABASE_URL")!;
const db = createClient(URL_, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const SITE = "https://doktorumol.com.tr";
const FN = `${URL_}/functions/v1/hoppa-subscription`;
const merchant = (): HoppaMerchant => ({
  merchant: Deno.env.get("HOPPA_MERCHANT_ID") ?? "", merchantKey: Deno.env.get("HOPPA_MERCHANT_KEY") ?? "",
  env: Deno.env.get("HOPPA_ENV") === "test" ? "test" : "prod",
});
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
const UUID = /^[0-9a-f-]{36}$/i;

function customerOf(s: { customer_name: string; customer_email: string; customer_phone: string }): HoppaCustomer {
  const [first, ...rest] = s.customer_name.trim().split(/\s+/);
  return { firstName: first || "-", lastName: rest.join(" ") || "-", mail: s.customer_email, phone: s.customer_phone };
}

const saveLink = (token: string) => `${SITE}/kart-kaydet?t=${token}`;
async function sms(phone: string, message: string) {
  try {
    const { error } = await db.functions.invoke("send-sms-via-static-proxy", { body: { phone, message } });
    if (error) console.error("hoppa sms failed");
    return !error;
  } catch { console.error("hoppa sms failed"); return false; }
}
async function notifyCardMissing(s: any) {
  if (!s.card_save_token) return;
  const ok = await sms(s.customer_phone, `Doktorum Ol: Ödemeniz alındı ancak kartınız kaydedilmedi. Aboneliğinizin her ay otomatik devam etmesi için kartınızı kaydedin: ${saveLink(s.card_save_token)}`);
  if (ok) await db.from("hoppa_subscriptions").update({ card_missing_notified_at: new Date().toISOString() }).eq("id", s.id);
}
async function copyPaidOrder(s: any, ref: string, period: number) {
  const { data: first } = await db.from("orders").select("*").eq("id", s.order_id).maybeSingle();
  if (!first) return null;
  const { id: _i, created_at: _c, updated_at: _u, package_features: _p, invoice_number: _n, invoice_sent: _s, approved_by: _b, ...copy } = first as any;
  const newId = crypto.randomUUID();
  await db.from("orders").insert({ ...copy, id: newId, status: "approved", payment_status: "paid", approved_at: new Date().toISOString(), payment_transaction_id: ref,
    is_first_order: false, subscription_month: period, amount: s.monthly_amount });
  return newId;
}

async function start(orderId: string) {
  if (!UUID.test(orderId)) return json({ error: "Geçersiz sipariş" }, 400);
  const { data: o } = await db.from("orders").select("id,status,payment_method,amount,customer_name,customer_email,customer_phone,customer_city,customer_address,package_name,package_type,created_at").eq("id", orderId).maybeSingle();
  if (!o || o.status !== "pending" || o.payment_method !== "credit_card") return json({ error: "Sipariş ödemeye uygun değil" }, 409);
  if (Date.now() - new Date(o.created_at).getTime() > 3600_000) return json({ error: "Sipariş süresi doldu, yeniden oluşturun" }, 409);
  const amount = Number(o.amount);
  if (!(amount > 0)) return json({ error: "Tutar doğrulanamadı" }, 409);
  const ref = orderRef("DO", o.id);
  const { data: existing } = await db.from("hoppa_subscriptions").select("status").eq("order_id", o.id).maybeSingle();
  if (existing && existing.status !== "initializing") return json({ error: "Bu sipariş için ödeme zaten işlendi" }, 409);
  if (!existing) {
    const { error } = await db.from("hoppa_subscriptions").insert({ order_id: o.id, order_ref: ref, customer_name: o.customer_name, customer_email: o.customer_email,
      customer_phone: o.customer_phone, package_name: o.package_name, package_type: o.package_type, monthly_amount: amount });
    if (error) return json({ error: "Ödeme başlatılamadı" }, 500);
  }
  const c = { ...customerOf(o), city: o.customer_city ?? undefined, address: o.customer_address ?? undefined };
  const res = await hoppa.startCommonPayment(merchant(), buildCommonPayment(merchant(), ref, amount, `${FN}?action=callback&ref=${ref}`, c, `${o.package_name} - 1. ay`));
  const url = paymentUrl(res);
  if (!url) { const failure = providerFailure(res); console.error("hoppa start", failure.code); return json(failure, 502); }
  return json({ url });
}

async function callback(ref: string) {
  let s: any = null;
  const go = (q: string) => Response.redirect(`${SITE}/odeme-basarili?kart=${q}${q === "kart-yok" && s?.card_save_token ? `&t=${s.card_save_token}` : ""}`, 303);
  if (!/^DO[0-9a-f]{22}$/i.test(ref)) return go("hata");
  ({ data: s } = await db.from("hoppa_subscriptions").select("*").eq("order_ref", ref).maybeSingle());
  if (!s) return go("hata");
  if (s.status !== "initializing") return go(s.status === "needs_review" ? "kart-kontrol" : s.status === "card_missing" ? "kart-yok" : "ok");
  const q = await hoppa.processQuery(merchant(), ref).catch(() => null);
  if (!isPaid(q)) { await db.from("hoppa_subscriptions").update({ last_error: providerFailure(q).error }).eq("id", s.id).eq("status", "initializing"); return go("hata"); }
  let card: ReturnType<typeof pickUsableCard> = null;
  let cardLookupFailed = false;
  try {
    const listed = await hoppa.listCardsByGsm(merchant(), s.customer_phone);
    logCardShape("callback", listed);
    requireCardList(listed);
    card = pickUsableCard(listed.CARDS);
  } catch { cardLookupFailed = true; }
  const now = new Date();
  const { data: claimed } = await db.from("hoppa_subscriptions").update({
    status: cardLookupFailed ? "needs_review" : card ? "active" : "card_missing", card_unique_key: card?.UNIQUE_KEY ?? null, card_masked: card?.CARD_MASKED_NUMBER ?? null,
    paid_months: 1, next_charge_at: addMonth(now).toISOString(), last_error: cardLookupFailed ? providerFailure(null).error : null,
  }).eq("id", s.id).eq("status", "initializing").select("id");
  if (claimed?.length) {
    await db.from("orders").update({ status: "approved", payment_status: "paid", approved_at: now.toISOString(), payment_transaction_id: ref }).eq("id", s.order_id).eq("status", "pending");
    if (!cardLookupFailed && !card) await notifyCardMissing(s);
  }
  return go(cardLookupFailed ? "kart-kontrol" : card ? "ok" : "kart-yok");
}

async function chargeOne(s: any) {
  // A failed lookup is not proof that no card exists. Do not consume an
  // attempt or initiate a charge until the provider has returned a card list.
  let listed: ReturnType<typeof pickUsableCard>;
  try {
    const response = await hoppa.listCardsByGsm(merchant(), s.customer_phone);
    requireCardList(response);
    listed = pickUsableCard(response.CARDS);
  } catch { return "unavailable"; }
  const period = s.paid_months + 1;
  const key = chargeKey(s.id, period, s.failed_attempts);
  const ref = orderRef("DR", crypto.randomUUID());
  const { error: dup } = await db.from("hoppa_charges").insert({ subscription_id: s.id, charge_key: key, order_ref: ref, period, amount: s.monthly_amount });
  if (dup) return "skipped";
  let card = s.card_unique_key;
  if (listed) card = listed.UNIQUE_KEY;
  let r: any = null, unknown = false;
  if (card) {
    try { r = await hoppa.chargeSavedCard(merchant(), buildSavedCardCharge(merchant(), ref, Number(s.monthly_amount), card, `${SITE}/`, customerOf(s))); }
    catch { unknown = true; }
  }
  if (unknown) { // Result unknown: never retry blindly, admin checks it.
    await db.from("hoppa_charges").update({ status: "unknown", error: "Hoppa yanıt vermedi" }).eq("charge_key", key);
    await db.from("hoppa_subscriptions").update({ status: "needs_review", last_error: "Çekim sonucu bilinmiyor" }).eq("id", s.id);
    return "unknown";
  }
  const now = new Date();
  if (isPaid(r)) {
    const newId = await copyPaidOrder(s, ref, period);
    await db.from("hoppa_charges").update({ status: "paid", created_order_id: newId }).eq("charge_key", key);
    await db.from("hoppa_subscriptions").update({ status: "active", paid_months: period, failed_attempts: 0, card_unique_key: card,
      next_charge_at: addMonth(new Date(s.next_charge_at)).toISOString(), last_error: null }).eq("id", s.id);
    return "paid";
  }
  const failed = s.failed_attempts + 1, retry = nextRetry(failed, now);
  const msg = card ? providerFailure(r).error : "Kayıtlı kart bulunamadı";
  await db.from("hoppa_charges").update({ status: "failed", error: msg }).eq("charge_key", key);
  await db.from("hoppa_subscriptions").update({ failed_attempts: failed, last_error: msg,
    status: retry ? "retrying" : "failed", next_charge_at: retry ? retry.toISOString() : s.next_charge_at }).eq("id", s.id);
  return "failed";
}

// "Kartımı kaydet": the customer pays the next month early on Hoppa's own page
// (ticking "save card"); that month is then not charged again.
const SAVABLE = ["card_missing", "retrying", "failed"];
async function saveInfo(token: string) {
  if (!/^[0-9a-f]{36}$/.test(token)) return json({ error: "Geçersiz bağlantı" }, 400);
  const { data: s } = await db.from("hoppa_subscriptions").select("status,package_name,monthly_amount,card_unique_key").eq("card_save_token", token).maybeSingle();
  if (!s) return json({ error: "Bağlantı bulunamadı" }, 404);
  return json({ saved: !!s.card_unique_key && s.status === "active", canSave: SAVABLE.includes(s.status), package: s.package_name, amount: Number(s.monthly_amount) });
}
async function saveStart(token: string) {
  if (!/^[0-9a-f]{36}$/.test(token)) return json({ error: "Geçersiz bağlantı" }, 400);
  const { data: s } = await db.from("hoppa_subscriptions").select("*").eq("card_save_token", token).maybeSingle();
  if (!s || !SAVABLE.includes(s.status)) return json({ error: "Bu abonelik için kart kaydı gerekmiyor" }, 409);
  const ref = orderRef("DS", crypto.randomUUID());
  await db.from("hoppa_subscriptions").update({ card_save_ref: ref }).eq("id", s.id);
  const c = customerOf(s);
  const res = await hoppa.startCommonPayment(merchant(), buildCommonPayment(merchant(), ref, Number(s.monthly_amount), `${FN}?action=savecallback&ref=${ref}`, c, `${s.package_name} - ${s.paid_months + 1}. ay`));
  const url = paymentUrl(res);
  if (!url) { const failure = providerFailure(res); console.error("hoppa savestart", failure.code); return json(failure, 502); }
  return json({ url });
}
async function saveCallback(ref: string) {
  if (!/^DS[0-9a-f]{22}$/i.test(ref)) return Response.redirect(`${SITE}/kart-kaydet?sonuc=hata`, 303);
  const { data: s } = await db.from("hoppa_subscriptions").select("*").eq("card_save_ref", ref).maybeSingle();
  if (!s) return Response.redirect(`${SITE}/kart-kaydet?sonuc=hata`, 303);
  const go = (r: string) => Response.redirect(`${SITE}/kart-kaydet?t=${s.card_save_token}&sonuc=${r}`, 303);
  const q = await hoppa.processQuery(merchant(), ref).catch(() => null);
  if (!isPaid(q)) return go("hata");
  const period = s.paid_months + 1;
  const { error: dup } = await db.from("hoppa_charges").insert({ subscription_id: s.id, charge_key: `save:${ref}`, order_ref: ref, period, amount: s.monthly_amount });
  if (dup) return go(s.card_unique_key ? "ok" : "yok");
  let card: ReturnType<typeof pickUsableCard> = null;
  try { const listed = await hoppa.listCardsByGsm(merchant(), s.customer_phone); requireCardList(listed); card = pickUsableCard(listed.CARDS); } catch { /* keep card_missing */ }
  const newId = await copyPaidOrder(s, ref, period);
  await db.from("hoppa_charges").update({ status: "paid", created_order_id: newId }).eq("charge_key", `save:${ref}`);
  const base = s.next_charge_at ? new Date(s.next_charge_at) : new Date();
  await db.from("hoppa_subscriptions").update({ status: card ? "active" : "card_missing", paid_months: period, failed_attempts: 0, last_error: null,
    card_unique_key: card?.UNIQUE_KEY ?? s.card_unique_key, card_masked: card?.CARD_MASKED_NUMBER ?? s.card_masked,
    next_charge_at: addMonth(base).toISOString(), card_save_ref: null }).eq("id", s.id);
  return go(card ? "ok" : "yok");
}

async function remindCardMissing() {
  const soon = new Date(Date.now() + 3 * 86400_000).toISOString();
  const { data } = await db.from("hoppa_subscriptions").select("*").eq("status", "card_missing").gt("next_charge_at", new Date().toISOString()).lte("next_charge_at", soon).limit(200);
  let sent = 0;
  for (const s of data ?? []) {
    if (s.card_reminder_for === s.next_charge_at) continue;
    try {
      const listed = await hoppa.listCardsByGsm(merchant(), s.customer_phone); requireCardList(listed);
      const card = pickUsableCard(listed.CARDS);
      if (card) { await db.from("hoppa_subscriptions").update({ status: "active", card_unique_key: card.UNIQUE_KEY, card_masked: card.CARD_MASKED_NUMBER }).eq("id", s.id); continue; }
    } catch { continue; }
    const day = new Date(s.next_charge_at).toLocaleDateString("tr-TR", { timeZone: "Europe/Istanbul" });
    if (await sms(s.customer_phone, `Doktorum Ol: ${day} tarihli abonelik ödemeniz için kayıtlı kartınız bulunmuyor. Aboneliğinizin kesintisiz devam etmesi için kartınızı kaydedin: ${saveLink(s.card_save_token)}`)) {
      await db.from("hoppa_subscriptions").update({ card_reminder_for: s.next_charge_at }).eq("id", s.id); sent++;
    }
  }
  return sent;
}

async function recurring() {
  const reminders = await remindCardMissing().catch(() => 0);
  const { data } = await db.from("hoppa_subscriptions").select("*").in("status", ["active", "retrying", "card_missing"]).lte("next_charge_at", new Date().toISOString()).limit(200);
  const out: Record<string, number> = {};
  for (const s of data ?? []) { const r = await chargeOne(s); out[r] = (out[r] ?? 0) + 1; }
  return json({ processed: data?.length ?? 0, reminders, ...out });
}

function logCardShape(where: string, r: any) {
  // Shape only: never log card numbers, keys or phones.
  console.log("hoppa cards", where, JSON.stringify({ keys: r && typeof r === "object" ? Object.keys(r) : typeof r,
    code: r?.RETURN_CODE, status: r?.STATUS, msg: typeof r?.RETURN_MESSAGE === "string" ? r.RETURN_MESSAGE.slice(0, 120) : undefined,
    cards: Array.isArray(r?.CARDS) ? r.CARDS.length : r?.CARDS === null ? "null" : typeof r?.CARDS }));
}

async function recheck(id: string) {
  const { data: s } = await db.from("hoppa_subscriptions").select("*").eq("id", id).maybeSingle();
  if (!s || s.status !== "needs_review") return json({ error: "Kontrol gerekmiyor" }, 409);
  const listed = await hoppa.listCardsByGsm(merchant(), s.customer_phone).catch(() => null);
  logCardShape("recheck", listed);
  if (!Array.isArray(listed?.CARDS)) return json({ result: "unknown" });
  const card = pickUsableCard(listed.CARDS);
  await db.from("hoppa_subscriptions").update({ status: card ? "active" : "card_missing", card_unique_key: card?.UNIQUE_KEY ?? null,
    card_masked: card?.CARD_MASKED_NUMBER ?? null, last_error: null }).eq("id", s.id).eq("status", "needs_review");
  if (!card) await notifyCardMissing(s);
  return json({ result: card ? "active" : "card_missing" });
}

async function isAdmin(req: Request) {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return false;
  const { data } = await db.auth.getUser(token);
  if (!data.user) return false;
  const { data: p } = await db.from("user_profiles").select("role,is_approved").eq("user_id", data.user.id).maybeSingle();
  return p?.role === "admin" && p.is_approved === true;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const u = new URL(req.url);
  try {
    if (u.searchParams.get("action") === "callback") return await callback(u.searchParams.get("ref") ?? "");
    if (u.searchParams.get("action") === "savecallback") return await saveCallback(u.searchParams.get("ref") ?? "");
    const body = await req.json().catch(() => ({}));
    if (body.action === "start") return await start(String(body.orderId ?? ""));
    if (body.action === "recurring") return await recurring();
    if (body.action === "saveinfo") return await saveInfo(String(body.token ?? ""));
    if (body.action === "savestart") return await saveStart(String(body.token ?? ""));
    if (body.action === "recheck") {
      if (!(await isAdmin(req))) return json({ error: "Yetkisiz" }, 403);
      if (!UUID.test(String(body.id))) return json({ error: "Geçersiz" }, 400);
      return await recheck(String(body.id));
    }
    if (body.action === "retry" || body.action === "cancel") {
      if (!(await isAdmin(req))) return json({ error: "Yetkisiz" }, 403);
      if (!UUID.test(String(body.id))) return json({ error: "Geçersiz" }, 400);
      if (body.action === "cancel") {
        await db.from("hoppa_subscriptions").update({ status: "cancelled", cancelled_at: new Date().toISOString() }).eq("id", body.id);
        return json({ ok: true });
      }
      const { data: s } = await db.from("hoppa_subscriptions").select("*").eq("id", body.id).maybeSingle();
      if (!s || !["failed", "retrying", "card_missing"].includes(s.status)) return json({ error: "Tekrar denenemez" }, 409);
      return json({ result: await chargeOne(s) });
    }
    return json({ error: "Geçersiz istek" }, 400);
  } catch { console.error("hoppa provider_unavailable"); return json(providerFailure(null), 500); }
});
