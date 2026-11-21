import { createClient } from "npm:@supabase/supabase-js@2";
import { verifyAdminOrCron } from "../_shared/adminAuth.ts";
import { isBlockedPhone } from "../_shared/blocklist.ts";
import {
  AREA_LABELS, AreaKey, areaFromTherapy, areaMessage, callToken, inCallWindow, localMobile, normalizeMobile,
  REPLY_1, REPLY_2,
} from "../_shared/leadIvr.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });

const VOICE_ID = "pFZP5JQG7iQjIQuC4Bku"; // Lily – kadın sesi
const DIAL_PREFIX = "81"; // FCT0606 hattı
const CLI = "905317893880";
const CLI_LABEL = "0531 789 38 80";
const MAX_PARALLEL = 2;
const RING_SECONDS = 40;
const SOUND_VERSION = "pbx-v1";

function pbxUrl() {
  const raw = (Deno.env.get("FREEPBX_BULK_URL") ?? "").trim();
  if (!raw) return "";
  const base = /^https?:\/\//i.test(raw) ? raw : `http://${raw}`;
  return base.replace(/\/[^/]*\.php.*$/i, "").replace(/\/+$/, "") + "/freepbx-ivr.php";
}

async function pbx(action: string, extra: Record<string, unknown> = {}) {
  const url = pbxUrl();
  const secret = (Deno.env.get("FREEPBX_BULK_SECRET") ?? "").trim();
  if (!url || !secret) throw new Error("Santral bağlantı bilgisi eksik");
  const send = (u: string) => fetch(u, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ secret, action, ...extra }), signal: AbortSignal.timeout(20000),
  });
  let r: Response;
  try {
    r = await send(url);
  } catch (e) {
    // Santralin alan adı yok; IP üzerindeki HTTPS sertifikası geçersiz olduğu için HTTP'ye düş.
    if (!/^https:/i.test(url)) throw new Error("Santrale ulaşılamadı");
    try { r = await send(url.replace(/^https:/i, "http:")); }
    catch { throw new Error("Santrale ulaşılamadı"); }
  }
  const t = await r.text();
  if (r.status === 404) throw new Error("Santralde freepbx-ivr.php dosyası yok. Önce dosyayı yükleyin.");
  let p: any = null;
  try { p = JSON.parse(t); } catch { /* */ }
  if (!r.ok || !p?.success) throw new Error(p?.error ? `Santral: ${p.error}` : `Santral hata ${r.status}`);
  return p;
}

