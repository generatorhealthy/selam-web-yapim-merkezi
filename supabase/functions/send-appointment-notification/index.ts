import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
  specialistPhone?: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentType: string;
  notes?: string;
}

const PLACEHOLDER_PHONE_DIGITS = new Set(['02167060611', '902167060611']);

const normalizePhone = (value?: string | null) => (value ?? '').replace(/\D/g, '');

const isUsablePhone = (value?: string | null) => {
  const digits = normalizePhone(value);
  return digits.length >= 10 && !PLACEHOLDER_PHONE_DIGITS.has(digits);
};

const pickFirstUsablePhone = (values: Array<string | null | undefined>) => {
  const match = values.find((value) => isUsablePhone(value));
  return match?.trim() ?? null;
};

const resolveSpecialistPhone = async (
  supabase: any,
  specialistEmail: string,
  specialistName: string,
  requestedPhone?: string,
) => {
  const requestPhone = pickFirstUsablePhone([requestedPhone]);
  if (requestPhone) {
    return { phone: requestPhone, source: 'request' };
  }

  try {
    const { data: specialistRow, error } = await supabase
      .from('specialists')
      .select('phone')
      .eq('email', specialistEmail)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error reading specialist phone from specialists:', error);
    }

    const specialistPhone = pickFirstUsablePhone([specialistRow?.phone]);
    if (specialistPhone) {
      return { phone: specialistPhone, source: 'specialists' };
    }
  } catch (error) {
    console.error('Specialists phone lookup failed:', error);
  }

  try {
    const { data: orderRows, error } = await supabase
      .from('orders')
      .select('customer_phone, created_at')
      .eq('customer_email', specialistEmail)
      .not('customer_phone', 'is', null)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error reading specialist phone from orders by email:', error);
    }

    const orderPhone = pickFirstUsablePhone((orderRows ?? []).map((row) => row.customer_phone));
    if (orderPhone) {
      return { phone: orderPhone, source: 'orders_email' };
    }
  } catch (error) {
    console.error('Orders phone lookup by email failed:', error);
  }

  try {
    const { data: namedOrderRows, error } = await supabase
      .from('orders')
      .select('customer_phone, created_at')
      .eq('customer_name', specialistName)
      .not('customer_phone', 'is', null)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error reading specialist phone from orders by name:', error);
    }

    const namedOrderPhone = pickFirstUsablePhone((namedOrderRows ?? []).map((row) => row.customer_phone));
    if (namedOrderPhone) {
      return { phone: namedOrderPhone, source: 'orders_name' };
    }
  } catch (error) {
    console.error('Orders phone lookup by name failed:', error);
  }

  return { phone: null, source: 'none' };
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

    const payload = await req.json() as Partial<AppointmentNotificationRequest>;
    const missingFields = [
      'appointmentId',
      'patientName',
      'patientEmail',
      'patientPhone',
      'specialistEmail',
      'specialistName',
      'appointmentDate',
      'appointmentTime',
      'appointmentType',
    ].filter((field) => !payload[field as keyof AppointmentNotificationRequest]);

    if (missingFields.length > 0) {
      return new Response(
        JSON.stringify({ error: `Missing required fields: ${missingFields.join(', ')}` }),
        {
          status: 400,
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
      specialistPhone,
      appointmentDate,
      appointmentTime,
      appointmentType,
      notes,
    } = payload as AppointmentNotificationRequest;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Appointment notification request received:', {
      appointmentId,
      patientName,
      specialistEmail,
      appointmentDate,
      appointmentTime,
    });

    const appointmentTypeText = appointmentType === 'face-to-face'
      ? 'Yüz Yüze'
      : appointmentType === 'online'
        ? 'Online'
        : appointmentType;

    const formattedDate = new Date(appointmentDate).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
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
          name: 'Doktor Umol',
        },
        to: [{
          email: specialistEmail,
          name: specialistName,
        }],
        subject: `Yeni Randevu: ${patientName} - ${formattedDate} ${appointmentTime}`,
        htmlContent: emailContent,
      }),
    });

    if (!brevoResponse.ok) {
      const errorData = await brevoResponse.text();
      console.error('Brevo API error:', errorData);
      throw new Error(`Brevo API error: ${brevoResponse.status}`);
    }

    const brevoResult = await brevoResponse.json();
    console.log('Appointment notification email sent successfully via Brevo:', brevoResult);

    const { phone: resolvedSpecialistPhone, source: smsPhoneSource } = await resolveSpecialistPhone(
      supabase,
      specialistEmail,
      specialistName,
      specialistPhone,
    );

    console.log('Resolved specialist phone for appointment SMS:', {
      specialistEmail,
      specialistName,
      smsPhoneSource,
      hasPhone: Boolean(resolvedSpecialistPhone),
    });

    try {
      await supabase.from('brevo_email_logs').insert({
        recipient_email: specialistEmail,
        recipient_name: specialistName,
        subject: `Yeni Randevu: ${patientName} - ${formattedDate} ${appointmentTime}`,
        template_name: 'appointment-notification',
        status: 'sent',
        brevo_message_id: brevoResult.messageId || null,
        metadata: {
          appointmentId,
          patientName,
          patientEmail,
          appointmentDate,
          appointmentTime,
          smsPhoneSource,
        },
      });
    } catch (logErr) {
      console.error('Email log insert error:', logErr);
    }

    let smsResult = null;
    if (resolvedSpecialistPhone) {
      try {
        console.log('Sending SMS notification to specialist:', resolvedSpecialistPhone);

        const smsMessage = `Yeni randevu alındı!\nHasta: ${patientName}\nTarih: ${formattedDate}\nSaat: ${appointmentTime}\nTür: ${appointmentTypeText}\nTelefon: ${patientPhone}${notes ? `\nNot: ${notes}` : ''}`;

        const { data: smsData, error: smsError } = await supabase.functions.invoke('send-sms-via-static-proxy', {
          body: {
            phone: resolvedSpecialistPhone,
            message: smsMessage,
          },
        });

        if (smsError) {
          console.error('SMS sending error:', smsError);
        } else {
          console.log('SMS sent successfully to specialist:', smsData);
          smsResult = smsData;
        }
      } catch (smsError) {
        console.error('SMS sending failed:', smsError);
      }
    } else {
      console.log('No usable specialist phone found in request, specialists or orders; skipping SMS');
    }

    return new Response(
      JSON.stringify({
        success: true,
        messageId: brevoResult.messageId,
        smsResult,
        smsPhoneSource,
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
