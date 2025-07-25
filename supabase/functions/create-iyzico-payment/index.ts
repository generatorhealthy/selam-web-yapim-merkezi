// Supabase Edge Function – index.ts
import { serve } from "https://deno.land/std@0.192.0/http/server.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  try {
    const body = await req.json();
    const { customerData, packageType, subscriptionReferenceCode } = body;
    const packagePrice = 2998.0;
    const conversationId = `conv_${Date.now()}`; // ✅ tanımlandı

    const requestBody = {
      locale: "tr",
      conversationId,
      price: packagePrice.toFixed(2),
      paidPrice: packagePrice.toFixed(2),
      currency: "TRY",
      basketId: conversationId,
      paymentGroup: "PRODUCT",
      callbackUrl: "https://doktorumol.com.tr",
      enabledInstallments: [1, 2, 3, 6, 9],
      buyer: {
        id: "BY789",
        name: customerData.name || "John",
        surname: customerData.surname || "Doe",
        identityNumber: customerData.tcNo?.toString().padStart(11, "0") || "74300864791",
        email: customerData.email || "email@email.com",
        gsmNumber: customerData.phone?.startsWith("+90")
          ? customerData.phone
          : `+90${customerData.phone?.replace(/^0/, "") || "5350000000"}`,
        registrationDate: "2023-01-01 12:00:00",
        lastLoginDate: "2024-07-25 12:00:00",
        registrationAddress: customerData.address || "Adres",
        city: customerData.city || "Istanbul",
        country: "Turkey",
        zipCode: customerData.zipCode || "34732",
        ip: "194.59.166.153"
      },
      shippingAddress: {
        address: customerData.address || "Adres",
        zipCode: customerData.zipCode || "34742",
        contactName: `${customerData.name || "Jane"} ${customerData.surname || "Doe"}`,
        city: customerData.city || "Istanbul",
        country: "Turkey"
      },
      billingAddress: {
        address: customerData.address || "Adres",
        zipCode: customerData.zipCode || "34742",
        contactName: `${customerData.name || "Jane"} ${customerData.surname || "Doe"}`,
        city: customerData.city || "Istanbul",
        country: "Turkey"
      },
      basketItems: [
        {
          id: "BI101",
          name: `${packageType} Paketi`,
          category1: "Danışmanlık",
          category2: "Üyelik",
          itemType: "VIRTUAL",
          price: packagePrice.toFixed(2)
        }
      ]
    };

    // Burada İyzico API çağrısını yapacaksın...

    return new Response(JSON.stringify({ status: "success" }), {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json"
      }
    });

  } catch (error) {
    console.error("İyzico ödeme hatası:", error);
    return new Response(
      JSON.stringify({ error: "Sunucu hatası", detail: error.message }),
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json"
        }
      }
    );
  }
});
