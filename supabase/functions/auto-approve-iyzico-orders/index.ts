import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { verifyAdminOrCron } from "../_shared/adminAuth.ts";
import { iyzicoHttpPort, settleByToken, settleSubscriptionCharge } from "../_shared/iyzicoCheckout.ts";
import { supabaseDbPort } from "../_shared/iyzicoDb.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function generateIyzicoAuth(
  apiKey: string,
  secretKey: string,
  uriPath: string,
  requestBody: string = ""
): Promise<{ authorization: string; randomKey: string }> {
  const randomKey = Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const dataToEncrypt = randomKey + uriPath + requestBody;
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secretKey);
  const messageData = encoder.encode(dataToEncrypt);

  const cryptoKey = await crypto.subtle.importKey(
    "raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
  const signatureHex = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const authorizationString = `apiKey:${apiKey}&randomKey:${randomKey}&signature:${signatureHex}`;
  const base64EncodedAuthorization = btoa(authorizationString);

  return {
    authorization: `IYZWSv2 ${base64EncodedAuthorization}`,
    randomKey,
  };
}

async function getAllSubscriptions(
  apiKey: string,
  secretKey: string,
  baseUrl: string,
  status: string = "ACTIVE"
): Promise<any[]> {
  const uriPathForSign = "/v2/subscription/subscriptions";
  const allItems: any[] = [];
  let page = 1;
  const count = 100;

  while (true) {
    const requestUrl = `${baseUrl}${uriPathForSign}?subscriptionStatus=${status}&page=${page}&count=${count}`;
    const { authorization, randomKey } = await generateIyzicoAuth(apiKey, secretKey, uriPathForSign);

    const response = await fetch(requestUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: authorization,
        "x-iyzi-rnd": randomKey,
      },
    });

    const result = await response.json();

    if (result.status === "success" && result.data?.items) {
      allItems.push(...result.data.items);
      if (result.data.items.length < count) break;
      page++;
    } else {
      break;
    }
  }

  return allItems;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Enforced only when CRON_SECRET is configured (non-breaking rollout for the cron job).
  if (Deno.env.get('CRON_SECRET')) {
    const auth = await verifyAdminOrCron(req);
    if (!auth.ok) {
      return new Response(JSON.stringify({ error: auth.error }), {
        status: auth.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }



  try {
    console.log('Auto-approve from Iyzico started at:', new Date().toISOString());

    const IYZICO_API_KEY = Deno.env.get("IYZICO_API_KEY");
    const IYZICO_SECRET_KEY = Deno.env.get("IYZICO_SECRET_KEY");
    const IYZICO_BASE_URL = Deno.env.get("IYZIPAY_URI") || "https://api.iyzipay.com";

    if (!IYZICO_API_KEY || !IYZICO_SECRET_KEY) {
      throw new Error("iyzico API anahtarları bulunamadı");
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get subscriptions from Iyzico (ACTIVE + UNPAID)
    const [activeSubscriptions, unpaidSubscriptions] = await Promise.all([
      getAllSubscriptions(IYZICO_API_KEY, IYZICO_SECRET_KEY, IYZICO_BASE_URL, "ACTIVE"),
      getAllSubscriptions(IYZICO_API_KEY, IYZICO_SECRET_KEY, IYZICO_BASE_URL, "UNPAID"),
    ]);

    const allSubscriptions = [...activeSubscriptions, ...unpaidSubscriptions];
    console.log(`Found ${activeSubscriptions.length} active + ${unpaidSubscriptions.length} unpaid = ${allSubscriptions.length} total Iyzico subscriptions`);

    const db = supabaseDbPort(supabaseAdmin);
    const iyzico = iyzicoHttpPort(IYZICO_API_KEY, IYZICO_SECRET_KEY, IYZICO_BASE_URL);
    const counts: Record<string, number> = {};
    const bump = (k: string) => { counts[k] = (counts[k] ?? 0) + 1; };

    // A) Tarayıcı kapandıysa: sunucu oturumu olan ve token'ı bağlı siparişler kayıtlı token ile
    //    iyzico Checkout Form Retrieve üzerinden kesinleştirilir.
    const sessions = await db.listOpenSessions(new Date(Date.now() - 48 * 3600_000).toISOString());
    for (const s of sessions) {
      try { const r = await settleByToken(s.iyzico_token, "auto_approve_token", { db, iyzico }); bump(`token_${r.outcome}`); }
      catch (e) { bump("token_error"); console.error("token settle error", e instanceof Error ? e.message : e); }
    }

    // B) Abonelik tahsilatları: yalnız bu aboneliğe sunucuda bağlı (oturum / abonelik kodu / bağlı yenileme)
    //    bekleyen sipariş, iyzico'nun gerçekte çektiği tutarla ve tek kullanımlık makbuzla onaylanır.
    //    E-posta eşleşmesi tek başına onay sebebi değildir; ilk siparişler oturumsuz asla onaylanmaz.
    const successfulEmails = new Set<string>();
    const failedEmails = new Set<string>();
    for (const sub of allSubscriptions) {
      const email = String(sub.customerEmail || "").toLowerCase().trim();
      const ref = String(sub.referenceCode || "");
      const orders = Array.isArray(sub.orders) ? sub.orders : [];
      const recentSuccess = orders.some((o: any) => o.orderStatus === "SUCCESS" && (o.paymentAttempts || []).some((a: any) =>
        a.paymentStatus === "SUCCESS" && Date.now() - Number(a.createdDate) <= 48 * 3600_000));
      if (recentSuccess && ref) {
        if (email) successfulEmails.add(email);
        try {
          const r = await settleSubscriptionCharge({ status: "success", data: sub }, ref, "auto_approve_subscription", { db }, email || null);
          bump(`sub_${r.outcome}${r.reason ? `_${r.reason}` : ""}`);
        } catch (e) { bump("sub_error"); console.error("subscription settle error", e instanceof Error ? e.message : e); }
      }
      if (email && orders.some((o: any) => o.orderStatus !== "SUCCESS" && (o.paymentAttempts || []).some((a: any) =>
        a.paymentStatus === "FAILED" && Date.now() - Number(a.createdDate) <= 168 * 3600_000))) failedEmails.add(email);
    }
    const approvedCount = (counts.token_applied ?? 0) + (counts.sub_applied ?? 0);
    let failedMarkedCount = 0;

    // Mark failed payment orders
    for (const email of failedEmails) {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const { data: pendingOrders, error: fetchError } = await supabaseAdmin
        .from('orders')
        .select('id, customer_name, payment_status')
        .eq('customer_email', email)
        .eq('status', 'pending')
        .is('deleted_at', null)
        .gte('created_at', sevenDaysAgo)
        .order('created_at', { ascending: false });

      if (fetchError || !pendingOrders || pendingOrders.length === 0) continue;

      for (const order of pendingOrders) {
        if (order.payment_status === 'failed') continue;

        const { error: updateError } = await supabaseAdmin
          .from('orders')
          .update({ payment_status: 'failed' })
          .eq('id', order.id);

        if (!updateError) {
          console.log(`Marked payment as failed for ${order.customer_name} (${email})`);
          failedMarkedCount++;
        }
      }
    }

    const result = {
      success: true,
      message: 'Auto-approval from Iyzico completed',
      totalSuccessfulPayments: successfulEmails.size,
      totalFailedPayments: failedEmails.size,
      approved: approvedCount,
      outcomes: counts,
      failedMarked: failedMarkedCount,
      timestamp: new Date().toISOString(),
    };

    console.log('Auto-approve result:', result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Auto-approve error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
