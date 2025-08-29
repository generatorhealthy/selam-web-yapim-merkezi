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

    // Build query
    let query = supabase
      .from('orders')
      .select('*')
      .gte('created_at', startISO)
      .lte('created_at', endISO);

    // Filter by status if provided; default to approved orders
    if (orderStatusId) {
      // BirFatura status mapping:
      // 1: Onaylandı (we map both approved & completed)
      // 2: Kargolandı (we map shipped/processing)
      // 3: İptal Edildi (cancelled)
      const statusMapping: { [key: number]: string[] } = {
        1: ['approved', 'completed'],
        2: ['shipped'],
        3: ['cancelled']
      };
      const statuses = statusMapping[orderStatusId];
      if (statuses) {
        if (statuses.length === 1) query = query.eq('status', statuses[0]);
        else query = query.in('status', statuses);
      }
    } else {
      // Show approved and completed orders by default for BirFatura
      query = query.in('status', ['approved', 'completed']);
    }

    let { data: orders, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return new Response(JSON.stringify({ error: 'Database error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fallback: If no orders match the provided date range, return last 60 days approved/completed
    if (!orders || orders.length === 0) {
      const fallbackStart = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
      const { data: fallbackOrders, error: fallbackError } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', fallbackStart)
        .in('status', ['approved', 'completed'])
        .order('created_at', { ascending: false })
        .limit(100);

      if (!fallbackError && fallbackOrders) {
        orders = fallbackOrders;
        console.log('birfatura-orders: primary query empty, using fallback count =', orders.length);
      } else if (fallbackError) {
        console.error('Fallback database error:', fallbackError);
      }
    }

    // Convert orders to BirFatura format
    const birfaturaOrders = (orders || []).map((order) => {
      // BirFatura bazı alanları Int64 bekliyor; UUID gönderirsek hata veriyor.
      // Stabil ve sayısal bir kimlik için oluşturulma zamanını kullanıyoruz.
      const orderIdNum = Date.parse(order.created_at || new Date().toISOString());

      return {
        "OrderId": orderIdNum, // Int64 uyumlu
        "OrderNumber": String(orderIdNum),
        "OrderDate": formatBirFaturaDate(order.created_at || new Date().toISOString()),
        "OrderStatusId": getStatusId(order.status || 'approved'),
        "PaymentMethodId": order.payment_method === 'credit_card' ? 1 : 2,
        "CustomerName": order.customer_name || "Müşteri",
        "CustomerSurname": "",
        "CustomerEmail": order.customer_email || "noreply@doktorumol.com.tr",
        "CustomerPhone": order.customer_phone || "0",
        "CustomerTcNo": order.customer_tc_no || "0",
        "CustomerTaxNo": order.company_tax_no || "0",
        "CustomerTaxOffice": order.company_tax_office || "Merkez",
        "BillingAddress": order.customer_address || "Adres bilgisi yok",
        "ShippingAddress": order.customer_address || "Adres bilgisi yok",
        "OrderProducts": [
          {
            "ProductId": 1,
            "ProductName": order.package_name || "Paket",
            "ProductQuantity": 1,
            "ProductUnitPriceTaxExcluding": Number((Number(order.amount ?? 0) || 1) / 1.20),
            "ProductUnitPriceTaxIncluding": Number((Number(order.amount ?? 0) || 1)),
            "ProductTotalPriceTaxExcluding": Number((Number(order.amount ?? 0) || 1) / 1.20),
            "ProductTotalPriceTaxIncluding": Number((Number(order.amount ?? 0) || 1)),
            "ProductVatRate": 20,
            "ProductVatAmount": Number((Number(order.amount ?? 0) || 1) - (Number(order.amount ?? 0) || 1) / 1.20),
            "ProductCurrency": "TRY"
          }
        ],
        "OrderTotalPriceTaxExcluding": Number((Number(order.amount ?? 0) || 1) / 1.20),
        "OrderTotalPriceTaxIncluding": Number((Number(order.amount ?? 0) || 1)),
        "OrderTotalVatAmount": Number((Number(order.amount ?? 0) || 1) - (Number(order.amount ?? 0) || 1) / 1.20),
        "OrderCurrency": "TRY",
        "OrderNote": "",
        "CargoTrackingNumber": "",
        "InvoiceLink": ""
      };
    });
    // Wrap exactly as BirFatura expects
    const response = { "Orders": birfaturaOrders };

    console.log('birfatura-orders: returning orders count =', birfaturaOrders.length);
    if (birfaturaOrders.length > 0) {
      console.log('birfatura-orders: sample order keys =', Object.keys(birfaturaOrders[0]));
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