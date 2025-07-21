import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Processing automatic orders...');

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Generate monthly orders using the database function
    console.log('Calling generate_monthly_orders function...');
    const { error: generateError } = await supabase.rpc('generate_monthly_orders');
    
    if (generateError) {
      console.error('Error generating monthly orders:', generateError);
      throw generateError;
    }

    // Get newly created orders (pending orders from today)
    const today = new Date().toISOString().split('T')[0];
    const { data: newOrders, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('status', 'pending')
      .eq('is_first_order', false)
      .gte('created_at', today + ' 00:00:00')
      .lte('created_at', today + ' 23:59:59');

    if (fetchError) {
      console.error('Error fetching new orders:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${newOrders?.length || 0} new automatic orders for today`);

    // Send emails for each new order
    if (newOrders && newOrders.length > 0) {
      for (const order of newOrders) {
        try {
          console.log(`Sending email for order: ${order.id}`);

          const customerData = {
            name: order.customer_name?.split(' ')[0] || 'Değerli',
            surname: order.customer_name?.split(' ').slice(1).join(' ') || 'Müşterimiz',
            email: order.customer_email,
            phone: order.customer_phone,
            tcNo: order.customer_tc_no,
            address: order.customer_address,
            city: order.customer_city,
            customerType: order.customer_type,
            companyName: order.company_name,
            taxNo: order.company_tax_no,
            taxOffice: order.company_tax_office
          };

          const packageData = {
            name: order.package_name,
            price: order.amount,
            originalPrice: order.amount
          };

          // Call the contract emails function
          const { error: emailError } = await supabase.functions.invoke('send-contract-emails', {
            body: {
              customerData,
              packageData,
              paymentMethod: order.payment_method,
              clientIP: '127.0.0.1' // System generated
            }
          });

          if (emailError) {
            console.error(`Error sending email for order ${order.id}:`, emailError);
          } else {
            console.log(`Email sent successfully for order: ${order.id}`);
            
            // Update the order to mark emails as sent
            await supabase
              .from('orders')
              .update({ contract_emails_sent: true })
              .eq('id', order.id);
          }

        } catch (emailError) {
          console.error(`Failed to send email for order ${order.id}:`, emailError);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${newOrders?.length || 0} automatic orders`,
        ordersProcessed: newOrders?.length || 0
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );

  } catch (error) {
    console.error('Error in process-automatic-orders function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );
  }
});