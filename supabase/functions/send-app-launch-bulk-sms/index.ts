// One-shot bulk SMS to all active specialists announcing the mobile app launch.
// Uses Verimor batch API via static IP relay or ScrapingBee proxy
// (Supabase Edge IPs are not whitelisted in Verimor).
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MESSAGE = `Sayin Uzmanimiz,

Doktorum Ol mobil uygulamasi artik App Store ve Google Play'de!

Randevularinizi yonetin, danisanlarinizla iletisimde kalin, takviminizi cebinizden kontrol edin.

Indirin: https://apps.apple.com/tr/app/doktorum-ol/id6762599027?l=tr

Doktorumol.com.tr`;

function normalizePhone(raw: string): string | null {
  if (!raw) return null;
  let p = raw.replace(/\D/g, "");
  if (p.startsWith("0")) p = "90" + p.substring(1);
  else if (!p.startsWith("90")) p = "90" + p;
  if (p.length !== 12 || !p.startsWith("905")) return null;
  return p;
}

async function sendBatchViaProxy(payload: unknown): Promise<{ status: number; body: string; via: string }> {
  const relayUrl = Deno.env.get("SMS_RELAY_URL");
  const relayToken = Deno.env.get("SMS_RELAY_TOKEN");
  const scrapingBeeApiKey = Deno.env.get("SCRAPINGBEE_API_KEY");

  // Try relay first
  if (relayUrl) {
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (relayToken) headers["Authorization"] = `Bearer ${relayToken}`;
      const r = await fetch(relayUrl, { method: "POST", headers, body: JSON.stringify(payload) });
      const text = await r.text();
      if (r.ok && !text.toLowerCase().includes("izin")) {
        return { status: r.status, body: text, via: "relay" };
      }
      console.log(`Relay failed (status=${r.status}), body=${text.slice(0, 200)}; trying ScrapingBee fallback`);
    } catch (e) {
      console.log("Relay threw:", e);
    }
  }

  if (scrapingBeeApiKey) {
    const sbUrl =
      `https://app.scrapingbee.com/api/v1/?api_key=${scrapingBeeApiKey}` +
      `&url=${encodeURIComponent("https://sms.verimor.com.tr/v2/send.json")}` +
      `&render_js=false&premium_proxy=true&country_code=tr&method=POST&forward_headers=true`;
    const r = await fetch(sbUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Spb-Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const text = await r.text();
    return { status: r.status, body: text, via: "scrapingbee" };
  }

  throw new Error("No proxy configured: set SMS_RELAY_URL or SCRAPINGBEE_API_KEY");
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const dryRun = new URL(req.url).searchParams.get("dryRun") === "1";

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: specialists, error } = await supabase
      .from("specialists")
      .select("id, name, phone")
      .eq("is_active", true)
      .not("phone", "is", null);

    if (error) throw error;

    const recipients: { id: string; name: string; phone: string }[] = [];
    const skipped: { id: string; name: string; phone: string | null; reason: string }[] = [];
    const seen = new Set<string>();

    for (const s of specialists ?? []) {
      const norm = normalizePhone(s.phone ?? "");
      if (!norm) {
        skipped.push({ id: s.id, name: s.name, phone: s.phone, reason: "invalid_phone" });
        continue;
      }
      if (seen.has(norm)) {
        skipped.push({ id: s.id, name: s.name, phone: s.phone, reason: "duplicate" });
        continue;
      }
      seen.add(norm);
      recipients.push({ id: s.id, name: s.name, phone: norm });
    }

    console.log(`Total active specialists: ${specialists?.length}`);
    console.log(`Valid recipients: ${recipients.length}, Skipped: ${skipped.length}`);

    if (dryRun) {
      return new Response(
        JSON.stringify({ success: true, dryRun: true, recipientCount: recipients.length, skipped }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const username = Deno.env.get("VERIMOR_USERNAME");
    const password = Deno.env.get("VERIMOR_PASSWORD");
    const sender = (Deno.env.get("SMS_SENDER") || Deno.env.get("VERIMOR_SENDER") || "Doktorum Ol").trim();
    if (!username || !password) throw new Error("Verimor credentials not configured");

    // Verimor batch: chunks of 200 per request
    const CHUNK_SIZE = 200;
    const results: any[] = [];

    for (let i = 0; i < recipients.length; i += CHUNK_SIZE) {
      const chunk = recipients.slice(i, i + CHUNK_SIZE);
      const payload = {
        username,
        password,
        source_addr: sender,
        source_addr_type: "5",
        custom_id: `app-launch-${Date.now()}-${i}`,
        datacoding: "0",
        valid_for: "48:00",
        send_at: "",
        datacoding_lock: "0",
        messages: chunk.map((r) => ({ msg: MESSAGE, dest: r.phone })),
      };

      const res = await sendBatchViaProxy(payload);
      console.log(`Chunk ${i / CHUNK_SIZE + 1} (${chunk.length} msgs) via=${res.via} status=${res.status} body=${res.body.slice(0, 300)}`);
      results.push({
        chunk: i / CHUNK_SIZE + 1,
        count: chunk.length,
        via: res.via,
        status: res.status,
        body: res.body.slice(0, 500),
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        totalActive: specialists?.length ?? 0,
        sentCount: recipients.length,
        skippedCount: skipped.length,
        chunks: results,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e: any) {
    console.error("send-app-launch-bulk-sms error:", e);
    return new Response(JSON.stringify({ success: false, error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);
