import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const normalize = (s?: string) =>
  (s || '').toLocaleLowerCase('tr-TR').trim();

const removeTurkishChars = (s: string) =>
  s
    .replace(/ı/g, 'i')
    .replace(/İ/g, 'i')
    .replace(/ş/g, 's')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c');

const normalizeForMatch = (s: string) => removeTurkishChars(normalize(s));

function detectIntent(text: string): 'price' | 'general' {
  const t = normalizeForMatch(text);
  const priceWords = [
    'fiyat',
    'ucret',
    'seans',
    'kac',
    'kac tl',
    'ne kadar',
    'ucretli',
    'parasi',
    'odeme',
    'tl',
    'paraya',
    'odem',
    'maas',
    'maaş',
    'bedel',
    'ucreti',
    'fiyati',
    'fiyatlari',
    'seans ucreti',
    'terapi ucreti',
    'danismanlik ucreti',
    'ne kadara',
  ];
  if (priceWords.some((w) => t.includes(w))) return 'price';
  return 'general';
}

function parsePhone(chatId: string) {
  return String(chatId || '').split('@')[0].replace(/[^0-9]/g, '');
}

function isAutoReplyable(message: Record<string, unknown>) {
  if (message.fromMe === true) return false;
  const chatId = String(message.chatId || '');
  if (!chatId) return false;
  if (chatId.endsWith('@g.us')) return false;
  if (chatId.includes('@broadcast')) return false;
  const body = String(message.body || '').trim();
  if (body.length < 2) return false;
  const type = String(message.mediaType || message.type || 'chat');
  if (!['chat', 'text', ''].includes(type)) return false;
  return true;
}

async function hasActiveReferralSession(
  supabase: ReturnType<typeof createClient>,
  phone: string,
) {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  if (!cleanPhone) return false;
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from('whatsapp_bot_sessions')
    .select('id')
    .ilike('phone', `%${cleanPhone}%`)
    .not('state', 'in', '(completed,declined,no_specialist)')
    .gt('last_message_at', since)
    .limit(1)
    .maybeSingle();
  return !!data;
}

async function sendViaWaha(
  sessionName: string,
  chatId: string,
  text: string,
) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')?.replace(/\/+$/, '');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  const res = await fetch(`${supabaseUrl}/functions/v1/waha-proxy`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${serviceRoleKey}`,
    },
    body: JSON.stringify({
      action: 'sendText',
      sessionName,
      payload: { chatId, text },
    }),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => 'Unknown WAHA error');
    throw new Error(`WAHA sendText failed: ${res.status} ${errorText}`);
  }

  return res.json();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const secret =
    Deno.env.get('WAHA_BOT_SECRET') ||
    Deno.env.get('WAHA_WEBHOOK_SECRET');
  const received =
    req.headers.get('x-bot-secret') ||
    req.headers.get('x-waha-token') ||
    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim() ||
    '';

  if (secret && received !== secret) {
    return json({ ok: false, error: 'Unauthorized' }, 401);
  }

  try {
    const body = (await req.json()) as Record<string, unknown>;
    const message =
      (body.message as Record<string, unknown> | undefined) ||
      (body.payload as Record<string, unknown> | undefined) ||
      body;

    if (!isAutoReplyable(message)) {
      return json({ ok: true, skipped: true, reason: 'not replyable' });
    }

    const sessionName = String(
      message.session_name ?? body.session_name ?? body.session ?? message.session ?? '',
    );
    const chatId = String(message.chatId || '');
    const phone = parsePhone(chatId);
    const incomingBody = String(message.body || '');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: settings } = await supabase
      .from('whatsapp_bot_settings')
      .select('auto_reply_enabled, auto_reply_test_mode, auto_reply_price_text, auto_reply_general_text, auto_reply_cooldown_minutes')
      .limit(1)
      .maybeSingle();

    if (!settings || !settings.auto_reply_enabled) {
      return json({ ok: true, skipped: true, reason: 'auto_reply disabled' });
    }

    if (await hasActiveReferralSession(supabase, phone)) {
      return json({ ok: true, skipped: true, reason: 'active referral session' });
    }

    const cooldownMinutes = Math.max(1, Number(settings.auto_reply_cooldown_minutes) || 60);
    const cooldownSince = new Date(
      Date.now() - cooldownMinutes * 60 * 1000,
    ).toISOString();
    const { data: lastReply } = await supabase
      .from('whatsapp_bot_auto_replies')
      .select('created_at')
      .eq('session_name', sessionName)
      .eq('chat_id', chatId)
      .gt('created_at', cooldownSince)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastReply) {
      return json({ ok: true, skipped: true, reason: 'cooldown' });
    }

    const intent = detectIntent(incomingBody);
    const replyText =
      intent === 'price'
        ? String(settings.auto_reply_price_text)
        : String(settings.auto_reply_general_text);

    const isTest = settings.auto_reply_test_mode !== false;
    let error: string | null = null;

    if (!isTest) {
      try {
        await sendViaWaha(sessionName, chatId, replyText);
      } catch (e) {
        error = (e as Error).message;
      }
    }

    await supabase.from('whatsapp_bot_auto_replies').insert({
      session_name: sessionName,
      chat_id: chatId,
      phone,
      incoming_body: incomingBody,
      intent,
      reply_text: replyText,
      is_test: isTest,
      error,
    });

    return json({
      ok: true,
      sent: !isTest && !error,
      testMode: isTest,
      intent,
      replyText,
      error,
    });
  } catch (e) {
    console.error('wa-bot-chat-handler error:', e);
    return json({ ok: false, error: (e as Error).message }, 500);
  }
});
