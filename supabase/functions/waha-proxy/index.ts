const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const jsonHeaders = { ...corsHeaders, 'Content-Type': 'application/json' };

const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = '';

  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }

  return btoa(binary);
};

const normalizeQrPayload = (payload: unknown, contentType: string | null) => {
  if (!payload) {
    return null;
  }

  if (typeof payload === 'string') {
    const trimmedPayload = payload.trim();

    if (!trimmedPayload) {
      return null;
    }

    const qrValue = trimmedPayload.startsWith('data:') || trimmedPayload.startsWith('http')
      ? trimmedPayload
      : (contentType?.startsWith('image/') ? `data:${contentType};base64,${trimmedPayload}` : trimmedPayload);

    return {
      value: qrValue,
      qr: qrValue,
      raw: trimmedPayload,
    };
  }

  if (typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    const candidates = [record.qr, record.value, record.data, record.base64, record.image];
    const firstString = candidates.find((candidate): candidate is string => typeof candidate === 'string' && candidate.trim().length > 0);

    if (!firstString) {
      return record;
    }

    const qrValue = firstString.startsWith('data:') || firstString.startsWith('http')
      ? firstString
      : `data:image/png;base64,${firstString}`;

    return {
      ...record,
      value: qrValue,
      qr: qrValue,
      raw: firstString,
    };
  }

  return null;
};

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
        const qrHeaders = {
          ...headers,
          Accept: 'application/json, image/png;q=0.9, */*;q=0.8',
        };
        const qrRes = await fetch(`${wahaUrl}${endpoint}`, { headers: qrHeaders });
        const qrContentType = qrRes.headers.get('content-type');

        let qrData: Record<string, unknown> | null = null;
        let qrErrorText: string | null = null;

        if (qrContentType?.startsWith('image/')) {
          const qrImageBuffer = await qrRes.arrayBuffer();
          const dataUrl = `data:${qrContentType};base64,${arrayBufferToBase64(qrImageBuffer)}`;
          qrData = {
            value: dataUrl,
            qr: dataUrl,
            raw: dataUrl,
          };
        } else {
          const qrText = await qrRes.text();
          qrErrorText = qrText || null;

          const parsedPayload = (() => {
            try {
              return qrText ? JSON.parse(qrText) : null;
            } catch {
              return qrText || null;
            }
          })();

          qrData = normalizeQrPayload(parsedPayload, qrContentType);
        }

        if (!qrRes.ok) {
          return respond({
            success: false,
            status: qrRes.status,
            error: qrData?.message || qrData?.error || qrErrorText || 'QR alınamadı',
            data: qrData,
          });
        }

        if (!qrData) {
          return respond({
            success: false,
            status: qrRes.status,
            error: 'QR verisi henüz hazır değil',
            data: null,
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
        {
          const safeLimit = Math.min(Math.max(Number(payload?.limit) || 50, 1), 100);
          const params = new URLSearchParams({ limit: String(safeLimit) });

          if (typeof payload?.offset === 'number' && Number.isFinite(payload.offset) && payload.offset >= 0) {
            params.set('offset', String(payload.offset));
          }

          if (typeof payload?.downloadMedia === 'boolean') {
            params.set('downloadMedia', String(payload.downloadMedia));
          }

          endpoint = `/api/${sessionName}/chats/${payload.chatId}/messages?${params.toString()}`;
        }
        break;
      case 'contacts.list':
        endpoint = `/api/contacts?session=${sessionName}`;
        break;
      case 'contacts.profile-picture':
        endpoint = `/api/contacts/profile-picture?contactId=${payload.contactId}&session=${sessionName}`;
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
