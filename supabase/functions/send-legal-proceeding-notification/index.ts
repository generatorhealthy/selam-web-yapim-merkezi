import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LegalProceedingNotificationRequest {
  customerName: string;
  proceedingAmount: number;
  status: string;
  notes?: string;
  createdAt: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { customerName, proceedingAmount, status, notes, createdAt }: LegalProceedingNotificationRequest = await req.json();

    const brevoApiKey = Deno.env.get('BREVO_API_KEY');
    if (!brevoApiKey) {
      throw new Error('BREVO_API_KEY not configured');
    }

    const formatCurrency = (amount: number) => {
      return amount.toLocaleString('tr-TR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    };

    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleString('tr-TR', { 
        timeZone: 'Europe/Istanbul',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #dc2626, #991b1b); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">⚖️ Yeni İcra Talebi</h1>
          <p style="color: #fecaca; margin: 10px 0 0 0; font-size: 14px;">DoktorumOl.com.tr Hukuki İşlemler</p>
        </div>
        
        <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
          <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
            <h2 style="color: #dc2626; margin-top: 0; font-size: 18px;">🚨 Acil Bildirim</h2>
            <p style="color: #991b1b; margin: 0; font-weight: bold;">Sistemde yeni bir icra talebi oluşturulmuştur.</p>
          </div>
          
          <h3 style="color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">İcra Detayları</h3>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; font-weight: bold; color: #6b7280; width: 140px;">Müşteri Adı:</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; color: #111827; font-weight: bold;">${customerName}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; font-weight: bold; color: #6b7280;">İcra Tutarı:</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; color: #dc2626; font-weight: bold; font-size: 16px;">₺${formatCurrency(proceedingAmount)}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; font-weight: bold; color: #6b7280;">Durum:</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6;">
                <span style="background: #fef3c7; color: #92400e; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold;">
                  ${status.replace(/_/g, ' ')}
                </span>
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; font-weight: bold; color: #6b7280;">Oluşturulma:</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; color: #111827;">${formatDate(createdAt)}</td>
            </tr>
            ${notes ? `
            <tr>
              <td style="padding: 12px 0; font-weight: bold; color: #6b7280; vertical-align: top;">Açıklama:</td>
              <td style="padding: 12px 0; color: #111827; background: #f9fafb; padding: 12px; border-radius: 6px; border-left: 4px solid #3b82f6;">${notes}</td>
            </tr>
            ` : ''}
          </table>

          <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 20px; margin: 25px 0;">
            <h4 style="color: #1d4ed8; margin-top: 0; font-size: 16px;">📋 Yapılması Gerekenler:</h4>
            <ul style="color: #1e40af; margin: 10px 0; padding-left: 20px;">
              <li>Admin panelinden icra detaylarını kontrol edin</li>
              <li>Müşteriyle iletişime geçin</li>
              <li>Gerekli hukuki işlemleri başlatın</li>
              <li>İcra sürecini takip altına alın</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="https://doktorumol.com.tr/divan_paneli/legal-proceedings" 
               style="background: linear-gradient(135deg, #dc2626, #991b1b); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block; box-shadow: 0 4px 6px rgba(220, 38, 38, 0.3);">
              🔗 Admin Panel'e Git
            </a>
          </div>

          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 12px; margin: 0;">
              Bu e-posta DoktorumOl.com.tr sistem tarafından otomatik olarak gönderilmiştir.<br>
              Sorunuz varsa <a href="mailto:info@doktorumol.com.tr" style="color: #dc2626;">info@doktorumol.com.tr</a> adresine yazabilirsiniz.
            </p>
          </div>
        </div>
      </div>
    `;

    // Send email using Brevo
    const emailResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': brevoApiKey,
      },
      body: JSON.stringify({
        sender: {
          name: 'DoktorumOl Hukuki İşlemler',
          email: 'info@doktorumol.com.tr'
        },
        to: [
          {
            email: 'ahilmidurak@gmail.com',
            name: 'Hukuk Departmanı'
          }
        ],
        subject: `🚨 Yeni İcra Talebi: ${customerName} - ₺${formatCurrency(proceedingAmount)}`,
        htmlContent: emailContent
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      throw new Error(`Brevo API error: ${emailResponse.status} - ${errorText}`);
    }

    const result = await emailResponse.json();
    console.log('Legal proceeding notification email sent successfully:', result);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Legal proceeding notification sent successfully',
        messageId: result.messageId
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    console.error('Error sending legal proceeding notification:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Unknown error occurred' 
      }),
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json', 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);