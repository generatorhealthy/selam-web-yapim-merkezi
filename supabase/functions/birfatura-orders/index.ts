import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

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
    
    if (!token) {
      return new Response(JSON.stringify({ error: 'Token required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check token
    if (token !== 'doktorumol-2025-api-key' && !token.includes('doktorumol-2025-api-key')) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse BirFatura body: { orderStatusId, startDateTime, endDateTime }
    let payload: any = {};
    try { payload = await req.json(); } catch (_) { payload = {}; }

    const orderStatusId: number | undefined = payload.orderStatusId ?? payload.OrderStatusId;
    const startDateTime: string | undefined = payload.startDateTime ?? payload.StartDateTime;
    const endDateTime: string | undefined = payload.endDateTime ?? payload.EndDateTime;

    function parseBirFaturaDate(s?: string): string {
      if (!s || typeof s !== 'string') {
        return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      }
      // Expected format: DD.MM.YYYY HH:mm:ss
      const [datePart, timePart = '00:00:00'] = s.split(' ');
      const [dd, mm, yyyy] = datePart.split('.').map(Number);
      const [HH, MM, SS] = timePart.split(':').map((v) => Number(v));
      const d = new Date(yyyy, (mm || 1) - 1, dd || 1, HH || 0, MM || 0, SS || 0);
      return d.toISOString();
    }

    const startISO = parseBirFaturaDate(startDateTime);
    const endISO = parseBirFaturaDate(endDateTime || new Date().toISOString());

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Build query
    let query = supabase
      .from('orders')
      .select('*')
      .gte('created_at', startISO)
      .lte('created_at', endISO);

    // Filter by status if provided
    if (orderStatusId) {
      const statusMapping: { [key: number]: string } = {
        1: 'pending',
        2: 'approved',
        3: 'processing',
        4: 'shipped',
        5: 'completed',
        6: 'cancelled'
      };
      const status = statusMapping[orderStatusId];
      if (status) query = query.eq('status', status);
    }

    const { data: orders, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return new Response(JSON.stringify({ error: 'Database error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Convert orders to BirFatura format
    const birfaturaOrders = orders?.map(order => ({
      "OrderId": order.id,
      "OrderNumber": order.id.substring(0, 8),
      "OrderDate": order.created_at,
      "OrderStatusId": getStatusId(order.status),
      "PaymentMethodId": order.payment_method === 'credit_card' ? 1 : 2,
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
        "Surname": "",
        "Address": order.customer_address || "",
        "District": "",
        "City": order.customer_city || "",
        "PostalCode": "",
        "Country": "Türkiye"
      },
      "ShippingAddress": {
        "AddressTitle": "Teslimat Adresi",
        "Name": order.customer_name,
        "Surname": "",
        "Address": order.customer_address || "",
        "District": "",
        "City": order.customer_city || "",
        "PostalCode": "",
        "Country": "Türkiye"
      },
      "OrderProducts": [
        {
          "ProductId": 1,
          "ProductName": order.package_name,
          "ProductQuantity": 1,
          "ProductUnitPriceTaxExcluding": Number(order.amount) / 1.20,
          "ProductUnitPriceTaxIncluding": Number(order.amount),
          "ProductTotalPriceTaxExcluding": Number(order.amount) / 1.20,
          "ProductTotalPriceTaxIncluding": Number(order.amount),
          "ProductVatRate": 20,
          "ProductVatAmount": Number(order.amount) - (Number(order.amount) / 1.20),
          "ProductCurrency": "TRY"
        }
      ],
      "OrderTotalTaxExcluding": Number(order.amount) / 1.20,
      "OrderTotalTaxIncluding": Number(order.amount),
      "OrderTotalVatAmount": Number(order.amount) - (Number(order.amount) / 1.20),
      "OrderCurrency": "TRY",
      "OrderNote": "",
      "CargoTrackingNumber": "",
      "InvoiceLink": ""
    })) || [];
    // Wrap exactly as BirFatura expects
    const response = { "Orders": birfaturaOrders };

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

function getStatusId(status: string): number {
  const statusMapping: { [key: string]: number } = {
    'pending': 1,
    'approved': 2,
    'processing': 3,
    'shipped': 4,
    'completed': 5,
    'cancelled': 6
  };
  
  return statusMapping[status] || 1;
}