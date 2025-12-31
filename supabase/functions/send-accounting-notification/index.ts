import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AccountingNotificationRequest {
  fileName: string;
  year: number;
  month: number;
  uploadedBy?: string;
  fileUrl?: string;
}

const getMonthName = (month: number): string => {
  const months = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];
  return months[month - 1] || '';
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
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
      fileName,
      year,
      month,
      uploadedBy,
      fileUrl
    }: AccountingNotificationRequest = await req.json();

    console.log('Sending accounting notification for file:', fileName);

    const uploadDate = new Date().toLocaleString('tr-TR', {
      timeZone: 'Europe/Istanbul',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Create email content
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
          .content { padding: 30px; }
          .info-box { background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0; }
          .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .info-row:last-child { border-bottom: none; }
          .info-label { font-weight: 600; color: #374151; }
          .info-value { color: #059669; }
          .file-info { background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); padding: 15px 20px; border-radius: 8px; margin: 20px 0; }
          .footer { background-color: #f8fafc; padding: 20px 30px; text-align: center; color: #6b7280; font-size: 12px; border-top: 1px solid #e5e7eb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📄 Yeni Muhasebe Belgesi Yüklendi</h1>
          </div>
          <div class="content">
            <p>Muhasebe birimine yeni bir belge yüklendi.</p>
            
            <div class="info-box">
              <div class="info-row">
                <span class="info-label">📁 Dosya Adı:</span>
                <span class="info-value">${fileName}</span>
              </div>
              <div class="info-row">
                <span class="info-label">📅 Dönem:</span>
                <span class="info-value">${getMonthName(month)} ${year}</span>
              </div>
              <div class="info-row">
                <span class="info-label">⏰ Yüklenme Tarihi:</span>
                <span class="info-value">${uploadDate}</span>
              </div>
              ${uploadedBy ? `
              <div class="info-row">
                <span class="info-label">👤 Yükleyen:</span>
                <span class="info-value">${uploadedBy}</span>
              </div>
              ` : ''}
            </div>
            
            <div class="file-info">
              <strong>💡 Not:</strong> Bu belgeyi görüntülemek için Muhasebe Birimi panelini ziyaret edin.
            </div>
          </div>
          <div class="footer">
            <p>Bu e-posta <strong>Doktorumol Muhasebe Sistemi</strong> tarafından otomatik olarak gönderilmiştir.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailPayload = {
      sender: {
        name: 'Doktorumol Muhasebe',
        email: 'info@doktorumol.com.tr'
      },
      to: [
        {
          email: 'aliozansahin@gmail.com',
          name: 'Ali Ozan Şahin'
        }
      ],
      subject: `📄 Yeni Muhasebe Belgesi - ${getMonthName(month)} ${year}`,
      htmlContent: htmlContent
    };

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

    console.log('Accounting notification email sent successfully:', responseData);

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: responseData.messageId,
        message: 'Bildirim e-postası gönderildi'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in send-accounting-notification:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);