async function tts(text: string, format: string): Promise<Uint8Array> {
  const key = Deno.env.get("ELEVENLABS_API_KEY");
  if (!key) throw new Error("ElevenLabs anahtarı yok");
  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}?output_format=${format}`, {
    method: "POST",
    headers: { "xi-api-key": key, "Content-Type": "application/json" },
    body: JSON.stringify({
      text, model_id: "eleven_multilingual_v2", language_code: "tr",
      voice_settings: { stability: 0.55, similarity_boost: 0.8, style: 0.25, use_speaker_boost: true, speed: 0.95 },
    }),
  });
  if (!r.ok) throw new Error(`ElevenLabs hata ${r.status}`);
  return new Uint8Array(await r.arrayBuffer());
}

function b64(bytes: Uint8Array) {
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

const ANN_TEXTS: Record<string, string> = {
  ...Object.fromEntries((Object.keys(AREA_LABELS) as AreaKey[]).map((a) => [`area_${a}`, areaMessage(a)])),
  reply_1: REPLY_1,
  reply_2: REPLY_2,
};

async function ensureSounds(svc: any) {
  const { data } = await svc.from("lead_ivr_announcements").select("key, text, voice_id, announcement_id");
  const have = new Map((data || []).map((r: any) => [r.key, r]));
  const stale = Object.entries(ANN_TEXTS).some(([k, text]) => {
    const r: any = have.get(k);
    return !r || r.text !== text || r.voice_id !== VOICE_ID || r.announcement_id !== SOUND_VERSION;
  });
  if (!stale) return;
  const files: Record<string, string> = {};
  for (const [k, text] of Object.entries(ANN_TEXTS)) files[k] = b64(await tts(text, "ulaw_8000"));
  await pbx("setup", { files });
  await svc.from("lead_ivr_announcements").upsert(
    Object.entries(ANN_TEXTS).map(([key, text]) => ({ key, text, voice_id: VOICE_ID, announcement_id: SOUND_VERSION })),
  );
}

async function dispatch(svc: any, call: any) {
  const base = Deno.env.get("SUPABASE_URL")!;
  const t = await callToken(call.id, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const webhook = `${base}/functions/v1/lead-ivr-webhook?t=${t}`;
  await svc.from("lead_ivr_calls").update({ state: "dialing", dispatched_at: new Date().toISOString() }).eq("id", call.id);
  try {
    await pbx("call", {
      number: localMobile(call.phone), prefix: DIAL_PREFIX, area: call.area_key, call_id: call.id,
      webhook, ring_seconds: RING_SECONDS,
    });
  } catch (e) {
    await svc.from("lead_ivr_calls").update({ state: "failed", call_status: (e as Error).message.slice(0, 200) }).eq("id", call.id);
    throw e;
  }
}

// Bir tur: biten aramaları kapat, boş kanal kadar yenisini başlat.
async function tick(svc: any) {
  const stale = new Date(Date.now() - (RING_SECONDS + 120) * 1000).toISOString();
  await svc.from("lead_ivr_calls").update({ state: "done", call_status: "no_digit" })
    .eq("state", "dialing").is("digit", null).lt("dispatched_at", stale);

  const { data: camp } = await svc.from("lead_ivr_campaigns").select("id")
    .eq("status", "running").order("created_at", { ascending: true }).limit(1).maybeSingle();
  if (!camp) return { idle: true };
  if (!inCallWindow(new Date())) return { waiting: "saat" };

  const { count: dialing } = await svc.from("lead_ivr_calls").select("id", { count: "exact", head: true })
    .eq("campaign_id", camp.id).eq("state", "dialing");
  const st = await pbx("status");
  const busy = Math.max(Number(st.active || 0) + Number(st.pending || 0), 0);
  const slots = Math.max(0, MAX_PARALLEL - Math.max(busy, dialing || 0));

  const { data: next } = await svc.from("lead_ivr_calls").select("id, phone, area_key")
    .eq("campaign_id", camp.id).eq("state", "queued").order("created_at").limit(slots || 1);
  if (!next?.length) {
    if (!dialing && !busy) {
      await svc.from("lead_ivr_campaigns").update({ status: "done", updated_at: new Date().toISOString() }).eq("id", camp.id);
    }
    return { finishing: true };
  }
  for (const c of next.slice(0, slots)) await dispatch(svc, c);
  return { started: Math.min(slots, next.length) };
}

async function tickLoop(svc: any) {
  const until = Date.now() + 50_000;
  while (Date.now() < until) {
    const r: any = await tick(svc);
    if (r.idle || r.waiting) return r;
    await new Promise((res) => setTimeout(res, 10_000));
  }
  // İş bitmediyse kendini bir tur daha çağırır; kampanya bitince zincir durur.
  await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/lead-ivr-campaign`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}` },
    body: JSON.stringify({ action: "tick" }), signal: AbortSignal.timeout(3000),
  }).catch(() => {});
  return { ok: true };
}

function kick(svc: any) {
  // @ts-ignore EdgeRuntime Supabase'de var
  EdgeRuntime.waitUntil(tickLoop(svc).catch((e) => console.error("tick", (e as Error).message)));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const auth = await verifyAdminOrCron(req, ["admin"]);
  if (!auth.ok) return json({ error: auth.error }, auth.status);

  const svc = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  let body: any = {};
  try { body = await req.json(); } catch { /* */ }
  const action = String(body.action || "");

  try {
    if (action === "sample") {
      const area = (body.area in AREA_LABELS ? body.area : "bireysel") as AreaKey;
      const mp3 = await tts(areaMessage(area), "mp3_44100_128");
      return json({ audio: `data:audio/mpeg;base64,${b64(mp3)}`, text: areaMessage(area) });
    }

    if (action === "eligible") {
      const leads = await eligibleLeads(svc);
      return json({ count: leads.length, cli: CLI_LABEL });
    }

    if (action === "tick") { kick(svc); return json({ ok: true }); }

    if (action === "stop") {
      await svc.from("lead_ivr_campaigns").update({ status: "stopped", updated_at: new Date().toISOString() }).eq("status", "running");
      await svc.from("lead_ivr_calls").update({ state: "cancelled" }).eq("state", "queued");
      try { await pbx("stop"); } catch (e) { return json({ ok: true, warning: (e as Error).message }); }
      return json({ ok: true });
    }

    if (action !== "start") return json({ error: "Geçersiz işlem" }, 400);

    const testPhone = body.test_phone ? normalizeMobile(String(body.test_phone)) : null;
    if (body.test_phone && !testPhone) return json({ error: "Geçerli bir cep numarası girin" }, 400);

    if (!testPhone) {
      const { data: running } = await svc.from("lead_ivr_campaigns").select("id").eq("status", "running").limit(1).maybeSingle();
      if (running) {
        kick(svc);
        return json({ error: "Zaten devam eden bir toplu arama var; kaldığı yerden sürdürülüyor. Yeniden başlatmak için önce durdurun." }, 409);
      }
      if (!inCallWindow(new Date())) return json({ error: "Toplu arama yalnız 09:30–20:00 arası başlatılabilir." }, 400);
    }

    await ensureSounds(svc);

    type Row = { lead_id: string | null; phone: string; area: AreaKey };
    let rows: Row[];
    if (testPhone) {
      const area = (body.area in AREA_LABELS ? body.area : "bireysel") as AreaKey;
      rows = [{ lead_id: null, phone: testPhone, area }];
    } else {
      const limit = Math.min(Math.max(Number(body.limit) || 1000, 1), 1000);
      rows = (await eligibleLeads(svc)).slice(0, limit);
    }
    if (rows.length === 0) return json({ error: "Aranacak danışan yok" }, 400);

    const { data: camp, error: ce } = await svc.from("lead_ivr_campaigns").insert({
      cli: CLI, total: rows.length, status: testPhone ? "test" : "running", webhook_token_hash: "per-call",
    }).select("id").single();
    if (ce) throw ce;

    const { data: calls, error: ie } = await svc.from("lead_ivr_calls").insert(
      rows.map((r) => ({ campaign_id: camp.id, lead_id: r.lead_id, phone: r.phone, area_key: r.area })),
    ).select("id, phone, area_key");
    if (ie) throw ie;

    if (testPhone) {
      await dispatch(svc, calls![0]);
      return json({ ok: true, count: 1, campaign_id: camp.id });
    }
    kick(svc);
    return json({ ok: true, count: rows.length, campaign_id: camp.id });
  } catch (e) {
    console.error("lead-ivr-campaign error", (e as Error).message);
    return json({ error: (e as Error).message }, 500);
  }
});

async function eligibleLeads(svc: any) {
  const { data, error } = await svc.from("danisan_basvurulari").select("id, phone, therapy_type").eq("status", "no_answer").limit(1000);
  if (error) throw error;
  const since = new Date(Date.now() - 864e5).toISOString();
  const { data: recent } = await svc.from("lead_ivr_calls").select("lead_id")
    .gte("created_at", since).neq("state", "cancelled").not("lead_id", "is", null).limit(5000);
  const skip = new Set((recent || []).map((r: any) => r.lead_id));
  const seen = new Set<string>();
  const out: { lead_id: string; phone: string; area: AreaKey }[] = [];
  for (const l of data || []) {
    const p = normalizeMobile(l.phone);
    if (!p || skip.has(l.id) || seen.has(p) || isBlockedPhone(p)) continue;
    seen.add(p);
    out.push({ lead_id: l.id, phone: p, area: areaFromTherapy(l.therapy_type) });
  }
  return out;
}
