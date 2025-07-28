// Supabase Edge Function - TypeScript (Deno için)
// Dosya: create-iyzico-payment.ts

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createHmac } from "https://deno.land/std@0.190.0/hash/mod.ts";

// Ortak PKI string oluşturucu fonksiyon
function buildPkiString(data: Record<string, any>): string {
  function internal(obj: any): string {
    const keys = Object.keys(obj).filter(k => obj[k] !== null && obj[k] !== undefined).sort();
    return keys.map(key => {
      if (typeof obj[key] === "object" && !Array.isArray(obj[key])) {
        return `${key}=[${internal(obj[key])}]`;
      } else if (Array.isArray(obj[key])) {
        return `${key}=[${obj[key].map(internal).join(",")}]`;
      } else {
        return `${key}=${obj[key]}`;
      }
    }).join(",");
  }
  return `[${internal(data)}]`;
}

// SHA1 imza oluşturucu
function generateAuthorization(apiKey: string, secretKey: string, pkiString: string): string {
  const hash = createHmac("sha1", secretKey).update(pkiString).digest("base64");
  return `IYZWS ${apiKey}:${hash}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
      }
    });
  }

  try {
    const { packageType, customerData, subscriptionReferenceCode } = await req.json();

    const apiKey = Deno.env.get("IYZICO_API_KEY")!;
    const secretKey = Deno.env.get("IYZICO_SECRET_KEY")!;
    const url = "https://api.iyzipay.com/payment/init3ds/ecom";

    const requestBody = {
      locale: "tr",
      conversationId: subscriptionReferenceCode,
      price: "2998.0",
      paidPrice: "2998.0",
      currency: "TRY",
      basketId: "B67832",
      paymentGroup: "PRODUCT",
      callbackUrl: "https://doktorumol.com.tr/payment-success",
      buyer: {
        id: "BY789",
        name: customerData.name,
        surname: customerData.surname,
        identityNumber: customerData.identityNumber,
        email: customerData.email,
        gsmNumber: customerData.phone,
        registrationAddress: customerData.address,
        city: customerData.city,
        country: "Turkey",
        zipCode: customerData.postalCode
      },
      paymentCard: {
        cardHolderName: customerData.cardHolderName,
        cardNumber: customerData.cardNumber,
        expireMonth: customerData.expireMonth,
        expireYear: customerData.expireYear,
        cvc: customerData.cvc,
        registerCard: "0"
      },
      shippingAddress: {
        contactName: customerData.name + " " + customerData.surname,
        city: customerData.city,
        country: "Turkey",
        address: customerData.address,
        zipCode: customerData.postalCode
      },
      billingAddress: {
        contactName: customerData.name + " " + customerData.surname,
        city: customerData.city,
        country: "Turkey",
        address: customerData.address,
        zipCode: customerData.postalCode
      },
      basketItems: [
        {
          id: "BI101",
          name: "Premium Paket",
          category1: "Danışmanlık",
          itemType: "VIRTUAL",
          price: "2998.0"
        }
      ]
    };

    const pkiString = buildPkiString(requestBody);
    const authorization = generateAuthorization(apiKey, secretKey, pkiString);

    const iyzicoRes = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": authorization,
        "x-iyzi-rnd": new Date().getTime().toString()
      },
      body: JSON.stringify(requestBody)
    });

    const iyzicoData = await iyzicoRes.json();

    return new Response(JSON.stringify(iyzicoData), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });

  } catch (error) {
    console.error("İyzico ödeme hatası:", error);
    return new Response(JSON.stringify({ error: "İşlem başlatılamadı", detail: error.message }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
});
