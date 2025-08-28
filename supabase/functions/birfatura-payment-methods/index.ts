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
    const apiKey = req.headers.get('x-api-key') || req.headers.get('x-apikey') || req.headers.get('apikey') || req.headers.get('api-key') || req.headers.get('api_password') || req.headers.get('api-password') || req.headers.get('token') || req.headers.get('authorization');
    
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('BirFatura payment methods request received');

    // Return payment methods as per BirFatura specification
    const paymentMethods = [
      {
        "PaymentMethodId": 1,
        "PaymentMethodName": "Kredi Kartı"
      },
      {
        "PaymentMethodId": 2,
        "PaymentMethodName": "Banka Havalesi/EFT"
      },
      {
        "PaymentMethodId": 3,
        "PaymentMethodName": "Kapıda Ödeme"
      },
      {
        "PaymentMethodId": 4,
        "PaymentMethodName": "PayPal"
      }
    ];

    return new Response(JSON.stringify(paymentMethods), {
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