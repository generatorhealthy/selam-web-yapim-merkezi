import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const brevoApiKey = Deno.env.get('BREVO_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
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

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase configuration not found');
      return new Response(
        JSON.stringify({ error: 'Supabase service not configured' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get tomorrow's date (in UTC)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDateStr = tomorrow.toISOString().split('T')[0]; // yyyy-mm-dd

    console.log('Checking for appointments on:', tomorrowDateStr);

    // Fetch all appointments scheduled for tomorrow
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select(`
        id,
        patient_name,
        patient_email,
        patient_phone,
        appointment_date,
        appointment_time,
        appointment_type,
        notes,
        status,
        specialists (
          id,
          name,
          phone,
          email
        )
      `)
      .eq('appointment_date', tomorrowDateStr)
      .in('status', ['pending', 'confirmed']);

    if (error) {
      console.error('Error fetching appointments:', error);
      throw error;
    }

    if (!appointments || appointments.length === 0) {
      console.log('No appointments found for tomorrow');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No appointments to remind',
          count: 0
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`Found ${appointments.length} appointment(s) for tomorrow`);

    let successCount = 0;
    let failureCount = 0;

    // Send reminder email for each appointment
    for (const appointment of appointments) {
      try {
        const appointmentTypeText = appointment.appointment_type === 'face-to-face' ? 'Yüz Yüze' : 
                                    appointment.appointment_type === 'online' ? 'Online' : appointment.appointment_type;

        const formattedDate = new Date(appointment.appointment_date).toLocaleDateString('tr-TR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          weekday: 'long'
        });

        const specialistName = appointment.specialists?.name || 'Uzmanınız';
        const specialistPhone = appointment.specialists?.phone;
        const specialistEmail = appointment.specialists?.email;

        const emailContent = `
          <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
              <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #e74c3c; border-bottom: 2px solid #e74c3c; padding-bottom: 10px;">
                  🔔 Randevu Hatırlatması
                </h2>
                
                <p style="font-size: 16px; margin-bottom: 20px;">
                  Sayın <strong>${appointment.patient_name}</strong>,
                </p>
                
                <p style="margin-bottom: 20px; font-size: 15px;">
                  Yarın randevunuz bulunmaktadır. Randevu detaylarınız:
                </p>

                <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
                  <h3 style="color: #856404; margin-top: 0;">⏰ Randevu Detayları</h3>
                  <p><strong>Uzman:</strong> ${specialistName}</p>
                  <p><strong>Tarih:</strong> ${formattedDate}</p>
                  <p><strong>Saat:</strong> ${appointment.appointment_time}</p>
                  <p><strong>Randevu Türü:</strong> ${appointmentTypeText}</p>
                  ${appointment.notes ? `<p><strong>Notlar:</strong> ${appointment.notes}</p>` : ''}
                </div>

                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="color: #2c3e50;">📞 Uzman İletişim Bilgileri</h3>
                  ${specialistPhone ? `<p><strong>Telefon:</strong> ${specialistPhone}</p>` : ''}
                  ${specialistEmail ? `<p><strong>E-posta:</strong> ${specialistEmail}</p>` : ''}
                </div>

                <div style="margin-top: 30px; padding: 20px; background-color: #e8f4f8; border-radius: 8px;">
                  <p style="margin: 0; color: #0369a1;">
                    <strong>💡 İptal veya Değişiklik:</strong><br>
                    Randevunuzu iptal etmeniz veya değiştirmeniz gerekiyorsa lütfen en kısa sürede 
                    uzmanınız ile iletişime geçiniz.
                  </p>
                </div>

                <div style="margin-top: 30px; padding: 20px; background-color: #e8f4f8; border-radius: 8px;">
                  <p style="margin: 0; font-size: 14px; color: #666;">
                    Bu e-posta <strong>doktorumol.com.tr</strong> üzerinden otomatik olarak gönderilmiştir.
                  </p>
                </div>
              </div>
            </body>
          </html>
        `;

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
              email: appointment.patient_email,
              name: appointment.patient_name
            }],
            subject: `Yarın Randevunuz Var! ${specialistName} - ${formattedDate}`,
            htmlContent: emailContent
          })
        });

        if (!brevoResponse.ok) {
          const errorData = await brevoResponse.text();
          console.error(`Failed to send reminder to ${appointment.patient_email}:`, errorData);
          failureCount++;
        } else {
          console.log(`Reminder sent successfully to ${appointment.patient_email}`);
          successCount++;
        }

      } catch (emailError) {
        console.error(`Error sending reminder for appointment ${appointment.id}:`, emailError);
        failureCount++;
      }
    }

    console.log(`Reminder sending complete: ${successCount} success, ${failureCount} failures`);

    return new Response(
      JSON.stringify({ 
        success: true,
        totalAppointments: appointments.length,
        successCount,
        failureCount
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error in send-appointment-reminders function:', error);
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
