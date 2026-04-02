import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UnpaidCustomer {
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  monthly_payment_day: number;
  current_month: number | null;
  paid_months: number[];
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('VERIMOR_BULUTSANTRAL_API_KEY');
    if (!apiKey) {
      throw new Error('VERIMOR_BULUTSANTRAL_API_KEY is not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get request body (optional filters)
    let requestBody: any = {};
    try {
      requestBody = await req.json();
    } catch {
      // No body is fine
    }

    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth() + 1; // 1-based

    // Find unpaid customers: payment day has passed but current month not in paid_months
    const { data: customers, error: fetchError } = await supabase
      .from('automatic_orders')
      .select('customer_name, customer_phone, customer_email, monthly_payment_day, current_month, paid_months')
      .eq('is_active', true);

    if (fetchError) {
      throw new Error(`Failed to fetch customers: ${fetchError.message}`);
    }

    // Filter unpaid customers
    const unpaidCustomers: UnpaidCustomer[] = (customers || []).filter((c: any) => {
      const paidMonths = c.paid_months || [];
      const customerCurrentMonth = c.current_month || 1;
      
      // Check if the customer's payment day has passed this month
      // and their current subscription month is not yet paid
      if (c.monthly_payment_day <= currentDay) {
        // Check if current subscription month is not paid
        return !paidMonths.includes(customerCurrentMonth);
      }
      return false;
    });

    if (unpaidCustomers.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No unpaid customers found for today',
        called_count: 0
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Build phone list with personalized TTS messages
    const phoneList = unpaidCustomers
      .filter(c => c.customer_phone && c.customer_phone.trim() !== '')
      .map(c => {
        // Clean phone number
        let phone = c.customer_phone.replace(/\D/g, '');
        if (phone.startsWith('0')) {
          phone = '90' + phone.substring(1);
        } else if (!phone.startsWith('90') && phone.startsWith('5')) {
          phone = '90' + phone;
        }

        const paymentDay = c.monthly_payment_day;
        
        // Professional TTS message
        const phrase = `Sayın ${c.customer_name}, bugün aylık abonelik ödeme gününüzdür. Ödemenizi bugün içerisinde gerçekleştirip tarafımıza bilgi vermenizi rica ederiz. Detaylı bilgi için 0216 706 06 11 numarasından bize ulaşabilirsiniz. İyi günler dileriz. Doktorum Ol.`;

        return {
          phone,
          phrase,
          lang: "tr-TR"
        };
      });

    if (phoneList.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No valid phone numbers found for unpaid customers',
        called_count: 0
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Create IVR campaign via Verimor Bulutsantral API
    const campaignData = {
      call_type: "ivr",
      name: `Odeme Hatirlatma - ${today.toISOString().split('T')[0]}`,
      date_range_begin: today.toISOString().split('T')[0],
      date_range_end: today.toISOString().split('T')[0],
      time_range_begin: "10:00",
      time_range_end: "18:00",
      active_days: [1, 2, 3, 4, 5], // Monday to Friday
      ring_timeout: 30,
      cli: "902167060611",
      call_retries: 2,
      digit_timeout: 4,
      digit_retries: 1,
      // When customer presses 1, connect to queue/operator
      digit_target_1: "hangup",
      timeout_target: "hangup",
      invalid_target: "hangup",
      phone_list: phoneList,
      is_commercial: false,
      recording_enabled: true
    };

    console.log('Creating IVR campaign with', phoneList.length, 'numbers');
    console.log('Campaign data:', JSON.stringify(campaignData, null, 2));

    const verimorResponse = await fetch(
      `https://api.bulutsantralim.com/ivr_campaigns.json?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(campaignData)
      }
    );

    const responseText = await verimorResponse.text();
    console.log('Verimor IVR response status:', verimorResponse.status);
    console.log('Verimor IVR response:', responseText);

    if (!verimorResponse.ok) {
      throw new Error(`Verimor IVR API error (${verimorResponse.status}): ${responseText}`);
    }

    // Log the call campaign
    const calledNames = unpaidCustomers
      .filter(c => c.customer_phone && c.customer_phone.trim() !== '')
      .map(c => c.customer_name);

    return new Response(JSON.stringify({
      success: true,
      message: `IVR campaign created successfully for ${phoneList.length} unpaid customers`,
      called_count: phoneList.length,
      called_customers: calledNames,
      campaign_id: responseText,
      campaign_date: today.toISOString().split('T')[0]
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error: any) {
    console.error('Error creating IVR campaign:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
};

serve(handler);
