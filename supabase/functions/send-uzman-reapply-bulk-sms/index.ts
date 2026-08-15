// Bulk SMS to specialists (uzman_basvurulari) in a given status category,
// inviting them to complete registration at /kayit-ol. Uses Verimor batch API
// through the same proxy chain as send-reapply-bulk-sms.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { verifyAdminOrCron } from "../_shared/adminAuth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function buildMessage(firstName: string): string {
  const nm = (firstName || "").trim().split(/\s+/)[0] || "";
  const hi = nm ? `Sayin ${nm},` : "Merhaba,";
  return `${hi} Size doktorumol.com.tr'den ulasiyoruz.

Kampanyali paket uzerinden son alimlarimiz saglanmaktadir; akabinde danisan yonlendirmelerimiz ve diger calismalarimiz baslayacaktir.

Asagidaki linkten profilinizi olusturabilirsiniz:
https://doktorumol.com.tr/kayit-ol

Saglikli gunler dileriz.`;
}

function toGsm7(s: string): string {
  const map: Record<string, string> = {
    "ç": "c", "Ç": "C",
    "ğ": "g", "Ğ": "G",
    "ı": "i", "İ": "I",
    "ö": "o", "Ö": "O",
    "ş": "s", "Ş": "S",
    "ü": "u", "Ü": "U",
  };
  return s.replace(/[çÇğĞıİöÖşŞüÜ]/g, (c) => map[c] || c);
}

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

  if (relayUrl) {
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (relayToken) headers["Authorization"] = `Bearer ${relayToken}`;
      const r = await fetch(relayUrl, { method: "POST", headers, body: JSON.stringify(payload) });
      const text = await r.text();
      if (r.ok && !text.toLowerCase().includes("izin")) {
        return { status: r.status, body: text, via: "relay" };
      }
      console.log(`Relay failed (status=${r.status}); trying ScrapingBee`);
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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const __auth = await verifyAdminOrCron(req);
  if (!__auth.ok) {
    return new Response(JSON.stringify({ error: __auth.error }), {
      status: __auth.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const url = new URL(req.url);
    const dryRun = url.searchParams.get("dryRun") === "1";
    const skipSent = url.searchParams.get("skipSent") === "1";

    let bodyStatus: string | undefined;
    try {
      if (req.method !== "GET") {
        const b = await req.json().catch(() => ({}));
        if (b && typeof b.status === "string") bodyStatus = b.status;
      }
    } catch { /* ignore */ }
    const ALLOWED_STATUSES = new Set(["contacted", "follow_up", "no_answer"]);
    const targetStatus = bodyStatus && ALLOWED_STATUSES.has(bodyStatus) ? bodyStatus : "contacted";

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const pageSize = 1000;
    let from = 0;
    const rows: { id: string; full_name: string; phone: string; welcome_sent_at: string | null }[] = [];
    while (true) {
      const { data, error } = await supabase
        .from("uzman_basvurulari")
        .select("id, full_name, phone, welcome_sent_at")
        .eq("status", targetStatus)
        .order("created_at", { ascending: false })
        .range(from, from + pageSize - 1);
      if (error) throw error;
      const batch = data || [];
      rows.push(...batch);
      if (batch.length < pageSize) break;
      from += pageSize;
    }

    const recipients: { id: string; name: string; phone: string }[] = [];
    const skipped: { id: string; reason: string }[] = [];
    const seen = new Set<string>();
    for (const r of rows) {
      if (skipSent && r.welcome_sent_at) {
        skipped.push({ id: r.id, reason: "already_sent" });
        continue;
      }
      const norm = normalizePhone(r.phone || "");
      if (!norm) {
        skipped.push({ id: r.id, reason: "invalid_phone" });
        continue;
      }
      if (seen.has(norm)) {
        skipped.push({ id: r.id, reason: "duplicate" });
        continue;
      }
      seen.add(norm);
      recipients.push({ id: r.id, name: r.full_name || "", phone: norm });
    }

    console.log(`${targetStatus} uzman leads: ${rows.length}, recipients: ${recipients.length}, skipped: ${skipped.length}`);

    if (dryRun) {
      return new Response(
        JSON.stringify({
          success: true,
          dryRun: true,
          total: rows.length,
          recipientCount: recipients.length,
          skippedCount: skipped.length,
          sample: recipients.slice(0, 3).map((r) => ({
            phone: r.phone,
            preview: toGsm7(buildMessage(r.name)),
          })),
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const username = Deno.env.get("VERIMOR_USERNAME");
    const password = Deno.env.get("VERIMOR_PASSWORD");
    const sender = (Deno.env.get("SMS_SENDER") || Deno.env.get("VERIMOR_SENDER") || "Doktorum Ol").trim();
    if (!username || !password) throw new Error("Verimor credentials not configured");

    const CHUNK_SIZE = 200;
    const results: any[] = [];
    const sentLeadIds: string[] = [];

    for (let i = 0; i < recipients.length; i += CHUNK_SIZE) {
      const chunk = recipients.slice(i, i + CHUNK_SIZE);
      const payload = {
        username,
        password,
        source_addr: sender,
        source_addr_type: "5",
        custom_id: `uzman-reapply-${Date.now()}-${i}`,
        datacoding: "0",
        valid_for: "48:00",
        send_at: "",
        datacoding_lock: "0",
        messages: chunk.map((r) => ({
          msg: toGsm7(buildMessage(r.name)),
          dest: r.phone,
        })),
      };

      const res = await sendBatchViaProxy(payload);
      console.log(`Chunk ${i / CHUNK_SIZE + 1} (${chunk.length}) via=${res.via} status=${res.status} body=${res.body.slice(0, 200)}`);
      const okChunk = res.status >= 200 && res.status < 300;
      if (okChunk) sentLeadIds.push(...chunk.map((c) => c.id));
      results.push({
        chunk: i / CHUNK_SIZE + 1,
        count: chunk.length,
        via: res.via,
        status: res.status,
        body: res.body.slice(0, 500),
      });
    }

    if (sentLeadIds.length > 0) {
      const nowIso = new Date().toISOString();
      for (let i = 0; i < sentLeadIds.length; i += 500) {
        const slice = sentLeadIds.slice(i, i + 500);
        await supabase
          .from("uzman_basvurulari")
          .update({ welcome_sent_at: nowIso })
          .in("id", slice);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        total: rows.length,
        sentCount: sentLeadIds.length,
        recipientCount: recipients.length,
        skippedCount: skipped.length,
        chunks: results,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e: any) {
    console.error("send-uzman-reapply-bulk-sms error:", e);
    return new Response(JSON.stringify({ success: false, error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
