import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

async function generateIyzicoAuth(
  apiKey: string,
  secretKey: string,
  uriPath: string,
): Promise<{ authorization: string; randomKey: string }> {
  const randomKey = Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const dataToEncrypt = randomKey + uriPath;
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

async function getCustomerFromIyzico(customerReferenceCode: string): Promise<string | null> {
  const apiKey = Deno.env.get("IYZICO_API_KEY");
  const secretKey = Deno.env.get("IYZICO_SECRET_KEY");
  const baseUrl = Deno.env.get("IYZIPAY_URI") || "https://api.iyzipay.com";

  if (!apiKey || !secretKey) return null;

  const uriPath = `/v2/subscription/customers/${customerReferenceCode}`;
  const { authorization, randomKey } = await generateIyzicoAuth(apiKey, secretKey, uriPath);

  try {
    const response = await fetch(`${baseUrl}${uriPath}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: authorization,
        "x-iyzi-rnd": randomKey,
      },
    });

    const result = await response.json();
    console.log("Iyzico customer lookup result:", JSON.stringify(result));

    if (result.status === "success" && result.data?.email) {
      return result.data.email.toLowerCase().trim();
    }
  } catch (err) {
    console.error("Iyzico customer lookup error:", err);
  }

  return null;
}

serve(async (req) => {
  console.log("=== Iyzico Callback Received ===");
  console.log("Method:", req.method);
  console.log("URL:", req.url);
  
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const contentType = req.headers.get("content-type") || "";
    console.log("Content-Type:", contentType);
    
    let body: any = {};
    const rawBody = await req.text();
    console.log("Raw body (first 500 chars):", rawBody.substring(0, 500));
    
    if (rawBody) {
      try {
        body = JSON.parse(rawBody);
        console.log("Parsed as JSON");
      } catch {
        try {
          const params = new URLSearchParams(rawBody);
          body = Object.fromEntries(params.entries());
          console.log("Parsed as form-urlencoded");
        } catch {
          console.log("Could not parse body, using raw");
          body = { raw: rawBody };
        }
      }
    }
    
    const url = new URL(req.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    if (Object.keys(queryParams).length > 0) {
      console.log("Query params:", JSON.stringify(queryParams));
      body = { ...body, ...queryParams };
    }
    
    console.log("Parsed callback body:", JSON.stringify(body));

    // Determine payment status - check multiple possible fields including subscription events
    const eventType = (body.iyziEventType || "").toLowerCase();
    const isSuccess = 
      body.status === "success" || 
      body.paymentStatus === "SUCCESS" ||
      eventType === "subscription_order_success" ||
      eventType === "subscription.order.success" ||
      body.orderStatus === "SUCCESS" ||
      body.status === "SUCCESS";

    const isFailed =
      body.paymentStatus === "FAILED" ||
      eventType === "subscription_order_failure" ||
      eventType === "subscription.order.failure" ||
      body.orderStatus === "FAILED";

    console.log("Event type:", eventType, "| Payment success:", isSuccess);

    if (isSuccess) {
      // Try to get email from body first, then from Iyzico API using customerReferenceCode
      let customerEmail = (body.customerEmail || body.customer_email || "")?.toLowerCase().trim();
      
      if (!customerEmail && body.customerReferenceCode) {
        console.log("No email in callback, fetching from Iyzico API with customerRef:", body.customerReferenceCode);
        customerEmail = await getCustomerFromIyzico(body.customerReferenceCode);
        console.log("Email from Iyzico API:", customerEmail);
      }

      console.log("Başarılı ödeme - Email:", customerEmail);

      if (customerEmail) {
        try {
          const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
          );

          const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
          
          const { data: pendingOrders, error: fetchError } = await supabaseAdmin
            .from('orders')
            .select('id, customer_name, customer_email, amount, subscription_month')
            .eq('customer_email', customerEmail)
            .eq('status', 'pending')
            .is('deleted_at', null)
            .gte('created_at', twoDaysAgo)
            .order('created_at', { ascending: false })
            .limit(1);

          if (fetchError) {
            console.error("Sipariş sorgulama hatası:", fetchError);
          } else if (pendingOrders && pendingOrders.length > 0) {
            const order = pendingOrders[0];
            
            const { error: updateError } = await supabaseAdmin
              .from('orders')
              .update({
                status: 'approved',
                approved_at: new Date().toISOString(),
                payment_method: 'credit_card',
                payment_transaction_id: body.subscriptionReferenceCode || body.paymentId || body.token || null,
              })
              .eq('id', order.id);

            if (updateError) {
              console.error("Sipariş onaylama hatası:", updateError);
            } else {
              console.log(`✅ Sipariş otomatik onaylandı: ${order.customer_name} (${customerEmail}) - ${order.amount} TL - Ay ${order.subscription_month}`);
              
              // Auto-create invoice
              try {
                const invokeUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/create-birfatura-invoice`;
                const invoiceRes = await fetch(invokeUrl, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
                  },
                  body: JSON.stringify({ orderId: order.id }),
                });
                const invoiceResult = await invoiceRes.json();
                console.log("Otomatik fatura sonucu:", JSON.stringify(invoiceResult));
              } catch (invoiceErr) {
                console.error("Otomatik fatura hatası:", invoiceErr);
              }
            }
          } else {
            console.log("⚠️ Bekleyen sipariş bulunamadı:", customerEmail);
            
            const { data: allPending } = await supabaseAdmin
              .from('orders')
              .select('id, customer_name, customer_email, amount, created_at, status')
              .eq('customer_email', customerEmail)
              .is('deleted_at', null)
              .order('created_at', { ascending: false })
              .limit(3);
            
            console.log("Bu email için tüm siparişler:", JSON.stringify(allPending));
          }
        } catch (dbError) {
          console.error("DB işlem hatası:", dbError);
        }
      } else {
        console.log("⚠️ Email bulunamadı, otomatik onay yapılamadı. Body:", JSON.stringify(body));
      }

      // Build redirect URL
      const getPackagePrice = (pricingPlanCode: string) => {
        const priceMap: Record<string, number> = {
          "e01a059d-9392-4690-b030-0002064f9421": 998,
          "205eb35c-e122-401f-aef7-618daf3732f8": 1998,
          "92feac6d-1181-4b78-b0c2-3b5d5742adff": 2998,
          "4a9ab9e6-407f-4008-9a0d-6a31fac6fd94": 3998,
          "e0d7e6b7-e665-4460-ab8f-6bb6e7a2c652": 4000,
        };
        return priceMap[pricingPlanCode] || 2998;
      };

      const getPackageName = (pricingPlanCode: string) => {
        const nameMap: Record<string, string> = {
          "e01a059d-9392-4690-b030-0002064f9421": "Kampanya Paketi",
          "205eb35c-e122-401f-aef7-618daf3732f8": "Temel Paket",
          "92feac6d-1181-4b78-b0c2-3b5d5742adff": "Profesyonel Paket",
          "4a9ab9e6-407f-4008-9a0d-6a31fac6fd94": "Premium Paket",
          "e0d7e6b7-e665-4460-ab8f-6bb6e7a2c652": "Premium Paket - Özel Fırsat",
        };
        return nameMap[pricingPlanCode] || "Premium Paket";
      };

      const packagePrice = getPackagePrice(body.pricingPlanReferenceCode);
      const packageName = getPackageName(body.pricingPlanReferenceCode);

      const orderData = {
        id: body.subscriptionReferenceCode || Date.now().toString(),
        orderNumber: `DRP-${Date.now().toString().slice(-12)}`,
        package: packageName,
        amount: packagePrice,
        paymentMethod: "credit_card",
        customerName: `${body.customerName || "Müşteri"} ${body.customerSurname || ""}`
      };

      const orderDataParam = encodeURIComponent(JSON.stringify(orderData));
      const redirectUrl = `https://doktorumol.com.tr/odeme-basarili?orderData=${orderDataParam}`;
      
      return new Response(null, {
        status: 302,
        headers: { ...corsHeaders, "Location": redirectUrl }
      });
    } else {
      console.log("❌ Ödeme başarısız veya bilinmeyen durum:", JSON.stringify(body));
      return new Response(null, {
        status: 302,
        headers: { ...corsHeaders, "Location": "https://doktorumol.com.tr/" }
      });
    }

  } catch (err) {
    console.error("Callback hatası:", err);
    return new Response(null, {
      status: 302,
      headers: { ...corsHeaders, "Location": "https://doktorumol.com.tr/" }
    });
  }
});
