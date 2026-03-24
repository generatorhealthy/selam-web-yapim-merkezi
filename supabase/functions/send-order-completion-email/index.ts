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
      paymentMethod,
      customerType,
      orderId
    }: OrderCompletionEmailRequest = await req.json();

    const fullName = `${customerData.name} ${customerData.surname}`.trim();
    console.log('Order completion email request:', { orderId, email: customerData.email, fullName });

    // Fetch the order's contract content from database
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('pre_info_pdf_content, distance_sales_pdf_content, contract_generated_at')
      .eq('id', orderId)
      .maybeSingle();

    if (orderError) {
      console.error('Order fetch error:', orderError);
    }

    const preInfoContent = order?.pre_info_pdf_content || null;
    const distanceSalesContent = order?.distance_sales_pdf_content || null;

    console.log('Contract content found:', {
      hasPreInfo: !!preInfoContent,
      hasDistanceSales: !!distanceSalesContent
    });

    // Build contract sections
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

    // Payment method display
    const paymentMethodText = paymentMethod === 'credit_card' ? 'Kredi Kartı' : 'Banka Havalesi/EFT';

    // Customer type display
    const customerTypeText = customerType === 'individual' ? 'Bireysel' : 'Kurumsal';

    const message = `Sayın ${fullName}, siparişiniz onaylanmıştır. Ön Bilgilendirme Formu ve Mesafeli Satış Sözleşmeniz aşağıda yer almaktadır.`;

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
            <p>Sayın <strong>${fullName}</strong>,</p>
            
            <div class="package-info">
              <strong>Paket:</strong> ${packageData.name}
            </div>
            
            <div class="message-box">
              ${message}
            </div>

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

    // Send email via Brevo
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
        subject: `Sipariş Onayı & Sözleşmeleriniz - ${packageData.name}`,
        htmlContent
      })
    });

    if (!brevoResponse.ok) {
      const errorData = await brevoResponse.text();
      console.error('Brevo API error:', errorData);
      throw new Error(`Brevo API error: ${brevoResponse.status}`);
    }

    const brevoResult = await brevoResponse.json();
    console.log('Order completion email sent successfully:', brevoResult);

    // Log to brevo_email_logs
    try {
      await supabaseAdmin.from('brevo_email_logs').insert({
        recipient_email: customerData.email,
        recipient_name: fullName,
        subject: `Sipariş Onayı & Sözleşmeleriniz - ${packageData.name}`,
        template_name: 'order-completion',
        status: 'sent',
        brevo_message_id: brevoResult.messageId || null,
        metadata: { orderId, packageName: packageData.name, hasPreInfo: !!preInfoContent, hasDistanceSales: !!distanceSalesContent }
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
