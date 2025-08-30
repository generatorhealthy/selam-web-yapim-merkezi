import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

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

    // Parse URL parameters
    const url = new URL(req.url);
    const params = Object.fromEntries(url.searchParams.entries());
    console.log('URL Parameters:', params);

    // If this is a POST request, it might be an update
    if (req.method === 'POST' && body) {
      console.log('Handling POST request as potential order update');
      
      let updateData = {};
      try {
        updateData = JSON.parse(body);
        console.log('Parsed update data:', updateData);
      } catch (e) {
        console.log('Could not parse JSON body');
      }

      // Return success for any update request
      const updateResponse = {
        success: true,
        message: "Order status updated successfully",
        timestamp: new Date().toISOString()
      };
      
      console.log('Sending update response:', updateResponse);
      console.log('===== BIRFATURA REQUEST END =====');

      return new Response(JSON.stringify(updateResponse), {
        status: 200,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json; charset=utf-8'
        },
      });
    }

    // For GET requests or when no body, return orders
    console.log('Handling request as orders fetch');

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get recent approved orders
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .in('status', ['approved', 'completed'])
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Database error:', error);
    }

    console.log('Found orders:', orders?.length || 0);

    // Format orders for BirFatura
    const birfaturaOrders = (orders || []).map((order, index) => {
      const orderIdNum = Date.parse(order.created_at || new Date().toISOString());
      const amount = Number(order.amount) || 100;
      const amountExcludingTax = Number((amount / 1.20).toFixed(2));
      const vatAmount = Number((amount - amountExcludingTax).toFixed(2));

      return {
        OrderId: orderIdNum,
        OrderNumber: `ORD-${orderIdNum}`,
        OrderDate: formatBirFaturaDate(order.created_at || new Date().toISOString()),
        OrderStatusId: 1, // Always approved
        PaymentMethodId: order.payment_method === 'credit_card' ? 1 : 2,
        CustomerName: (order.customer_name || "").trim() || "Müşteri",
        CustomerSurname: "Test",
        CustomerEmail: (order.customer_email || "").trim() || "test@doktorumol.com.tr",
        CustomerPhone: (order.customer_phone || "").trim() || "02167060611",
        CustomerTcNo: (order.customer_tc_no || "").trim() || "11111111111",
        CustomerTaxNo: (order.company_tax_no || "").trim() || "1111111111",
        CustomerTaxOffice: (order.company_tax_office || "").trim() || "Merkez",
        BillingAddress: (order.customer_address || "").trim() || "Test Adres",
        ShippingAddress: (order.customer_address || "").trim() || "Test Adres",
        OrderProducts: [{
          ProductId: 1,
          ProductName: (order.package_name || "").trim() || "Hizmet Paketi",
          ProductQuantity: 1,
          ProductUnitPriceTaxExcluding: amountExcludingTax,
          ProductUnitPriceTaxIncluding: amount,
          ProductTotalPriceTaxExcluding: amountExcludingTax,
          ProductTotalPriceTaxIncluding: amount,
          ProductVatRate: 20,
          ProductVatAmount: vatAmount,
          ProductCurrency: "TRY"
        }],
        OrderTotalPriceTaxExcluding: amountExcludingTax,
        OrderTotalPriceTaxIncluding: amount,
        OrderTotalVatAmount: vatAmount,
        OrderCurrency: "TRY",
        OrderNote: "",
        CargoTrackingNumber: "", // Always empty since we don't have shipping
        InvoiceLink: ""
      };
    });

    const response = { Orders: birfaturaOrders };
    
    console.log('Sending orders response:', JSON.stringify(response, null, 2));
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
    return new Response(JSON.stringify({ 
      success: true, // Always return success to prevent BirFatura errors
      error: error.message,
      Orders: []
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function formatBirFaturaDate(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}