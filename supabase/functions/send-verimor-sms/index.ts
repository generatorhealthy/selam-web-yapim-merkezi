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
    const cleanPhone = phone.replace(/[^\d+]/g, '');
    
    // Verimor API endpoint
    const verimorUrl = 'https://sms.verimor.com.tr/v2/send.json';
    
    const smsData = {
      username: username,
      password: password,
      source_addr: 'SELAMWEB', // Your registered sender ID
      messages: [
        {
          msg: message,
          dest: cleanPhone
        }
      ]
    };

    console.log('Sending SMS to:', cleanPhone);
    console.log('Message:', message);

    const response = await fetch(verimorUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(smsData)
    });

    const result = await response.json();
    
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