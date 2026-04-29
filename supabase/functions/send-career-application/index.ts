import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CareerApplicationRequest {
  full_name: string;
  email: string;
  phone: string;
  position: string;
  cover_letter?: string;
  cv_base64: string; // base64 encoded PDF (without data: prefix)
  cv_filename: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: CareerApplicationRequest = await req.json();
    const { full_name, email, phone, position, cover_letter, cv_base64, cv_filename } = body;

    // Basic validation
    if (!full_name || !email || !phone || !cv_base64 || !cv_filename) {
      return new Response(
        JSON.stringify({ error: "Eksik alan: ad, e-posta, telefon ve CV zorunludur." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Size check (base64 is ~33% larger than binary; cap raw at ~5MB → base64 ~7MB)
    if (cv_base64.length > 7_500_000) {
      return new Response(
        JSON.stringify({ error: "CV dosyası çok büyük. Maksimum 5MB olmalıdır." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const brevoApiKey = Deno.env.get("BREVO_API_KEY");
    if (!brevoApiKey) {
      throw new Error("BREVO_API_KEY is not configured");
    }

    const now = new Date();
    const turkeyTime = new Intl.DateTimeFormat("tr-TR", {
      timeZone: "Europe/Istanbul",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(now);

    // Save to DB
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: insertData, error: insertError } = await supabaseAdmin
      .from("career_applications")
      .insert({
        full_name,
        email,
        phone,
        position: position || "Müşteri Temsilcisi",
        cover_letter: cover_letter || null,
        cv_filename,
        status: "new",
      })
      .select("id")
      .maybeSingle();

    if (insertError) {
      console.error("DB insert error:", insertError);
    }

    const safeFilename = cv_filename.replace(/[^\w.\-]/g, "_");

    // Admin email with CV attachment
    const adminEmailPayload = {
      sender: { name: "Doktorum Ol Kariyer", email: "info@doktorumol.com.tr" },
      to: [{ email: "info@doktorumol.com.tr", name: "Doktorum Ol İK" }],
      replyTo: { email, name: full_name },
      subject: `Yeni Kariyer Başvurusu - ${position} - ${full_name}`,
      htmlContent: `
        <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;">
          <div style="background:linear-gradient(135deg,#1e40af 0%,#3b82f6 100%);padding:30px;text-align:center;color:white;border-radius:8px 8px 0 0;">
            <h1 style="margin:0;font-size:22px;">💼 Yeni Kariyer Başvurusu</h1>
            <p style="margin:10px 0 0 0;font-size:14px;">doktorumol.com.tr/kariyer</p>
          </div>
          <div style="background:#f8f9fa;padding:30px;border-radius:0 0 8px 8px;">
            <div style="background:#fff;padding:20px;border-radius:8px;margin-bottom:15px;">
              <h3 style="margin:0 0 10px 0;color:#333;">👤 Ad Soyad</h3>
              <p style="margin:0;color:#555;font-size:16px;">${full_name}</p>
            </div>
            <div style="background:#fff;padding:20px;border-radius:8px;margin-bottom:15px;">
              <h3 style="margin:0 0 10px 0;color:#333;">📧 E-posta</h3>
              <p style="margin:0;color:#555;font-size:16px;"><a href="mailto:${email}" style="color:#1e40af;">${email}</a></p>
            </div>
            <div style="background:#fff;padding:20px;border-radius:8px;margin-bottom:15px;">
              <h3 style="margin:0 0 10px 0;color:#333;">📞 Telefon</h3>
              <p style="margin:0;color:#555;font-size:16px;"><a href="tel:${phone}" style="color:#1e40af;">${phone}</a></p>
            </div>
            <div style="background:#fff;padding:20px;border-radius:8px;margin-bottom:15px;">
              <h3 style="margin:0 0 10px 0;color:#333;">🎯 Pozisyon</h3>
              <p style="margin:0;color:#555;font-size:16px;">${position}</p>
            </div>
            ${cover_letter ? `
            <div style="background:#fff;padding:20px;border-radius:8px;margin-bottom:15px;">
              <h3 style="margin:0 0 10px 0;color:#333;">📝 Ön Yazı</h3>
              <p style="margin:0;color:#555;font-size:15px;white-space:pre-wrap;line-height:1.6;">${cover_letter}</p>
            </div>` : ""}
            <div style="background:#fff;padding:20px;border-radius:8px;margin-bottom:15px;">
              <h3 style="margin:0 0 10px 0;color:#333;">📎 CV</h3>
              <p style="margin:0;color:#555;font-size:15px;">CV dosyası bu e-postaya ek olarak iletilmiştir: <strong>${safeFilename}</strong></p>
            </div>
            <div style="background:#fff;padding:20px;border-radius:8px;">
              <h3 style="margin:0 0 10px 0;color:#333;">🕐 Başvuru Tarihi</h3>
              <p style="margin:0;color:#555;font-size:15px;">${turkeyTime}</p>
            </div>
          </div>
        </div>`,
      attachment: [
        {
          name: safeFilename,
          content: cv_base64,
        },
      ],
    };

    const adminResp = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": brevoApiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify(adminEmailPayload),
    });

    if (!adminResp.ok) {
      const errText = await adminResp.text();
      throw new Error(`Brevo admin email failed: ${adminResp.status} - ${errText}`);
    }

    // Auto-reply to applicant (no attachment)
    const userEmailPayload = {
      sender: { name: "Doktorum Ol", email: "info@doktorumol.com.tr" },
      to: [{ email, name: full_name }],
      subject: "Başvurunuzu Aldık - Doktorum Ol Kariyer",
      htmlContent: `
        <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;">
          <div style="background:linear-gradient(135deg,#1e40af 0%,#3b82f6 100%);padding:30px;text-align:center;color:white;border-radius:8px 8px 0 0;">
            <h1 style="margin:0;font-size:22px;">🙏 Başvurunuzu Aldık!</h1>
          </div>
          <div style="background:#f8f9fa;padding:30px;border-radius:0 0 8px 8px;">
            <div style="background:#fff;padding:25px;border-radius:8px;text-align:center;">
              <h2 style="margin:0 0 15px 0;color:#333;">Merhaba ${full_name},</h2>
              <p style="color:#555;font-size:16px;line-height:1.6;">
                <strong>${position}</strong> pozisyonu için yaptığınız başvuru başarıyla tarafımıza ulaştı.
                İK ekibimiz başvurunuzu inceleyip uygun bulunması halinde sizinle iletişime geçecektir.
              </p>
              <div style="background:#e3f2fd;padding:15px;border-radius:8px;margin:20px 0;">
                <p style="margin:5px 0;color:#555;"><strong>Pozisyon:</strong> ${position}</p>
                <p style="margin:5px 0;color:#555;"><strong>Başvuru Tarihi:</strong> ${turkeyTime}</p>
              </div>
              <p style="color:#666;font-size:14px;margin-top:20px;">
                İlginiz için teşekkür ederiz.<br><strong>Doktorum Ol İK Ekibi</strong>
              </p>
            </div>
          </div>
        </div>`,
    };

    await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": brevoApiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify(userEmailPayload),
    });

    return new Response(
      JSON.stringify({ success: true, application_id: insertData?.id ?? null }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("send-career-application error:", error);
    return new Response(
      JSON.stringify({ error: error.message ?? "Bilinmeyen hata" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
