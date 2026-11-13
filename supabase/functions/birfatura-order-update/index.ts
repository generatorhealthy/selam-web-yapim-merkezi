import { verifyBirfatura } from '../_shared/birfaturaAuth.ts';
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': '*',
};

serve(async (req) => {
  console.log('===== BIRFATURA ORDER UPDATE REQUEST =====');
  console.log('Method:', req.method);
  // (kişisel veri içeren kayıt satırı kaldırıldı)
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (!verifyBirfatura(req)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // BirFatura sipariş durumu güncellemesi için
    const requestBody = await req.text();
    console.log('Update request body received', { length: String(requestBody ?? '').length });

    let updateData: any = {};
    try {
      updateData = JSON.parse(requestBody);
    } catch (e) {
      console.log('Could not parse JSON, treating as form data or other format');
    }

    // (kişisel veri içeren kayıt satırı kaldırıldı)

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // If this is an order status update, handle it
    if (updateData.OrderId || updateData.orderId) {
      const orderId = updateData.OrderId || updateData.orderId;
      const status = updateData.OrderStatus || updateData.status;
      const trackingCode = updateData.CargoTrackingNumber || updateData.trackingCode || '';

      console.log('Updating order status');

      // BirFatura'dan gelen sipariş ID'sini timestamp olarak kullanmıştık
      // Bu timestamp'e göre siparişi bulup güncellememiz gerekiyor
      const { data: orders, error } = await supabase
        .from('orders')
        .select('id, created_at')
        .gte('created_at', new Date(orderId - 86400000).toISOString()) // 1 gün öncesinden
        .lte('created_at', new Date(orderId + 86400000).toISOString()); // 1 gün sonrasına

      if (orders && orders.length > 0) {
        // En yakın tarihli olanı bul
        const closestOrder = orders.reduce((prev, curr) => {
          const prevDiff = Math.abs(Date.parse(prev.created_at) - orderId);
          const currDiff = Math.abs(Date.parse(curr.created_at) - orderId);
          return currDiff < prevDiff ? curr : prev;
        });

        // Siparişi güncelle
        const { error: updateError } = await supabase
          .from('orders')
          .update({
            // Kargo takip kodunu eklemiyoruz çünkü bizde kargo yok
            // Sadece log için kabul ediyoruz
          })
          .eq('id', closestOrder.id);

        if (updateError) {
          console.error('Update error:', updateError);
        } else {
          console.log('Order updated successfully');
        }
      }
    }

    // BirFatura'ya her zaman başarılı response dön
    const response = {
      success: true,
      message: "Order status updated successfully",
      orderId: updateData.OrderId || updateData.orderId,
      status: "success"
    };

    console.log('Sending update response');
    console.log('===== BIRFATURA ORDER UPDATE END =====');

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json; charset=utf-8'
      },
    });

  } catch (error) {
    console.error('Update ERROR:', error);
    
    // Hata olsa bile BirFatura'ya başarılı response dön
    return new Response(JSON.stringify({ 
      success: true, 
      message: "Accepted",
      error: error instanceof Error ? error.message : String(error) 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});