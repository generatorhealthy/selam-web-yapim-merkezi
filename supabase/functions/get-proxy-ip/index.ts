import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { verifyAdminOrCron } from '../_shared/adminAuth.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') return new Response(JSON.stringify({error: 'Method not allowed'}), {status: 405, headers: {...corsHeaders, 'Content-Type': 'application/json'}});
  const auth = await verifyAdminOrCron(req, ['admin']);
  if (!auth.ok) return new Response(JSON.stringify({error: auth.error}), {status: auth.status, headers: {...corsHeaders, 'Content-Type': 'application/json'}});

  try {
    const scrapingBeeApiKey = Deno.env.get('SCRAPINGBEE_API_KEY');
    
    if (!scrapingBeeApiKey) {
      throw new Error('ScrapingBee API key not configured');
    }

    console.log('Testing ScrapingBee proxy IP...');

    // Use ScrapingBee to get the IP that will be seen by external services
    const scrapingBeeUrl = `https://app.scrapingbee.com/api/v1/?api_key=${scrapingBeeApiKey}&url=${encodeURIComponent('https://api.ipify.org?format=json')}&render_js=false&premium_proxy=true`;
    
    const response = await fetch(scrapingBeeUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    console.log('ScrapingBee response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`ScrapingBee API error: ${response.status} ${response.statusText}`);
    }

    const responseText = await response.text();
    
    let ipData;
    try {
      ipData = JSON.parse(responseText);
    } catch (parseError) {
      throw new Error('Invalid response from IP service');
    }


    return new Response(JSON.stringify({ 
      success: true,
      proxy_ip: ipData.ip,
      message: 'Bu IP adresini Verimor paneline eklemeniz gerekiyor',
      service: 'ScrapingBee Premium Proxy'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error('Proxy lookup failed');
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Proxy lookup failed'
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