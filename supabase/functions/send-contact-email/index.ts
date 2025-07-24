import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ContactEmailRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, subject, message }: ContactEmailRequest = await req.json();

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

    // Admin'e gönderilecek e-posta
    const adminEmailResponse = await resend.emails.send({
      from: "Doktorum Ol <onboarding@resend.dev>",
      to: ["info@doktorumol.com.tr"],
      subject: `Yeni İletişim Formu Mesajı - ${subject}`,
      html: `
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
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="margin: 0 0 15px 0; color: #333;">📝 Konu:</h3>
              <p style="margin: 0; font-size: 16px; color: #555;">${subject}</p>
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="margin: 0 0 15px 0; color: #333;">💬 Mesaj:</h3>
              <p style="margin: 0; font-size: 16px; color: #555; white-space: pre-wrap; line-height: 1.6;">${message}</p>
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 8px;">
              <h3 style="margin: 0 0 15px 0; color: #333;">🕐 Tarih:</h3>
              <p style="margin: 0; font-size: 16px; color: #555;">${turkeyTime}</p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid #e9ecef;">
              <p style="margin: 0; font-size: 14px; color: #666;">Bu mesaj doktorumol.com.tr iletişim formundan gönderilmiştir.</p>
            </div>
          </div>
        </div>
      `,
    });

    // Kullanıcıya otomatik yanıt gönder
    const userEmailResponse = await resend.emails.send({
      from: "Doktorum Ol <onboarding@resend.dev>",
      to: [email],
      subject: "Mesajınızı Aldık - Doktorum Ol",
      html: `
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
                <p style="margin: 5px 0; color: #555;"><strong>Tarih:</strong> ${turkeyTime}</p>
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
      `,
    });

    console.log("Emails sent successfully:", { adminEmailResponse, userEmailResponse });

    return new Response(JSON.stringify({ 
      success: true, 
      adminEmail: adminEmailResponse,
      userEmail: userEmailResponse,
      timestamp: turkeyTime
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