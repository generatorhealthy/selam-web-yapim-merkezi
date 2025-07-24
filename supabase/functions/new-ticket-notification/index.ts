import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NewTicketNotificationRequest {
  ticketId: string;
  specialistName: string;
  specialistEmail: string;
  ticketTitle: string;
  ticketDescription: string;
  category: string;
  priority: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log('New ticket notification function called');

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
      specialistName,
      specialistEmail,
      ticketTitle,
      ticketDescription,
      category,
      priority
    }: NewTicketNotificationRequest = await req.json();

    console.log('Request data:', {
      ticketId,
      specialistName,
      specialistEmail,
      ticketTitle,
      category,
      priority
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

    // Category and priority display mapping
    const categoryDisplay = {
      'general': 'Genel',
      'technical': 'Teknik',
      'payment': 'Ödeme',
      'account': 'Hesap',
      'other': 'Diğer'
    };

    const priorityDisplay = {
      'low': 'Düşük',
      'medium': 'Orta',
      'high': 'Yüksek',
      'urgent': 'Acil'
    };

    const priorityIcon = {
      'urgent': '🚨',
      'high': '🔴',
      'medium': '🟡',
      'low': '🟢'
    };

    const emailData = {
      sender: {
        name: "Doktorum Ol Sistem",
        email: "system@doktorumol.com.tr"
      },
      to: [
        {
          email: "info@doktorumol.com.tr",
          name: "Doktorum Ol Destek Ekibi"
        }
      ],
      subject: `${priorityIcon[priority]} Yeni Destek Talebi - ${ticketTitle}`,
      htmlContent: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Yeni Destek Talebi</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #e0e0e0; }
            .ticket-info { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .info-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
            .info-label { font-weight: bold; color: #555; }
            .info-value { color: #333; }
            .priority-badge { display: inline-block; padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: bold; }
            .priority-urgent { background: #ff4444; color: white; }
            .priority-high { background: #ff8800; color: white; }
            .priority-medium { background: #ffbb33; color: black; }
            .priority-low { background: #00C851; color: white; }
            .description-box { background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196f3; }
            .action-button { display: inline-block; background: #667eea; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
            .footer { background: #f5f5f5; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎯 Yeni Destek Talebi Alındı</h1>
              <p>Doktorum Ol Yönetim Sistemi</p>
            </div>
            
            <div class="content">
              <p>Yeni bir destek talebi oluşturuldu ve yanıt bekliyor.</p>
              
              <div class="ticket-info">
                <h3>📋 Talep Detayları</h3>
                <div class="info-row">
                  <span class="info-label">Konu:</span>
                  <span class="info-value">${ticketTitle}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Uzman:</span>
                  <span class="info-value">${specialistName}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Email:</span>
                  <span class="info-value">${specialistEmail}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Kategori:</span>
                  <span class="info-value">${categoryDisplay[category] || category}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Öncelik:</span>
                  <span class="info-value">
                    <span class="priority-badge priority-${priority}">
                      ${priorityIcon[priority]} ${priorityDisplay[priority] || priority}
                    </span>
                  </span>
                </div>
                <div class="info-row">
                  <span class="info-label">Talep ID:</span>
                  <span class="info-value">${ticketId}</span>
                </div>
              </div>
              
              <div class="description-box">
                <h3>📝 Açıklama</h3>
                <p>${ticketDescription.replace(/\n/g, '<br>')}</p>
              </div>
              
              ${priority === 'urgent' ? `
                <div style="background: #ffebee; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f44336;">
                  <h3>⚠️ ACİL TALEPTİR!</h3>
                  <p><strong>Bu talep acil öncelikli olarak işaretlenmiştir. Lütfen en kısa sürede yanıtlayın.</strong></p>
                </div>
              ` : ''}
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://doktorumol.com.tr/divan_paneli/support-tickets" class="action-button">
                  Destek Paneline Git ve Yanıtla
                </a>
              </div>
              
              <div style="background: #f0f8ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; font-size: 14px; color: #333;">
                  <strong>💡 Hatırlatma:</strong> Uzman destek taleplerini mümkün olan en kısa sürede yanıtlamak, 
                  platform kalitesini artırır ve uzman memnuniyetini sağlar.
                </p>
              </div>
            </div>
            
            <div class="footer">
              <p><strong>Doktorum Ol</strong><br>
              Yönetim Sistemi - Otomatik Bildirim<br>
              <a href="https://doktorumol.com.tr/divan_paneli">Admin Paneli</a></p>
              <p style="font-size: 12px; color: #999; margin-top: 20px;">
                Bu e-posta otomatik olarak gönderilmiştir. Yanıt vermek için admin panelini kullanın.
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
        message: 'Yeni talep bildirim maili gönderildi'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in new-ticket-notification function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        message: 'Bildirim maili gönderilirken hata oluştu'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);