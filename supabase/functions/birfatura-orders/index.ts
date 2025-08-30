import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': '*',
};

serve(async (req) => {
  console.log('===== BIRFATURA REQUEST START =====');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Headers:', Object.fromEntries(req.headers.entries()));
  
  if (req.method === 'OPTIONS') {
    console.log('CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let body = null;
    try {
      body = await req.text();
      console.log('Request Body:', body);
    } catch (e) {
      console.log('No body or error reading body:', e);
    }

    // En basit possible response
    const orders = [
      {
        OrderId: 123456,
        OrderNumber: "ORD-123456",
        OrderDate: "29.08.2025 21:30:00",
        OrderStatusId: 1,
        PaymentMethodId: 1,
        CustomerName: "Test Müşteri",
        CustomerSurname: "Test",
        CustomerEmail: "test@test.com",
        CustomerPhone: "5551234567",
        CustomerTcNo: "12345678901",
        CustomerTaxNo: "1234567890",
        CustomerTaxOffice: "Test",
        BillingAddress: "Test Adres",
        ShippingAddress: "Test Adres",
        OrderProducts: [{
          ProductId: 1,
          ProductName: "Test Ürün",
          ProductQuantity: 1,
          ProductUnitPriceTaxExcluding: 100.0,
          ProductUnitPriceTaxIncluding: 120.0,
          ProductTotalPriceTaxExcluding: 100.0,
          ProductTotalPriceTaxIncluding: 120.0,
          ProductVatRate: 20,
          ProductVatAmount: 20.0,
          ProductCurrency: "TRY"
        }],
        OrderTotalPriceTaxExcluding: 100.0,
        OrderTotalPriceTaxIncluding: 120.0,
        OrderTotalVatAmount: 20.0,
        OrderCurrency: "TRY",
        OrderNote: "",
        CargoTrackingNumber: "",
        InvoiceLink: ""
      }
    ];

    const response = { Orders: orders };
    
    console.log('Sending response:', JSON.stringify(response, null, 2));
    console.log('===== BIRFATURA REQUEST END =====');

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json; charset=utf-8'
      },
    });

  } catch (error) {
    console.error('ERROR:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});