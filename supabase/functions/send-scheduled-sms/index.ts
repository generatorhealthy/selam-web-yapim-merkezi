import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get pending SMS that are due
    const { data: pendingSms, error: fetchError } = await supabase
      .from('scheduled_sms')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_at', new Date().toISOString())
      .limit(50);

    if (fetchError) throw fetchError;

    if (!pendingSms || pendingSms.length === 0) {
      return new Response(JSON.stringify({ success: true, message: 'No pending SMS', count: 0 }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    console.log(`Processing ${pendingSms.length} scheduled SMS messages`);

    let sentCount = 0;
    for (const sms of pendingSms) {
      try {
        // Send via the existing SMS function
        const response = await fetch(`${supabaseUrl}/functions/v1/send-sms-via-static-proxy`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
          },
          body: JSON.stringify({ phone: sms.phone, message: sms.message }),
        });

        const result = await response.json();

        if (result.success) {
          await supabase
            .from('scheduled_sms')
            .update({ status: 'sent', sent_at: new Date().toISOString() })
            .eq('id', sms.id);
          sentCount++;
          console.log(`SMS sent to ${sms.phone} for ${sms.customer_name}`);
        } else {
          await supabase
            .from('scheduled_sms')
            .update({ status: 'failed', error_message: result.error || 'Unknown error' })
            .eq('id', sms.id);
          console.error(`SMS failed for ${sms.phone}: ${result.error}`);
        }
      } catch (err: any) {
        await supabase
          .from('scheduled_sms')
          .update({ status: 'failed', error_message: err.message })
          .eq('id', sms.id);
        console.error(`SMS error for ${sms.phone}: ${err.message}`);
      }
    }

    return new Response(JSON.stringify({ success: true, sent: sentCount, total: pendingSms.length }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error: any) {
    console.error('Scheduled SMS error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});
