import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Payment reminder SMS sender started at:', new Date().toISOString());

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Bugün oluşturulan ve banka havalesi ile ödeme yapacak siparişleri al
    const today = new Date().toISOString().split('T')[0];
    const { data: newOrders, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select('id, customer_name, customer_email, customer_phone, amount, payment_method, created_at')
      .eq('payment_method', 'banka_havalesi')
      .gte('created_at', `${today}T00:00:00`)
      .lte('created_at', `${today}T23:59:59`);

    if (ordersError) {
      console.error('Error fetching new orders:', ordersError);
      return new Response(
        JSON.stringify({ error: ordersError.message }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!newOrders || newOrders.length === 0) {
      console.log('No bank transfer orders found for today');
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'No bank transfer orders found',
          smsCount: 0
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Found ${newOrders.length} new bank transfer orders`);
    let successCount = 0;
    let failCount = 0;

    // Her sipariş için SMS gönder
    for (const order of newOrders) {
      try {
        // Telefon numarasını siparişten al
        const phone = order.customer_phone;

        if (!phone) {
          console.log(`No phone number found for order ${order.id}`);
          failCount++;
          continue;
        }

        const message = `${order.customer_name}, Bu ayın ödemesi gelmiştir aşağıdaki hesap numarasına ilgili tutarı iletip WhatsApp üzerinden ilgili danışmanınıza dekont iletebilirsiniz. Tutar: ${order.amount} TL - IBAN: TR95 0004 6007 2188 8000 3848 15 (DOKTORUM OL BİLGİ VE TEKNOLOJİ HİZMETLERİ)`;

        // SMS gönder
        const smsResponse = await supabaseAdmin.functions.invoke('send-sms-via-static-proxy', {
          body: {
            phone: phone,
            message: message
          }
        });

        if (smsResponse.error) {
          console.error(`Failed to send SMS for order ${order.id}:`, smsResponse.error);
          failCount++;
        } else {
          console.log(`SMS sent successfully to ${order.customer_name} (${phone})`);
          successCount++;
        }
      } catch (smsError) {
        console.error(`Error sending SMS for order ${order.id}:`, smsError);
        failCount++;
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Payment reminders processed',
        totalOrders: newOrders.length,
        successCount,
        failCount,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('Payment reminder sender error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
