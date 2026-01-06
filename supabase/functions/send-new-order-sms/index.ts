import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OrderNotification {
  customerName: string;
  customerPhone: string;
  packageName: string;
  amount: number;
  paymentMethod: string;
  orderDate: string;
  customerCity?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { customerName, customerPhone, packageName, amount, paymentMethod, orderDate, customerCity }: OrderNotification = await req.json();
    
    const username = Deno.env.get('VERIMOR_USERNAME');
    const password = Deno.env.get('VERIMOR_PASSWORD');
    
    if (!username || !password) {
      throw new Error('Verimor credentials not configured');
    }

    // SMS alıcı numarası - sadece admin
    const recipients = ['905316852275'];
    
    // Telefon numarasını formatlama
    let formattedPhone = customerPhone || '';
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '+9' + formattedPhone;
    } else if (formattedPhone.startsWith('5')) {
      formattedPhone = '+90' + formattedPhone;
    } else if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+' + formattedPhone;
    }
    
    // SMS mesajı - görüntüdeki formata göre
    const message = `YENI KAYIT! ${customerName} - ${formattedPhone} - ${packageName} - ${customerCity || 'Belirtilmedi'} - ${amount} TL - ${orderDate} B038`;

    console.log('Sending new order SMS to:', recipients);
    console.log('Message:', message);

    // Verimor API endpoint  
    const verimorUrl = 'https://sms.verimor.com.tr/v2/send.json';
    
    const messages = recipients.map(phone => ({
      msg: message,
      dest: phone
    }));

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
      messages: messages
    };

    console.log('SMS Data:', JSON.stringify(smsData, null, 2));

    const response = await fetch(verimorUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(smsData)
    });

    console.log('Verimor API response status:', response.status);
    
    let result;
    const responseText = await response.text();
    console.log('Verimor raw response:', responseText);
    
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
      message: 'Order notification SMS sent successfully',
      recipients: recipients,
      data: result 
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error('Error sending order notification SMS:', error);
    
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
