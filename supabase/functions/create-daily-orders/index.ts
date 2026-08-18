import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { verifyAdminOrCron } from "../_shared/adminAuth.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Enforced only when CRON_SECRET is configured (non-breaking rollout for the cron job).
  if (Deno.env.get('CRON_SECRET')) {
    const auth = await verifyAdminOrCron(req);
    if (!auth.ok) {
      return new Response(JSON.stringify({ error: auth.error }), {
        status: auth.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
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
      .select('id, name, email, payment_day, package_price, specialty, city, phone, user_id')
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
    const noPrevOrder: Array<{ name: string; emails: string; phone: string }> = [];


    const normPhone = (p?: string | null) => {
      if (!p) return "";
      let c = String(p).replace(/\D/g, "");
      if (c.startsWith("90")) c = c.substring(2);
      if (c.startsWith("0")) c = c.substring(1);
      return c;
    };

    for (const specialist of dueSpecialists) {
      try {
        // Collect every e-mail this specialist might have used on previous orders.
        // (Registration e-mail typos are the #1 reason a duplicate "1st month" order was created.)
        const candidateEmails = new Set<string>();
        if (specialist.email) candidateEmails.add(specialist.email.toLowerCase().trim());

        if (specialist.user_id) {
          const { data: prof } = await supabaseAdmin
            .from('user_profiles')
            .select('email')
            .eq('id', specialist.user_id)
            .maybeSingle();
          if (prof?.email) candidateEmails.add(String(prof.email).toLowerCase().trim());
        }

        const { data: autoOrders } = await supabaseAdmin
          .from('automatic_orders')
          .select('customer_email')
          .eq('specialist_id', specialist.id);
        for (const a of autoOrders ?? []) {
          if (a.customer_email) candidateEmails.add(String(a.customer_email).toLowerCase().trim());
        }

        if (candidateEmails.size === 0) {
          console.log(`No email for specialist ${specialist.name}, skipping`);
          errorCount++;
          continue;
        }

        const emails = Array.from(candidateEmails);
        const phoneDigits = normPhone(specialist.phone);

        // Find the latest order for this specialist: by any known e-mail, then phone, then name
        const orderCols = '*';
        let prev: Record<string, any> | null = null;

        const { data: byEmail, error: orderError } = await supabaseAdmin
          .from('orders')
          .select(orderCols)
          .in('customer_email', emails)
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(1);

        if (orderError) {
          console.error(`Error fetching latest order for ${specialist.name}:`, orderError);
          errorCount++;
          continue;
        }
        prev = byEmail?.[0] ?? null;

        if (!prev && phoneDigits.length === 10) {
          const { data: byPhone } = await supabaseAdmin
            .from('orders')
            .select(orderCols)
            .ilike('customer_phone', `%${phoneDigits}%`)
            .is('deleted_at', null)
            .order('created_at', { ascending: false })
            .limit(1);
          prev = byPhone?.[0] ?? null;
        }

        if (!prev && specialist.name) {
          const { data: byName } = await supabaseAdmin
            .from('orders')
            .select(orderCols)
            .ilike('customer_name', `%${specialist.name.trim()}%`)
            .is('deleted_at', null)
            .order('created_at', { ascending: false })
            .limit(1);
          prev = byName?.[0] ?? null;
        }

        if (!prev) {
          // Never fabricate an order with default price / month 1 — it produces wrong
          // amounts (e.g. 2.998 TL for a 4.000 TL package) and duplicate "1st month" rows.
          console.log(`No previous order found for ${specialist.name} (${emails.join(', ')}), skipping to avoid a wrong order`);
          skippedCount++;
          continue;
        }

        // Duplicate guard: an order created today for the same customer (any known e-mail)
        const dupEmails = Array.from(new Set([...emails, String(prev.customer_email || '').toLowerCase().trim()])).filter(Boolean);
        const { data: existingToday } = await supabaseAdmin
          .from('orders')
          .select('id')
          .in('customer_email', dupEmails)
          .is('deleted_at', null)
          .gte('created_at', `${todayStr}T00:00:00+03:00`)
          .lte('created_at', `${todayStr}T23:59:59+03:00`)
          .limit(1);

        if (existingToday && existingToday.length > 0) {
          console.log(`Order already exists today for ${specialist.name}, skipping`);
          skippedCount++;
          continue;
        }

        // Extra guard: highest subscription_month ever recorded for this customer
        const { data: monthRows } = await supabaseAdmin
          .from('orders')
          .select('subscription_month')
          .in('customer_email', dupEmails)
          .is('deleted_at', null)
          .order('subscription_month', { ascending: false })
          .limit(1);

        const maxMonth = Math.max(
          Number(monthRows?.[0]?.subscription_month || 0),
          Number(prev.subscription_month || 0),
        );

        const newOrder: Record<string, any> = {
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
          subscription_month: maxMonth + 1,
        };


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
