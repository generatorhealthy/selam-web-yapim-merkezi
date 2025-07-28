import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};
serve(async (req)=>{
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders
    });
  }
  try {
    const body = await req.json();
    console.log("Gelen Body - V2:", body);
    const { packageType, customerData, subscriptionReferenceCode } = body;
    const { 
      name, 
      surname, 
      email, 
      gsmNumber: phone, 
      identityNumber: tcNo, 
      registrationAddress: address, 
      city, 
      billingAddress, 
      billingCity, 
      billingZipCode, 
      shippingAddress, 
      shippingCity, 
      shippingZipCode 
    } = customerData;
    const IYZICO_API_KEY = Deno.env.get("IYZICO_API_KEY");
    const IYZICO_SECRET_KEY = Deno.env.get("IYZICO_SECRET_KEY");
    const IYZICO_BASE_URL = Deno.env.get("IYZIPAY_URI");
    const conversationId = `conv_${Date.now()}`;
    const price = packageType === "premium" ? "2998.0" : "1.0";
    const paidPrice = price;
    const requestData = {
      locale: "tr",
      conversationId,
      price: price,
      paidPrice: paidPrice,
      currency: "TRY",
      installment: "1",
      basketId: "B67832",
      paymentChannel: "WEB",
      paymentGroup: "PRODUCT",
      callbackUrl: "https://doktorumol.com.tr/payment-success",
      enabledInstallments: [
        1,
        2,
        3,
        6,
        9
      ],
      buyer: {
        id: "BY789",
        name,
        surname,
        gsmNumber: phone,
        email,
        identityNumber: tcNo,
        lastLoginDate: new Date().toISOString().slice(0, 19).replace('T', ' '),
        registrationDate: new Date().toISOString().slice(0, 19).replace('T', ' '),
        registrationAddress: address,
        ip: "194.59.166.153",
        city,
        country: "Turkey",
        zipCode: zipCode || "34100"
      },
      shippingAddress: {
        contactName: name + " " + surname,
        city: shippingCity || city,
        country: "Turkey",
        address: shippingAddress || address,
        zipCode: shippingZipCode || "34100"
      },
      billingAddress: {
        contactName: name + " " + surname,
        city: billingCity || city,
        country: "Turkey",
        address: billingAddress || address,
        zipCode: billingZipCode || "34100"
      },
      basketItems: [
        {
          id: "BI101",
          name: "Premium Paket",
          category1: "Danışmanlık",
          category2: "Psikoloji",
          itemType: "VIRTUAL",
          price: price
        }
      ]
    };
    const jsonString = JSON.stringify(requestData);
    console.log("İyzico'ya gönderilen JSON:", jsonString);
    const randomString = Date.now().toString();
    // İyzico hash hesaplama: APIKEY + RANDOMSTRING + SECRETKEY + REQUESTBODY
    const hashString = IYZICO_API_KEY + randomString + IYZICO_SECRET_KEY + jsonString;
    console.log("Hash string uzunluğu:", hashString.length);
    const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(hashString));
    const hashBase64 = btoa(String.fromCharCode(...new Uint8Array(hash)));
    const iyzicoResponse = await fetch(`${IYZICO_BASE_URL}/payment/iyzipos/checkoutform/initialize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `IYZWS ${IYZICO_API_KEY}:${hashBase64}`,
        "x-iyzi-rnd": randomString
      },
      body: jsonString
    });
    const iyzicoResult = await iyzicoResponse.json();
    console.log("İyzico Yanıtı:", iyzicoResult);
    return new Response(JSON.stringify(iyzicoResult), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      },
      status: 200
    });
  } catch (err) {
    console.error("Hata:", err);
    return new Response(JSON.stringify({
      error: "Sunucu hatası",
      details: err.message
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      },
      status: 500
    });
  }
});
