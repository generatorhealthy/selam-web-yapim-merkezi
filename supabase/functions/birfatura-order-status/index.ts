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
    // BirFatura sends token in header as 'token' (not x-api-key)
    const token = req.headers.get('token') || req.headers.get('x-token') || req.headers.get('authorization');
    
    console.log('BirFatura order status request received with token:', token ? 'present' : 'missing');
    console.log('All headers:', Object.fromEntries(req.headers.entries()));

    // For now, we'll accept any token (you can validate specific tokens later)
    if (!token) {
      console.log('No token provided');
      return new Response(JSON.stringify({ error: 'Token required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if token matches what was configured in BirFatura
    if (token !== 'doktorumol-2025-api-key' && !token.includes('doktorumol-2025-api-key')) {
      console.log('Invalid token:', token);
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Return order statuses exactly as per BirFatura specification
    const response = {
      "OrderStatus": [
        {
          "Id": 1,
          "Value": "Beklemede"
        },
        {
          "Id": 2,
          "Value": "Onaylandı"
        },
        {
          "Id": 3,
          "Value": "Hazırlanıyor"
        },
        {
          "Id": 4,
          "Value": "Kargoya Verildi"
        },
        {
          "Id": 5,
          "Value": "Teslim Edildi"
        },
        {
          "Id": 6,
          "Value": "İptal Edildi"
        }
      ]
    };

    console.log('Returning order statuses:', JSON.stringify(response));

    return new Response(JSON.stringify(response), {
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