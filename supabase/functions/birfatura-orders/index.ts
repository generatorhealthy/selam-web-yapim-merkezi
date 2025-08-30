import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, token, x-token, x-api-key, api-key, api_password',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const token = req.headers.get('x-api-key') || req.headers.get('token') || req.headers.get('x-token') || req.headers.get('authorization') || url.searchParams.get('token') || url.searchParams.get('apiKey') || url.searchParams.get('apikey') || '';

    if (!token) {
      return new Response(JSON.stringify({ error: 'Token required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('birfatura-orders: TEST MODE - returning minimal test data...');

    // Create minimal test data for BirFatura - all fields with valid values
    const birfaturaOrders = [
      {
        "OrderId": Date.now(),
        "OrderNumber": String(Date.now()),
        "OrderDate": "29.08.2025 20:48:14",
        "OrderStatusId": 1,
        "PaymentMethodId": 1,
        "CustomerName": "Test Müşteri",
        "CustomerSurname": "Test Soyad",
        "CustomerEmail": "test@doktorumol.com.tr",
        "CustomerPhone": "02167060611",
        "CustomerTcNo": "11111111111",
        "CustomerTaxNo": "1111111111",
        "CustomerTaxOffice": "Merkez",
        "BillingAddress": "Test Adres İstanbul",
        "ShippingAddress": "Test Adres İstanbul",
        "OrderProducts": [
          {
            "ProductId": 1,
            "ProductName": "Test Hizmet Paketi",
            "ProductQuantity": 1,
            "ProductUnitPriceTaxExcluding": 83.33,
            "ProductUnitPriceTaxIncluding": 100.00,
            "ProductTotalPriceTaxExcluding": 83.33,
            "ProductTotalPriceTaxIncluding": 100.00,
            "ProductVatRate": 20,
            "ProductVatAmount": 16.67,
            "ProductCurrency": "TRY"
          }
        ],
        "OrderTotalPriceTaxExcluding": 83.33,
        "OrderTotalPriceTaxIncluding": 100.00,
        "OrderTotalVatAmount": 16.67,
        "OrderCurrency": "TRY",
        "OrderNote": "Test Sipariş",
        "CargoTrackingNumber": "",
        "InvoiceLink": ""
      }
    ];

    // Wrap exactly as BirFatura expects
    const response = { "Orders": birfaturaOrders };

    console.log('birfatura-orders: returning TEST orders count =', birfaturaOrders.length);
    console.log('birfatura-orders: TEST response =', JSON.stringify(response, null, 2));

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in birfatura-orders function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});