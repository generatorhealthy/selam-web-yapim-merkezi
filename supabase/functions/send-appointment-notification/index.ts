import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AppointmentNotificationRequest {
  appointmentId: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  specialistEmail: string;
  specialistName: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentType: string;
  notes?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const brevoApiKey = Deno.env.get('BREVO_API_KEY');
    
    if (!brevoApiKey) {
      console.error('BREVO_API_KEY not found');
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const {
      appointmentId,
      patientName,
      patientEmail,
      patientPhone,
      specialistEmail,
      specialistName,
      appointmentDate,
      appointmentTime,
      appointmentType,
      notes
    }: AppointmentNotificationRequest = await req.json();

    console.log('Appointment notification request received:', {
      appointmentId,
      patientName,
      specialistEmail,
      appointmentDate,
      appointmentTime
    });

    // Format appointment type for display
    const appointmentTypeText = appointmentType === 'face-to-face' ? 'Yüz Yüze' : 
                               appointmentType === 'online' ? 'Online' : appointmentType;

    // Format date for display
    const formattedDate = new Date(appointmentDate).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });

    const emailContent = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
              Yeni Randevu Bildirimi
            </h2>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #27ae60; margin-top: 0;">Randevu Detayları</h3>
              <p><strong>Tarih:</strong> ${formattedDate}</p>
              <p><strong>Saat:</strong> ${appointmentTime}</p>
              <p><strong>Randevu Türü:</strong> ${appointmentTypeText}</p>
            </div>

            <div style="background-color: #fff; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
              <h3 style="color: #2c3e50;">Hasta Bilgileri</h3>
              <p><strong>Adı Soyadı:</strong> ${patientName}</p>
              <p><strong>E-posta:</strong> ${patientEmail}</p>
              <p><strong>Telefon:</strong> ${patientPhone}</p>
              ${notes ? `<p><strong>Notlar:</strong> ${notes}</p>` : ''}
            </div>

            <div style="margin-top: 30px; padding: 20px; background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px;">
              <h4 style="color: #856404; margin-top: 0;">📅 Randevu Yönetimi</h4>
              <p style="margin: 0; color: #856404;">
                Randevu durumunu güncellemek ve randevu detaylarını görüntülemek için 
                <strong>doktorumol.com.tr</strong> uzman panelinize giriş yapabilirsiniz.
              </p>
            </div>

            <div style="margin-top: 30px; padding: 20px; background-color: #e8f4f8; border-radius: 8px;">
              <p style="margin: 0; font-size: 14px; color: #666;">
                Bu e-posta <strong>doktorumol.com.tr</strong> üzerinden otomatik olarak gönderilmiştir.
                Randevu ID: ${appointmentId}
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send email using Brevo API
    const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': brevoApiKey,
      },
      body: JSON.stringify({
        sender: {
          email: 'info@doktorumol.com.tr',
          name: 'Doktor Umol'
        },
        to: [{
          email: specialistEmail,
          name: specialistName
        }],
        subject: `Yeni Randevu: ${patientName} - ${formattedDate} ${appointmentTime}`,
        htmlContent: emailContent
      })
    });

    if (!brevoResponse.ok) {
      const errorData = await brevoResponse.text();
      console.error('Brevo API error:', errorData);
      throw new Error(`Brevo API error: ${brevoResponse.status}`);
    }

    const brevoResult = await brevoResponse.json();
    console.log('Appointment notification email sent successfully via Brevo:', brevoResult);

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: brevoResult.messageId 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error in send-appointment-notification function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);