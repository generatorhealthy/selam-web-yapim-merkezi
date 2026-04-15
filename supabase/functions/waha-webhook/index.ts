import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log('WAHA Webhook received:', JSON.stringify(body).substring(0, 500));

    const event = body.event ?? body.type ?? '';
    
    // Handle message events
    if (!event.includes('message') && !event.includes('Message')) {
      return new Response(JSON.stringify({ ok: true, skipped: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payload = body.payload ?? body.data ?? body;
    const session = body.session ?? payload?.session ?? body.me?.id ?? '';
    
    if (!session) {
      console.warn('No session in webhook payload');
      return new Response(JSON.stringify({ ok: true, skipped: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
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
      return new Response(JSON.stringify({ ok: true, skipped: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
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

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Webhook error:', err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 200, // Return 200 to prevent WAHA retries
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
