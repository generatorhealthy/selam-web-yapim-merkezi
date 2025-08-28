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
    // BirFatura sends token in header as 'token'
    const token = req.headers.get('token') || req.headers.get('x-token') || req.headers.get('authorization');
    
    console.log('BirFatura payment methods request received with token:', token ? 'present' : 'missing');

    if (!token) {
      return new Response(JSON.stringify({ error: 'Token required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Accept any token for now; BirFatura requires GUID but we won't validate format
    // Later we can restrict via a stored secret


    // Return payment methods exactly as per BirFatura specification  
    const response = {
      "PaymentMethods": [
        {
          "Id": 1,
          "Value": "Kredi Kartı"
        },
        {
          "Id": 2,
          "Value": "Banka Havalesi/EFT"
        },
        {
          "Id": 3,
          "Value": "Kapıda Ödeme"
        },
        {
          "Id": 4,
          "Value": "PayPal"
        }
      ]
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in birfatura-payment-methods function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});