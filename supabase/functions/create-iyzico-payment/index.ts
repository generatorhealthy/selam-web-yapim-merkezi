import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createHmac } from "https://deno.land/std@0.190.0/hash/mod.ts";

const IYZICO_API_KEY = Deno.env.get("IYZICO_API_KEY")!;
const IYZICO_SECRET_KEY = Deno.env.get("IYZICO_SECRET_KEY")!;
const IYZICO_BASE_URL = "https://sandbox-api.iyzipay.com";

serve(async (req) => {
  try {
    const { packageType, customerData, subscriptionReferenceCode } = await req.json();

    const price = packageType === "premium" ? "2998.0" : "0.0";

    const requestBody = {
      locale: "tr",
      conversationId: subscriptionReferenceCode,
      price: price,
      paidPrice: price,
      currency: "TRY",
      installment: "1",
      basketId: subscriptionReferenceCode,
      paymentChannel: "WEB",
      paymentGroup: "PRODUCT",
      callbackUrl: "https://doktorumol.com.tr/odeme-sonucu",
      buyer: {
        id: "BY789",
        name: customerData.name,
        surname: customerData.surname,
        gsmNumber: customerData.phone,
        email: customerData.email,
        identityNumber: customerData.identityNumber,
        lastLoginDate: new Date().toISOString(),
        registrationDate: new Date().toISOString(),
        registrationAddress: customerData.address,
        ip: "85.34.99.112",
        city: customerData.city,
        country: "Turkey",
        zipCode: customerData.zipCode,
      },
      shippingAddress: {
        contactName: `${customerData.name} ${customerData.surname}`,
        city: customerData.city,
        country: "Turkey",
        address: customerData.address,
        zipCode: customerData.zipCode,
      },
      billingAddress: {
        contactName: `${customerData.name} ${customerData.surname}`,
        city: customerData.city,
        country: "Turkey",
        address: customerData.address,
        zipCode: customerData.zipCode,
      },
      basketItems: [
        {
          id: "BI101",
          name: packageType,
          category1: "Danışmanlık",
          category2: "Online Hizmet",
          itemType: "VIRTUAL",
          price: price,
        },
      ],
    };

    const jsonString = JSON.stringify(requestBody);
    const randomString = crypto.randomUUID();
    const hashStr = IYZICO_API_KEY + randomString + IYZICO_SECRET_KEY + jsonString;

    const hash = createHmac("sha1", IYZICO_SECRET_KEY)
      .update(hashStr)
      .toString("base64");

    const iyzicoResponse = await fetch(`${IYZICO_BASE_URL}/payment/iyzipos/initialize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `IYZWS ${IYZICO_API_KEY}:${hash}`,
        "x-iyzi-rnd": randomString
      },
      body: jsonString,
    });

    const iyzicoData = await iyzicoResponse.json();

    return new Response(JSON.stringify(iyzicoData), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
});
