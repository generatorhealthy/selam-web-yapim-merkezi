import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const apiKey = req.headers.get('x-api-key') || req.headers.get('authorization');
    
    // For now, we'll validate that a key is provided
    // In production, you'd validate against your stored API keys
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('BirFatura order status request received');

    // Return order statuses as per BirFatura specification
    const orderStatuses = [
      {
        "OrderStatusId": 1,
        "OrderStatusName": "Beklemede"
      },
      {
        "OrderStatusId": 2,
        "OrderStatusName": "Onaylandı"
      },
      {
        "OrderStatusId": 3,
        "OrderStatusName": "Hazırlanıyor"
      },
      {
        "OrderStatusId": 4,
        "OrderStatusName": "Kargoya Verildi"
      },
      {
        "OrderStatusId": 5,
        "OrderStatusName": "Teslim Edildi"
      },
      {
        "OrderStatusId": 6,
        "OrderStatusName": "İptal Edildi"
      }
    ];

    return new Response(JSON.stringify(orderStatuses), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in birfatura-order-status function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});