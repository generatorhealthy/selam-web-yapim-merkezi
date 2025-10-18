import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BlogNotificationRequest {
  blogId: string;
  specialistEmail: string;
  specialistName: string;
  blogTitle: string;
  blogSlug: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { blogId, specialistEmail, specialistName, blogTitle, blogSlug }: BlogNotificationRequest = await req.json();

    console.log('Blog notification request:', { blogId, specialistEmail, specialistName, blogTitle });

    // Blog linkini oluştur
    const blogUrl = `https://doktorumol.com.tr/blog/${blogSlug}`;

    // SMS mesajını hazırla
    const smsMessage = `Sayın ${specialistName}, Size özel içeriğiniz yayınlanmıştır. Başlık: "${blogTitle}". İçeriği görüntülemek için: ${blogUrl}`;

    // Uzmanın telefon numarasını al
    const { data: specialist, error: specialistError } = await supabaseAdmin
      .from('specialists')
      .select('phone, email')
      .eq('email', specialistEmail)
      .single();

    if (specialistError) {
      console.error('Specialist not found:', specialistError);
    } else if (specialist?.phone) {
      // SMS gönder
      try {
        const smsResponse = await fetch(
          `${supabaseUrl}/functions/v1/send-sms-via-static-proxy`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
            },
            body: JSON.stringify({
              phone: specialist.phone,
              message: smsMessage
            })
          }
        );

        if (smsResponse.ok) {
          console.log('SMS sent successfully to', specialist.phone);
        } else {
          console.error('SMS send failed:', await smsResponse.text());
        }
      } catch (smsError) {
        console.error('SMS send error:', smsError);
      }
    }

    // Blog bildirimini veritabanına ekle (uzman dashboard'da görecek)
    const { error: notificationError } = await supabaseAdmin
      .from('blog_notifications')
      .insert({
        specialist_email: specialistEmail,
        blog_id: blogId,
        blog_title: blogTitle,
        blog_url: blogUrl,
        read: false
      });

    if (notificationError) {
      console.error('Notification insert error:', notificationError);
      // Tablo yoksa oluşturmak gerekebilir
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Blog notification sent successfully',
        blogUrl 
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('Error in send-blog-notification:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
