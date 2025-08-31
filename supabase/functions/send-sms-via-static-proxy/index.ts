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
    
    // ScrapingBee proxy credentials (statik IP proxy servisi)
    const scrapingBeeApiKey = Deno.env.get('SCRAPINGBEE_API_KEY');
    
    if (!username || !password) {
      throw new Error('Verimor credentials not configured');
    }

    if (!scrapingBeeApiKey) {
      throw new Error('ScrapingBee API key not configured');
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
    const smsData = {
      username: username,
      password: password,
      source_addr: '902167060611',
      source_addr_type: '5',
      msg_header: 'Doktorum Ol',
      custom_id: Date.now().toString(),
      datacoding: '0',
      valid_for: '48:00',
      send_at: '',
      datacoding_lock: '0',
      messages: [
        {
          msg: message,
          dest: cleanPhone
        }
      ]
    };

    console.log('Sending SMS via ScrapingBee proxy to:', cleanPhone);
    console.log('Message:', message);

    // ScrapingBee proxy endpoint with POST forwarding
    const scrapingBeeUrl = `https://app.scrapingbee.com/api/v1/?api_key=${scrapingBeeApiKey}&url=${encodeURIComponent('https://sms.verimor.com.tr/v2/send.json')}&render_js=false&premium_proxy=true&method=POST&forward_headers=true`;
    
    // Make POST request through ScrapingBee proxy (forward JSON body and headers)
    const response = await fetch(scrapingBeeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Forwarded to target by ScrapingBee because forward_headers=true
        'Spb-Content-Type': 'application/json',
      },
      body: JSON.stringify(smsData)
    });

    console.log('ScrapingBee proxy response status:', response.status);
    console.log('ScrapingBee proxy response headers:', Object.fromEntries(response.headers.entries()));
    
    let result;
    const responseText = await response.text();
    console.log('Verimor raw response via ScrapingBee:', responseText);
    
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.log('Failed to parse as JSON, treating as text response');
      result = { message: responseText, raw_response: responseText };
    }
    
    console.log('Verimor parsed response:', result);

    if (!response.ok) {
      console.error('Proxy request error details:', {
        status: response.status,
        statusText: response.statusText,
        response: result
      });
      throw new Error(`Proxy request error (${response.status}): ${result.message || responseText || 'Unknown error'}`);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'SMS sent successfully via static IP proxy',
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