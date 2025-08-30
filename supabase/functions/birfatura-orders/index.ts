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
    console.log('birfatura-orders: ULTRA SIMPLE TEST MODE');

    // Ultra basit test - sadece gerekli minimum alanlar
    const response = {
      "Orders": [
        {
          "OrderId": 123456789,
          "OrderNumber": "123456789",
          "OrderDate": "29.08.2025 21:00:00",
          "OrderStatusId": 1,
          "PaymentMethodId": 1,
          "CustomerName": "Test",
          "CustomerSurname": "User",
          "CustomerEmail": "test@test.com",
          "CustomerPhone": "5551234567",
          "CustomerTcNo": "12345678901",
          "CustomerTaxNo": "1234567890",
          "CustomerTaxOffice": "Test",
          "BillingAddress": "Test Address",
          "ShippingAddress": "Test Address",
          "OrderProducts": [
            {
              "ProductId": 1,
              "ProductName": "Test Product",
              "ProductQuantity": 1,
              "ProductUnitPriceTaxExcluding": 100.0,
              "ProductUnitPriceTaxIncluding": 120.0,
              "ProductTotalPriceTaxExcluding": 100.0,
              "ProductTotalPriceTaxIncluding": 120.0,
              "ProductVatRate": 20,
              "ProductVatAmount": 20.0,
              "ProductCurrency": "TRY"
            }
          ],
          "OrderTotalPriceTaxExcluding": 100.0,
          "OrderTotalPriceTaxIncluding": 120.0,
          "OrderTotalVatAmount": 20.0,
          "OrderCurrency": "TRY",
          "OrderNote": "Test",
          "CargoTrackingNumber": "123",
          "InvoiceLink": "https://test.com"
        }
      ]
    };

    console.log('birfatura-orders: SIMPLE response =', JSON.stringify(response));

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});