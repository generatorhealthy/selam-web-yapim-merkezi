import { verifyBirfatura } from '../_shared/birfaturaAuth.ts';
import { acceptInvoiceReceipt, parseInvoiceReceipt } from '../_shared/invoiceReceipt.ts';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders as sdkCorsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const corsHeaders = { ...sdkCorsHeaders,
  'Access-Control-Allow-Headers': `${sdkCorsHeaders['Access-Control-Allow-Headers']}, token, x-token, x-api-key, api-key, api_password, apipassword`,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
});
serve(async req => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (!verifyBirfatura(req)) return json({ error: 'Unauthorized' }, 401);
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  try {
    const body = await req.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) return json({ error: 'invalid_receipt' }, 400);
    const receipt = parseInvoiceReceipt(body);
    if (!receipt) return json({ error: 'invalid_receipt' }, 400);
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    const result = await acceptInvoiceReceipt(receipt, {
      resolve: async reference => {
        let query = supabase.from('orders').select('id,status,invoice_number,created_at').is('deleted_at', null);
        if (/^\d{13}$/.test(reference)) {
          // Preserve the actual pull feed's timestamp-based numeric OrderId;
          // reject collisions instead of choosing an arbitrary customer.
          const ms = Number(reference);
          query = query.gte('created_at', new Date(ms).toISOString()).lt('created_at', new Date(ms + 1).toISOString());
        } else query = query.eq('id', reference);
        const { data, error } = await query.limit(2);
        if (error) throw error;
        return (data ?? []).map(o => ({ id: o.id, status: o.status, number: o.invoice_number }));
      },
      storeOnce: async (id, proof) => {
        const { data, error } = await supabase.from('orders').update({
          invoice_number: proof.number, invoice_date: proof.issuedAt, invoice_sent: true,
        }).eq('id', id).is('deleted_at', null).is('invoice_number', null)
          .in('status', ['approved', 'completed']).select('id');
        if (error) throw error;
        return (data?.length ?? 0) === 1;
      },
    });
    return json(result, result.success ? 200 : 409);
  } catch {
    return json({ success: false, error: 'invoice_receipt_unavailable' }, 503);
  }
});
