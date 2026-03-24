import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OrderCompletionEmailRequest {
  customerData: {
    name: string;
    surname: string;
    email: string;
    phone: string;
    tcNo: string;
    address: string;
    city: string;
    postalCode?: string;
    companyName?: string;
    taxNo?: string;
    taxOffice?: string;
  };
  packageData: {
    name: string;
    price: number;
    originalPrice: number;
  };
  paymentMethod: string;
  customerType: string;
  orderId: string;
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

const renderContractSection = (title: string, rawContent: string | null) => {
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

const buildTextContent = (fullName: string, packageName: string, message: string, preInfoContent: string | null, distanceSalesContent: string | null) => {
  const sections = [
    'Sipariş Onayı & Sözleşmeleriniz',
    `Sayın ${fullName},`,
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
      console.error('BREVO_API_KEY not found');
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const {
      customerData,
      packageData,
      orderId
    }: OrderCompletionEmailRequest = await req.json();

    const fullName = `${customerData.name} ${customerData.surname}`.trim();
    const orderReference = orderId.slice(0, 8).toUpperCase();
    const subject = `Sipariş Onayı & Sözleşmeleriniz • ${packageData.name} • #${orderReference}`;

    console.log('Order completion email request:', { orderId, email: customerData.email, fullName });

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('pre_info_pdf_content, distance_sales_pdf_content, contract_generated_at')
      .eq('id', orderId)
      .maybeSingle();

    if (orderError) {
      console.error('Order fetch error:', orderError);
      throw new Error('Sipariş bilgileri alınamadı');
    }

    if (!order) {
      throw new Error('Sipariş kaydı bulunamadı');
    }

    const preInfoContent = order.pre_info_pdf_content?.trim() || null;
    const distanceSalesContent = order.distance_sales_pdf_content?.trim() || null;

    console.log('Contract content found:', {
      hasPreInfo: !!preInfoContent,
      hasDistanceSales: !!distanceSalesContent,
      preInfoLength: preInfoContent?.length || 0,
      distanceSalesLength: distanceSalesContent?.length || 0,
    });

    if (!preInfoContent && !distanceSalesContent) {
      throw new Error('Siparişte gönderilecek sözleşme içeriği bulunamadı');
    }

    const message = `Sayın ${fullName}, siparişiniz onaylanmıştır. Onay verdiğiniz ön bilgilendirme formu ve mesafeli satış sözleşmesi aşağıda yer almaktadır.`;

    const contractSections = [
      renderContractSection('📋 Ön Bilgilendirme Formu', preInfoContent),
      renderContractSection('📄 Mesafeli Satış Sözleşmesi', distanceSalesContent),
    ].join('');

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
            <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6;">Sayın <strong>${escapeHtml(fullName)}</strong>,</p>
            <div style="background: linear-gradient(135deg, #e0f2fe 0%, #e0e7ff 100%); padding: 14px 18px; border-radius: 8px; margin: 0 0 18px; font-size: 14px; line-height: 1.6;">
              <strong style="color: #1e40af;">Paket:</strong> ${escapeHtml(packageData.name)}
            </div>
            <div style="background-color: #f0f9ff; border-left: 4px solid #3b82f6; padding: 18px; margin: 0 0 24px; border-radius: 0 8px 8px 0; font-size: 14px; line-height: 1.7;">
              ${escapeHtml(message)}
            </div>
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

    const textContent = buildTextContent(fullName, packageData.name, message, preInfoContent, distanceSalesContent);

    const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': brevoApiKey,
      },
      body: JSON.stringify({
        sender: {
          name: 'Doktorumol',
          email: 'info@doktorumol.com.tr'
        },
        to: [{ email: customerData.email, name: fullName }],
        subject,
        htmlContent,
        textContent,
      })
    });

    if (!brevoResponse.ok) {
      const errorData = await brevoResponse.text();
      console.error('Brevo API error:', errorData);
      throw new Error(`Brevo API error: ${brevoResponse.status}`);
    }

    const brevoResult = await brevoResponse.json();
    console.log('Order completion email sent successfully:', brevoResult);

    try {
      await supabaseAdmin.from('brevo_email_logs').insert({
        recipient_email: customerData.email,
        recipient_name: fullName,
        subject,
        template_name: 'order-completion',
        status: 'sent',
        brevo_message_id: brevoResult.messageId || null,
        metadata: {
          orderId,
          packageName: packageData.name,
          hasPreInfo: !!preInfoContent,
          hasDistanceSales: !!distanceSalesContent,
          preInfoLength: preInfoContent?.length || 0,
          distanceSalesLength: distanceSalesContent?.length || 0,
        }
      });
    } catch (logErr) {
      console.error('Email log insert error:', logErr);
    }

    return new Response(
      JSON.stringify({ success: true, messageId: brevoResult.messageId }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in send-order-completion-email:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);
