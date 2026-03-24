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
    if (!brevoApiKey) throw new Error('BREVO_API_KEY not found');

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let totalImported = 0;

    // Use Brevo SMTP statistics/events endpoint which doesn't require email filter
    // Fetch events for the last 90 days
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    let offset = 0;
    const limit = 50;
    let hasMore = true;

    while (hasMore) {
      const url = `https://api.brevo.com/v3/smtp/statistics/events?limit=${limit}&offset=${offset}&startDate=${startDate}&endDate=${endDate}&sort=desc`;
      console.log('Fetching Brevo events:', url);
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'api-key': brevoApiKey,
        },
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error('Brevo API error:', errText);
        throw new Error(`Brevo API error: ${response.status} - ${errText}`);
      }

      const data = await response.json();
      const events = data.events || [];
      console.log(`Fetched ${events.length} events at offset ${offset}`);

      if (events.length === 0) {
        hasMore = false;
        break;
      }

      for (const event of events) {
        const messageId = event.messageId || null;
        
        // Skip if already exists
        if (messageId) {
          const { data: existing } = await supabaseAdmin
            .from('brevo_email_logs')
            .select('id')
            .eq('brevo_message_id', String(messageId))
            .maybeSingle();
          
          if (existing) continue;
        }

        // Map event to status
        let status = 'sent';
        const eventName = event.event || '';
        if (['delivered', 'opened', 'clicks', 'uniqueOpened'].includes(eventName)) {
          status = 'sent';
        } else if (['hardBounces', 'softBounces', 'blocked', 'invalid'].includes(eventName)) {
          status = 'failed';
        } else if (['deferred'].includes(eventName)) {
          status = 'pending';
        } else if (eventName === 'requests') {
          status = 'sent';
        }

        // Determine template name from subject or tag
        let templateName = 'manual';
        const subject = event.subject || '';
        const tag = event.tag || '';
        
        if (subject.includes('Randevu') || tag.includes('appointment')) templateName = 'appointment-notification';
        else if (subject.includes('İletişim') || tag.includes('contact')) templateName = 'contact-email';
        else if (subject.includes('Kayıt') || tag.includes('registration')) templateName = 'registration-email';
        else if (subject.includes('Destek')) templateName = 'support-response';
        else if (subject.includes('Test Sonucu')) templateName = 'test-results';
        else if (subject.includes('Sipariş') || subject.includes('Belge')) templateName = 'order-documents';
        else if (subject.includes('Blog')) templateName = 'blog-notification';
        else if (subject.includes('Muhasebe') || subject.includes('Fatura')) templateName = 'accounting-notification';
        else if (subject.includes('Hukuki')) templateName = 'legal-proceeding';
        else if (subject.includes('Onay') && subject.includes('Hasta')) templateName = 'patient-confirmation';

        const { error: insertError } = await supabaseAdmin.from('brevo_email_logs').insert({
          recipient_email: event.email || 'unknown',
          recipient_name: null,
          subject: subject || 'Konu yok',
          template_name: templateName,
          status,
          brevo_message_id: messageId ? String(messageId) : null,
          created_at: event.date || new Date().toISOString(),
          metadata: {
            event: eventName,
            tag: tag,
            from: event.from,
          }
        });

        if (insertError) {
          console.error('Insert error:', insertError);
        } else {
          totalImported++;
        }
      }

      offset += limit;
      if (events.length < limit) hasMore = false;
      if (offset > 5000) hasMore = false;
    }

    console.log(`Total imported: ${totalImported}`);

    return new Response(
      JSON.stringify({ success: true, imported: totalImported }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error syncing Brevo history:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);
