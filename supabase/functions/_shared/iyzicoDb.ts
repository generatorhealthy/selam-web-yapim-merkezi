// Supabase servis istemcisi üzerinden DbPort (iyzicoCheckout.ts) uygulaması.
import type { DbPort, OrderRow, SessionRow } from "./iyzicoCheckout.ts";
const ORDER_COLS = "id,status,deleted_at,amount,package_type,payment_method,is_first_order,customer_email,customer_name,package_name,created_at,subscription_reference_code";
const SESSION_COLS = "id,order_id,conversation_id,iyzico_token,plan_ref,expected_amount,currency,status,subscription_reference_code,created_at";
// deno-lint-ignore no-explicit-any
const like = (e: string) => e.trim().toLowerCase().replace(/[\\%_]/g, (c) => "\\" + c);
export function supabaseDbPort(admin: any): DbPort {
  const one = async (q: any) => { const { data, error } = await q.maybeSingle(); if (error) throw new Error(error.message); return data; };
  const many = async (q: any) => { const { data, error } = await q; if (error) throw new Error(error.message); return data ?? []; };
  return {
    readOrder: (id) => one(admin.from("orders").select(ORDER_COLS).eq("id", id)) as Promise<OrderRow | null>,
    readSessionByOrder: (id) => one(admin.from("payment_checkout_sessions").select(SESSION_COLS).eq("order_id", id)) as Promise<SessionRow | null>,
    readSessionByToken: (t) => one(admin.from("payment_checkout_sessions").select(SESSION_COLS).eq("iyzico_token", t)) as Promise<SessionRow | null>,
    readSessionBySubscription: (r) => one(admin.from("payment_checkout_sessions").select(SESSION_COLS).eq("subscription_reference_code", r)) as Promise<SessionRow | null>,
    insertSession: async (row) => {
      const { data, error } = await admin.from("payment_checkout_sessions").insert(row).select(SESSION_COLS).maybeSingle();
      if (error) { if (error.code === "23505") return null; throw new Error(error.message); }
      return data;
    },
    resetSession: async (id, conv) => {
      const { data, error } = await admin.from("payment_checkout_sessions").update({ conversation_id: conv, updated_at: new Date().toISOString(), expires_at: new Date(Date.now() + 30 * 60_000).toISOString() })
        .eq("id", id).eq("status", "initializing").is("iyzico_token", null).select("id");
      return !error && (data?.length ?? 0) === 1;
    },
    bindToken: async (id, token) => {
      const { data, error } = await admin.from("payment_checkout_sessions")
        .update({ iyzico_token: token, status: "initialized", initialized_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("id", id).is("iyzico_token", null).eq("status", "initializing").select("id");
      return !error && (data?.length ?? 0) === 1;
    },
    markSession: async (id, status, err) => {
      await admin.from("payment_checkout_sessions").update({ status, last_error: err, updated_at: new Date().toISOString() }).eq("id", id);
    },
    listOpenSessions: (since) => many(admin.from("payment_checkout_sessions").select(SESSION_COLS).eq("status", "initialized")
      .not("iyzico_token", "is", null).gte("created_at", since).limit(200)),
    settle: async (a) => {
      const { data, error } = await admin.rpc("settle_iyzico_payment", { p_order_id: a.orderId, p_payment_key: a.paymentKey,
        p_subscription_ref: a.subscriptionRef, p_customer_ref: a.customerRef, p_charge_ref: a.chargeRef, p_amount: a.amount,
        p_currency: a.currency, p_paid_at: a.paidAt, p_source: a.source, p_binding: a.binding, p_session_id: a.sessionId });
      if (error) throw new Error(error.message);
      return data;
    },
    findPendingBySubscription: (r) => many(admin.from("orders").select(ORDER_COLS).eq("subscription_reference_code", r)
      .eq("status", "pending").is("deleted_at", null).order("created_at", { ascending: false }).limit(5)),
    findPendingRenewalsByEmail: (e) => many(admin.from("orders").select(ORDER_COLS).ilike("customer_email", like(e))
      .eq("status", "pending").eq("is_first_order", false).is("deleted_at", null)
      .gte("created_at", new Date(Date.now() - 7 * 86400_000).toISOString()).order("created_at", { ascending: false }).limit(5)),
    automaticOrderSubscription: async (e) => {
      const rows = await many(admin.from("automatic_orders").select("subscription_reference_code").ilike("customer_email", like(e)).limit(2));
      if (rows.length !== 1) return { exists: false, subscriptionRef: null }; // birden çok/yok: belirsiz, onay yok
      return { exists: true, subscriptionRef: rows[0].subscription_reference_code ?? null };
    },
    hasApprovedOrder: async (e) => (await many(admin.from("orders").select("id").ilike("customer_email", like(e))
      .in("status", ["approved", "completed"]).is("deleted_at", null).limit(1))).length > 0,
  };
}
