import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

interface SubscriptionOrder {
  referenceCode: string;
  price: number;
  orderStatus: string;
  paymentAttempts: Array<{
    paymentStatus: string;
    errorMessage?: string;
    createdDate: number;
  }>;
}

interface SubscriptionItem {
  referenceCode: string;
  customerEmail: string;
  customerGsmNumber: string;
  subscriptionStatus: string;
  pricingPlanName: string;
  orders: SubscriptionOrder[];
}

async function generateIyzicoAuth(
  apiKey: string,
  secretKey: string,
  uriPath: string,
  requestBody: string = ""
): Promise<{ authorization: string; randomKey: string }> {
  // iyzico HMACSHA256 auth requires a per-request random key (x-iyzi-rnd)
  const randomKey = Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const dataToEncrypt = randomKey + uriPath + requestBody;

  const encoder = new TextEncoder();
  const keyData = encoder.encode(secretKey);
  const messageData = encoder.encode(dataToEncrypt);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
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

async function getUnpaidSubscriptions(
  apiKey: string,
  secretKey: string,
  baseUrl: string
): Promise<SubscriptionItem[]> {
  // IMPORTANT: iyzico signature must be calculated with the URI path **without** query params.
  const uriPathForSign = "/v2/subscription/subscriptions";
  const requestUrl = `${baseUrl}${uriPathForSign}?subscriptionStatus=UNPAID&page=1&count=100`;

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
    return result.data.items;
  }

  console.log("UNPAID abonelik sorgu yanıtı:", JSON.stringify(result));

  // Don't silently return [] on auth or API errors; surface it to UI.
  const msg = result?.errorMessage || result?.message || "UNPAID abonelikleri alınamadı";
  throw new Error(msg);
}

async function retryPayment(
  apiKey: string,
  secretKey: string,
  baseUrl: string,
  orderReferenceCode: string
): Promise<{ success: boolean; message: string }> {
  const uriPath = "/v2/subscription/operation/retry";
  const requestBody = JSON.stringify({ referenceCode: orderReferenceCode });

  const { authorization, randomKey } = await generateIyzicoAuth(apiKey, secretKey, uriPath, requestBody);

  const response = await fetch(`${baseUrl}${uriPath}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: authorization,
      "x-iyzi-rnd": randomKey,
    },
    body: requestBody,
  });

  const result = await response.json();

  if (result.status === "success") {
    return { success: true, message: "Ödeme başarıyla tekrar denendi" };
  }

  return {
    success: false,
    message: result.errorMessage || result.message || "Ödeme tekrar denenemedi",
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const IYZICO_API_KEY = Deno.env.get("IYZICO_API_KEY");
    const IYZICO_SECRET_KEY = Deno.env.get("IYZICO_SECRET_KEY");
    const IYZICO_BASE_URL = Deno.env.get("IYZIPAY_URI") || "https://api.iyzipay.com";

    if (!IYZICO_API_KEY || !IYZICO_SECRET_KEY) {
      throw new Error("iyzico API anahtarları bulunamadı");
    }

    console.log("Başarısız ödemeler kontrol ediliyor...");

    // 1. UNPAID durumundaki abonelikleri getir
    const unpaidSubscriptions = await getUnpaidSubscriptions(
      IYZICO_API_KEY, 
      IYZICO_SECRET_KEY, 
      IYZICO_BASE_URL
    );

    console.log(`${unpaidSubscriptions.length} adet UNPAID abonelik bulundu`);

    const retryResults: Array<{
      subscriptionRef: string;
      customerEmail: string;
      orderRef: string;
      success: boolean;
      message: string;
    }> = [];

    // 2. Her abonelik için başarısız ödeme siparişlerini bul ve tekrar dene
    for (const subscription of unpaidSubscriptions) {
      console.log(`Abonelik kontrol ediliyor: ${subscription.referenceCode} - ${subscription.customerEmail}`);
      
      for (const order of subscription.orders) {
        // Sadece WAITING veya başarısız ödemeleri kontrol et
        const hasFailedAttempt = order.paymentAttempts?.some(
          attempt => attempt.paymentStatus === "FAILED"
        );
        
        if (order.orderStatus === "WAITING" && hasFailedAttempt) {
          console.log(`Başarısız ödeme bulundu - Order: ${order.referenceCode}, Tutar: ${order.price} TL`);
          
          // Son başarısız deneme tarihini kontrol et
          const lastAttempt = order.paymentAttempts
            ?.filter(a => a.paymentStatus === "FAILED")
            ?.sort((a, b) => b.createdDate - a.createdDate)[0];
          
          if (lastAttempt) {
            const lastAttemptDate = new Date(lastAttempt.createdDate);
            const hoursSinceLastAttempt = (Date.now() - lastAttempt.createdDate) / (1000 * 60 * 60);
            
            console.log(`Son deneme: ${lastAttemptDate.toISOString()}, ${hoursSinceLastAttempt.toFixed(1)} saat önce`);
            console.log(`Son hata mesajı: ${lastAttempt.errorMessage || 'Belirtilmemiş'}`);
            
            // En az 6 saat geçmişse tekrar dene (günde max 4 deneme)
            if (hoursSinceLastAttempt >= 6) {
              console.log(`Ödeme tekrar deneniyor: ${order.referenceCode}`);
              
              const retryResult = await retryPayment(
                IYZICO_API_KEY,
                IYZICO_SECRET_KEY,
                IYZICO_BASE_URL,
                order.referenceCode
              );
              
              retryResults.push({
                subscriptionRef: subscription.referenceCode,
                customerEmail: subscription.customerEmail,
                orderRef: order.referenceCode,
                success: retryResult.success,
                message: retryResult.message
              });
              
              console.log(`Sonuç: ${retryResult.success ? 'BAŞARILI' : 'BAŞARISIZ'} - ${retryResult.message}`);
            } else {
              console.log(`Son denemeden 6 saat geçmemiş, atlanıyor`);
            }
          }
        }
      }
    }

    // Özet rapor
    const successCount = retryResults.filter(r => r.success).length;
    const failCount = retryResults.filter(r => !r.success).length;

    console.log(`\n=== ÖZET ===`);
    console.log(`Toplam işlem: ${retryResults.length}`);
    console.log(`Başarılı: ${successCount}`);
    console.log(`Başarısız: ${failCount}`);

    return new Response(JSON.stringify({
      status: "success",
      summary: {
        unpaidSubscriptions: unpaidSubscriptions.length,
        totalRetries: retryResults.length,
        successful: successCount,
        failed: failCount
      },
      results: retryResults,
      subscriptions: unpaidSubscriptions
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200
    });

  } catch (error) {
    console.error("Hata:", error);
    return new Response(JSON.stringify({
      status: "error",
      message: error.message
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500
    });
  }
});
