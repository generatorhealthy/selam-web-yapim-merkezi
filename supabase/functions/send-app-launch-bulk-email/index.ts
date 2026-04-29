// One-shot bulk EMAIL to all active specialists announcing the mobile app launch.
// Uses Brevo (info@doktorumol.com.tr). Reuses the styled HTML wrapper from send-bulk-email.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUBJECT = "🎉 Doktorum Ol Mobil Uygulaması Yayında!";

const BODY_HTML = `
<p style="margin:0 0 16px;">🎉 <strong>Doktorum Ol</strong> mobil uygulaması artık <strong>App Store</strong> ve <strong>Google Play</strong>'de yayında!</p>

<p style="margin:0 0 16px;">Sizin için geliştirdiğimiz uzman uygulaması ile artık:</p>

<ul style="margin:0 0 20px;padding-left:20px;line-height:1.8;">
  <li>Randevularınızı tek dokunuşla yönetin</li>
  <li>Danışanlarınızla iletişimde kalın</li>
  <li>Takviminizi cebinizden kontrol edin</li>
  <li>Yeni randevu ve mesajlar için anlık bildirim alın</li>
</ul>

<p style="margin:0 0 24px;text-align:center;">
  <a href="https://apps.apple.com/tr/app/doktorum-ol/id6762599027?l=tr"
     style="display:inline-block;background:linear-gradient(135deg,#2563eb 0%,#1e40af 100%);color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;font-size:15px;">
    📲 App Store'dan İndirin
  </a>
</p>

<p style="margin:0 0 8px;font-size:14px;color:#666;">
  Mevcut e-posta ve şifrenizle giriş yapabilirsiniz — tüm danışan ve randevu bilgileriniz sizi bekliyor.
</p>

<p style="margin:0 0 0;font-size:14px;color:#666;">
  Herhangi bir sorunuz olursa <a href="mailto:info@doktorumol.com.tr" style="color:#2563eb;">info@doktorumol.com.tr</a> adresinden bize ulaşabilirsiniz.
</p>
`;

