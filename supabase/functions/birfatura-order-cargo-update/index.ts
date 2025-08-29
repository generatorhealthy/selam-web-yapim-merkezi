import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, token, x-token, x-api-key, api-key, api_password',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const token = req.headers.get('token') || req.headers.get('x-token') || req.headers.get('x-api-key') || req.headers.get('api-key') || req.headers.get('api_password') || req.headers.get('authorization') || url.searchParams.get('token') || url.searchParams.get('apikey') || url.searchParams.get('apiKey') || '';
    
    // Allow missing token for now to simplify integration

    // if (!token) {
    //   return new Response(JSON.stringify({ error: 'Token required' }), {
    //     status: 401,
    //     headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    //   });
    // }


    // Parse payload (accept both camel and Pascal case)
    let payload: any = {};
    try { payload = await req.json(); } catch (_) { payload = {}; }

    const orderId = payload.orderId ?? payload.OrderId;
    const orderStatusId = payload.orderStatusId ?? payload.OrderStatusId;
    const cargoTrackingCode = payload.cargoTrackingCode ?? payload.CargoTrackingNumber ?? payload.CargoTrackingCode;

    console.log('BirFatura cargo update request received:', { orderId, orderStatusId, cargoTrackingCode });

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Map status ID to our status
    const statusMapping: { [key: number]: string } = {
      1: 'pending',
      2: 'approved',
      3: 'processing',
      4: 'shipped',
      5: 'completed',
      6: 'cancelled'
    };

    const newStatus = statusMapping[Number(orderStatusId)];
    
    if (!orderId || !newStatus) {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update order status
    const updateData: any = { status: newStatus };
    
    const { error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId);

    if (error) {
      console.error('Database error:', error);
      return new Response(JSON.stringify({ error: 'Database error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, message: 'Order updated successfully' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in birfatura-order-cargo-update function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});