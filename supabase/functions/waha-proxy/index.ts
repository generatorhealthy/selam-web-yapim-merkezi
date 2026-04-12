const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const jsonHeaders = { ...corsHeaders, 'Content-Type': 'application/json' };

const respond = (payload: Record<string, unknown>) =>
  new Response(JSON.stringify(payload), {
    status: 200,
    headers: jsonHeaders,
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let wahaUrl = Deno.env.get('WAHA_API_URL');
    if (wahaUrl && !wahaUrl.startsWith('http')) {
      wahaUrl = 'https://' + wahaUrl;
    }
    if (wahaUrl) {
      wahaUrl = wahaUrl.replace(/\/+$/, '');
    }
    const wahaApiKey = Deno.env.get('WAHA_API_KEY');

    if (!wahaUrl) {
      return respond({ success: false, error: 'WAHA_API_URL not configured' });
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
      case 'auth.qr': {
        endpoint = `/api/${sessionName}/auth/qr`;
        const qrRes = await fetch(`${wahaUrl}${endpoint}`, { headers });
        const qrText = await qrRes.text();
        const qrData = (() => {
          try {
            return qrText ? JSON.parse(qrText) : null;
          } catch {
            return null;
          }
        })();

        if (!qrRes.ok) {
          return respond({
            success: false,
            status: qrRes.status,
            error: qrData?.message || qrData?.error || qrText || 'QR alınamadı',
            data: qrData,
          });
        }

        return respond({ success: true, status: qrRes.status, data: qrData });
      }
      case 'screenshot': {
        endpoint = `/api/screenshot?session=${sessionName}`;
        const screenRes = await fetch(`${wahaUrl}${endpoint}`, { headers });
        if (!screenRes.ok) {
          const errorText = await screenRes.text();
          return respond({
            success: false,
            status: screenRes.status,
            error: errorText || 'Screenshot failed',
          });
        }
        const screenData = await screenRes.arrayBuffer();
        return new Response(screenData, {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'image/png' },
        });
      }
      case 'sendText':
        endpoint = `/api/sendText`;
        method = 'POST';
        body = JSON.stringify({
          session: sessionName,
          chatId: payload.chatId,
          text: payload.text,
        });
        break;
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
      case 'chats.list':
        endpoint = `/api/${sessionName}/chats`;
        break;
      case 'chats.messages':
        endpoint = `/api/${sessionName}/chats/${payload.chatId}/messages?limit=${payload.limit || 50}`;
        break;
      case 'contacts.list':
        endpoint = `/api/contacts?session=${sessionName}`;
        break;
      default:
        return respond({ success: false, error: `Unknown action: ${action}` });
    }

    const fetchOptions: RequestInit = { method, headers };
    if (body) fetchOptions.body = body;

    console.log(`WAHA Proxy: ${method} ${wahaUrl}${endpoint}`);
    const response = await fetch(`${wahaUrl}${endpoint}`, fetchOptions);
    const text = await response.text();
    const data = (() => {
      try {
        return text ? JSON.parse(text) : null;
      } catch {
        return text || null;
      }
    })();

    return respond({
      success: response.ok,
      status: response.status,
      data,
      error: response.ok ? null : (typeof data === 'object' && data !== null ? (data as Record<string, unknown>).message ?? (data as Record<string, unknown>).error : data) || `WAHA request failed with status ${response.status}`,
    });
  } catch (error) {
    console.error('WAHA Proxy error:', error);
    return respond({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});
