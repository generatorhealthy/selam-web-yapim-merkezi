import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Daily auto-order creator started at:', new Date().toISOString());

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get today's day of month
    const today = new Date();
    const dayOfMonth = today.getDate();
    console.log(`Today is day ${dayOfMonth} of the month`);

    // Find active customers whose payment day is today
    const { data: dueCustomers, error: customersError } = await supabaseAdmin
      .from('automatic_orders')
      .select('*')
      .eq('monthly_payment_day', dayOfMonth)
      .eq('is_active', true);

    if (customersError) {
      console.error('Error fetching due customers:', customersError);
      return new Response(
        JSON.stringify({ error: customersError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!dueCustomers || dueCustomers.length === 0) {
      console.log('No customers with payment due today');
      return new Response(
        JSON.stringify({ success: true, message: 'No payments due today', created: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${dueCustomers.length} customers with payment due today`);
    let createdCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const customer of dueCustomers) {
      try {
        // Find the latest order for this customer by email (not name, since names can change)
        const { data: latestOrders, error: orderError } = await supabaseAdmin
          .from('orders')
          .select('*')
          .eq('customer_email', customer.customer_email)
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(1);

        if (orderError) {
          console.error(`Error fetching latest order for ${customer.customer_email}:`, orderError);
          errorCount++;
          continue;
        }

        // Check if an order was already created today for this customer
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
        const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString();
        
        const { data: existingToday, error: existingError } = await supabaseAdmin
          .from('orders')
          .select('id')
          .eq('customer_email', customer.customer_email)
          .is('deleted_at', null)
          .gte('created_at', todayStart)
          .lte('created_at', todayEnd)
          .limit(1);

        if (!existingError && existingToday && existingToday.length > 0) {
          console.log(`Order already exists today for ${customer.customer_email}, skipping`);
          skippedCount++;
          continue;
        }

        // Build new order from latest order or from customer data
        let newOrder: Record<string, any>;

        if (latestOrders && latestOrders.length > 0) {
          const prev = latestOrders[0];
          newOrder = {
            customer_name: prev.customer_name,
            customer_email: prev.customer_email,
            customer_phone: prev.customer_phone,
            customer_address: prev.customer_address,
            customer_city: prev.customer_city,
            customer_tc_no: prev.customer_tc_no,
            company_name: prev.company_name,
            company_tax_no: prev.company_tax_no,
            company_tax_office: prev.company_tax_office,
            package_name: prev.package_name,
            package_type: prev.package_type,
            amount: prev.amount,
            payment_method: prev.payment_method,
            customer_type: prev.customer_type,
            status: 'pending',
            is_first_order: false,
            subscription_month: (prev.subscription_month || 0) + 1,
          };
        } else {
          // No previous order exists, create from automatic_orders data
          newOrder = {
            customer_name: customer.customer_name,
            customer_email: customer.customer_email,
            customer_phone: customer.customer_phone,
            customer_address: customer.customer_address,
            customer_city: customer.customer_city,
            customer_tc_no: customer.customer_tc_no,
            company_name: customer.company_name,
            company_tax_no: customer.company_tax_no,
            company_tax_office: customer.company_tax_office,
            package_name: customer.package_name,
            package_type: customer.package_type,
            amount: customer.amount,
            payment_method: customer.payment_method,
            customer_type: customer.customer_type,
            status: 'pending',
            is_first_order: true,
            subscription_month: 1,
          };
        }

        const { error: insertError } = await supabaseAdmin
          .from('orders')
          .insert(newOrder);

        if (insertError) {
          console.error(`Error creating order for ${customer.customer_email}:`, insertError);
          errorCount++;
        } else {
          console.log(`Order created for ${customer.customer_email} (month ${newOrder.subscription_month})`);
          createdCount++;
        }
      } catch (err) {
        console.error(`Unexpected error for ${customer.customer_email}:`, err);
        errorCount++;
      }
    }

    const result = {
      success: true,
      message: 'Daily orders processed',
      totalDue: dueCustomers.length,
      created: createdCount,
      skipped: skippedCount,
      errors: errorCount,
      timestamp: new Date().toISOString(),
    };

    console.log('Daily order result:', result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Daily order creator error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
