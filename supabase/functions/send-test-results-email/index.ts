import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

const esc = (v: unknown) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

// SECURITY: the recipient and all health data are read from the stored test result.
// The request only names a freshly-created result; it can never choose the recipient.
const MAX_AGE_MS = 60 * 60 * 1000;

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const brevoApiKey = Deno.env.get('BREVO_API_KEY');
    if (!brevoApiKey) return json({ error: 'Email service not configured' }, 500);

    const body = await req.json().catch(() => ({}));
    const testResultId = String(body?.testResultId ?? '');
    if (!/^[0-9a-f-]{36}$/i.test(testResultId)) return json({ error: 'Geçersiz test sonucu' }, 400);

    const admin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

    const { data: result } = await admin
      .from('test_results')
      .select('id, test_id, specialist_id, patient_name, patient_email, answers, created_at')
      .eq('id', testResultId)
      .maybeSingle();
    if (!result || !result.specialist_id) return json({ error: 'Test sonucu bulunamadı' }, 404);
    if (Date.now() - new Date(result.created_at).getTime() > MAX_AGE_MS) {
      return json({ error: 'Bu test sonucu için bildirim süresi geçti' }, 400);
    }

    const { data: spec } = await admin
      .from('specialists').select('email').eq('id', result.specialist_id).maybeSingle();
    const specialistEmail = spec?.email ?? '';
    if (!specialistEmail) return json({ error: 'Specialist email not found' }, 400);

    let testTitle = 'Test';
    if (result.test_id) {
      const { data: t } = await admin.from('tests').select('title').eq('id', result.test_id).maybeSingle();
      if (t?.title) testTitle = t.title;
    }

    const answers = (result.answers && typeof result.answers === 'object') ? result.answers : {};
    const formattedAnswers = Object.entries(answers as Record<string, unknown>).map(([q, a]) =>
      `<li><strong>Soru ${esc(q)}:</strong> ${esc(typeof a === 'object' ? JSON.stringify(a) : a)}</li>`
    ).join('');

    const emailContent = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">Yeni Test Sonucu Bildirimi</h2>
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #27ae60; margin-top: 0;">Hasta Bilgileri</h3>
              <p><strong>Hasta Adı:</strong> ${esc(result.patient_name)}</p>
              <p><strong>Telefon:</strong> ${esc(result.patient_email)}</p>
              <p><strong>Test:</strong> ${esc(testTitle)}</p>
            </div>
            <div style="background-color: #fff; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
              <h3 style="color: #2c3e50;">Test Cevapları</h3>
              <ul style="padding-left: 20px;">${formattedAnswers}</ul>
            </div>
            <div style="margin-top: 30px; padding: 20px; background-color: #e8f4f8; border-radius: 8px;">
              <p style="margin: 0; font-size: 14px; color: #666;">
                Bu e-posta <strong>doktorumol.com.tr</strong> üzerinden otomatik olarak gönderilmiştir. Test sonucu ID: ${esc(result.id)}
              </p>
            </div>
          </div>
        </body>
      </html>`;

    const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json', 'api-key': brevoApiKey },
      body: JSON.stringify({
        sender: { email: 'info@doktorumol.com.tr', name: 'Doktor Umol' },
        to: [{ email: specialistEmail, name: 'Uzman Doktor' }],
        subject: `Yeni Test Sonucu: ${testTitle} - ${result.patient_name ?? ''}`.replace(/[\r\n]/g, ' '),
        htmlContent: emailContent,
      }),
    });

    if (!brevoResponse.ok) {
      const errorText = await brevoResponse.text();
      console.error('Brevo API error:', brevoResponse.status, errorText);
      return json({ error: 'Failed to send email' }, 500);
    }
    const brevoResult = await brevoResponse.json();
    return json({ success: true, messageId: brevoResult.messageId });
  } catch (error) {
    console.error('Error in send-test-results-email function:', error);
    return json({ error: 'Internal server error' }, 500);
  }
};

serve(handler);
