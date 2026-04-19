import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ConsentEmailRequest {
  email: string;
  fullName?: string;
  consentedAt?: string; // ISO string
}

const disclosureHtml = `
  <h2 style="font-size:18px;color:#2d3748;margin:24px 0 12px;">Aydınlatma Metni</h2>
  <p style="margin:0 0 12px;">Doktorumol.com.tr ("doktorumol" veya "Şirket") olarak, işbu Aydınlatma Metni ile, Kişisel Verilerin Korunması Kanunu ("Kanun") ve Aydınlatma Yükümlülüğünün Yerine Getirilmesinde Uyulacak Usul ve Esaslar Hakkında Tebliğ kapsamında aydınlatma yükümlüğümüzün yerine getirilmesi amaçlanmaktadır.</p>
  <p style="margin:0 0 12px;font-weight:600;">Bu kapsamda bilgi vermekle yükümlü olduğumuz konular aşağıdaki gibidir:</p>

  <h3 style="font-size:16px;color:#2d3748;margin:20px 0 8px;">Veri sorumlusunun ve varsa temsilcisinin kimliği</h3>
  <p style="margin:0 0 12px;">Veri sorumlusu; doktorumol.com.tr'dir.</p>

  <h3 style="font-size:16px;color:#2d3748;margin:20px 0 8px;">Kişisel verilerin hangi amaçla işleneceği</h3>
  <p style="margin:0 0 12px;">Ad, soyadı, telefon numarası, e-posta adresi, adres bilgileri, ödeme aracı bilgileri ve bunlarla sınırlı olmamak üzere varsa internet sitesi veya çağrı merkezi aracılığıyla iletmiş olduğunuz genel ve özel nitelikli kategorilerdeki kişisel verileriniz, internet sitesinde üyeliğinizin oluşturulması, Doktorumol üyeliği sebebiyle aldığınız hizmetlerin sunumu, alınan hizmet ile ilgili sizinle iletişime geçilmesi, müşteri ilişkilerinde sağlıklı ve uzun süreli etkileşim kurulması, onay vermeniz halinde tarafınıza ticari elektronik ileti gönderilmesi, talep ve şikayetlerinizin takibi ile ilerde oluşabilecek uyuşmazlık ve sorunların çözülmesi ve mevzuattan kaynaklanan zamanaşımı süresi doğrultusunda bu kişisel verilerinizin Doktorumol tarafından saklanması amacı ile işlenmektedir.</p>
  <p style="margin:0 0 12px;">Ayrıca, internet sitemizi ziyaretiniz ve kullanımınız sırasında internet sayfası sunucusu tarafından sabit sürücünüze iletilen küçük metin dosyaları ("Çerezler") aracılığıyla elde edilen kullanılan tarayıcı, IP adresi, internet bağlantınız, site kullanımlarınız hakkındaki bilgiler, bilgisayarınızdaki işletim sistemi ve benzeri kategorilerdeki kişisel verileriniz, internet sitesinin düzgün bir şekilde çalışabilmesi, ziyaret edilebilmesi ve özelliklerinden faydalanılması, internet sitesinde sayfalar arasında bilgileri taşıyabilmek ve bilgileri tekrardan girmek zorunluluğunu ortadan kaldırmak amaçları ile işlenmektedir.</p>

  <h3 style="font-size:16px;color:#2d3748;margin:20px 0 8px;">Şirket tarafından işlenen kişisel verilerin kimlere ve hangi amaçla aktarılabileceği</h3>
  <p style="margin:0 0 12px;">Kişisel verileriniz 2. maddede belirtilen amaçların yerine getirilebilmesi için Doktorumol hissedarları, iş ortakları, hizmet aldığı şirketler ile yetkili kamu kurum ve kuruluşlarına aktarılabilecektir.</p>

  <h3 style="font-size:16px;color:#2d3748;margin:20px 0 8px;">Kişisel veri toplamanın yöntemi ve hukuki sebebi</h3>
  <p style="margin:0 0 12px;">Şirketimizin internet sitesi veya çağrı merkezi aracılığıyla, tamamen veya kısmen otomatik yollarla elde edilen kişisel verileriniz, kanunda açıkça öngörülmesi, Doktorumol ile aranızda kurulabilecek hukuki ilişkinin devamı için kişisel verilerinizin işlenmesinin gerekli olması, iletişim hakkının tesisi, kullanılması veya korunması için veri işlemenin zorunlu olması ve açık rızanız hukuki sebepleri ile toplanmaktadır.</p>

  <h3 style="font-size:16px;color:#2d3748;margin:20px 0 8px;">Kişisel verileriniz ile ilgili Kanun kapsamındaki haklarınız aşağıdaki şekildedir:</h3>
  <p style="margin:4px 0;"><strong>(a)</strong> Kişisel verilerinizin işlenip işlenmediğini öğrenme,</p>
  <p style="margin:4px 0;"><strong>(b)</strong> Kişisel verileriniz işlenmişse buna ilişkin bilgi talep etme,</p>
  <p style="margin:4px 0;"><strong>(c)</strong> Kişisel verilerinizin işlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme,</p>
  <p style="margin:4px 0;"><strong>(ç)</strong> Yurt içinde veya yurt dışında kişisel verilerin aktarıldığı üçüncü kişileri bilme,</p>
  <p style="margin:4px 0;"><strong>(d)</strong> Kişisel verilerinizin eksik veya yanlış işlenmiş olması hâlinde bunların düzeltilmesini isteme,</p>
  <p style="margin:4px 0;"><strong>(e)</strong> Kişisel verilerinizin işlenmesini gerektiren sebeplerin ortadan kalkması halinde kişisel verilerinizin silinmesini veya yok edilmesini isteme,</p>
  <p style="margin:4px 0;"><strong>(f)</strong> (d) ve (e) bentleri uyarınca yapılan işlemlerin, kişisel verilerin aktarıldığı üçüncü kişilere bildirilmesini isteme,</p>
  <p style="margin:4px 0;"><strong>(g)</strong> İşlenen verilerin münhasıran otomatik sistemler vasıtasıyla analiz edilmesi suretiyle kişinin kendisi aleyhine bir sonucun ortaya çıkmasına itiraz etme,</p>
  <p style="margin:4px 0 12px;"><strong>(ğ)</strong> Kişisel verilerin kanuna aykırı olarak işlenmesi sebebiyle zarara uğraması hâlinde zararın giderilmesini talep etme.</p>

  <p style="margin:12px 0;">Bu haklarınızı yazılı olarak veya güvenli elektronik imza, mobil imza, kayıtlı elektronik posta (KEP) adresi ya da Şirket'in sisteminde kayıtlı bulunan elektronik posta adresini kullanmak suretiyle (Bu kapsamda <a href="mailto:info@doktorumol.com.tr" style="color:#4299e1;">info@doktorumol.com.tr</a> e-posta adresi üzerinden Şirket'e ulaşabilirsiniz) veya başvuru amacına yönelik geliştirilmiş bir yazılım ya da uygulama vasıtasıyla Şirket'e iletebilirsiniz.</p>
`;

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { email, fullName, consentedAt }: ConsentEmailRequest = await req.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: "Geçerli bir e-posta gerekli" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const brevoApiKey = Deno.env.get("BREVO_API_KEY");
    if (!brevoApiKey) throw new Error("BREVO_API_KEY is not configured");

    const consentDate = consentedAt ? new Date(consentedAt) : new Date();
    const consentDateStr = consentDate.toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" });
    const displayName = (fullName && fullName.trim()) || "Değerli Üyemiz";

    const htmlContent = `
      <!DOCTYPE html>
      <html><head><meta charset="UTF-8"></head>
      <body style="margin:0;padding:0;background-color:#f5f5f5;font-family:Arial,sans-serif;">
        <div style="max-width:680px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,.08);">
          <div style="background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;padding:28px 24px;text-align:center;">
            <h1 style="margin:0;font-size:22px;">Aydınlatma Metni Onayınız</h1>
            <p style="margin:8px 0 0;opacity:.9;font-size:14px;">Doktorumol.com.tr — KVKK Aydınlatma Metni</p>
          </div>
          <div style="padding:28px 28px 8px;color:#2d3748;font-size:14px;line-height:1.6;">
            <p style="margin:0 0 12px;">Sayın <strong>${displayName}</strong>,</p>
            <p style="margin:0 0 12px;">Doktorumol.com.tr'ye üye olurken onayladığınız <strong>Aydınlatma Metni</strong>'nin tam içeriği, kayıtlarınız için aşağıda yer almaktadır.</p>
            <div style="background:#edf2f7;border-radius:8px;padding:14px 16px;margin:16px 0;">
              <p style="margin:4px 0;font-size:13px;"><strong>Onay Tarihi:</strong> ${consentDateStr}</p>
              <p style="margin:4px 0;font-size:13px;"><strong>E-posta:</strong> ${email}</p>
            </div>
          </div>
          <div style="padding:0 28px 24px;color:#4a5568;font-size:14px;line-height:1.6;">
            ${disclosureHtml}
          </div>
          <div style="background:#2d3748;color:#fff;padding:18px;text-align:center;">
            <p style="margin:0;font-size:13px;">Bu e-posta, üyelik kaydınız sırasında verdiğiniz onayın belgelenmesi amacıyla gönderilmiştir.</p>
            <p style="margin:6px 0 0;font-size:12px;opacity:.85;">© Doktorumol.com.tr</p>
          </div>
        </div>
      </body></html>
    `;

    const resp = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "Accept": "application/json", "Content-Type": "application/json", "api-key": brevoApiKey },
      body: JSON.stringify({
        sender: { name: "Doktorumol.com.tr", email: "info@doktorumol.com.tr" },
        to: [{ email, name: displayName }],
        subject: "Aydınlatma Metni Onayınız - Doktorumol.com.tr",
        htmlContent,
      }),
    });

    if (!resp.ok) {
      const txt = await resp.text();
      throw new Error(`Brevo error: ${txt}`);
    }
    const result = await resp.json();

    try {
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );
      await supabaseAdmin.from("brevo_email_logs").insert([{
        recipient_email: email,
        recipient_name: displayName,
        subject: "Aydınlatma Metni Onayınız - Doktorumol.com.tr",
        template_name: "disclosure-consent",
        status: "sent",
        brevo_message_id: result.messageId || null,
        metadata: { consented_at: consentDate.toISOString() },
      }]);
    } catch (e) {
      console.error("Email log insert error:", e);
    }

    return new Response(JSON.stringify({ success: true, result }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("send-disclosure-consent-email error:", error);
    return new Response(JSON.stringify({ error: error.message, success: false }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
