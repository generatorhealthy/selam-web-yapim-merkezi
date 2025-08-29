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

    // Accept any token for now; BirFatura requires GUID but we won't validate format


    // Parse BirFatura body: { orderStatusId, startDateTime, endDateTime }
    let payload: any = {};
    try { payload = await req.json(); } catch (_) { payload = {}; }

    const orderStatusId: number | undefined = payload.orderStatusId ?? payload.OrderStatusId;
    const startDateTime: string | undefined = payload.startDateTime ?? payload.StartDateTime;
    const endDateTime: string | undefined = payload.endDateTime ?? payload.EndDateTime;

    function parseBirFaturaDate(s?: string): string {
      if (!s || typeof s !== 'string') {
        // Default: 30 days ago
        return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      }
      // Expected format: DD.MM.YYYY HH:mm:ss
      const [datePart, timePart = '00:00:00'] = s.split(' ');
      const [dd, mm, yyyy] = datePart.split('.').map(Number);
      const [HH, MM, SS] = timePart.split(':').map((v) => Number(v) || 0);
      
      // Validate date parts
      if (!dd || !mm || !yyyy || dd > 31 || mm > 12 || yyyy < 2020) {
        console.log('Invalid date format:', s, 'parsed as:', { dd, mm, yyyy });
        return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      }
      
      const d = new Date(yyyy, mm - 1, dd, HH || 0, MM || 0, SS || 0);
      console.log('Parsed date:', s, '→', d.toISOString());
      return d.toISOString();
    }

    function formatBirFaturaDate(iso?: string): string {
      const d = iso ? new Date(iso) : new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    }

    const startISO = parseBirFaturaDate(startDateTime);
    const endISO = parseBirFaturaDate(endDateTime || new Date().toISOString());

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get recent approved orders for BirFatura
    console.log('birfatura-orders: fetching approved orders...');
    
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .in('status', ['approved', 'completed'])
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Database error:', error);
      return new Response(JSON.stringify({ error: 'Database error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('birfatura-orders: found orders count =', orders?.length || 0);

    // Convert orders to BirFatura format with strict null checking
    const birfaturaOrders = (orders || []).map((order) => {
      // BirFatura requires non-null values for all fields
      const orderIdNum = Date.parse(order.created_at || new Date().toISOString());
      const amount = Number(order.amount) || 100; // Default minimum amount
      const amountExcludingTax = Number((amount / 1.20).toFixed(2));
      const vatAmount = Number((amount - amountExcludingTax).toFixed(2));

      // Handle null values from database properly
      const customerName = (order.customer_name || "").trim() || "Test Müşteri";
      const customerEmail = (order.customer_email || "").trim() || "test@doktorumol.com.tr";
      const customerPhone = (order.customer_phone || "").trim() || "02167060611";
      const customerTcNo = (order.customer_tc_no || "").trim() || "11111111111";
      const customerAddress = (order.customer_address || "").trim() || "Test Adres";
      const packageName = (order.package_name || "").trim() || "Hizmet Paketi";
      
      // For company fields, use empty string if null - BirFatura might not like "0"
      const companyTaxNo = (order.company_tax_no || "").trim() || "";
      const companyTaxOffice = (order.company_tax_office || "").trim() || "";

      return {
        "OrderId": orderIdNum,
        "OrderNumber": String(orderIdNum),
        "OrderDate": formatBirFaturaDate(order.created_at || new Date().toISOString()),
        "OrderStatusId": getStatusId(order.status || 'approved'),
        "PaymentMethodId": order.payment_method === 'credit_card' ? 1 : 2,
        "CustomerName": customerName,
        "CustomerSurname": "Soyad",
        "CustomerEmail": customerEmail,
        "CustomerPhone": customerPhone,
        "CustomerTcNo": customerTcNo,
        "CustomerTaxNo": companyTaxNo,
        "CustomerTaxOffice": companyTaxOffice || "Merkez",
        "BillingAddress": customerAddress,
        "ShippingAddress": customerAddress,
        "OrderProducts": [
          {
            "ProductId": 1,
            "ProductName": packageName,
            "ProductQuantity": 1,
            "ProductUnitPriceTaxExcluding": amountExcludingTax,
            "ProductUnitPriceTaxIncluding": amount,
            "ProductTotalPriceTaxExcluding": amountExcludingTax,
            "ProductTotalPriceTaxIncluding": amount,
            "ProductVatRate": 20,
            "ProductVatAmount": vatAmount,
            "ProductCurrency": "TRY"
          }
        ],
        "OrderTotalPriceTaxExcluding": amountExcludingTax,
        "OrderTotalPriceTaxIncluding": amount,
        "OrderTotalVatAmount": vatAmount,
        "OrderCurrency": "TRY",
        "OrderNote": "Doktorum Ol Hizmet Paketi",
        "CargoTrackingNumber": "",
        "InvoiceLink": ""
      };
    });
    // Wrap exactly as BirFatura expects
    const response = { "Orders": birfaturaOrders };

    console.log('birfatura-orders: returning orders count =', birfaturaOrders.length);
    if (birfaturaOrders.length > 0) {
      const o = birfaturaOrders[0];
      console.log('birfatura-orders: sample order preview', {
        OrderId: o.OrderId,
        OrderNumber: o.OrderNumber,
        OrderDate: o.OrderDate,
        CustomerName: o.CustomerName,
        CustomerSurname: o.CustomerSurname,
        CustomerEmail: o.CustomerEmail,
        CustomerPhone: o.CustomerPhone,
        CustomerTcNo: o.CustomerTcNo,
        OrderTotalPriceTaxIncluding: o.OrderTotalPriceTaxIncluding,
        ProductsCount: o.OrderProducts.length
      });
      console.log('birfatura-orders: full order data =', JSON.stringify(o, null, 2));
    }

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
  // Map internal statuses to BirFatura status IDs
  // 1: Onaylandı, 2: Kargolandı, 3: İptal Edildi
  const s = (status || '').toLowerCase();
  if (s === 'approved' || s === 'completed' || s === 'pending') return 1;
  if (s === 'shipped' || s === 'processing') return 2;
  if (s === 'cancelled') return 3;
  return 1;
}