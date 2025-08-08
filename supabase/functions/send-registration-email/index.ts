import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

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

    // Admin'e gönderilecek e-posta içeriği
    const adminEmailContent = `
      <h2>Yeni Doktor Kayıt Başvurusu</h2>
      <p><strong>Ad Soyad:</strong> ${requestData.name}</p>
      <p><strong>E-posta:</strong> ${requestData.email}</p>
      <p><strong>Telefon:</strong> ${requestData.phone}</p>
      <p><strong>Uzmanlık Alanı:</strong> ${requestData.specialty}</p>
      <p><strong>Şehir:</strong> ${requestData.city}</p>
      ${requestData.experience ? `<p><strong>Deneyim:</strong> ${requestData.experience} yıl</p>` : ''}
      ${requestData.education ? `<p><strong>Eğitim:</strong> ${requestData.education}</p>` : ''}
      ${requestData.about ? `<p><strong>Hakkında:</strong> ${requestData.about}</p>` : ''}
      <p><strong>Başvuru Tarihi:</strong> ${new Date().toLocaleString('tr-TR')}</p>
    `;

    // Kullanıcıya gönderilecek onay e-postası
    const userEmailContent = `
      <h2>Başvurunuz Alındı</h2>
      <p>Sayın ${requestData.name},</p>
      <p>Doktorumol.com.tr'ye yapmış olduğunuz doktor kayıt başvurunuz tarafımıza ulaşmıştır.</p>
      <p>Başvurunuz incelendikten sonra en kısa sürede size dönüş yapılacaktır.</p>
      <p>Herhangi bir sorunuz için info@doktorumol.com.tr adresinden bizimle iletişime geçebilirsiniz.</p>
      <p>Teşekkür ederiz.</p>
      <p><strong>Doktorumol.com.tr Ekibi</strong></p>
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