import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // BirFatura will send the API token in the header
    const apiKey = req.headers.get('x-api-key') || req.headers.get('x-apikey') || req.headers.get('apikey') || req.headers.get('api-key') || req.headers.get('api_password') || req.headers.get('api-password') || req.headers.get('token') || req.headers.get('authorization');
    
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { OrderId, OrderStatusId, CargoTrackingNumber } = await req.json();
    
    console.log('BirFatura cargo update request received:', { OrderId, OrderStatusId, CargoTrackingNumber });

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

    const newStatus = statusMapping[OrderStatusId];
    
    if (!newStatus) {
      return new Response(JSON.stringify({ error: 'Invalid status ID' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update order status
    const updateData: any = { status: newStatus };
    
    // If cargo tracking number is provided, we could add it to a new column
    // For now, we'll just update the status
    
    const { error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', OrderId);

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