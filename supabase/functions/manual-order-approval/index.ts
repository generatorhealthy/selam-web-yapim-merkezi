import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3.25.76';

const schema = z.object({ orderId: z.string().uuid(), action: z.enum(['approve', 'pending']), reason: z.string().trim().min(5).max(1000) }).strict();
const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return reply({ error: 'POST gerekli' }, 405);
  const authorization = req.headers.get('Authorization');
  if (!authorization) return reply({ error: 'Yönetici oturumu gerekli' }, 401);
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return reply({ error: 'Sipariş, işlem ve en az beş karakterlik gerekçe gerekli' }, 400);
    const url = Deno.env.get('SUPABASE_URL');
    const anon = Deno.env.get('SUPABASE_ANON_KEY');
    if (!url || !anon) return reply({ error: 'İşlem şu anda kullanılamıyor' }, 503);
    const client = createClient(url, anon, { global: { headers: { Authorization: authorization } } });
    const { data: identity, error: identityError } = await client.auth.getUser();
    if (identityError || !identity.user) return reply({ error: 'Geçerli yönetici oturumu gerekli' }, 401);
    const { data: admin, error: roleError } = await client.rpc('is_admin_user');
    if (roleError || admin !== true) return reply({ error: 'Yalnız yönetici manuel onay verebilir' }, 403);
    const { orderId, action, reason } = parsed.data;
    const { data, error } = await client.rpc('set_manual_order_approval', { p_order_id: orderId, p_action: action, p_reason: reason });
    if (error) return reply({ error: error.code === '42501' ? 'Bu işlem için yetkiniz yok' : 'Sipariş bekleyen, ödenmemiş havale siparişi olmalı ve kayıtlı uzman hesabıyla eşleşmeli' }, error.code === '42501' ? 403 : 409);
    let documents: Record<string, unknown> | null = null;
    if (action === 'approve' && data?.duplicate !== true) {
      // Exact stored order, immutable snapshots, unique content claim; no invoice attachments.
      const sent = await client.functions.invoke('send-order-documents-email', { body: { orderId, documentsOnly: true, message: 'Sipariş belgeleri' } });
      documents = sent.error ? { success: false, message: 'Manuel onay kaydedildi; belge teslimi doğrulanamadı. Yeniden göndermeden teslim durumunu kontrol edin.' } : sent.data;
    }
    return reply({ success: true, ...data, documents });
  } catch {
    return reply({ error: 'İşlem sonucu doğrulanamadı; sipariş durumunu yeniden kontrol edin' }, 500);
  }
});