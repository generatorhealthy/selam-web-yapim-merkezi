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
    console.log('Daily order generator started at:', new Date().toISOString());

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // generate_monthly_orders fonksiyonunu çağır
    const { data, error } = await supabaseAdmin.rpc('generate_monthly_orders');

    if (error) {
      console.error('Error generating monthly orders:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Monthly orders generated successfully');

    // Bugün oluşturulan ve banka havalesi ile ödeme yapacak siparişleri al
    const today = new Date().toISOString().split('T')[0];
    const { data: newOrders, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select('id, customer_name, customer_email, amount, payment_method')
      .eq('payment_method', 'banka_havalesi')
      .gte('created_at', `${today}T00:00:00`)
      .lte('created_at', `${today}T23:59:59`);

    if (ordersError) {
      console.error('Error fetching new orders:', ordersError);
    } else if (newOrders && newOrders.length > 0) {
      console.log(`Found ${newOrders.length} new bank transfer orders`);

      // Her sipariş için uzmanın telefon numarasını bul ve SMS gönder
      for (const order of newOrders) {
        try {
          // Uzmanın telefon numarasını al
          const { data: specialist } = await supabaseAdmin
            .from('specialists')
            .select('phone, name')
            .or(`email.ilike.${order.customer_email},name.ilike.%${order.customer_name}%`)
            .single();

          if (specialist && specialist.phone) {
            const message = `${specialist.name}, Bu ayın ödemesi gelmiştir aşağıdaki hesap numarasına ilgili tutarı iletip WhatsApp üzerinden ilgili danışmanınıza dekont iletebilirsiniz. Tutar: ${order.amount} TL - IBAN: TR95 0004 6007 2188 8000 3848 15 (DOKTORUM OL BİLGİ VE TEKNOLOJİ HİZMETLERİ)`;

            // SMS gönder
            const smsResponse = await fetch(
              `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-sms-via-static-proxy`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
                },
                body: JSON.stringify({
                  phone: specialist.phone,
                  message: message
                })
              }
            );

            if (smsResponse.ok) {
              console.log(`SMS sent successfully to ${specialist.name} (${specialist.phone})`);
            } else {
              console.error(`Failed to send SMS to ${specialist.name}:`, await smsResponse.text());
            }
          } else {
            console.log(`No phone number found for order ${order.id}`);
          }
        } catch (smsError) {
          console.error(`Error sending SMS for order ${order.id}:`, smsError);
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Monthly orders generated successfully',
        smsCount: newOrders?.length || 0,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('Daily order generator error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
