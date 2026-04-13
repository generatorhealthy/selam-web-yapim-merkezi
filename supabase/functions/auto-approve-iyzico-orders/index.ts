import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

    // Build sets of emails with successful/failed recent payments
    const successfulEmails = new Set<string>();
    const failedEmails = new Set<string>();

    for (const sub of allSubscriptions) {
      const email = sub.customerEmail;
      if (!email) continue;

      for (const order of (sub.orders || [])) {
        const hasSuccessfulPayment = order.paymentAttempts?.some(
          (attempt: any) => attempt.paymentStatus === "SUCCESS"
        );
        const hasFailedPayment = order.paymentAttempts?.some(
          (attempt: any) => attempt.paymentStatus === "FAILED"
        );

        if (hasSuccessfulPayment && order.orderStatus === "SUCCESS") {
          const latestSuccess = order.paymentAttempts
            ?.filter((a: any) => a.paymentStatus === "SUCCESS")
            ?.sort((a: any, b: any) => b.createdDate - a.createdDate)[0];

          if (latestSuccess) {
            const hoursSince = (Date.now() - latestSuccess.createdDate) / (1000 * 60 * 60);
            if (hoursSince <= 48) {
              successfulEmails.add(email.toLowerCase());
            }
          }
        } else if (hasFailedPayment && !hasSuccessfulPayment) {
          const latestFailed = order.paymentAttempts
            ?.filter((a: any) => a.paymentStatus === "FAILED")
            ?.sort((a: any, b: any) => b.createdDate - a.createdDate)[0];

          if (latestFailed) {
            const hoursSince = (Date.now() - latestFailed.createdDate) / (1000 * 60 * 60);
            if (hoursSince <= 168) { // 7 days for failed payments
              failedEmails.add(email.toLowerCase());
            }
          }
        }
      }
    }

    // Remove emails that also have successful payments
    for (const email of successfulEmails) {
      failedEmails.delete(email);
    }

    console.log(`Found ${successfulEmails.size} emails with recent successful payments, ${failedEmails.size} with failed payments`);

    // Find pending orders for successful emails and auto-approve
    let approvedCount = 0;
    let failedMarkedCount = 0;

    for (const email of successfulEmails) {
      const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

      const { data: pendingOrders, error: fetchError } = await supabaseAdmin
        .from('orders')
        .select('id, customer_name, customer_email, status, subscription_month, amount')
        .eq('customer_email', email)
        .eq('status', 'pending')
        .is('deleted_at', null)
        .gte('created_at', twoDaysAgo)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error(`Error fetching orders for ${email}:`, fetchError);
        continue;
      }

      if (!pendingOrders || pendingOrders.length === 0) continue;

      const orderToApprove = pendingOrders[0];

      const { error: updateError } = await supabaseAdmin
        .from('orders')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          payment_method: 'credit_card',
          payment_status: 'success',
        })
        .eq('id', orderToApprove.id);

      if (updateError) {
        console.error(`Error approving order ${orderToApprove.id}:`, updateError);
      } else {
        console.log(`Auto-approved order for ${orderToApprove.customer_name} (${email}) - ${orderToApprove.amount} TL - Month ${orderToApprove.subscription_month}`);
        approvedCount++;
      }
    }

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
