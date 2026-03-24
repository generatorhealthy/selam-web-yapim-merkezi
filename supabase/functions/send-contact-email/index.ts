import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ContactEmailRequest {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, phone, subject, message }: ContactEmailRequest = await req.json();

    // Türkiye saat diliminde tarih formatı (TR: DD.MM.YYYY HH:mm:ss)
    const now = new Date();
    const turkeyTime = new Intl.DateTimeFormat('tr-TR', {
      timeZone: 'Europe/Istanbul',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(now);

    const brevoApiKey = Deno.env.get("BREVO_API_KEY");
    
    if (!brevoApiKey) {
      throw new Error("BREVO_API_KEY is not configured");
    }

    // Admin'e gönderilecek e-posta (Brevo API ile)
    const adminEmailPayload = {
      sender: {
        name: "Doktorum Ol",
        email: "info@doktorumol.com.tr"
      },
      to: [
        {
          email: "info@doktorumol.com.tr",
          name: "Doktorum Ol Admin"
        }
      ],
      subject: `Yeni İletişim Formu Mesajı - ${subject}`,
      htmlContent: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">🌟 Yeni İletişim Formu Mesajı</h1>
            <p style="margin: 10px 0 0 0; font-size: 14px;">doktorumol.com.tr iletişim formundan gönderilmiştir.</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px;">
            <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="margin: 0 0 15px 0; color: #333;">👤 Ad Soyad:</h3>
              <p style="margin: 0; font-size: 16px; color: #555;">${name}</p>
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="margin: 0 0 15px 0; color: #333;">📧 E-posta:</h3>
              <p style="margin: 0; font-size: 16px; color: #555;"><a href="mailto:${email}" style="color: #667eea; text-decoration: none;">${email}</a></p>
            </div>
            
            ${phone ? `
            <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="margin: 0 0 15px 0; color: #333;">📞 Telefon:</h3>
              <p style="margin: 0; font-size: 16px; color: #555;"><a href="tel:${phone}" style="color: #667eea; text-decoration: none;">${phone}</a></p>
            </div>
            ` : ''}
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="margin: 0 0 15px 0; color: #333;">📝 Konu:</h3>
              <p style="margin: 0; font-size: 16px; color: #555;">${subject}</p>
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="margin: 0 0 15px 0; color: #333;">💬 Mesaj:</h3>
              <p style="margin: 0; font-size: 16px; color: #555; white-space: pre-wrap; line-height: 1.6;">${message}</p>
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 8px;">
              <h3 style="margin: 0 0 15px 0; color: #333;">🕐 Tarih (Türkiye Saati):</h3>
              <p style="margin: 0; font-size: 16px; color: #555;">${turkeyTime}</p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid #e9ecef;">
              <p style="margin: 0; font-size: 14px; color: #666;">Bu mesaj doktorumol.com.tr iletişim formundan gönderilmiştir.</p>
            </div>
          </div>
        </div>
      `
    };

    // Admin'e e-posta gönder
    const adminEmailResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": brevoApiKey,
        "content-type": "application/json"
      },
      body: JSON.stringify(adminEmailPayload)
    });

    if (!adminEmailResponse.ok) {
      const errorText = await adminEmailResponse.text();
      throw new Error(`Admin email failed: ${adminEmailResponse.status} - ${errorText}`);
    }

    // Kullanıcıya otomatik yanıt gönder
    const userEmailPayload = {
      sender: {
        name: "Doktorum Ol",
        email: "info@doktorumol.com.tr"
      },
      to: [
        {
          email: email,
          name: name
        }
      ],
      subject: "Mesajınızı Aldık - Doktorum Ol",
      htmlContent: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">🙏 Teşekkür Ederiz!</h1>
            <p style="margin: 10px 0 0 0; font-size: 14px;">Mesajınızı başarıyla aldık.</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px;">
            <div style="background: white; padding: 25px; border-radius: 8px; text-align: center;">
              <h2 style="margin: 0 0 20px 0; color: #333;">Merhaba ${name}!</h2>
              
              <p style="margin: 0 0 20px 0; font-size: 16px; color: #555; line-height: 1.6;">
                İletişim formunuz başarıyla tarafımıza ulaştı. Mesajınızı inceleyip, 
                <strong>en kısa sürede</strong> size geri dönüş yapacağız.
              </p>
              
              <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin: 0 0 10px 0; color: #1976d2;">📋 Mesaj Özeti</h3>
                <p style="margin: 5px 0; color: #555;"><strong>Konu:</strong> ${subject}</p>
                <p style="margin: 5px 0; color: #555;"><strong>Tarih (Türkiye Saati):</strong> ${turkeyTime}</p>
              </div>
              
              <p style="margin: 20px 0 0 0; font-size: 14px; color: #666;">
                Acil durumlar için: <a href="mailto:info@doktorumol.com.tr" style="color: #667eea; text-decoration: none;">info@doktorumol.com.tr</a>
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid #e9ecef;">
              <p style="margin: 0; font-size: 14px; color: #666;">
                <strong>Doktorum Ol Ekibi</strong><br>
                doktorumol.com.tr
              </p>
            </div>
          </div>
        </div>
      `
    };

    // Kullanıcıya e-posta gönder
    const userEmailResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": brevoApiKey,
        "content-type": "application/json"
      },
      body: JSON.stringify(userEmailPayload)
    });

    if (!userEmailResponse.ok) {
      const errorText = await userEmailResponse.text();
      throw new Error(`User email failed: ${userEmailResponse.status} - ${errorText}`);
    }

    const adminResult = await adminEmailResponse.json();
    const userResult = await userEmailResponse.json();

    console.log("Emails sent successfully via Brevo:", { adminResult, userResult });

    // Log emails to database
    try {
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      await supabaseAdmin.from('brevo_email_logs').insert([
        {
          recipient_email: 'info@doktorumol.com.tr',
          recipient_name: 'Doktorum Ol Admin',
          subject: `Yeni İletişim Formu Mesajı - ${subject}`,
          template_name: 'contact-email',
          status: 'sent',
          brevo_message_id: adminResult.messageId || null,
          metadata: { name, email, phone, subject }
        },
        {
          recipient_email: email,
          recipient_name: name,
          subject: 'Mesajınızı Aldık - Doktorum Ol',
          template_name: 'contact-email',
          status: 'sent',
          brevo_message_id: userResult.messageId || null,
          metadata: { type: 'auto-reply' }
        }
      ]);
    } catch (logErr) {
      console.error('Email log insert error:', logErr);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      adminEmail: adminResult,
      userEmail: userResult,
      timestamp: turkeyTime,
      provider: "Brevo"
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-contact-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);