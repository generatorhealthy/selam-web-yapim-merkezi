import { verifyAdminOrCron } from "../_shared/adminAuth.ts";
import { queueInvoice } from "../_shared/invoiceQueue.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), {
  status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
});
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  const auth = await verifyAdminOrCron(req);
  if (!auth.ok) return json({ error: auth.error }, auth.status);
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  try {
    const body = await req.json();
    if (typeof body?.orderId !== 'string') return json({ error: 'invalid_order' }, 400);
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    const result = await queueInvoice(body.orderId, {
      read: async (id) => {
        const { data, error } = await supabase.from('orders').select('id,status,invoice_sent').eq('id', id).is('deleted_at', null).maybeSingle();
        if (error) throw error;
        return data ? { id: data.id, status: data.status, queued: data.invoice_sent === true } : null;
      },
      enqueue: async (id) => {
        // Existing BirFatura pull feed consumes invoice_sent=true. Preserve that
        // protocol without inventing an external invoice number or receipt.
        const { data, error } = await supabase.from('orders').update({
          invoice_sent: true, invoice_date: new Date().toISOString(),
        }).eq('id', id).is('deleted_at', null).in('status', ['approved', 'completed'])
          .or('invoice_sent.eq.false,invoice_sent.is.null').select('id');
        if (error) throw error;
        return (data?.length ?? 0) === 1;
      },
    });
    return json({ ...result, message: result.success ? 'Fatura aktarım kuyruğunda; sağlayıcı düzenleme teyidi değildir.' : 'Fatura aktarımı doğrulanamadı.' });
  } catch {
    return json({ success: false, error: 'invoice_queue_unavailable' }, 503);
  }
});
