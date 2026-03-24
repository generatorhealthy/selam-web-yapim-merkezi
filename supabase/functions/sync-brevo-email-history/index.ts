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
    if (!brevoApiKey) {
      throw new Error('BREVO_API_KEY not found');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let totalImported = 0;
    let offset = 0;
    const limit = 50;
    let hasMore = true;

    while (hasMore) {
      // Fetch transactional emails from Brevo
      const url = `https://api.brevo.com/v3/smtp/emails?limit=${limit}&offset=${offset}&sort=desc`;
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'api-key': brevoApiKey,
        },
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error('Brevo API error:', errText);
        throw new Error(`Brevo API error: ${response.status}`);
      }

      const data = await response.json();
      const emails = data.transactionalEmails || [];

      if (emails.length === 0) {
        hasMore = false;
        break;
      }

      // Insert each email into brevo_email_logs (skip duplicates)
      for (const email of emails) {
        const messageId = email.messageId || email.uuid || null;
        
        // Check if already exists
        if (messageId) {
          const { data: existing } = await supabaseAdmin
            .from('brevo_email_logs')
            .select('id')
            .eq('brevo_message_id', messageId)
            .maybeSingle();
          
          if (existing) continue;
        }

        // Map Brevo event to status
        let status = 'sent';
        if (email.event === 'delivered' || email.event === 'opened' || email.event === 'clicks') {
          status = 'sent';
        } else if (email.event === 'hardBounces' || email.event === 'softBounces' || email.event === 'blocked') {
          status = 'failed';
        } else if (email.event === 'deferred') {
          status = 'pending';
        }

        await supabaseAdmin.from('brevo_email_logs').insert({
          recipient_email: email.email || 'unknown',
          recipient_name: email.to ? (Array.isArray(email.to) ? email.to[0] : email.to) : null,
          subject: email.subject || 'Konu yok',
          template_name: email.templateId ? `template-${email.templateId}` : 'manual',
          status,
          brevo_message_id: messageId,
          created_at: email.date || new Date().toISOString(),
          metadata: {
            event: email.event,
            tag: email.tag,
            from: email.from,
          }
        });

        totalImported++;
      }

      offset += limit;
      if (emails.length < limit) {
        hasMore = false;
      }

      // Safety limit
      if (offset > 2000) {
        hasMore = false;
      }
    }

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
