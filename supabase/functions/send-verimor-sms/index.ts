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
    
    const username = Deno.env.get('VERIMOR_USERNAME');
    const password = Deno.env.get('VERIMOR_PASSWORD');
    
    if (!username || !password) {
      throw new Error('Verimor credentials not configured');
    }

    // Clean phone number (remove spaces, dashes, etc.)
    let cleanPhone = phone.replace(/[^\d+]/g, '');
    
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
      source_addr: '02167060611',
      custom_id: Date.now().toString(),
      datacoding: '0',
      messages: [
        {
          msg: message,
          dest: cleanPhone
        }
      ]
    };

    console.log('Sending SMS to:', cleanPhone);
    console.log('Message:', message);
    console.log('SMS Data:', JSON.stringify(smsData, null, 2));

    const response = await fetch(verimorUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(smsData)
    });

    console.log('Verimor API response status:', response.status);
    console.log('Verimor API response headers:', Object.fromEntries(response.headers.entries()));
    
    const result = await response.json();
    console.log('Verimor response body:', JSON.stringify(result, null, 2));
    
    console.log('Verimor response:', result);

    if (!response.ok) {
      throw new Error(`Verimor API error: ${result.message || 'Unknown error'}`);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'SMS sent successfully',
      data: result 
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error('Error sending SMS:', error);
    
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