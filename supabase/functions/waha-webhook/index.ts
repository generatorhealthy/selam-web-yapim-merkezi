import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Optional webhook secret validation (enforced when WAHA_WEBHOOK_SECRET is set)
  const WAHA_WEBHOOK_SECRET = Deno.env.get('WAHA_WEBHOOK_SECRET');
  if (WAHA_WEBHOOK_SECRET) {
    const token =
      req.headers.get('x-waha-token') ||
      req.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim() ||
      '';
    if (token !== WAHA_WEBHOOK_SECRET) {
      return json({ error: 'Unauthorized' }, 401);
    }
  }

  try {
    const body = await req.json();
    console.log('WAHA Webhook received:', JSON.stringify(body).substring(0, 500));

    const event = body.event ?? body.type ?? '';

    // Handle message events
    if (!event.includes('message') && !event.includes('Message')) {
      return json({ ok: true, skipped: true });
    }

    const payload = body.payload ?? body.data ?? body;
    const session = body.session ?? payload?.session ?? body.me?.id ?? '';

    if (!session) {
      console.warn('No session in webhook payload');
      return json({ ok: true, skipped: true });
    }

    // Extract message data
    const message = payload?.message ?? payload ?? {};
    const fromMe = Boolean(message.fromMe ?? message._data?.id?.fromMe ?? false);
    const chatId = String(
      message.chatId ?? message.from ?? message.to ??
      message._data?.id?.remote ?? message.id?.remote ?? ''
    );
    const messageId = String(
      message.id?._serialized ?? message.id ??
      message._data?.id?._serialized ?? ''
    );
    const messageBody = String(message.body ?? message._data?.body ?? message.text ?? '');
    const timestamp = Number(message.timestamp ?? message._data?.t ?? message.messageTimestamp ?? Math.floor(Date.now() / 1000));
    const hasMedia = Boolean(message.hasMedia ?? message._data?.hasMedia ?? false);
    const mediaType = message.type ?? message._data?.type ?? null;
    const senderName = String(
      message._data?.notifyName ?? message.notifyName ??
      message.pushName ?? message.senderName ?? ''
    );

    if (!chatId) {
      console.warn('No chatId in webhook message');
      return json({ ok: true, skipped: true });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error } = await supabase.from('whatsapp_messages').upsert(
      {
        session_name: session,
        chat_id: chatId,
        message_id: messageId || null,
        body: messageBody,
        from_me: fromMe,
        timestamp,
        has_media: hasMedia,
        media_type: mediaType,
        sender_name: senderName || null,
        raw_data: message,
      },
      {
        onConflict: 'session_name,chat_id,message_id',
        ignoreDuplicates: true,
      }
    );

    if (error) {
      console.error('Failed to store message:', error);
    } else {
      console.log(`Message stored: session=${session} chat=${chatId} fromMe=${fromMe}`);
    }

    // Trigger auto-reply handler for incoming client messages
    if (!fromMe && chatId && messageBody.trim().length > 1) {
      try {
        const { data: settings } = await supabase
          .from('whatsapp_bot_settings')
          .select('auto_reply_enabled')
          .limit(1)
          .maybeSingle();

        if (settings?.auto_reply_enabled) {
          const handlerUrl = `${supabaseUrl.replace(/\/+$/, '')}/functions/v1/wa-bot-chat-handler`;
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
          };
          if (WAHA_WEBHOOK_SECRET) {
            headers['x-bot-secret'] = WAHA_WEBHOOK_SECRET;
          }

          const handlerBody = JSON.stringify({
            session_name: session,
            chatId,
            message_id: messageId,
            body: messageBody,
            from_me: fromMe,
            timestamp,
            has_media: hasMedia,
            media_type: mediaType,
            sender_name: senderName,
          });

          // Fire-and-forget: never block the webhook response for the bot
          fetch(handlerUrl, {
            method: 'POST',
            headers,
            body: handlerBody,
          }).catch((err) => console.error('wa-bot-chat-handler call failed:', err));
        }
      } catch (e) {
        console.error('Auto-reply trigger error:', e);
      }
    }

    return json({ ok: true });
  } catch (err) {
    console.error('Webhook error:', err);
    return json({ ok: false, error: String(err) }, 200); // Return 200 to prevent WAHA retries
  }
});
