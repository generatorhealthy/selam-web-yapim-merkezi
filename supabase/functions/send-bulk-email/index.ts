import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Recipient {
  email: string;
  name?: string;
}

interface BulkEmailRequest {
  recipients: Recipient[];
  subject: string;
  htmlContent: string;
  plainText?: string;
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const buildHtml = (bodyHtml: string, recipientName?: string) => {
  const greeting = recipientName ? `Sayın ${escapeHtml(recipientName)},` : "Merhaba,";
  return `<!DOCTYPE html>
<html lang="tr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Doktorum Ol</title></head>
<body style="margin:0;padding:0;background:#f5f7fa;font-family:'Segoe UI',Arial,sans-serif;color:#1a1a1a;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f5f7fa;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
        <tr><td style="background:linear-gradient(135deg,#2563eb 0%,#1e40af 100%);padding:28px 24px;text-align:center;color:#ffffff;">
          <h1 style="margin:0;font-size:20px;font-weight:600;">Doktorum Ol</h1>
          <p style="margin:6px 0 0;font-size:13px;opacity:0.9;">info@doktorumol.com.tr</p>
        </td></tr>
        <tr><td style="padding:32px 28px;">
          <p style="margin:0 0 16px;font-size:15px;"><strong>${greeting}</strong></p>
          <div style="font-size:15px;line-height:1.7;color:#333;">${bodyHtml}</div>
          <p style="margin:28px 0 0;font-size:15px;color:#333;">Saygılarımızla,<br/><strong>Doktorum Ol Ekibi</strong></p>
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

const htmlToText = (html: string) =>
  html.replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { recipients, subject, htmlContent, plainText }: BulkEmailRequest = await req.json();

    if (!Array.isArray(recipients) || recipients.length === 0) {
      throw new Error("Alıcı listesi boş");
    }
    if (!subject || subject.trim().length === 0) throw new Error("Konu zorunlu");
    if (!htmlContent || htmlContent.trim().length === 0) throw new Error("İçerik zorunlu");
    if (recipients.length > 500) throw new Error("Tek seferde en fazla 500 alıcı");

    const brevoApiKey = Deno.env.get("BREVO_API_KEY");
    if (!brevoApiKey) throw new Error("BREVO_API_KEY tanımlı değil");

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const results: Array<{ email: string; status: string; error?: string; messageId?: string }> = [];

    // Auth: only admin/staff can use this
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabaseAdmin.auth.getUser(token);
      if (user) {
        const { data: profile } = await supabaseAdmin
          .from('user_profiles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();
        if (!profile || !['admin', 'staff'].includes(profile.role)) {
          return new Response(JSON.stringify({ error: 'Yetkisiz erişim' }), {
            status: 403, headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        }
      }
    }

    for (const r of recipients) {
      const email = (r.email || "").trim().toLowerCase();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        results.push({ email: r.email, status: 'failed', error: 'Geçersiz e-posta' });
        continue;
      }

      const html = buildHtml(htmlContent, r.name);
      const text = plainText && plainText.trim().length > 0 ? plainText : htmlToText(html);

      const payload = {
        sender: { name: "Doktorum Ol", email: "info@doktorumol.com.tr" },
        replyTo: { name: "Doktorum Ol", email: "info@doktorumol.com.tr" },
        to: [{ email, name: r.name || email }],
        subject: subject.trim(),
        htmlContent: html,
        textContent: text,
        headers: {
          "List-Unsubscribe": "<mailto:info@doktorumol.com.tr?subject=unsubscribe>",
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          "X-Mailer": "Doktorumol-Bulk",
        },
        tags: ["bulk-admin"],
      };

      try {
        const resp = await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: { "accept": "application/json", "api-key": brevoApiKey, "content-type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!resp.ok) {
          const errText = await resp.text();
          results.push({ email, status: 'failed', error: `${resp.status}: ${errText.slice(0, 200)}` });
          await supabaseAdmin.from('brevo_email_logs').insert({
            recipient_email: email, recipient_name: r.name || null,
            subject, template_name: 'bulk-admin', status: 'failed',
            metadata: { error: errText.slice(0, 500) }
          });
        } else {
          const result = await resp.json();
          results.push({ email, status: 'sent', messageId: result.messageId });
          await supabaseAdmin.from('brevo_email_logs').insert({
            recipient_email: email, recipient_name: r.name || null,
            subject, template_name: 'bulk-admin', status: 'sent',
            brevo_message_id: result.messageId || null,
            metadata: { type: 'bulk' }
          });
        }
      } catch (e: any) {
        results.push({ email, status: 'failed', error: e.message });
      }

      // Throttle: 600ms between sends to protect deliverability
      await sleep(600);
    }

    const sent = results.filter(r => r.status === 'sent').length;
    const failed = results.filter(r => r.status === 'failed').length;

    return new Response(JSON.stringify({ success: true, sent, failed, total: recipients.length, results }), {
      status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("send-bulk-email error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
