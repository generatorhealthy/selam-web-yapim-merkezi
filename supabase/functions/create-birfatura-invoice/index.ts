import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId } = await req.json();
    
    console.log('BirFatura invoice request received for order:', orderId);

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('Order not found:', orderError);
      return new Response(JSON.stringify({ success: false, error: 'Order not found' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // If not in correct status, return success:false but 200
    if (order.status !== 'completed' && order.status !== 'approved') {
      return new Response(JSON.stringify({ success: false, error: 'Order is not in completed/approved status' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (order.invoice_sent) {
      return new Response(JSON.stringify({ success: false, error: 'Invoice already sent for this order' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get BirFatura API key (in a real scenario, you might get this from settings)
    const birfaturaApiKey = 'doktorumol-2025-api-key'; // This should match what you set in BirFatura

    // Prepare invoice data for BirFatura
    const invoiceData = {
      "OrderId": order.id,
      "OrderNumber": order.id.substring(0, 8),
      "OrderDate": order.created_at,
      "CustomerName": order.customer_name,
      "CustomerSurname": "",
      "CustomerEmail": order.customer_email,
      "CustomerPhone": order.customer_phone || "",
      "CustomerTcNo": order.customer_tc_no || "",
      "CustomerTaxNo": order.company_tax_no || "",
      "CustomerTaxOffice": order.company_tax_office || "",
      "BillingAddress": {
        "AddressTitle": "Fatura Adresi",
        "Name": order.customer_name,
        "Address": order.customer_address || "",
        "City": order.customer_city || "",
        "Country": "Türkiye"
      },
      "OrderProducts": [
        {
          "ProductName": order.package_name,
          "ProductQuantity": 1,
          "ProductUnitPriceTaxExcluding": Number(order.amount) / 1.20,
          "ProductUnitPriceTaxIncluding": Number(order.amount),
          "ProductVatRate": 20,
          "ProductCurrency": "TRY"
        }
      ],
      "OrderTotalTaxExcluding": Number(order.amount) / 1.20,
      "OrderTotalTaxIncluding": Number(order.amount),
      "OrderCurrency": "TRY"
    };

    // Call BirFatura API to create invoice
    let birfaturaSuccess = false;
    
    try {
      console.log('Sending invoice data to BirFatura:', JSON.stringify(invoiceData, null, 2));
      
      // Real BirFatura API call - replace with actual endpoint
      const birfaturaResponse = await fetch('https://api.birfatura.com/orders', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${birfaturaApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoiceData)
      });
      
      if (!birfaturaResponse.ok) {
        throw new Error(`BirFatura API responded with status: ${birfaturaResponse.status}`);
      }
      
      const birfaturaResult = await birfaturaResponse.json();
      console.log('BirFatura API response:', birfaturaResult);
      birfaturaSuccess = true;
      
    } catch (error) {
      console.error('BirFatura API error:', error);
      // Return error if BirFatura fails
      return new Response(JSON.stringify({ 
        success: false, 
        error: `BirFatura API error: ${error.message}` 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update order with invoice information
    const { error: updateError } = await supabase
      .from('orders')
      .update({ 
        invoice_sent: true,
        invoice_number: `INV-${order.id.substring(0, 8)}`,
        invoice_date: new Date().toISOString()
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('Database update error:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to update order' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Invoice created successfully',
      invoiceNumber: `INV-${order.id.substring(0, 8)}`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in create-birfatura-invoice function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});