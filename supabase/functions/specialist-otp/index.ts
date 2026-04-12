import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, phone, code } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    if (action === 'send') {
      // Normalize phone
      let cleaned = phone.replace(/\s/g, '').replace(/[^0-9+]/g, '');
      if (cleaned.startsWith('+90')) cleaned = cleaned.substring(1);
      if (cleaned.startsWith('0')) cleaned = '9' + cleaned;
      if (!cleaned.startsWith('90')) cleaned = '90' + cleaned;

      // Find specialist by phone - check both specialists and automatic_orders tables
      const phoneVariants = [
        cleaned,
        '+' + cleaned,
        '0' + cleaned.substring(2),
        cleaned.substring(2),
      ];

      let specialistEmail: string | null = null;
      let specialistUserId: string | null = null;

      // First try specialists table
      for (const variant of phoneVariants) {
        const { data } = await supabase
          .from('specialists')
          .select('email, user_id')
          .eq('phone', variant)
          .eq('is_active', true)
          .limit(1);

        if (data && data.length > 0 && data[0].email) {
          specialistEmail = data[0].email;
          specialistUserId = data[0].user_id;
          break;
        }
      }

      // If not found in specialists, try automatic_orders (customer phone)
      if (!specialistEmail) {
        for (const variant of phoneVariants) {
          const { data } = await supabase
            .from('automatic_orders')
            .select('customer_email, customer_name')
            .eq('customer_phone', variant)
            .eq('is_active', true)
            .limit(1);

          if (data && data.length > 0 && data[0].customer_email) {
            // Verify this email belongs to an active specialist
            const { data: specData } = await supabase
              .from('specialists')
              .select('email, user_id')
              .eq('email', data[0].customer_email)
              .eq('is_active', true)
              .limit(1);

            if (specData && specData.length > 0) {
              specialistEmail = specData[0].email;
              specialistUserId = specData[0].user_id;
              break;
            }
          }
        }
      }

      if (!specialistEmail) {
        return new Response(JSON.stringify({ success: false, error: 'Uzman bulunamadı' }), {
          status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // If no user_id on specialist, find from auth by email
      if (!specialistUserId) {
        const { data: authUsers } = await supabase.auth.admin.listUsers();
        const foundUser = authUsers?.users?.find(u => u.email === specialistEmail);
        if (foundUser) specialistUserId = foundUser.id;
      }

      if (!specialistUserId) {
        return new Response(JSON.stringify({ success: false, error: 'Uzman hesabı bulunamadı' }), {
          status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Clean expired OTPs
      await supabase.from('otp_codes').delete().lt('expires_at', new Date().toISOString());

      // Rate limit: max 3 OTPs per phone in 10 min
      const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      const { data: recentOtps } = await supabase
        .from('otp_codes')
        .select('id')
        .eq('phone', cleaned)
        .gte('created_at', tenMinAgo);

      if (recentOtps && recentOtps.length >= 3) {
        return new Response(JSON.stringify({ success: false, error: 'Çok fazla deneme. 10 dakika bekleyin.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Generate 6-digit OTP
      const otpCode = String(Math.floor(100000 + Math.random() * 900000));

      // Save OTP
      await supabase.from('otp_codes').insert({
        phone: cleaned,
        code: otpCode,
        user_id: specialistUserId,
        expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      });

      // Send SMS via existing function
      const smsPhone = '0' + cleaned.substring(2);
      const smsMessage = `Doktorumol giris kodunuz: ${otpCode} (5 dakika gecerli)`;

      // Call SMS function internally
      const smsResponse = await fetch(`${supabaseUrl}/functions/v1/send-sms-via-static-proxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceRoleKey}`,
        },
        body: JSON.stringify({ phone: smsPhone, message: smsMessage }),
      });

      const smsResult = await smsResponse.text();
      console.log('SMS result:', smsResult);

      return new Response(JSON.stringify({ success: true, message: 'OTP gönderildi' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } else if (action === 'verify') {
      // Normalize phone
      let cleaned = phone.replace(/\s/g, '').replace(/[^0-9+]/g, '');
      if (cleaned.startsWith('+90')) cleaned = cleaned.substring(1);
      if (cleaned.startsWith('0')) cleaned = '9' + cleaned;
      if (!cleaned.startsWith('90')) cleaned = '90' + cleaned;

      // Find valid OTP
      const { data: otpData } = await supabase
        .from('otp_codes')
        .select('*')
        .eq('phone', cleaned)
        .eq('code', code)
        .eq('is_used', false)
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1);

      if (!otpData || otpData.length === 0) {
        return new Response(JSON.stringify({ success: false, error: 'Geçersiz veya süresi dolmuş kod' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const otp = otpData[0];

      // Mark OTP as used
      await supabase.from('otp_codes').update({ is_used: true }).eq('id', otp.id);

      // Find user email from specialist
      const phoneVariants2 = [cleaned, '+' + cleaned, '0' + cleaned.substring(2), cleaned.substring(2)];
      let userEmail = '';
      
      for (const variant of phoneVariants2) {
        const { data } = await supabase
          .from('specialists')
          .select('email')
          .eq('phone', variant)
          .eq('is_active', true)
          .limit(1);
        if (data && data.length > 0 && data[0].email) {
          userEmail = data[0].email;
          break;
        }
      }

      if (!userEmail) {
        return new Response(JSON.stringify({ success: false, error: 'Uzman bulunamadı' }), {
          status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Generate magic link for the user
      const { data: magicData, error: magicError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: userEmail,
      });

      if (magicError || !magicData) {
        console.error('Magic link error:', magicError);
        return new Response(JSON.stringify({ success: false, error: 'Oturum oluşturulamadı' }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Extract token from the magic link
      const actionLink = magicData.properties?.action_link || '';
      
      return new Response(JSON.stringify({ 
        success: true, 
        email: userEmail,
        action_link: actionLink,
        token_hash: magicData.properties?.hashed_token,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } else {
      return new Response(JSON.stringify({ error: 'Invalid action' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('OTP error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
