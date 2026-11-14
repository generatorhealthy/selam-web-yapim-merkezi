import { verifyAdminOrCron } from "../_shared/adminAuth.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OrderDocumentsEmailRequest {
  orderId?: string;
  orderCustomerEmail?: string;
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
  documentsOnly?: boolean;
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
    'Sipariş Belgeleriniz',
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

  // SECURITY: only trusted callers may trigger this handler.
  const authCheck = await verifyAdminOrCron(req);
  if (!authCheck.ok) {
    return new Response(JSON.stringify({ error: authCheck.error }), {
      status: authCheck.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
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

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body: OrderDocumentsEmailRequest = await req.json();
    if (!body || typeof body.orderId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.orderId)) {
      return new Response(JSON.stringify({error: 'Kayıtlı sipariş kimliği gerekli'}), {status: 400, headers: {...corsHeaders, 'Content-Type': 'application/json'}});
    }
    const {data: order, error: orderError} = await supabaseAdmin.from('orders')
      .select('id,customer_email,customer_name,package_name,amount,status,deleted_at,pre_info_pdf_content,distance_sales_pdf_content')
      .eq('id', body.orderId).maybeSingle();
    if (orderError || !order) return new Response(JSON.stringify({error: 'Sipariş bulunamadı'}), {status: 404, headers: {...corsHeaders, 'Content-Type': 'application/json'}});
    if (order.deleted_at) return new Response(JSON.stringify({error: 'Silinmiş sipariş için gönderim yapılamaz'}), {status: 409, headers: {...corsHeaders, 'Content-Type': 'application/json'}});
    const customerEmail = order.customer_email?.trim();
    if (!customerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail) ||
        (body.customerEmail && body.customerEmail.trim().toLowerCase() !== customerEmail.toLowerCase())) {
      return new Response(JSON.stringify({error: 'Alıcı siparişte kayıtlı e-posta olmalıdır'}), {status: 400, headers: {...corsHeaders, 'Content-Type': 'application/json'}});
    }
    if (typeof body.message !== 'string' || !body.message.trim() || body.message.length > 10000) {
      return new Response(JSON.stringify({error: 'Geçerli mesaj gerekli'}), {status: 400, headers: {...corsHeaders, 'Content-Type': 'application/json'}});
    }
    const {invoicePdf, contractPdf, invoiceFileName, contractFileName} = body;
    const message = body.documentsOnly === true
      ? 'Siparişinize ilişkin belgeler aşağıdadır. Bu e-posta ödeme onayı, üyelik aktivasyonu veya yeni sözleşme kabul kaydı değildir.'
      : body.message;
    const orderId = order.id;
    const resolvedOrderId = order.id;
    const customerName = order.customer_name || '';
    const packageName = order.package_name || '';
    let resolvedPreInfoContent = order.pre_info_pdf_content?.trim() || undefined;
    const resolvedDistanceSalesContent = order.distance_sales_pdf_content?.trim() || undefined;
    let currentInformation = false;
    if (!resolvedPreInfoContent && !resolvedDistanceSalesContent && body.documentsOnly === true) {
      const { data: form, error: formError } = await supabaseAdmin.from('form_contents')
        .select('content').eq('form_type', 'pre_info').maybeSingle();
      if (!formError && form?.content?.trim()) {
        currentInformation = true;
        resolvedPreInfoContent = `<p>Güncel bilgilendirme nüshasıdır; sipariş sırasında kabul edilen metnin arşivlenmiş kopyası değildir.</p><p>İlgili sipariş: ${escapeHtml(order.id)} · Paket: ${escapeHtml(packageName)} · Tutar: ${escapeHtml(String(order.amount))} TL</p>${form.content}`;
      }
    }
    if (!resolvedPreInfoContent && !resolvedDistanceSalesContent) {
      return new Response(JSON.stringify({error: 'Siparişte kayıtlı sözleşme içeriği yok'}), {status: 409, headers: {...corsHeaders, 'Content-Type': 'application/json'}});
    }

    const attachments: Array<{ content: string; name: string }> = [];

    if (body.documentsOnly !== true && invoicePdf && invoiceFileName) {
      attachments.push({ content: invoicePdf, name: invoiceFileName });
      console.log('Added invoice attachment');
    }

    if (body.documentsOnly !== true && contractPdf && contractFileName) {
      attachments.push({ content: contractPdf, name: contractFileName });
      console.log('Added contract attachment');
    }

    const contractSections = [
      renderContractSection(currentInformation ? '📋 Güncel Ön Bilgilendirme (arşivlenmiş kabul nüshası değildir)' : '📋 Ön Bilgilendirme Formu', resolvedPreInfoContent),
      renderContractSection('📄 Mesafeli Satış Sözleşmesi', resolvedDistanceSalesContent),
    ].join('');

    const subject = `Sipariş Belgeleriniz • ${packageName} • #${order.id.slice(0,8).toUpperCase()}`;

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
            <h1 style="margin: 0; font-size: 24px; font-weight: 700;">📄 Sipariş Belgeleriniz</h1>
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

    const textContent = buildTextContent(customerName, packageName, message, resolvedPreInfoContent, resolvedDistanceSalesContent);

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

    {
      const bytes = new TextEncoder().encode(JSON.stringify([customerEmail, resolvedPreInfoContent, resolvedDistanceSalesContent]));
      const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))).map(b => b.toString(16).padStart(2, '0')).join('');
      const { error: claimError } = await supabaseAdmin.from('order_document_delivery_claims').insert({ order_id: order.id, content_hash: hash });
      if (claimError) return new Response(JSON.stringify({ error: claimError.code === '23505'
        ? 'Bu belge için gönderim daha önce başlatıldı. Tekrar göndermeden önce teslim durumunu kontrol edin.'
        : 'Güvenli gönderim kaydı oluşturulamadı' }), { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

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
      console.error('Order document delivery rejected');
      return new Response(
        JSON.stringify({ error: 'Failed to send email' }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Order document delivery completed');

    try {
      await supabaseAdmin.from('brevo_email_logs').insert({
        recipient_email: customerEmail,
        recipient_name: customerName,
        subject,
        template_name: 'order-documents',
        status: 'sent',
        brevo_message_id: responseData.messageId || null,
        metadata: {
          orderId: resolvedOrderId || orderId,
          packageName,
          hasPreInfo: !!resolvedPreInfoContent,
          hasDistanceSales: !!resolvedDistanceSalesContent,
          attachmentCount: attachments.length,
        }
      });
    } catch (logErr) {
      console.error('Email log unavailable');
    }

    return new Response(
      JSON.stringify({
        success: true,
        messageId: responseData.messageId,
        message: 'E-posta başarıyla gönderildi',
        currentInformationOnly: currentInformation
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Order document request failed');
    return new Response(
      JSON.stringify({ error: 'Sipariş belgesi gönderilemedi' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);
