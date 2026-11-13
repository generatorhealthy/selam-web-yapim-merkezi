import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { classifyCaller, decideNotification, pickSpecialistPhone, specialistSms, patientSms as buildPatientSms } from '../_shared/appointmentNotify.ts';
import { appointmentAuthority } from '../_shared/appointmentAuthority.ts';
import { escapeHtml } from '../_shared/escapeHtml.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AppointmentNotificationRequest {
  appointmentId: string;
  notificationToken?: string;
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

    // Public JWTs are transport only; the database-issued appointment token is required.
    const notifySecret = Deno.env.get('APPOINTMENT_NOTIFY_SECRET') ?? '';
    const bearer = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
    let caller = classifyCaller({
      secretHeader: req.headers.get('x-notify-secret'), secret: notifySecret,
      bearer, serviceKey: supabaseServiceKey, enforce: true,
    });
    const payload = await req.json().catch(() => ({})) as Partial<AppointmentNotificationRequest>;
    if (typeof payload.appointmentId !== 'string' || !/^[0-9a-f-]{36}$/i.test(payload.appointmentId)) {
      return new Response(JSON.stringify({ error: 'Invalid appointmentId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    if (caller !== 'trusted') {
      const authorized = await appointmentAuthority(payload.appointmentId, payload.notificationToken, async (id, hash) => {
        const { data, error } = await supabase.rpc('verify_appointment_notification_authority', {
          p_appointment_id: id, p_token_hash: hash,
        });
        return !error && data === true;
      });
      if (!authorized) return new Response(JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      caller = 'trusted';
    }
    const missingFields = [
      'appointmentId',
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

    let {
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

    // SECURITY: the notification must describe a real appointment and may only be
    // delivered to the specialist stored on that appointment. Everything that decides
    // the recipient or the content is re-read from the database, so a caller cannot
    // send made-up appointment mails to an address of their choosing.
    const { data: appointmentRow, error: appointmentLookupError } = await supabase
      .from('appointments')
      .select('id, specialist_id, patient_name, patient_email, patient_phone, appointment_date, appointment_time, appointment_type, created_at')
      .eq('id', appointmentId)
      .maybeSingle();

    if (appointmentLookupError || !appointmentRow) {
      console.error('Appointment not found for notification:', appointmentId, appointmentLookupError);
      return new Response(
        JSON.stringify({ error: 'Randevu bulunamadı' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const { data: specialistRecord } = await supabase
      .from('specialists')
      .select('name, email, phone')
      .eq('id', appointmentRow.specialist_id)
      .maybeSingle();

    if (!specialistRecord?.email) {
      console.error('Specialist e-mail missing for appointment:', appointmentId);
      return new Response(
        JSON.stringify({ error: 'Uzman e-posta adresi bulunamadı' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    specialistEmail = specialistRecord.email;
    specialistName = specialistRecord.name ?? '';
    specialistPhone = specialistRecord.phone ?? '';
    patientName = appointmentRow.patient_name ?? '';
    patientEmail = appointmentRow.patient_email ?? '';
    patientPhone = appointmentRow.patient_phone ?? '';
    appointmentDate = appointmentRow.appointment_date;
    appointmentTime = appointmentRow.appointment_time?.toString().slice(0, 5) ?? '';
    appointmentType = appointmentRow.appointment_type ?? '';
    // GÜVENLİK: notlar/danışmanlık konusu hiçbir bildirime girmez.
    notes = undefined;

    // Trusted delayed calls retain the existing 24-hour window and unique claim.
    {
      const { data: prior } = await supabase.from('brevo_email_logs').select('id')
        .eq('template_name', 'appointment-notification').contains('metadata', { appointmentId }).limit(1);
      const decision = decideNotification({ exists: true, alreadyNotified: !!prior?.length, createdAt: appointmentRow.created_at ?? null, now: Date.now(), caller });
      if (!decision.send) {
        console.log(JSON.stringify({ evt: 'appointment_notify_skipped', reason: decision.reason }));
        return new Response(JSON.stringify({ success: true, skipped: true, reason: decision.reason }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }


    // GÜVENLİK: atomik tek-sefer kilidi. Eş zamanlı iki istekte yalnız biri kaydı ekleyebilir.
    {
      const { error: claimErr } = await supabase.from('appointment_notification_claims')
        .insert({ appointment_id: appointmentId, caller, status: 'claimed' });
      if (claimErr) {
        const dup = (claimErr as any).code === '23505';
        console.log(JSON.stringify({ evt: 'appointment_notify_skipped', reason: dup ? 'duplicate_claim' : 'claim_error' }));
        return new Response(JSON.stringify({ success: !dup ? false : true, skipped: true, reason: dup ? 'duplicate' : 'claim_error' }),
          { status: dup ? 200 : 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    console.log(JSON.stringify({ evt: 'appointment_notify', appointmentId, caller }));

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
              <p><strong>Tarih:</strong> ${escapeHtml(formattedDate)}</p>
              <p><strong>Saat:</strong> ${escapeHtml(appointmentTime)}</p>
              <p><strong>Randevu Türü:</strong> ${escapeHtml(appointmentTypeText)}</p>
            </div>

            <div style="background-color: #fff; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
              <h3 style="color: #2c3e50;">Hasta Bilgileri</h3>
              <p><strong>Adı Soyadı:</strong> ${escapeHtml(patientName)}</p>
              <p><strong>E-posta:</strong> ${escapeHtml(patientEmail)}</p>
              <p><strong>Telefon:</strong> ${escapeHtml(patientPhone)}</p>
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

    // Was this appointment already notified? Then this is a repeat call: do not
    // text the patient again (prevents using this endpoint to spam a phone).
    const { data: priorLogs } = await supabase
      .from('brevo_email_logs')
      .select('id')
      .eq('template_name', 'appointment-notification')
      .contains('metadata', { appointmentId })
      .limit(1);
    const isFirstNotification = !priorLogs?.length;
    const isFreshAppointment = appointmentRow.created_at
      ? Date.now() - new Date(appointmentRow.created_at).getTime() < 30 * 60 * 1000
      : false;

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
      console.error('Brevo API error status:', brevoResponse.status);
      // Provider rejection/timeout is not proof of non-delivery. Keep the claim;
      // reconcile before any retry, never risk a duplicate notification.
      throw new Error(`Brevo API error: ${brevoResponse.status}`);
    }

    const brevoResult = await brevoResponse.json();
    console.log(JSON.stringify({ evt: 'appointment_email_ok' }));

    // Alıcı telefonu YALNIZ uzmanın kendi kayıtlı numarası.
    const { phone: resolvedSpecialistPhone, source: smsPhoneSource } = pickSpecialistPhone(specialistRecord.phone);
    await supabase.from('appointment_notification_claims')
      .update({ status: 'email_sent', updated_at: new Date().toISOString() }).eq('appointment_id', appointmentId);

    console.log(JSON.stringify({ evt: 'appointment_notify_phone', source: smsPhoneSource }));

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
        console.log(JSON.stringify({ evt: 'appointment_sms_specialist' }));

        const smsMessage = specialistSms({ patientName, date: formattedDate, time: appointmentTime, type: appointmentTypeText, patientPhone });

        const { data: smsData, error: smsError } = await supabase.functions.invoke('send-sms-via-static-proxy', {
          body: {
            phone: resolvedSpecialistPhone,
            message: smsMessage,
          },
        });

        if (smsError) {
          console.error('SMS sending error:', smsError);
        } else {
          console.log(JSON.stringify({ evt: 'appointment_sms_specialist_ok' }));
          smsResult = smsData;
        }
      } catch (smsError) {
        console.error('SMS sending failed:', smsError);
      }
    } else {
      console.log('No usable specialist phone found in specialist record; skipping SMS');
    }

    // Hastaya "randevunuz alındı" SMS'i — yalnızca kayıttaki numaraya, bir kez.
    if (patientPhone) {
      try {
        const patientSms = buildPatientSms({ specialistName, date: formattedDate, time: appointmentTime, type: appointmentTypeText });
        const { error: pSmsErr } = await supabase.functions.invoke('send-sms-via-static-proxy', {
          body: { phone: patientPhone, message: patientSms },
        });
        if (pSmsErr) console.error('Patient SMS error:', pSmsErr);
      } catch (e) {
        console.error('Patient SMS failed:', e);
      }
    }

    // Doki'den uzmana WhatsApp bildirimi (WAHA üzerinden) — hata olursa sessizce geç
    let dokiWaResult: any = null;
    try {
      if (resolvedSpecialistPhone) {
        const normalizePhoneToWa = (raw: string): string | null => {
          const digits = (raw || '').replace(/\D/g, '');
          if (digits.startsWith('90') && digits.length === 12) return digits;
          if (digits.startsWith('0') && digits.length === 11) return '9' + digits;
          if (digits.length === 10) return '90' + digits;
          return null;
        };
        const getSessionNameForLineId = (lineId: string) =>
          `line_${lineId.replace(/-/g, '').slice(0, 16)}`;

        const waPhone = normalizePhoneToWa(resolvedSpecialistPhone);
        if (waPhone) {
          const { data: activeLines } = await supabase
            .from('whatsapp_lines')
            .select('id, phone_number, is_active, sort_order')
            .eq('is_active', true)
            .order('sort_order', { ascending: true });
          const lines = (activeLines || []) as any[];
          const candidates = lines.map((l) => getSessionNameForLineId(l.id));
          const activePhones = new Set(lines.map((l) => String(l.phone_number || '').replace(/\D/g, '')).filter(Boolean));

          if (candidates.length > 0) {
            const sessionsRes = await supabase.functions.invoke('waha-proxy', {
              body: { action: 'sessions.list' },
            });
            const sessions = Array.isArray((sessionsRes.data as any)?.data) ? (sessionsRes.data as any).data : [];
            let sessionName: string | undefined = candidates.find((c) =>
              sessions.some((s: any) => s?.name === c && String(s?.status || '').toUpperCase() === 'WORKING')
            );
            if (!sessionName) {
              const matched = sessions.find((s: any) => {
                if (String(s?.status || '').toUpperCase() !== 'WORKING') return false;
                const mePhone = String(s?.me?.id || '').split('@')[0]?.replace(/\D/g, '') || '';
                return mePhone && activePhones.has(mePhone);
              });
              if (matched) sessionName = matched.name;
            }

            if (sessionName) {
              const dokiText =
                `Merhaba ${specialistName} 👋\n\n` +
                `Ben *Doki* — Doktorum Ol platformunun yapay zeka asistanıyım.\n\n` +
                `📅 *Yeni bir randevunuz var!*\n\n` +
                `👤 *Danışan:* ${patientName}\n` +
                `📆 *Tarih:* ${formattedDate}\n` +
                `🕐 *Saat:* ${appointmentTime}\n` +
                `💼 *Tür:* ${appointmentTypeText}\n` +
                `📞 *Telefon:* ${patientPhone}` +
                `\n\n🔗 Randevu detaylarını web sitemizden veya mobil uygulamamızdan kontrol edebilirsiniz:\n` +
                `https://doktorumol.com.tr\n\n` +
                `Başarılı bir görüşme dilerim! 💙\n\n` +
                `— *Doki*\n_Doktorum Ol AI Asistanı_`;

              const waRes = await supabase.functions.invoke('waha-proxy', {
                body: {
                  action: 'sendText',
                  sessionName,
                  payload: { chatId: `${waPhone}@c.us`, text: dokiText },
                },
              });
              dokiWaResult = waRes.data;
              console.log(JSON.stringify({ evt: 'appointment_wa_ok' }));
            } else {
              console.log('Doki WA: WORKING session bulunamadı, atlandı');
            }
          } else {
            console.log('Doki WA: aktif WhatsApp hattı yok, atlandı');
          }
        } else {
          console.log('Doki WA: telefon WA formatına çevrilemedi, atlandı');
        }
      }
    } catch (waErr) {
      console.error('Doki WA randevu bildirim hatası (sessizce geçiliyor):', waErr);
    }

    return new Response(
      JSON.stringify({
        success: true,
        messageId: brevoResult.messageId,
        smsResult,
        dokiWaResult,
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
