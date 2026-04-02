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

    let unpaidCustomers: UnpaidCustomer[] = [];

    // Test mode: directly call a specific number
    if (requestBody.test_mode && requestBody.test_phone) {
      unpaidCustomers = [{
        customer_name: requestBody.test_name || 'Test Müşteri',
        customer_phone: requestBody.test_phone,
        customer_email: requestBody.test_email || '',
        monthly_payment_day: requestBody.test_payment_day || currentDay,
        current_month: null,
        paid_months: []
      }];
      console.log('TEST MODE: Calling', requestBody.test_phone);
    } else {
      // Find unpaid customers: payment day has passed but current month not in paid_months
      const { data: customers, error: fetchError } = await supabase
        .from('automatic_orders')
        .select('customer_name, customer_phone, customer_email, monthly_payment_day, current_month, paid_months')
        .eq('is_active', true);

      if (fetchError) {
        throw new Error(`Failed to fetch customers: ${fetchError.message}`);
      }

      // Filter unpaid customers
      unpaidCustomers = (customers || []).filter((c: any) => {
        const paidMonths = c.paid_months || [];
        const customerCurrentMonth = c.current_month || 1;
        
        if (c.monthly_payment_day <= currentDay) {
          return !paidMonths.includes(customerCurrentMonth);
        }
        return false;
      });
    }

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

    const preparedCustomers = unpaidCustomers
      .filter(c => c.customer_phone && c.customer_phone.trim() !== '')
      .map(c => {
        let phone = c.customer_phone.replace(/\D/g, '');
        if (phone.startsWith('0')) {
          phone = '90' + phone.substring(1);
        } else if (!phone.startsWith('90') && phone.startsWith('5')) {
          phone = '90' + phone;
        }

        const ttsMessage = `Sayın ${c.customer_name}. Bugün aylık abonelik ödeme gününüzdür. Ödemenizi bugün içerisinde gerçekleştirip tarafımıza bilgi vermenizi rica ederiz. Detaylı bilgi için 0216 706 06 11 numarasından bize ulaşabilirsiniz. İyi günler dileriz. Doktorum Ol.`
          .replace(/[\/#]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        return {
          customer_name: c.customer_name,
          phone,
          tts_target: `tts/tr-TR/${ttsMessage}`,
        };
      });

    if (preparedCustomers.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No valid phone numbers found for unpaid customers',
        called_count: 0
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const isTestMode = requestBody.test_mode === true;
    const campaignResults: Array<{ customer_name: string; campaign_id: string }> = [];

    for (const customer of preparedCustomers) {
      const campaignData: any = {
        call_type: "ivr",
        name: `Odeme Hatirlatma - ${customer.customer_name} - ${today.toISOString().split('T')[0]}`,
        date_range_begin: today.toISOString().split('T')[0],
        date_range_end: today.toISOString().split('T')[0],
        time_range_begin: isTestMode ? "00:00" : "10:00",
        time_range_end: isTestMode ? "23:59" : "18:00",
        active_days: isTestMode ? [1, 2, 3, 4, 5, 6, 7] : [1, 2, 3, 4, 5],
        max_thread_count: 1,
        ring_timeout: 30,
        cli: "902167060611",
        call_retries: isTestMode ? 0 : 2,
        digit_retries: 0,
        digit_timeout: 1,
        digit_target_1: customer.tts_target,
        timeout_target: customer.tts_target,
        invalid_target: customer.tts_target,
        phone_list: [{ phone: customer.phone, phrase: "#131891" }],
        is_commercial: false,
        recording_enabled: true
      };

      console.log('Creating IVR campaign for', customer.customer_name, customer.phone);
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
        throw new Error(`Verimor IVR API error for ${customer.customer_name} (${verimorResponse.status}): ${responseText}`);
      }

      campaignResults.push({
        customer_name: customer.customer_name,
        campaign_id: responseText.trim(),
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: `IVR campaign created successfully for ${campaignResults.length} unpaid customers`,
      called_count: campaignResults.length,
      called_customers: campaignResults.map(c => c.customer_name),
      campaign_id: campaignResults[0]?.campaign_id ?? null,
      campaign_ids: campaignResults.map(c => c.campaign_id),
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
