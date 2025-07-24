import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SupportResponseRequest {
  ticketId: string;
  specialistEmail: string;
  specialistName: string;
  ticketTitle: string;
  adminResponse: string;
  status: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log('Support response function called');

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    const {
      ticketId,
      specialistEmail,
      specialistName,
      ticketTitle,
      adminResponse,
      status
    }: SupportResponseRequest = await req.json();

    console.log('Request data:', {
      ticketId,
      specialistEmail,
      specialistName,
      ticketTitle,
      status
    });

    if (!BREVO_API_KEY) {
      console.error('BREVO_API_KEY not found');
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Status display mapping
    const statusDisplay = {
      'open': 'Açık',
      'in_progress': 'İşlemde', 
      'resolved': 'Çözüldü',
      'closed': 'Kapalı'
    };

    const emailData = {
      sender: {
        name: "Doktorum Ol Destek",
        email: "destek@doktorumol.com.tr"
      },
      to: [
        {
          email: specialistEmail,
          name: specialistName
        }
      ],
      subject: `Destek Talebinize Cevap - ${ticketTitle}`,
      htmlContent: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Destek Talebi Cevabı</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #e0e0e0; }
            .ticket-info { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .response-box { background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196f3; }
            .status-badge { display: inline-block; padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: bold; }
            .status-resolved { background: #4caf50; color: white; }
            .status-open { background: #2196f3; color: white; }
            .status-in_progress { background: #ff9800; color: white; }
            .status-closed { background: #9e9e9e; color: white; }
            .footer { background: #f5f5f5; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; color: #666; font-size: 14px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎯 Destek Talebinize Cevap</h1>
              <p>Doktorum Ol Destek Ekibi</p>
            </div>
            
            <div class="content">
              <p>Merhaba <strong>${specialistName}</strong>,</p>
              
              <p>Destek talebinize cevap verilmiştir. Detaylar aşağıdaki gibidir:</p>
              
              <div class="ticket-info">
                <h3>📋 Talep Bilgileri</h3>
                <p><strong>Konu:</strong> ${ticketTitle}</p>
                <p><strong>Talep ID:</strong> ${ticketId}</p>
                <p><strong>Durum:</strong> <span class="status-badge status-${status}">${statusDisplay[status] || status}</span></p>
              </div>
              
              <div class="response-box">
                <h3>💬 Destek Ekibi Cevabı</h3>
                <p>${adminResponse.replace(/\n/g, '<br>')}</p>
              </div>
              
              ${status === 'resolved' ? `
                <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4caf50;">
                  <h3>✅ Talep Çözüldü</h3>
                  <p>Destek talebiniz başarıyla çözülmüştür. Eğer başka sorularınız varsa, yeni bir destek talebi oluşturabilirsiniz.</p>
                </div>
              ` : `
                <p>Bu konuda başka sorularınız varsa, lütfen doktor panelinizden yeni bir destek talebi oluşturunuz.</p>
              `}
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://doktorumol.com.tr/doktor-paneli" class="button">Doktor Paneline Git</a>
              </div>
            </div>
            
            <div class="footer">
              <p><strong>Doktorum Ol</strong><br>
              7/24 Destek Hizmeti<br>
              <a href="mailto:destek@doktorumol.com.tr">destek@doktorumol.com.tr</a></p>
              <p style="font-size: 12px; color: #999; margin-top: 20px;">
                Bu e-posta otomatik olarak gönderilmiştir. Lütfen bu e-postaya yanıt vermeyiniz.
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    console.log('Sending email to Brevo...');

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': BREVO_API_KEY,
      },
      body: JSON.stringify(emailData),
    });

    console.log('Brevo response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Brevo API error:', errorText);
      throw new Error(`Brevo API error: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    console.log('Email sent successfully:', result);

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: result.messageId,
        message: 'Destek cevabı email ile gönderildi'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in send-support-response function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        message: 'Email gönderilirken hata oluştu'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);