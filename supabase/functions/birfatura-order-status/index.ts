import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    // Token from header or query string
    const url = new URL(req.url);
    const token = req.headers.get('token') || req.headers.get('x-token') || req.headers.get('x-api-key') || req.headers.get('api-key') || req.headers.get('api_password') || req.headers.get('authorization') || url.searchParams.get('token') || url.searchParams.get('apikey') || url.searchParams.get('apiKey') || '';
    
    console.log('BirFatura order status request received. Token present:', !!token);


    // For now, we'll accept any token (you can validate specific tokens later)
    if (!token) {
      console.log('No token provided');
      return new Response(JSON.stringify({ error: 'Token required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Accept any token for now (BirFatura requires a GUID but we won't validate format)
    // If you later want to lock it down, compare with a stored value in DB/secret
    // if (token !== '...') return new Response(...)


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