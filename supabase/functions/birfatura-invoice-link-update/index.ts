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
    const url = new URL(req.url);
    const token = req.headers.get('token') || req.headers.get('x-token') || req.headers.get('authorization') || url.searchParams.get('token') || '';
    // Token optional for now

    // Parse body (accept both TR and EN keys)
    let payload: any = {};
    try { payload = await req.json(); } catch (_) { payload = {}; }

    const orderId = payload.orderId ?? payload.OrderId;
    const invoiceLink = payload.faturaUrl ?? payload.InvoiceLink;
    const invoiceNo = payload.faturaNo ?? payload.InvoiceNo;
    const invoiceDateStr = payload.faturaTarihi ?? payload.InvoiceDate;

    // Helper to parse BirFatura date format "DD.MM.YYYY HH:mm:ss"
    const parseDateTR = (s?: string): string | undefined => {
      if (!s) return undefined;
      const [datePart, timePart = '00:00:00'] = s.split(' ');
      const [dd, mm, yyyy] = datePart.split('.').map(Number);
      const [HH, MM, SS] = timePart.split(':').map(Number);
      const d = new Date(yyyy, (mm || 1) - 1, dd || 1, HH || 0, MM || 0, SS || 0);
      return d.toISOString();
    };

    const invoiceDateISO = parseDateTR(invoiceDateStr);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Update order with invoice information (best effort)
    const { error } = await supabase
      .from('orders')
      .update({ 
        invoice_sent: true,
        invoice_date: invoiceDateISO || new Date().toISOString(),
      })
      .eq('id', orderId);


    if (error) {
      console.error('Database error:', error);
      return new Response(JSON.stringify({ error: 'Database error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, message: 'Invoice link updated successfully' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in birfatura-invoice-link-update function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});