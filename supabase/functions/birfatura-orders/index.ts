import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, token, x-token, x-api-key, api-key, api_password',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const method = req.method;
    const token = req.headers.get('x-api-key') || req.headers.get('token') || req.headers.get('x-token') || req.headers.get('authorization') || url.searchParams.get('token') || url.searchParams.get('apiKey') || url.searchParams.get('apikey') || '';

    console.log('birfatura-orders: REQUEST METHOD =', method);
    console.log('birfatura-orders: TOKEN =', token ? 'EXISTS' : 'MISSING');
    console.log('birfatura-orders: URL PARAMS =', Object.fromEntries(url.searchParams.entries()));

    if (!token) {
      return new Response(JSON.stringify({ error: 'Token required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse request body for POST requests
    let requestBody = {};
    if (method === 'POST') {
      try {
        requestBody = await req.json();
        console.log('birfatura-orders: REQUEST BODY =', JSON.stringify(requestBody));
      } catch (e) {
        console.log('birfatura-orders: NO JSON BODY');
      }
    }

    // Ultra basit test response - BirFatura'nın beklediği minimum format
    const response = {
      "Orders": [
        {
          "OrderId": 1756512500000,
          "OrderNumber": "TEST001",
          "OrderDate": "29.08.2025 21:15:00",
          "OrderStatusId": 1,
          "PaymentMethodId": 1,
          "CustomerName": "Test Müşteri",
          "CustomerSurname": "Test",
          "CustomerEmail": "test@doktorumol.com.tr",
          "CustomerPhone": "02167060611",
          "CustomerTcNo": "11111111111",
          "CustomerTaxNo": "1111111111",
          "CustomerTaxOffice": "Merkez",
          "BillingAddress": "Test Adres",
          "ShippingAddress": "Test Adres",
          "OrderProducts": [
            {
              "ProductId": 1,
              "ProductName": "Test Hizmet",
              "ProductQuantity": 1,
              "ProductUnitPriceTaxExcluding": 100,
              "ProductUnitPriceTaxIncluding": 120,
              "ProductTotalPriceTaxExcluding": 100,
              "ProductTotalPriceTaxIncluding": 120,
              "ProductVatRate": 20,
              "ProductVatAmount": 20,
              "ProductCurrency": "TRY"
            }
          ],
          "OrderTotalPriceTaxExcluding": 100,
          "OrderTotalPriceTaxIncluding": 120,
          "OrderTotalVatAmount": 20,
          "OrderCurrency": "TRY",
          "OrderNote": "",
          "CargoTrackingNumber": "",
          "InvoiceLink": ""
        }
      ]
    };

    console.log('birfatura-orders: SENDING RESPONSE =', JSON.stringify(response, null, 2));

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('birfatura-orders: ERROR =', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});