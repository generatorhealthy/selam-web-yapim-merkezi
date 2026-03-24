import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OrderDocumentsEmailRequest {
  customerEmail: string;
  customerName: string;
  packageName: string;
  message: string;
  invoicePdf?: string;
  contractPdf?: string;
  invoiceFileName?: string;
  contractFileName?: string;
  preInfoContent?: string;
  distanceSalesContent?: string;
}

const escapeHtml = (value: string) => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const normalizeContractContent = (content: string) => content
  .replace(/<style[\s\S]*?<\/style>/gi, '')
  .replace(/<script[\s\S]*?<\/script>/gi, '')
  .replace(/<hr[^>]*>/gi, '\n────────────────────\n')
  .replace(/<br\s*\/?>/gi, '\n')
  .replace(/<li[^>]*>/gi, '• ')
  .replace(/<\/(p|div|section|article|h1|h2|h3|h4|h5|h6|ul|ol|li|table|tr)>/gi, '\n')
  .replace(/<\/(td|th)>/gi, ' ')
  .replace(/<[^>]+>/g, '')
  .replace(/&nbsp;/gi, ' ')
  .replace(/&amp;/gi, '&')
  .replace(/&lt;/gi, '<')
  .replace(/&gt;/gi, '>')
  .replace(/&quot;/gi, '"')
  .replace(/&#39;/gi, "'")
  .replace(/\r/g, '')
  .replace(/[ \t]+\n/g, '\n')
  .replace(/\n{3,}/g, '\n\n')
  .trim();

const renderContractSection = (title: string, rawContent?: string) => {
  if (!rawContent) return '';

  const normalized = normalizeContractContent(rawContent);
  if (!normalized) return '';

  const paragraphs = normalized
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p style="margin: 0 0 14px; font-size: 14px; line-height: 1.7; color: #374151; white-space: pre-line;">${escapeHtml(paragraph)}</p>`)
    .join('');

  return `
    <div style="margin-top: 30px; padding: 25px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #1e40af; margin: 0 0 18px; font-size: 18px; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">${escapeHtml(title)}</h2>
      ${paragraphs}
    </div>
  `;
};

const buildTextContent = (customerName: string, packageName: string, message: string, preInfoContent?: string, distanceSalesContent?: string) => {
  const sections = [
    'Sipariş Onayı & Sözleşmeleriniz',
    `Sayın ${customerName},`,
    `Paket: ${packageName}`,
    message,
  ];

  if (preInfoContent) {
    sections.push(`ÖN BİLGİLENDİRME FORMU\n\n${normalizeContractContent(preInfoContent)}`);
  }

  if (distanceSalesContent) {
    sections.push(`MESAFELİ SATIŞ SÖZLEŞMESİ\n\n${normalizeContractContent(distanceSalesContent)}`);
  }

  sections.push('Sorularınız için: info@doktorumol.com.tr');

  return sections.join('\n\n');
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const brevoApiKey = Deno.env.get('BREVO_API_KEY');
    if (!brevoApiKey) {
      console.error('BREVO_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const {
      customerEmail,
      customerName,
      packageName,
      message,
      invoicePdf,
      contractPdf,
      invoiceFileName,
      contractFileName,
      preInfoContent,
      distanceSalesContent
    }: OrderDocumentsEmailRequest = await req.json();

    console.log('Sending order documents email to:', customerEmail);

    const attachments: Array<{ content: string; name: string }> = [];

    if (invoicePdf && invoiceFileName) {
      attachments.push({ content: invoicePdf, name: invoiceFileName });
      console.log('Added invoice attachment:', invoiceFileName);
    }

    if (contractPdf && contractFileName) {
      attachments.push({ content: contractPdf, name: contractFileName });
      console.log('Added contract attachment:', contractFileName);
    }

    const contractSections = [
      renderContractSection('📋 Ön Bilgilendirme Formu', preInfoContent),
      renderContractSection('📄 Mesafeli Satış Sözleşmesi', distanceSalesContent),
    ].join('');

    const subject = `Sipariş Onayı & Sözleşmeleriniz • ${packageName} • ${new Date().toLocaleString('tr-TR')}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 24px 12px; background-color: #f5f7fb; font-family: 'Segoe UI', Arial, sans-serif; color: #333333;">
        <div style="max-width: 700px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; border: 1px solid #e5e7eb;">
          <div style="background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%); color: #ffffff; padding: 28px 24px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px; font-weight: 700;">📄 Sipariş Onayı & Sözleşmeleriniz</h1>
          </div>
          <div style="padding: 30px 24px;">
            <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6;">Sayın <strong>${escapeHtml(customerName)}</strong>,</p>
            <div style="background: linear-gradient(135deg, #e0f2fe 0%, #e0e7ff 100%); padding: 14px 18px; border-radius: 8px; margin: 0 0 18px; font-size: 14px; line-height: 1.6;">
              <strong style="color: #1e40af;">Paket:</strong> ${escapeHtml(packageName)}
            </div>
            <div style="background-color: #f0f9ff; border-left: 4px solid #3b82f6; padding: 18px; margin: 0 0 24px; border-radius: 0 8px 8px 0; font-size: 14px; line-height: 1.7;">
              ${escapeHtml(message).replace(/\n/g, '<br>')}
            </div>
            ${attachments.length > 0 ? `
              <div style="margin-top: 25px; padding: 20px; background-color: #fafafa; border-radius: 8px;">
                <h3 style="color: #374151; margin: 0 0 15px; font-size: 16px;">📎 Ekli Belgeler</h3>
                ${attachments.map((att) => `
                  <div style="display: flex; align-items: center; padding: 10px; background: white; border-radius: 6px; margin: 8px 0; border: 1px solid #e5e7eb; font-size: 14px; line-height: 1.5;">
                    <div style="width: 32px; height: 32px; background: #fee2e2; border-radius: 6px; display: inline-flex; align-items: center; justify-content: center; margin-right: 12px; color: #dc2626; font-size: 12px; font-weight: 700;">PDF</div>
                    <span>${escapeHtml(att.name)}</span>
                  </div>
                `).join('')}
              </div>
            ` : ''}
            ${contractSections}
          </div>
          <div style="background-color: #f8fafc; padding: 18px 24px; text-align: center; color: #6b7280; font-size: 12px; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0 0 6px;">Bu e-posta <strong>Doktorumol</strong> tarafından otomatik olarak gönderilmiştir.</p>
            <p style="margin: 0;">Sorularınız için: <a href="mailto:info@doktorumol.com.tr" style="color: #2563eb; text-decoration: none;">info@doktorumol.com.tr</a></p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = buildTextContent(customerName, packageName, message, preInfoContent, distanceSalesContent);

    const emailPayload: any = {
      sender: {
        name: 'Doktorumol',
        email: 'info@doktorumol.com.tr'
      },
      to: [{ email: customerEmail, name: customerName }],
      subject,
      htmlContent,
      textContent,
    };

    if (attachments.length > 0) {
      emailPayload.attachment = attachments;
    }

    console.log('Sending email via Brevo...');

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': brevoApiKey
      },
      body: JSON.stringify(emailPayload)
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('Brevo API error:', responseData);
      return new Response(
        JSON.stringify({ error: 'Failed to send email', details: responseData }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Email sent successfully:', responseData);

    try {
      const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
      await supabaseAdmin.from('brevo_email_logs').insert({
        recipient_email: customerEmail,
        recipient_name: customerName,
        subject,
        template_name: 'order-documents',
        status: 'sent',
        brevo_message_id: responseData.messageId || null,
        metadata: {
          packageName,
          hasPreInfo: !!preInfoContent,
          hasDistanceSales: !!distanceSalesContent,
          attachmentCount: attachments.length,
        }
      });
    } catch (logErr) {
      console.error('Email log insert error:', logErr);
    }

    return new Response(
      JSON.stringify({
        success: true,
        messageId: responseData.messageId,
        message: 'E-posta başarıyla gönderildi'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in send-order-documents-email:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);
