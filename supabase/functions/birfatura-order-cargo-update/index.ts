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

    // Map status ID to our status (BirFatura example mapping)
    const statusMapping: { [key: number]: string } = {
      1: 'approved',
      2: 'shipped',
      3: 'cancelled',
      4: 'processing',
      5: 'completed',
      6: 'pending'
    };

    const newStatus = statusMapping[Number(orderStatusId)];
    
    if (!orderId || !newStatus) {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update order status (find by closest created_at timestamp derived from OrderId)
    const { data: candidateOrders } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    let targetId: string | null = null;
    const orderTs = Number(orderId);
    if (candidateOrders && orderTs) {
      let bestDiff = Number.MAX_SAFE_INTEGER;
      for (const o of candidateOrders) {
        const ts = Date.parse(o.created_at);
        const diff = Math.abs(ts - orderTs);
        if (diff < bestDiff) { bestDiff = diff; targetId = o.id; }
      }
    }

    if (!targetId) {
      return new Response(JSON.stringify({ error: 'Order not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const updateData: any = { status: newStatus };
    if (cargoTrackingCode) updateData.cargo_tracking_code = String(cargoTrackingCode);

    const { error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', targetId);

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