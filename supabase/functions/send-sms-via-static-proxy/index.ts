import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SmsRequest {
  phone: string;
  message: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone, message }: SmsRequest = await req.json();
    
    // Verimor credentials
    const username = Deno.env.get('VERIMOR_USERNAME');
    const password = Deno.env.get('VERIMOR_PASSWORD');
    
    // Relay and ScrapingBee configuration
    const relayUrl = Deno.env.get('SMS_RELAY_URL');
    const relayToken = Deno.env.get('SMS_RELAY_TOKEN');
    const scrapingBeeApiKey = Deno.env.get('SCRAPINGBEE_API_KEY');
    
    if (!username || !password) {
      throw new Error('Verimor credentials not configured');
    }

    if (!relayUrl && !scrapingBeeApiKey) {
      throw new Error('No proxy configured: set SMS_RELAY_URL or SCRAPINGBEE_API_KEY');
    }
    // Clean phone number (remove spaces, dashes, etc.)
    let cleanPhone = phone.replace(/[^\d+]/g, '');
    
    // Ensure phone starts with 90 for Turkey
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '90' + cleanPhone.substring(1);
    } else if (!cleanPhone.startsWith('90')) {
      cleanPhone = '90' + cleanPhone;
    }
    
    // Verimor API data
    const sender = (Deno.env.get('SMS_SENDER') || Deno.env.get('VERIMOR_SENDER') || '').trim();
    if (!sender) {
      throw new Error('Missing SMS_SENDER secret (approved Verimor sender title)');
    }

    console.log('Using sender (source_addr):', sender);

    const smsData = {
      username: username,
      password: password,
      source_addr: sender, // Must match an approved Verimor sender title
      source_addr_type: '5', // 5 = Alphanumeric sender
      custom_id: Date.now().toString(),
      datacoding: '0',
      valid_for: '48:00',
      send_at: '',
      datacoding_lock: '0',
      messages: [
        {
          msg: message,
          dest: cleanPhone,
        },
      ],
    };

    const useRelay = !!relayUrl;
    console.log(useRelay ? 'Using RELAY to send SMS' : 'Using ScrapingBee proxy to send SMS', { to: cleanPhone });
    console.log('Message:', message);

    let fetchUrl = '';
    let fetchOptions: RequestInit = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(smsData)
    };

    if (useRelay && relayUrl) {
      // Use user's static IP relay
      fetchUrl = relayUrl;
      if (relayToken) {
        (fetchOptions.headers as Record<string, string>)['Authorization'] = `Bearer ${relayToken}`;
      }
    } else {
      // Fallback to ScrapingBee static proxy
      const scrapingBeeUrl = `https://app.scrapingbee.com/api/v1/?api_key=${scrapingBeeApiKey}&url=${encodeURIComponent('https://sms.verimor.com.tr/v2/send.json')}&render_js=false&premium_proxy=true&method=POST&forward_headers=true`;
      fetchUrl = scrapingBeeUrl;
      (fetchOptions.headers as Record<string, string>)['Spb-Content-Type'] = 'application/json';
    }

    let response = await fetch(fetchUrl, fetchOptions);

    console.log('Proxy response status:', response.status);
    console.log('Proxy response headers:', Object.fromEntries(response.headers.entries()));
    
    let result;
    let responseText = await response.text();
    console.log('Raw proxy response:', responseText);
    
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.log('Failed to parse as JSON, treating as text response');
      result = { message: responseText, raw_response: responseText };
    }
    
    console.log('Parsed response:', result);

    let attemptedFallback = false;

    if (!response.ok) {
      console.error('Proxy request error details:', {
        status: response.status,
        statusText: response.statusText,
        response: result
      });

      const shouldTryFallback = useRelay && !!scrapingBeeApiKey && (
        response.status === 403 ||
        (typeof responseText === 'string' && responseText.toLowerCase().includes('izin'))
      );

      if (shouldTryFallback) {
        try {
          console.log('Trying fallback via ScrapingBee static proxy...');
          const scrapingBeeUrl = `https://app.scrapingbee.com/api/v1/?api_key=${scrapingBeeApiKey}&url=${encodeURIComponent('https://sms.verimor.com.tr/v2/send.json')}&render_js=false&premium_proxy=true&country_code=tr&method=POST&forward_headers=true`;
          const fbOptions: RequestInit = {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Spb-Content-Type': 'application/json',
            },
            body: JSON.stringify(smsData),
          };
          response = await fetch(scrapingBeeUrl, fbOptions);
          console.log('Fallback ScrapingBee response status:', response.status);
          responseText = await response.text();
          console.log('Raw fallback response:', responseText);
          try {
            result = JSON.parse(responseText);
          } catch {
            console.log('Failed to parse fallback as JSON, treating as text');
            result = { message: responseText, raw_response: responseText };
          }
          attemptedFallback = true;
        } catch (fbErr) {
          console.error('Fallback via ScrapingBee failed:', fbErr);
        }
      }

      if (!response.ok) {
        throw new Error(`Proxy request error (${response.status}): ${result.message || responseText || 'Unknown error'}`);
      }
    }
    return new Response(JSON.stringify({ 
      success: true, 
      message: attemptedFallback
        ? 'SMS sent successfully via static IP proxy (fallback)'
        : (useRelay ? 'SMS sent successfully via relay' : 'SMS sent successfully via static IP proxy'),
      data: result 
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error('Error sending SMS via proxy:', error);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
};

serve(handler);