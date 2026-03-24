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

    // Build attachments array
    const attachments: Array<{ content: string; name: string }> = [];
    
    if (invoicePdf && invoiceFileName) {
      attachments.push({ content: invoicePdf, name: invoiceFileName });
      console.log('Added invoice attachment:', invoiceFileName);
    }
    
    if (contractPdf && contractFileName) {
      attachments.push({ content: contractPdf, name: contractFileName });
      console.log('Added contract attachment:', contractFileName);
    }

    // Build contract sections for inline HTML
    let contractSections = '';
    
    if (preInfoContent) {
      contractSections += `
        <div style="margin-top: 30px; padding: 25px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #1e40af; margin-top: 0; font-size: 18px; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">📋 Ön Bilgilendirme Formu</h2>
          <div style="font-size: 14px; line-height: 1.7; color: #374151;">
            ${preInfoContent}
          </div>
        </div>
      `;
    }
    
    if (distanceSalesContent) {
      contractSections += `
        <div style="margin-top: 30px; padding: 25px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #1e40af; margin-top: 0; font-size: 18px; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">📄 Mesafeli Satış Sözleşmesi</h2>
          <div style="font-size: 14px; line-height: 1.7; color: #374151; white-space: pre-wrap;">
            ${distanceSalesContent}
          </div>
        </div>
      `;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
          .container { max-width: 700px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%); color: #ffffff; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
          .content { padding: 30px; }
          .message-box { background-color: #f0f9ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0; }
          .package-info { background: linear-gradient(135deg, #e0f2fe 0%, #e0e7ff 100%); padding: 15px 20px; border-radius: 8px; margin: 20px 0; }
          .package-info strong { color: #1e40af; }
          .attachments { margin-top: 25px; padding: 20px; background-color: #fafafa; border-radius: 8px; }
          .attachments h3 { color: #374151; margin: 0 0 15px 0; font-size: 16px; }
          .attachment-item { display: flex; align-items: center; padding: 10px; background: white; border-radius: 6px; margin: 8px 0; border: 1px solid #e5e7eb; }
          .attachment-icon { width: 32px; height: 32px; background: #fee2e2; border-radius: 6px; display: flex; align-items: center; justify-content: center; margin-right: 12px; color: #dc2626; font-size: 14px; }
          .footer { background-color: #f8fafc; padding: 20px 30px; text-align: center; color: #6b7280; font-size: 12px; border-top: 1px solid #e5e7eb; }
          .footer a { color: #3b82f6; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📄 Sipariş Onayı & Sözleşmeleriniz</h1>
          </div>
          <div class="content">
            <p>Sayın <strong>${customerName}</strong>,</p>
            
            <div class="package-info">
              <strong>Paket:</strong> ${packageName}
            </div>
            
            <div class="message-box">
              ${message.replace(/\n/g, '<br>')}
            </div>
            
            ${attachments.length > 0 ? `
              <div class="attachments">
                <h3>📎 Ekli Belgeler</h3>
                ${attachments.map(att => `
                  <div class="attachment-item">
                    <div class="attachment-icon">PDF</div>
                    <span>${att.name}</span>
                  </div>
                `).join('')}
              </div>
            ` : ''}

            ${contractSections}
          </div>
          <div class="footer">
            <p>Bu e-posta <strong>Doktorumol</strong> tarafından otomatik olarak gönderilmiştir.</p>
            <p>Sorularınız için: <a href="mailto:info@doktorumol.com.tr">info@doktorumol.com.tr</a></p>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailPayload: any = {
      sender: {
        name: 'Doktorumol',
        email: 'info@doktorumol.com.tr'
      },
      to: [{ email: customerEmail, name: customerName }],
      subject: `Sipariş Onayı & Sözleşmeleriniz - ${packageName}`,
      htmlContent: htmlContent
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
