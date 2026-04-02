import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log("Iyzico callback verisi:", JSON.stringify(body));

    if (body.status === "success" || body.paymentStatus === "SUCCESS") {
      const customerEmail = body.customerEmail?.toLowerCase();
      console.log("Başarılı ödeme - Email:", customerEmail);

      // Siparişi otomatik onayla
      if (customerEmail) {
        try {
          const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
          );

          // Son 48 saatteki bekleyen siparişi bul
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
                approved_by: 'system-iyzico-callback',
                payment_method: 'credit_card',
                payment_transaction_id: body.subscriptionReferenceCode || body.paymentId || null,
              })
              .eq('id', order.id);

            if (updateError) {
              console.error("Sipariş onaylama hatası:", updateError);
            } else {
              console.log(`Sipariş otomatik onaylandı: ${order.customer_name} (${customerEmail}) - ${order.amount} TL`);
            }
          } else {
            console.log("Bekleyen sipariş bulunamadı:", customerEmail);
          }
        } catch (dbError) {
          console.error("DB işlem hatası:", dbError);
        }
      }

      // Paket bilgilerini belirle
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
