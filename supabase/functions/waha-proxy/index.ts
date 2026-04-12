const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const wahaUrl = Deno.env.get('WAHA_API_URL');
    const wahaApiKey = Deno.env.get('WAHA_API_KEY');

    if (!wahaUrl) {
      return new Response(
        JSON.stringify({ success: false, error: 'WAHA_API_URL not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, sessionName, payload } = await req.json();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (wahaApiKey) {
      headers['X-Api-Key'] = wahaApiKey;
    }

    let endpoint = '';
    let method = 'GET';
    let body: string | undefined;

    switch (action) {
      // Session management
      case 'sessions.list':
        endpoint = '/api/sessions';
        break;
      case 'sessions.start':
        endpoint = '/api/sessions/start';
        method = 'POST';
        body = JSON.stringify({ name: sessionName, config: { webhooks: [] } });
        break;
      case 'sessions.stop':
        endpoint = '/api/sessions/stop';
        method = 'POST';
        body = JSON.stringify({ name: sessionName });
        break;
      case 'sessions.logout':
        endpoint = '/api/sessions/logout';
        method = 'POST';
        body = JSON.stringify({ name: sessionName });
        break;
      case 'sessions.status':
        endpoint = `/api/sessions/${sessionName}`;
        break;

      // QR Code
      case 'auth.qr':
        endpoint = `/api/${sessionName}/auth/qr`;
        // Return raw image
        const qrRes = await fetch(`${wahaUrl}${endpoint}`, { headers });
        if (!qrRes.ok) {
          const errText = await qrRes.text();
          return new Response(
            JSON.stringify({ success: false, error: errText }),
            { status: qrRes.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        // Try to get QR as JSON (base64)
        const qrData = await qrRes.json().catch(() => null);
        if (qrData) {
          return new Response(
            JSON.stringify({ success: true, data: qrData }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        return new Response(
          JSON.stringify({ success: false, error: 'Could not get QR' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      // Screenshot (for showing WhatsApp screen)
      case 'screenshot':
        endpoint = `/api/screenshot?session=${sessionName}`;
        const screenRes = await fetch(`${wahaUrl}${endpoint}`, { headers });
        if (!screenRes.ok) {
          return new Response(
            JSON.stringify({ success: false, error: 'Screenshot failed' }),
            { status: screenRes.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        const screenData = await screenRes.arrayBuffer();
        return new Response(screenData, {
          headers: { ...corsHeaders, 'Content-Type': 'image/png' },
        });

      // Send message
      case 'sendText':
        endpoint = `/api/sendText`;
        method = 'POST';
        body = JSON.stringify({
          session: sessionName,
          chatId: payload.chatId,
          text: payload.text,
        });
        break;

      // Send image
      case 'sendImage':
        endpoint = `/api/sendImage`;
        method = 'POST';
        body = JSON.stringify({
          session: sessionName,
          chatId: payload.chatId,
          file: payload.file,
          caption: payload.caption,
        });
        break;

      // Get chats
      case 'chats.list':
        endpoint = `/api/${sessionName}/chats`;
        break;

      // Get messages from chat
      case 'chats.messages':
        endpoint = `/api/${sessionName}/chats/${payload.chatId}/messages?limit=${payload.limit || 50}`;
        break;

      // Get contacts
      case 'contacts.list':
        endpoint = `/api/contacts?session=${sessionName}`;
        break;

      default:
        return new Response(
          JSON.stringify({ success: false, error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    const fetchOptions: RequestInit = { method, headers };
    if (body) fetchOptions.body = body;

    console.log(`WAHA Proxy: ${method} ${wahaUrl}${endpoint}`);
    const response = await fetch(`${wahaUrl}${endpoint}`, fetchOptions);
    const data = await response.json().catch(() => ({}));

    return new Response(
      JSON.stringify({ success: response.ok, data, status: response.status }),
      { 
        status: response.ok ? 200 : response.status, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('WAHA Proxy error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
