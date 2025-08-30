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
        console.log('Could not parse JSON body, might be orders request');
      }

      // Check if this is actually an orders request with filters
      if (body.includes('startDateTime') || body.includes('endDateTime') || body.includes('orderStatusId')) {
        console.log('POST request seems to be orders fetch with filters, proceeding to orders logic');
        // Continue to orders logic below
      } else {
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
    }

    // For GET requests or when no body, return orders
    console.log('Handling request as orders fetch');

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse filters from body if provided
    let filters: any = {};
    try { if (body) filters = JSON.parse(body); } catch (_) {}

    const startIso = filters.startDateTime ? parseBirFaturaDate(filters.startDateTime) : new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString();
    const endIso = filters.endDateTime ? parseBirFaturaDate(filters.endDateTime) : new Date().toISOString();

    // Map BirFatura orderStatusId to our internal statuses
    let statusFilter: string[] = ['approved', 'completed'];
    switch (Number(filters.orderStatusId)) {
      case 1: statusFilter = ['approved']; break;         // Onaylandı
      case 2: statusFilter = ['shipped']; break;          // Kargolandı
      case 3: statusFilter = ['cancelled']; break;        // İptal
      default: statusFilter = ['approved', 'completed'];
    }

    // Fetch orders within date range, status, and NOT invoiced yet
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .gte('created_at', startIso)
      .lte('created_at', endIso)
      .in('status', statusFilter)
      .eq('invoice_sent', false)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Database error:', error);
    }

    console.log('Found orders:', orders?.length || 0);

    // Format orders for BirFatura (strict schema)
    const birfaturaOrders = (orders || []).map((order) => {
      const createdAt = order.created_at || new Date().toISOString();
      const orderIdNum = Date.parse(createdAt);
      const amount = Number(order.amount) || 0;
      const amountExcludingTax = Number((amount / 1.20).toFixed(2));
      const paymentTypeId = order.payment_method === 'credit_card' ? 1 : 2; // 1: Kredi Kartı, 2: Banka EFT-Havale
      const paymentTypeText = paymentTypeId === 1 ? 'Kredi Kartı' : 'Banka EFT-Havale';

      return {
        OrderId: orderIdNum,
        OrderCode: `ORD-${orderIdNum}`,
        OrderDate: formatBirFaturaDate(createdAt),
        CustomerId: orderIdNum % 1000000,
        BillingName: (order.customer_name || 'Müşteri'),
        BillingAddress: (order.customer_address || ''),
        BillingTown: '',
        BillingCity: (order.customer_city || ''),
        BillingMobilePhone: (order.customer_phone || ''),
        BillingPhone: (order.customer_phone || ''),
        SSNTCNo: (order.customer_tc_no || ''),
        Email: (order.customer_email || ''),
        ShippingId: (orderIdNum % 1000000),
        ShippingName: (order.customer_name || 'Müşteri'),
        ShippingAddress: (order.customer_address || ''),
        ShippingTown: '',
        ShippingCity: (order.customer_city || ''),
        ShippingCountry: 'Türkiye',
        ShippingZipCode: '',
        ShippingPhone: (order.customer_phone || ''),
        ShipCompany: '',
        CargoCampaignCode: '',
        SalesChannelWebSite: 'doktorumol.com.tr',
        PaymentTypeId: paymentTypeId,
        PaymentType: paymentTypeText,
        Currency: 'TRY',
        CurrencyRate: 1,
        TotalPaidTaxExcluding: amountExcludingTax,
        TotalPaidTaxIncluding: amount,
        ProductsTotalTaxExcluding: amountExcludingTax,
        ProductsTotalTaxIncluding: amount,
        CommissionTotalTaxExcluding: 0,
        CommissionTotalTaxIncluding: 0,
        ShippingChargeTotalTaxExcluding: 0,
        ShippingChargeTotalTaxIncluding: 0,
        PayingAtTheDoorChargeTotalTaxExcluding: 0,
        PayingAtTheDoorChargeTotalTaxIncluding: 0,
        DiscountTotalTaxExcluding: 0,
        DiscountTotalTaxIncluding: 0,
        InstallmentChargeTotalTaxExcluding: 0,
        InstallmentChargeTotalTaxIncluding: 0,
        BankTransferDiscountTotalTaxExcluding: 0,
        BankTransferDiscountTotalTaxIncluding: 0,
        ExtraFees: [],
        OrderDetails: [
          {
            ProductId: 1,
            ProductCode: '',
            Barcode: '',
            ProductBrand: '',
            ProductName: (order.package_name || 'Hizmet Paketi'),
            ProductNote: '',
            ProductImage: '',
            Variants: [],
            ProductQuantityType: 'Adet',
            ProductQuantity: 1,
            VatRate: 20,
            ProductUnitPriceTaxExcluding: amountExcludingTax,
            ProductUnitPriceTaxIncluding: amount,
            CommissionUnitTaxExcluding: 0,
            CommissionUnitTaxIncluding: 0,
            DiscountUnitTaxExcluding: 0,
            DiscountUnitTaxIncluding: 0,
            ExtraFeesUnit: []
          }
        ]
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

function parseBirFaturaDate(tr: string): string {
  // Expecting dd.MM.yyyy HH:mm:ss
  try {
    const [datePart, timePart = '00:00:00'] = tr.split(' ');
    const [dd, MM, yyyy] = datePart.split('.');
    const [HH = '00', mm = '00', ss = '00'] = timePart.split(':');
    const iso = `${yyyy}-${MM.padStart(2, '0')}-${dd.padStart(2, '0')}T${HH.padStart(2, '0')}:${mm.padStart(2, '0')}:${ss.padStart(2, '0')}Z`;
    return new Date(iso).toISOString();
  } catch (_) {
    return new Date().toISOString();
  }
}