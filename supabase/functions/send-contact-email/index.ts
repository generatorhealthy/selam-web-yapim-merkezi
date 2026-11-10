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
    const raw: ContactEmailRequest = await req.json();
    const esc = (v: unknown, max: number) => String(v ?? "").slice(0, max)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    if (!raw?.name || !raw?.email || !raw?.message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(raw.email))) {
      return new Response(JSON.stringify({ error: "Ad, geçerli e-posta ve mesaj zorunludur" }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    const name = esc(raw.name, 120);
    const email = esc(raw.email, 200);
    const phone = raw.phone ? esc(raw.phone, 40) : "";
    const subject = esc(raw.subject || "İletişim Formu Mesajı", 200);
    const message = esc(raw.message, 5000);

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

    // SECURITY: no auto-reply is sent to the address typed into the form — anyone
    // could otherwise make us mail arbitrary inboxes. Only our own inbox is notified.
    const adminResult = await adminEmailResponse.json();

    console.log("Contact email sent via Brevo:", adminResult);

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
        }
      ]);
    } catch (logErr) {
      console.error('Email log insert error:', logErr);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      adminEmail: adminResult,
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