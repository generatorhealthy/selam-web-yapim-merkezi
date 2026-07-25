// Bulk SMS to externally-supplied recipients (not stored in DB) using the same
// re-apply template as send-reapply-bulk-sms. Accepts { recipients: [{name, phone}] }.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { verifyAdminOrCron } from "../_shared/adminAuth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function buildMessage(firstName: string): string {
  const nm = (firstName || "").trim().split(/\s+/)[0] || "";
  const hi = nm ? `Sayin ${nm},` : "Merhaba,";
  return `${hi}

Doktorumol.com.tr olarak sizlerle daha once gorusme saglamistik.

Psikolog veya Aile Danismani destegine hala ihtiyac duyuyorsaniz, asagidaki formu doldurarak basvurunuzu olusturabilirsiniz. Ihtiyaciniza en uygun uzmani belirlemek icin ekibimiz en kisa surede sizinle iletisime gececektir.

Basvuru Formu:
https://doktorumol.com.tr/danismanlik-randevusu-al

Saglikli gunler dileriz.`;
}

function toGsm7(s: string): string {
  const map: Record<string, string> = {
    "ç":"c","Ç":"C","ğ":"g","Ğ":"G","ı":"i","İ":"I",
    "ö":"o","Ö":"O","ş":"s","Ş":"S","ü":"u","Ü":"U",
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
    } catch (e) { console.log("Relay threw:", e); }
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

  // Accept either an admin/cron caller OR a one-shot header token for agent-triggered runs.
  const oneShot = Deno.env.get("EXT_SMS_ONESHOT_TOKEN");
  const provided = req.headers.get("x-ext-token") || "";
  const oneShotOk = !!oneShot && provided === oneShot;
  if (!oneShotOk) {
    const __auth = await verifyAdminOrCron(req);
    if (!__auth.ok) {
      return new Response(JSON.stringify({ error: __auth.error }), {
        status: __auth.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  try {
    const url = new URL(req.url);
    const dryRun = url.searchParams.get("dryRun") === "1";
    const body = await req.json().catch(() => ({}));
    const inRecipients: { name?: string; phone: string }[] = Array.isArray(body?.recipients) ? body.recipients : [];

    const recipients: { name: string; phone: string }[] = [];
    const seen = new Set<string>();
    let skipped = 0;
    for (const r of inRecipients) {
      const n = normalizePhone(r.phone || "");
      if (!n || seen.has(n)) { skipped++; continue; }
      seen.add(n);
      recipients.push({ name: (r.name || "").toString(), phone: n });
    }

    if (dryRun) {
      return new Response(JSON.stringify({
        success: true, dryRun: true, recipientCount: recipients.length, skipped,
        sample: recipients.slice(0, 3).map(r => ({ phone: r.phone, preview: toGsm7(buildMessage(r.name)) })),
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const username = Deno.env.get("VERIMOR_USERNAME");
    const password = Deno.env.get("VERIMOR_PASSWORD");
    const sender = (Deno.env.get("SMS_SENDER") || Deno.env.get("VERIMOR_SENDER") || "Doktorum Ol").trim();
    if (!username || !password) throw new Error("Verimor credentials not configured");

    const CHUNK_SIZE = 200;
    const results: any[] = [];
    let sentCount = 0;

    for (let i = 0; i < recipients.length; i += CHUNK_SIZE) {
      const chunk = recipients.slice(i, i + CHUNK_SIZE);
      const payload = {
        username, password,
        source_addr: sender,
        source_addr_type: "5",
        custom_id: `ext-reapply-${Date.now()}-${i}`,
        datacoding: "0",
        valid_for: "48:00",
        send_at: "",
        datacoding_lock: "0",
        messages: chunk.map((r) => ({ msg: toGsm7(buildMessage(r.name)), dest: r.phone })),
      };
      const res = await sendBatchViaProxy(payload);
      const ok = res.status >= 200 && res.status < 300;
      if (ok) sentCount += chunk.length;
      results.push({ chunk: i / CHUNK_SIZE + 1, count: chunk.length, via: res.via, status: res.status, body: res.body.slice(0, 300) });
    }

    return new Response(JSON.stringify({
      success: true, recipientCount: recipients.length, sentCount, skipped, chunks: results,
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    console.error("send-external-reapply-sms error:", e);
    return new Response(JSON.stringify({ success: false, error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
