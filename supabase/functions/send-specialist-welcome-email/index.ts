import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  name: string;
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email }: WelcomeEmailRequest = await req.json();
    console.log("Specialist welcome email request:", { name, email });

    const brevoApiKey = Deno.env.get("BREVO_API_KEY");
    if (!brevoApiKey) {
      throw new Error("BREVO_API_KEY is not configured");
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          
          <div style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: white; padding: 30px 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 22px; font-weight: bold;">Doktorum Ol Randevu Sitesi</h1>
            <p style="margin: 8px 0 0 0; opacity: 0.9; font-size: 14px;">info@doktorumol.com.tr</p>
          </div>
          
          <div style="padding: 30px 25px;">
            <p style="font-size: 16px; color: #1a1a1a; margin: 0 0 20px 0;"><strong>Sayın ${name},</strong></p>
            
            <p style="font-size: 15px; color: #333; line-height: 1.6; margin: 0 0 15px 0;">
              Platformumuza göstermiş olduğunuz ilgi ve oluşturduğunuz profil için teşekkür ederiz.
            </p>
            
            <p style="font-size: 15px; color: #333; line-height: 1.6; margin: 0 0 15px 0;">
              Profiliniz şu anda incelenmiş ve yayına alınmaya hazır durumdadır. Ancak danışan yönlendirmelerinin başlatılabilmesi ve profilinizin aktif olarak platformda görünür hale gelmesi için son adım olarak ödeme işleminizin tamamlanması gerekmektedir.
            </p>
            
            <p style="font-size: 15px; color: #333; line-height: 1.6; margin: 0 0 10px 0;">
              Ödemenizi aşağıdaki bağlantı üzerinden kolayca gerçekleştirebilirsiniz:
            </p>
            
            <div style="text-align: center; margin: 25px 0;">
              <a href="https://doktorumol.com.tr/ozel-firsat" style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: bold;">
                Ödemeyi Tamamla
              </a>
            </div>
            
            <p style="font-size: 15px; color: #333; line-height: 1.6; margin: 0 0 10px 0;">
              Ödeme işleminizin ardından:
            </p>
            
            <ul style="font-size: 15px; color: #333; line-height: 1.8; margin: 0 0 20px 0; padding-left: 20px;">
              <li>Profiliniz yayına alınacaktır,</li>
              <li>Danışan yönlendirmeleri aktif hale gelecektir,</li>
              <li>Sosyal medya tanıtım çalışmalarınız başlatılacaktır.</li>
            </ul>
            
            <p style="font-size: 15px; color: #333; line-height: 1.6; margin: 0 0 15px 0;">
              Herhangi bir sorunuz olması durumunda bizimle iletişime geçmekten çekinmeyin.
            </p>
            
            <p style="font-size: 15px; color: #333; line-height: 1.6; margin: 0 0 15px 0;">
              Sizi en kısa sürede aktif olarak platformumuzda görmekten memnuniyet duyarız.
            </p>
            
            <p style="font-size: 15px; color: #333; line-height: 1.6; margin: 0 0 5px 0;">
              İyi çalışmalar dileriz.
            </p>
            
            <p style="font-size: 15px; color: #333; line-height: 1.6; margin: 20px 0 0 0;">
              Saygılarımızla,<br/>
              <a href="https://doktorumol.com.tr" style="color: #2563eb; text-decoration: none; font-weight: bold;">Doktorumol.com.tr</a>
            </p>
          </div>
          
          <div style="background-color: #1e293b; color: white; padding: 20px; text-align: center;">
            <p style="margin: 0; font-size: 13px;">Bu mesaj <strong>doktorumol.com.tr</strong> kayıt sisteminden otomatik olarak gönderilmiştir.</p>
          </div>
          
        </div>
      </body>
      </html>
    `;

    const emailResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "api-key": brevoApiKey,
      },
      body: JSON.stringify({
        sender: {
          name: "Doktorum Ol Randevu Sitesi",
          email: "info@doktorumol.com.tr"
        },
        to: [{ email, name }],
        subject: "Profiliniz Yayına Alınması İçin Son Adım",
        htmlContent,
      }),
    });

    if (!emailResponse.ok) {
      const errText = await emailResponse.text();
      throw new Error(`Brevo error: ${errText}`);
    }

    const result = await emailResponse.json();
    console.log("Welcome email sent:", result);

    // Log to brevo_email_logs
    try {
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      await supabaseAdmin.from('brevo_email_logs').insert({
        recipient_email: email,
        recipient_name: name,
        subject: 'Profiliniz Yayına Alınması İçin Son Adım',
        template_name: 'specialist-welcome',
        status: 'sent',
        brevo_message_id: result.messageId || null,
        metadata: { type: 'auto-welcome', name }
      });
    } catch (logErr) {
      console.error('Email log error:', logErr);
    }

    return new Response(JSON.stringify({ success: true, result }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Welcome email error:", error);
    return new Response(JSON.stringify({ error: error.message, success: false }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
