import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RegistrationEmailRequest {
  name: string;
  email: string;
  phone: string;
  specialty: string;
  city: string;
  experience?: string;
  education?: string;
  about?: string;
  type: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData: RegistrationEmailRequest = await req.json();
    console.log("Registration email request received:", requestData);

    const brevoApiKey = Deno.env.get("BREVO_API_KEY");
    if (!brevoApiKey) {
      throw new Error("BREVO_API_KEY is not configured");
    }

    // Admin'e gönderilecek e-posta içeriği - güzel tasarım
    const adminEmailContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Yeni Doktor Kayıt Başvurusu</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px; font-weight: bold;">⭐ Yeni Doktor Kayıt Başvurusu</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">doktorumol.com.tr kayıt formundan gönderilmiştir.</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 30px 20px;">
            
            <div style="margin-bottom: 25px;">
              <h3 style="color: #4a5568; margin: 0 0 15px 0; font-size: 16px; display: flex; align-items: center;">
                👤 Ad Soyad:
              </h3>
              <p style="margin: 0; font-size: 18px; font-weight: bold; color: #2d3748;">${requestData.name}</p>
            </div>
            
            <div style="margin-bottom: 25px;">
              <h3 style="color: #4a5568; margin: 0 0 15px 0; font-size: 16px; display: flex; align-items: center;">
                📧 E-posta:
              </h3>
              <p style="margin: 0; font-size: 16px; color: #4299e1;"><a href="mailto:${requestData.email}" style="color: #4299e1; text-decoration: none;">${requestData.email}</a></p>
            </div>
            
            <div style="margin-bottom: 25px;">
              <h3 style="color: #4a5568; margin: 0 0 15px 0; font-size: 16px; display: flex; align-items: center;">
                📞 Telefon:
              </h3>
              <p style="margin: 0; font-size: 16px; color: #2d3748;">${requestData.phone}</p>
            </div>
            
            <div style="margin-bottom: 25px;">
              <h3 style="color: #4a5568; margin: 0 0 15px 0; font-size: 16px; display: flex; align-items: center;">
                🏥 Uzmanlık Alanı:
              </h3>
              <p style="margin: 0; font-size: 16px; color: #2d3748; background-color: #edf2f7; padding: 8px 12px; border-radius: 6px; display: inline-block;">${requestData.specialty}</p>
            </div>
            
            <div style="margin-bottom: 25px;">
              <h3 style="color: #4a5568; margin: 0 0 15px 0; font-size: 16px; display: flex; align-items: center;">
                🏢 Şehir:
              </h3>
              <p style="margin: 0; font-size: 16px; color: #2d3748;">${requestData.city}</p>
            </div>
            
            ${requestData.experience ? `
            <div style="margin-bottom: 25px;">
              <h3 style="color: #4a5568; margin: 0 0 15px 0; font-size: 16px; display: flex; align-items: center;">
                📈 Deneyim:
              </h3>
              <p style="margin: 0; font-size: 16px; color: #2d3748;">${requestData.experience} yıl</p>
            </div>
            ` : ''}
            
            ${requestData.education ? `
            <div style="margin-bottom: 25px;">
              <h3 style="color: #4a5568; margin: 0 0 15px 0; font-size: 16px; display: flex; align-items: center;">
                🎓 Eğitim:
              </h3>
              <p style="margin: 0; font-size: 16px; color: #2d3748; background-color: #f7fafc; padding: 12px; border-radius: 6px; border-left: 4px solid #667eea;">${requestData.education}</p>
            </div>
            ` : ''}
            
            ${requestData.about ? `
            <div style="margin-bottom: 25px;">
              <h3 style="color: #4a5568; margin: 0 0 15px 0; font-size: 16px; display: flex; align-items: center;">
                💬 Hakkında:
              </h3>
              <p style="margin: 0; font-size: 16px; color: #2d3748; background-color: #f7fafc; padding: 12px; border-radius: 6px; border-left: 4px solid #764ba2;">${requestData.about}</p>
            </div>
            ` : ''}
            
            <div style="margin-top: 30px; padding: 20px; background-color: #edf2f7; border-radius: 8px;">
              <h3 style="color: #4a5568; margin: 0 0 10px 0; font-size: 16px; display: flex; align-items: center;">
                🕒 Başvuru Tarihi:
              </h3>
              <p style="margin: 0; font-size: 14px; color: #718096;">${new Date().toLocaleString('tr-TR')}</p>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #2d3748; color: white; padding: 20px; text-align: center;">
            <p style="margin: 0; font-size: 14px;">Bu mesaj <strong>doktorumol.com.tr</strong> kayıt formundan gönderilmiştir.</p>
          </div>
          
        </div>
      </body>
      </html>
    `;

    // Kullanıcıya gönderilecek onay e-postası - güzel tasarım
    const userEmailContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Başvurunuz Alındı</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px; font-weight: bold;">🌟 Yeni İletişim Formu Mesajı</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;"><strong>doktorumol.com.tr</strong> iletişim formundan gönderilmiştir.</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 30px 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h2 style="color: #2d3748; margin: 0 0 15px 0; font-size: 22px;">Başvurunuz Başarıyla Alındı!</h2>
              <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin: 0;">Sayın <strong>${requestData.name}</strong>, Doktorumol.com.tr'ye yapmış olduğunuz başvuru tarafımıza ulaşmıştır.</p>
            </div>
            
            <div style="background-color: #edf2f7; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
              <h3 style="color: #2d3748; margin: 0 0 15px 0; font-size: 18px;">📋 Başvuru Özeti:</h3>
              <div style="color: #4a5568; font-size: 14px; line-height: 1.8;">
                <p style="margin: 8px 0;"><strong>Uzmanlık Alanı:</strong> ${requestData.specialty}</p>
                <p style="margin: 8px 0;"><strong>Şehir:</strong> ${requestData.city}</p>
                <p style="margin: 8px 0;"><strong>E-posta:</strong> ${requestData.email}</p>
                <p style="margin: 8px 0;"><strong>Telefon:</strong> ${requestData.phone}</p>
              </div>
            </div>
            
            <div style="background-color: #f0fff4; border: 1px solid #9ae6b4; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
              <h3 style="color: #22543d; margin: 0 0 10px 0; font-size: 16px;">✅ Sonraki Adımlar:</h3>
              <ul style="color: #2f855a; font-size: 14px; line-height: 1.6; margin: 10px 0; padding-left: 20px;">
                <li>Başvurunuz incelendikten sonra en kısa sürede size dönüş yapılacaktır</li>
                <li>Gerekli görüldüğü takdirde sizinle iletişime geçilecektir</li>
                <li>Herhangi bir sorunuz için info@doktorumol.com.tr adresinden bizimle iletişime geçebilirsiniz</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #4a5568; font-size: 14px; margin: 0;">Başvurunuz için teşekkür ederiz.</p>
              <p style="color: #2d3748; font-size: 16px; font-weight: bold; margin: 10px 0 0 0;">Doktorumol.com.tr Ekibi</p>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #2d3748; color: white; padding: 20px; text-align: center;">
            <p style="margin: 0; font-size: 14px;">Bu mesaj <strong>doktorumol.com.tr</strong> iletişim formundan gönderilmiştir.</p>
          </div>
          
        </div>
      </body>
      </html>
    `;

    // Admin'e e-posta gönder
    const adminEmailResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "api-key": brevoApiKey,
      },
      body: JSON.stringify({
        sender: {
          name: "Doktorumol.com.tr",
          email: "info@doktorumol.com.tr"
        },
        to: [
          {
            email: "info@doktorumol.com.tr",
            name: "Doktorumol Admin"
          }
        ],
        subject: `Yeni Doktor Kayıt Başvurusu - ${requestData.name}`,
        htmlContent: adminEmailContent,
      }),
    });

    // Kullanıcıya onay e-postası gönder
    const userEmailResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "api-key": brevoApiKey,
      },
      body: JSON.stringify({
        sender: {
          name: "Doktorumol.com.tr",
          email: "info@doktorumol.com.tr"
        },
        to: [
          {
            email: requestData.email,
            name: requestData.name
          }
        ],
        subject: "Başvurunuz Alındı - Doktorumol.com.tr",
        htmlContent: userEmailContent,
      }),
    });

    if (!adminEmailResponse.ok || !userEmailResponse.ok) {
      const adminError = adminEmailResponse.ok ? null : await adminEmailResponse.text();
      const userError = userEmailResponse.ok ? null : await userEmailResponse.text();
      throw new Error(`E-posta gönderim hatası: Admin: ${adminError}, User: ${userError}`);
    }

    const adminResult = await adminEmailResponse.json();
    const userResult = await userEmailResponse.json();

    console.log("E-postalar başarıyla gönderildi:", { adminResult, userResult });

    // Log emails to database
    try {
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      await supabaseAdmin.from('brevo_email_logs').insert([
        {
          recipient_email: 'info@doktorumol.com.tr',
          recipient_name: 'Doktorumol Admin',
          subject: `Yeni Doktor Kayıt Başvurusu - ${requestData.name}`,
          template_name: 'registration-email',
          status: 'sent',
          brevo_message_id: adminResult.messageId || null,
          metadata: { name: requestData.name, email: requestData.email, specialty: requestData.specialty }
        },
        {
          recipient_email: requestData.email,
          recipient_name: requestData.name,
          subject: 'Başvurunuz Alındı - Doktorumol.com.tr',
          template_name: 'registration-email',
          status: 'sent',
          brevo_message_id: userResult.messageId || null,
          metadata: { type: 'auto-reply' }
        }
      ]);
    } catch (logErr) {
      console.error('Email log insert error:', logErr);
    }

    return new Response(
      JSON.stringify({ success: true, adminResult, userResult }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Kayıt e-postası gönderim hatası:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);