const PLAIN_TEXT = `Doktorum Ol mobil uygulamasi artik App Store ve Google Play'de yayinda!

Sizin icin gelistirdigimiz uzman uygulamasi ile artik:
- Randevularinizi tek dokunusla yonetin
- Danisanlarinizla iletisimde kalin
- Takviminizi cebinizden kontrol edin
- Yeni randevu ve mesajlar icin anlik bildirim alin

Indirin: https://apps.apple.com/tr/app/doktorum-ol/id6762599027?l=tr

Mevcut e-posta ve sifrenizle giris yapabilirsiniz.

Iletisim: info@doktorumol.com.tr
Saygilarimizla, Doktorum Ol Ekibi`;

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const buildHtml = (recipientName?: string) => {
  const greeting = recipientName ? `Sayın ${escapeHtml(recipientName)},` : "Sayın Uzmanımız,";
  return `<!DOCTYPE html>
<html lang="tr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Doktorum Ol</title></head>
<body style="margin:0;padding:0;background:#f5f7fa;font-family:'Segoe UI',Arial,sans-serif;color:#1a1a1a;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f5f7fa;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
        <tr><td style="background:linear-gradient(135deg,#2563eb 0%,#1e40af 100%);padding:28px 24px;text-align:center;color:#ffffff;">
          <h1 style="margin:0;font-size:22px;font-weight:600;">📱 Doktorum Ol Mobil Uygulaması</h1>
          <p style="margin:6px 0 0;font-size:13px;opacity:0.9;">App Store'da yayında!</p>
        </td></tr>
        <tr><td style="padding:32px 28px;">
          <p style="margin:0 0 20px;font-size:16px;"><strong>${greeting}</strong></p>
          <div style="font-size:15px;line-height:1.7;color:#333;">${BODY_HTML}</div>
          <p style="margin:32px 0 0;font-size:15px;color:#333;">Saygılarımızla,<br/><strong>Doktorum Ol Ekibi</strong></p>
        </td></tr>
        <tr><td style="background:#1e293b;color:#cbd5e1;padding:18px 24px;text-align:center;font-size:12px;line-height:1.6;">
          <p style="margin:0;">Bu e-posta <strong>doktorumol.com.tr</strong> tarafından gönderilmiştir.</p>
          <p style="margin:6px 0 0;">İletişim: <a href="mailto:info@doktorumol.com.tr" style="color:#93c5fd;text-decoration:none;">info@doktorumol.com.tr</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const dryRun = url.searchParams.get("dryRun") === "1";
    const limit = url.searchParams.get("limit");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: specialists, error } = await supabase
      .from("specialists")
      .select("id, name, email")
      .eq("is_active", true)
      .not("email", "is", null);

    if (error) throw error;

    const recipients: { id: string; name: string; email: string }[] = [];
    const skipped: { id: string; name: string; email: string | null; reason: string }[] = [];
    const seen = new Set<string>();

    for (const s of specialists ?? []) {
      const email = (s.email ?? "").trim().toLowerCase();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        skipped.push({ id: s.id, name: s.name, email: s.email, reason: "invalid_email" });
        continue;
      }
      if (seen.has(email)) {
        skipped.push({ id: s.id, name: s.name, email: s.email, reason: "duplicate" });
        continue;
      }
      seen.add(email);
      recipients.push({ id: s.id, name: s.name, email });
    }

    console.log(`Total active: ${specialists?.length} | Valid: ${recipients.length} | Skipped: ${skipped.length}`);

    if (dryRun) {
      return new Response(
        JSON.stringify({ success: true, dryRun: true, recipientCount: recipients.length, skipped }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const brevoApiKey = Deno.env.get("BREVO_API_KEY");
    if (!brevoApiKey) throw new Error("BREVO_API_KEY tanımlı değil");

    const list = limit ? recipients.slice(0, parseInt(limit, 10)) : recipients;

    let sent = 0;
    let failed = 0;
    const failures: Array<{ email: string; error: string }> = [];

    for (const r of list) {
      const html = buildHtml(r.name);
      const payload = {
        sender: { name: "Doktorum Ol", email: "info@doktorumol.com.tr" },
        replyTo: { name: "Doktorum Ol", email: "info@doktorumol.com.tr" },
        to: [{ email: r.email, name: r.name }],
        subject: SUBJECT,
        htmlContent: html,
        textContent: PLAIN_TEXT,
        headers: {
          "List-Unsubscribe": "<mailto:info@doktorumol.com.tr?subject=unsubscribe>",
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          "X-Mailer": "Doktorumol-AppLaunch",
        },
        tags: ["app-launch-2026"],
      };

      try {
        const resp = await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: {
            accept: "application/json",
            "api-key": brevoApiKey,
            "content-type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!resp.ok) {
          const errText = await resp.text();
          failed++;
          failures.push({ email: r.email, error: `${resp.status}: ${errText.slice(0, 200)}` });
          await supabase.from("brevo_email_logs").insert({
            recipient_email: r.email,
            recipient_name: r.name,
            subject: SUBJECT,
            template_name: "app-launch-2026",
            status: "failed",
            metadata: { error: errText.slice(0, 500) },
          });
        } else {
          const result = await resp.json();
          sent++;
          await supabase.from("brevo_email_logs").insert({
            recipient_email: r.email,
            recipient_name: r.name,
            subject: SUBJECT,
            template_name: "app-launch-2026",
            status: "sent",
            brevo_message_id: result.messageId || null,
            metadata: { type: "app-launch" },
          });
        }
      } catch (e: any) {
        failed++;
        failures.push({ email: r.email, error: e.message });
      }

      // Throttle: 600ms between sends (matches send-bulk-email)
      await sleep(600);
    }

    return new Response(
      JSON.stringify({
        success: true,
        totalActive: specialists?.length ?? 0,
        attempted: list.length,
        sent,
        failed,
        skippedCount: skipped.length,
        failures: failures.slice(0, 20),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e: any) {
    console.error("send-app-launch-bulk-email error:", e);
    return new Response(JSON.stringify({ success: false, error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);
