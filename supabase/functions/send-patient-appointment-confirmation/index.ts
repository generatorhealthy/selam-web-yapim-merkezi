import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PatientConfirmationRequest {
  appointmentId: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  specialistName: string;
  specialistPhone?: string;
  specialistEmail?: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentType: string;
  notes?: string;
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
      specialistName,
      specialistPhone,
      specialistEmail,
      appointmentDate,
      appointmentTime,
      appointmentType,
      notes
    }: PatientConfirmationRequest = await req.json();

    console.log('Patient confirmation request received:', {
      appointmentId,
      patientEmail,
      specialistName,
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
              Randevunuz Oluşturuldu
            </h2>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              Sayın <strong>${patientName}</strong>,
            </p>
            
            <p style="margin-bottom: 20px;">
              Randevunuz başarıyla oluşturulmuştur. Detaylar aşağıdaki gibidir:
            </p>

            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #27ae60; margin-top: 0;">Randevu Detayları</h3>
              <p><strong>Uzman:</strong> ${specialistName}</p>
              <p><strong>Tarih:</strong> ${formattedDate}</p>
              <p><strong>Saat:</strong> ${appointmentTime}</p>
              <p><strong>Randevu Türü:</strong> ${appointmentTypeText}</p>
              ${notes ? `<p><strong>Notlar:</strong> ${notes}</p>` : ''}
            </div>

            <div style="background-color: #fff; padding: 20px; border: 1px solid #ddd; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #2c3e50;">Uzman İletişim Bilgileri</h3>
              ${specialistPhone ? `<p><strong>Telefon:</strong> ${specialistPhone}</p>` : ''}
              ${specialistEmail ? `<p><strong>E-posta:</strong> ${specialistEmail}</p>` : ''}
            </div>

            <div style="margin-top: 30px; padding: 20px; background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px;">
              <h4 style="color: #856404; margin-top: 0;">📅 Önemli Hatırlatma</h4>
              <p style="margin: 0; color: #856404;">
                Randevu saatinden 1 gün önce size bir hatırlatma e-postası göndereceğiz.
                Randevunuzu iptal etmeniz gerekirse lütfen uzmanınız ile iletişime geçiniz.
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
          email: patientEmail,
          name: patientName
        }],
        subject: `Randevunuz Oluşturuldu - ${specialistName} - ${formattedDate}`,
        htmlContent: emailContent
      })
    });

    if (!brevoResponse.ok) {
      const errorData = await brevoResponse.text();
      console.error('Brevo API error:', errorData);
      throw new Error(`Brevo API error: ${brevoResponse.status}`);
    }

    const brevoResult = await brevoResponse.json();
    console.log('Patient confirmation email sent successfully:', brevoResult);

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
    console.error('Error in send-patient-appointment-confirmation function:', error);
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
