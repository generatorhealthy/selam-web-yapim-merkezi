import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

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

    const { days = 7 } = await req.json().catch(() => ({}));
    
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Fetch aggregated statistics
    const statsResponse = await fetch(
      `https://api.brevo.com/v3/smtp/statistics/aggregatedReport?startDate=${startDate}&endDate=${endDate}`,
      {
        headers: {
          'Accept': 'application/json',
          'api-key': brevoApiKey,
        },
      }
    );

    if (!statsResponse.ok) {
      const errText = await statsResponse.text();
      throw new Error(`Brevo stats API error: ${statsResponse.status} - ${errText}`);
    }

    const stats = await statsResponse.json();

    // Fetch recent events with details (opened, clicked, bounced, etc.)
    const eventsResponse = await fetch(
      `https://api.brevo.com/v3/smtp/statistics/events?limit=100&offset=0&startDate=${startDate}&endDate=${endDate}&sort=desc`,
      {
        headers: {
          'Accept': 'application/json',
          'api-key': brevoApiKey,
        },
      }
    );

    if (!eventsResponse.ok) {
      const errText = await eventsResponse.text();
      throw new Error(`Brevo events API error: ${eventsResponse.status} - ${errText}`);
    }

    const eventsData = await eventsResponse.json();

    // Build per-email event map
    const emailEvents: Record<string, any[]> = {};
    for (const event of (eventsData.events || [])) {
      const key = `${event.email}_${event.subject}_${event.date?.split('T')[0] || ''}`;
      if (!emailEvents[key]) emailEvents[key] = [];
      emailEvents[key].push({
        event: event.event,
        date: event.date,
        messageId: event.messageId,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        aggregated: {
          requests: stats.requests || 0,
          delivered: stats.delivered || 0,
          opens: stats.opens || 0,
          uniqueOpens: stats.uniqueOpens || 0,
          clicks: stats.clicks || 0,
          uniqueClicks: stats.uniqueClicks || 0,
          hardBounces: stats.hardBounces || 0,
          softBounces: stats.softBounces || 0,
          blocked: stats.blocked || 0,
          complaints: stats.spamReports || 0,
          invalid: stats.invalid || 0,
        },
        events: eventsData.events || [],
        period: { startDate, endDate, days },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error fetching Brevo statistics:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);
