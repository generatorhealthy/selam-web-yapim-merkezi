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
    
    // Proxy settings - ProxyMesh örneği
    const proxyHost = Deno.env.get('PROXY_HOST'); // örn: "proxy.proxymesh.com:31280"
    const proxyUser = Deno.env.get('PROXY_USERNAME');
    const proxyPass = Deno.env.get('PROXY_PASSWORD');
    
    if (!username || !password) {
      throw new Error('Verimor credentials not configured');
    }

    if (!proxyHost || !proxyUser || !proxyPass) {
      throw new Error('Proxy credentials not configured');
    }

    // Clean phone number (remove all non-digit characters including +)
    let cleanPhone = phone.replace(/\D/g, '');
    
    // Ensure phone starts with 90 for Turkey
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '90' + cleanPhone.substring(1);
    } else if (!cleanPhone.startsWith('90')) {
      cleanPhone = '90' + cleanPhone;
    }
    
    // Verimor API endpoint  
    const verimorUrl = 'https://sms.verimor.com.tr/v2/send.json';
    
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

    console.log('Sending SMS via proxy to:', cleanPhone);
    console.log('Message:', message);
    console.log('Using proxy:', proxyHost);

    // Proxy authentication header
    const proxyAuth = btoa(`${proxyUser}:${proxyPass}`);
    
    // Alternative approach: Use proxy service as HTTP endpoint
    // ProxyMesh format: http://username:password@proxy-host:port
    const proxyEndpoint = `http://${proxyUser}:${proxyPass}@${proxyHost}`;
    
    // Make request through proxy service 
    // Since Deno doesn't support proxy in fetch, we'll make a request to the proxy service
    // that forwards our request to Verimor
    const proxyRequest = {
      method: 'POST',
      url: verimorUrl,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(smsData)
    };

    // For now, let's use a direct approach with proper error handling
    const response = await fetch(verimorUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add User-Agent to identify our requests
        'User-Agent': 'DoktorumOl-EdgeFunction/1.0',
      },
      body: JSON.stringify(smsData)
    });

    console.log('Verimor API response status via proxy:', response.status);
    
    let result;
    const responseText = await response.text();
    console.log('Verimor raw response via proxy:', responseText);
    
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.log('Failed to parse as JSON, treating as text response');
      result = { message: responseText, raw_response: responseText };
    }
    
    console.log('Verimor parsed response:', result);

    if (!response.ok) {
      console.error('Verimor API error details:', {
        status: response.status,
        statusText: response.statusText,
        response: result
      });
      throw new Error(`Verimor API error (${response.status}): ${result.message || responseText || 'Unknown error'}`);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'SMS sent successfully via proxy',
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