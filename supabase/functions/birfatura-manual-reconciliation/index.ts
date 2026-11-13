import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { handleInvoiceReconciliation } from '../_shared/invoiceReconciliation.ts';

/** No invoice issuance, no mutation, no provider POST. Existing receipt and
 * enqueue endpoints retain their own unchanged authorization gates. */
Deno.serve(req => handleInvoiceReconciliation(req, {
  headers: corsHeaders,
  authorize: async request => {
    const url = Deno.env.get('SUPABASE_URL');
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const token = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '').trim();
    if (!url || !key) return { ok: false, status: 503 };
    if (!token) return { ok: false, status: 401 };
    const admin = createClient(url, key);
    const { data: { user }, error } = await admin.auth.getUser(token);
    if (error || !user) return { ok: false, status: 401 };
    const { data: profile, error: profileError } = await admin.from('user_profiles')
      .select('role,is_approved').eq('user_id', user.id).maybeSingle();
    if (profileError || !profile || profile.role !== 'admin' || profile.is_approved !== true)
      return { ok: false, status: 403 };
    return { ok: true };
  },
  read: async id => {
    const url = Deno.env.get('SUPABASE_URL');
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !key) throw new Error('configuration_unavailable');
    const admin = createClient(url, key);
    const { data, error } = await admin.from('orders')
      .select('id,status,invoice_sent,invoice_number,invoice_date,created_at')
      .eq('id', id).is('deleted_at', null).maybeSingle();
    if (error) throw error;
    return data ? {
      id: data.id, status: data.status, queued: data.invoice_sent === true,
      number: data.invoice_number, issuedAt: data.invoice_date, createdAt: data.created_at,
    } : null;
  },
}));