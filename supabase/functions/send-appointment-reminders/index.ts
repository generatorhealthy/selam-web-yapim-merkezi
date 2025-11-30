import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
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

    console.log('Starting appointment reminder check...');

    // Get current time and calculate 5 hours from now
    const now = new Date();
    const fiveHoursFromNow = new Date(now.getTime() + (5 * 60 * 60 * 1000));
    const sixHoursFromNow = new Date(now.getTime() + (6 * 60 * 60 * 1000));

    // Format dates for comparison
    const targetDate = fiveHoursFromNow.toISOString().split('T')[0];
    const endTargetDate = sixHoursFromNow.toISOString().split('T')[0];

    console.log('Current time:', now.toISOString());
    console.log('Looking for appointments between:', fiveHoursFromNow.toISOString(), 'and', sixHoursFromNow.toISOString());

    // Get appointments that are 5-6 hours away and confirmed
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select(`
        id,
        patient_name,
        patient_phone,
        appointment_date,
        appointment_time,
        appointment_type,
        status,
        specialists (
          name
        )
      `)
      .eq('status', 'confirmed')
      .gte('appointment_date', targetDate)
      .lte('appointment_date', endTargetDate);

    if (appointmentsError) {
      console.error('Error fetching appointments:', appointmentsError);
      throw appointmentsError;
    }

    console.log('Found appointments:', appointments?.length || 0);

    let remindersSent = 0;
    let errors = 0;

    if (appointments && appointments.length > 0) {
      for (const appointment of appointments) {
        try {
          // Parse appointment date and time
          const appointmentDateTime = new Date(`${appointment.appointment_date}T${appointment.appointment_time}`);
          const timeDifference = appointmentDateTime.getTime() - now.getTime();
          const hoursDifference = timeDifference / (1000 * 60 * 60);

          console.log('Appointment:', appointment.id, 'Time difference:', hoursDifference, 'hours');

          // Check if appointment is between 5 and 6 hours away
          if (hoursDifference >= 5 && hoursDifference < 6) {
            const specialistName = appointment.specialists?.name || 'Uzmanınız';
            const appointmentTypeText = appointment.appointment_type === 'online' ? 'online' : 
                                       appointment.appointment_type === 'face-to-face' ? 'yüz yüze' : 
                                       appointment.appointment_type;

            const formattedDate = new Date(appointment.appointment_date).toLocaleDateString('tr-TR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            });

            const message = `Merhaba ${appointment.patient_name}, ${specialistName} ile bugün saat ${appointment.appointment_time}'da ${appointmentTypeText} randevunuz bulunmaktadır. İyi günler dileriz. - doktorumol.com.tr`;

            console.log('Sending reminder SMS to:', appointment.patient_phone);

            const { data: smsData, error: smsError } = await supabase.functions.invoke('send-sms-via-static-proxy', {
              body: {
                phone: appointment.patient_phone,
                message: message
              }
            });

            if (smsError) {
              console.error('SMS sending error for appointment', appointment.id, ':', smsError);
              errors++;
            } else {
              console.log('SMS sent successfully for appointment:', appointment.id);
              remindersSent++;
            }
          }
        } catch (error) {
          console.error('Error processing appointment', appointment.id, ':', error);
          errors++;
        }
      }
    }

    console.log('Reminder check completed. Sent:', remindersSent, 'Errors:', errors);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Appointment reminder check completed',
        remindersSent,
        errors,
        appointmentsChecked: appointments?.length || 0
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