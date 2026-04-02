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

    // Get today's day of month (Turkey time UTC+3)
    const now = new Date();
    const turkeyTime = new Date(now.getTime() + (3 * 60 * 60 * 1000));
    const dayOfMonth = turkeyTime.getUTCDate();
    const todayStr = turkeyTime.toISOString().split('T')[0];
    console.log(`Turkey time: ${turkeyTime.toISOString()}, day of month: ${dayOfMonth}`);

    // Find active specialists whose payment_day is today
    const { data: dueSpecialists, error: specError } = await supabaseAdmin
      .from('specialists')
      .select('id, name, email, payment_day, package_price, specialty, city, phone')
      .eq('payment_day', dayOfMonth)
      .eq('is_active', true);

    if (specError) {
      console.error('Error fetching specialists:', specError);
      return new Response(
        JSON.stringify({ error: specError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!dueSpecialists || dueSpecialists.length === 0) {
      console.log('No specialists with payment due today');
      return new Response(
        JSON.stringify({ success: true, message: 'No payments due today', created: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${dueSpecialists.length} specialists with payment due today`);
    let createdCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const specialist of dueSpecialists) {
      try {
        if (!specialist.email) {
          console.log(`No email for specialist ${specialist.name}, skipping`);
          errorCount++;
          continue;
        }

        // Check if an order was already created today for this specialist (by email)
        const { data: existingToday } = await supabaseAdmin
          .from('orders')
          .select('id')
          .eq('customer_email', specialist.email)
          .is('deleted_at', null)
          .gte('created_at', `${todayStr}T00:00:00+03:00`)
          .lte('created_at', `${todayStr}T23:59:59+03:00`)
          .limit(1);

        if (existingToday && existingToday.length > 0) {
          console.log(`Order already exists today for ${specialist.email}, skipping`);
          skippedCount++;
          continue;
        }

        // Find the latest order for this specialist by email
        const { data: latestOrders, error: orderError } = await supabaseAdmin
          .from('orders')
          .select('*')
          .eq('customer_email', specialist.email)
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(1);

        if (orderError) {
          console.error(`Error fetching latest order for ${specialist.email}:`, orderError);
          errorCount++;
          continue;
        }

        let newOrder: Record<string, any>;

        if (latestOrders && latestOrders.length > 0) {
          // Copy from previous order with incremented subscription_month
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
          // No previous order — create from specialist data
          newOrder = {
            customer_name: specialist.name,
            customer_email: specialist.email,
            customer_phone: specialist.phone || '',
            customer_city: specialist.city || '',
            package_name: (specialist.specialty || 'Standart') + ' Paketi',
            package_type: 'premium',
            amount: specialist.package_price || 2998,
            payment_method: 'banka_havalesi',
            customer_type: 'individual',
            status: 'pending',
            is_first_order: true,
            subscription_month: 1,
          };
        }

        const { error: insertError } = await supabaseAdmin
          .from('orders')
          .insert(newOrder);

        if (insertError) {
          console.error(`Error creating order for ${specialist.email}:`, insertError);
          errorCount++;
        } else {
          console.log(`Order created for ${specialist.name} (${specialist.email}) - month ${newOrder.subscription_month}`);
          createdCount++;
        }
      } catch (err) {
        console.error(`Unexpected error for ${specialist.email}:`, err);
        errorCount++;
      }
    }

    const result = {
      success: true,
      message: 'Daily orders processed',
      totalDue: dueSpecialists.length,
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
