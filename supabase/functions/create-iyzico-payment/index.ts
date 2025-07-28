import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createHash } from "https://deno.land/std@0.190.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders
    });
  }

  try {
    const body = await req.json();
    console.log("Gelen Body - V4:", body);
    
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
      shippingZipCode,
      customerType,
      companyName,
      taxNumber,
      taxOffice
    } = customerData;

    const IYZICO_API_KEY = Deno.env.get("IYZICO_API_KEY");
    const IYZICO_SECRET_KEY = Deno.env.get("IYZICO_SECRET_KEY");
    const IYZICO_BASE_URL = Deno.env.get("IYZIPAY_URI") || "https://api.iyzipay.com";
    
    // TC kimlik kontrolü - 11 haneli olmalı
    const validateTCNo = (tc: string) => {
      if (!tc) return "11111111111";
      const cleanTC = tc.replace(/\D/g, '');
      if (cleanTC.length === 11) return cleanTC;
      return "11111111111";
    };

    // Telefon numarası kontrolü
    const validatePhone = (phoneNumber: string) => {
      if (!phoneNumber) return "+905000000000";
      let cleaned = phoneNumber.replace(/\D/g, '');
      if (cleaned.startsWith('90')) cleaned = cleaned.substring(2);
      if (cleaned.startsWith('0')) cleaned = cleaned.substring(1);
      if (cleaned.length === 10) return `+90${cleaned}`;
      return "+905000000000";
    };

    // Adres kontrolü - minimum 5 karakter
    const validateAddress = (addr: string) => {
      if (!addr || addr.length < 5) return "Varsayılan Adres 12345";
      return addr;
    };

    // Paket fiyatlarını doğru şekilde map et
    const getPriceByPackageType = (type: string) => {
      const priceMap: { [key: string]: number } = {
        "campaign": 2398,
        "basic": 2998, 
        "professional": 3600,
        "premium": 4998
      };
      return priceMap[type] || 2998;
    };

    const conversationId = `${Date.now()}`;
    const price = getPriceByPackageType(packageType);
    const paidPrice = price;
    const basketId = `B${Date.now()}`;

    // Client IP'yi request header'dan al
    const clientIP = req.headers.get('x-forwarded-for') || 
                     req.headers.get('x-real-ip') || 
                     '194.59.166.153';

    const validatedTCNo = validateTCNo(tcNo);
    const validatedPhone = validatePhone(phone);
    const validatedAddress = validateAddress(address);
    const validatedBillingAddress = validateAddress(billingAddress || address);
    const validatedShippingAddress = validateAddress(shippingAddress || address);

    const requestData = {
      locale: "tr",
      conversationId,
      price: price.toString(),
      paidPrice: paidPrice.toString(),
      currency: "TRY",
      installment: 1,
      basketId,
      paymentChannel: "WEB",
      paymentGroup: "PRODUCT",
      callbackUrl: "https://doktorumol.com.tr/payment-success",
      enabledInstallments: [1, 2, 3, 6, 9],
      buyer: {
        id: `BY${Date.now()}`,
        name: name || "Kullanici",
        surname: surname || "Adi",
        gsmNumber: validatedPhone,
        email: email || "test@test.com",
        identityNumber: validatedTCNo,
        lastLoginDate: new Date().toISOString().slice(0, 19).replace('T', ' '),
        registrationDate: new Date().toISOString().slice(0, 19).replace('T', ' '),
        registrationAddress: validatedAddress,
        ip: clientIP.split(',')[0].trim(),
        city: city || "Istanbul",
        country: "Turkey",
        zipCode: billingZipCode || "34100"
      },
      shippingAddress: {
        contactName: `${name || "Kullanici"} ${surname || "Adi"}`,
        city: shippingCity || city || "Istanbul",
        country: "Turkey",
        address: validatedShippingAddress,
        zipCode: shippingZipCode || "34100"
      },
      billingAddress: {
        contactName: `${name || "Kullanici"} ${surname || "Adi"}`,
        city: billingCity || city || "Istanbul", 
        country: "Turkey",
        address: validatedBillingAddress,
        zipCode: billingZipCode || "34100"
      },
      basketItems: [
        {
          id: `BI${Date.now()}`,
          name: (() => {
            const nameMap: { [key: string]: string } = {
              "campaign": "Kampanyali Paket",
              "basic": "Premium Paket",
              "professional": "Professional Paket", 
              "premium": "Full Paket"
            };
            return nameMap[packageType] || "Premium Paket";
          })(),
          category1: "Danismanlik",
          category2: "Psikoloji",
          itemType: "VIRTUAL",
          price: price.toString()
        }
      ]
    };

    const jsonString = JSON.stringify(requestData);
    console.log("İyzico'ya gönderilen JSON V4:", jsonString);
    
    const randomString = Date.now().toString();
    
    // SHA1 hash kullan (Iyzico SHA1 gerektiriyor)
    const hashString = IYZICO_API_KEY + randomString + IYZICO_SECRET_KEY + jsonString;
    console.log("Hash string V4:", hashString.substring(0, 100) + "...");
    
    const encoder = new TextEncoder();
    const data = encoder.encode(hashString);
    const hashBuffer = await crypto.subtle.digest("SHA-1", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    const hashBase64 = btoa(hashHex);

    console.log("Generated hash (ilk 20 karakter):", hashBase64.substring(0, 20));

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

    const responseText = await iyzicoResponse.text();
    console.log("Iyzico HTTP Status:", iyzicoResponse.status);
    console.log("Iyzico Raw Response:", responseText);

    let iyzicoResult;
    try {
      iyzicoResult = JSON.parse(responseText);
    } catch (parseError) {
      console.error("JSON parse hatası:", parseError);
      return new Response(JSON.stringify({
        error: "Iyzico yanıt formatı hatası",
        details: responseText
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500
      });
    }

    console.log("İyzico Yanıtı V4:", iyzicoResult);

    return new Response(JSON.stringify(iyzicoResult), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      },
      status: 200
    });

  } catch (err) {
    console.error("Hata V4:", err);
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
