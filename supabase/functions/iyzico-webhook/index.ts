import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Webhook received from Iyzico');
    
    const body = await req.text();
    const formData = new URLSearchParams(body);
    
    const token = formData.get('token');
    const status = formData.get('status');
    const subscriptionReferenceCode = formData.get('subscriptionReferenceCode');
    
    console.log('Webhook data:', { token, status, subscriptionReferenceCode });

    if (!token) {
      throw new Error('Token not found in webhook');
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find order by payment transaction ID (token)
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('payment_transaction_id', token)
      .single();

    if (orderError || !orderData) {
      console.error('Order not found:', orderError);
      throw new Error('Order not found');
    }

    let orderStatus = 'pending';
    let shouldSendContractEmails = false;

    // Process based on subscription status
    switch (status) {
      case 'ACTIVE':
        orderStatus = 'approved';
        shouldSendContractEmails = true;
        console.log('Subscription activated successfully');
        break;
      case 'PENDING':
        orderStatus = 'pending';
        break;
      case 'INACTIVE':
      case 'CANCELED':
        orderStatus = 'cancelled';
        break;
      default:
        orderStatus = 'failed';
    }

    // Update order status
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: orderStatus,
        approved_at: orderStatus === 'approved' ? new Date().toISOString() : null,
        contract_emails_sent: shouldSendContractEmails ? false : orderData.contract_emails_sent
      })
      .eq('id', orderData.id);

    if (updateError) {
      console.error('Failed to update order:', updateError);
      throw new Error('Failed to update order');
    }

    // If subscription is active and emails not sent, trigger contract email sending
    if (shouldSendContractEmails && !orderData.contract_emails_sent) {
      console.log('Triggering contract email sending...');
      
      try {
        const emailResponse = await fetch('https://irnfwewabogveofwemvg.supabase.co/functions/v1/send-contract-emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
          },
          body: JSON.stringify({
            orderId: orderData.id
          })
        });

        if (emailResponse.ok) {
          console.log('Contract emails triggered successfully');
        } else {
          console.error('Failed to trigger contract emails:', await emailResponse.text());
        }
      } catch (emailError) {
        console.error('Error triggering contract emails:', emailError);
      }
    }

    // Create automatic order schedule for recurring payments
    if (orderStatus === 'approved' && orderData.is_first_order) {
      console.log('Creating automatic order schedule...');
      
      const { error: autoOrderError } = await supabase
        .from('automatic_orders')
        .insert({
          customer_email: orderData.customer_email,
          customer_name: orderData.customer_name,
          customer_phone: orderData.customer_phone,
          customer_tc_no: orderData.customer_tc_no,
          customer_address: orderData.customer_address,
          customer_city: orderData.customer_city,
          customer_type: orderData.customer_type,
          company_name: orderData.company_name,
          company_tax_no: orderData.company_tax_no,
          company_tax_office: orderData.company_tax_office,
          package_name: orderData.package_name,
          package_type: orderData.package_type,
          amount: orderData.amount,
          payment_method: 'iyzico_subscription',
          registration_date: new Date().toISOString(),
          monthly_payment_day: new Date().getDate(),
          paid_months: [1]
        });

      if (autoOrderError) {
        console.error('Failed to create automatic order:', autoOrderError);
      } else {
        console.log('Automatic order schedule created');
      }
    }

    // Redirect user based on status
    let redirectUrl = 'https://doktorumol.com.tr/';
    
    if (status === 'ACTIVE') {
      redirectUrl = 'https://doktorumol.com.tr/tesekkurler';
    } else if (['INACTIVE', 'CANCELED', 'FAILED'].includes(status || '')) {
      redirectUrl = 'https://doktorumol.com.tr/odeme-hatasi';
    }

    // Return redirect response
    return new Response(null, {
      status: 302,
      headers: {
        'Location': redirectUrl,
        ...corsHeaders
      }
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    
    return new Response(null, {
      status: 302,
      headers: {
        'Location': 'https://doktorumol.com.tr/odeme-hatasi',
        ...corsHeaders
      }
    });
  }
});