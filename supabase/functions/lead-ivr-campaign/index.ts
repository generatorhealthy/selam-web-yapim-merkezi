import { createClient } from "npm:@supabase/supabase-js@2";
import { verifyAdminOrCron } from "../_shared/adminAuth.ts";
import { isBlockedPhone } from "../_shared/blocklist.ts";
import {
  AREA_LABELS, AreaKey, areaFromTherapy, areaMessage, normalizeMobile, REPLY_1, REPLY_2,
} from "../_shared/leadIvr.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });

const VOICE_ID = "pFZP5JQG7iQjIQuC4Bku"; // Lily – kadın sesi
const CLI = "902167060611";
const VERIMOR = "https://api.bulutsantralim.com";

async function sha256(s: string) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(b)).map((x) => x.toString(16).padStart(2, "0")).join("");
}

async function tts(text: string): Promise<Uint8Array> {
  const key = Deno.env.get("ELEVENLABS_API_KEY");
  if (!key) throw new Error("ElevenLabs anahtarı yok");
  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}?output_format=mp3_44100_128`, {
    method: "POST",
    headers: { "xi-api-key": key, "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      model_id: "eleven_multilingual_v2",
      language_code: "tr",
      voice_settings: { stability: 0.55, similarity_boost: 0.8, style: 0.25, use_speaker_boost: true, speed: 0.95 },
    }),
  });
  if (!r.ok) throw new Error(`ElevenLabs hata ${r.status}: ${await r.text()}`);
  return new Uint8Array(await r.arrayBuffer());
}

function b64(bytes: Uint8Array) {
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

async function uploadAnnouncement(apiKey: string, name: string, mp3: Uint8Array): Promise<string> {
  const data = b64(mp3).replace(/\+/g, "-").replace(/\//g, "_");
  const body = new URLSearchParams({
    key: apiKey, name,
    sounddata: `data:audio/mp3;name:${encodeURIComponent(name + ".mp3")};base64,${data}`,
  });
  const r = await fetch(`${VERIMOR}/announcements`, {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: body.toString(),
  });
  const t = await r.text();
  if (!r.ok) throw new Error(`Verimor anons yükleme hata ${r.status}: ${t}`);
  try { const p = JSON.parse(t); return String(p.id ?? p.announcement_id ?? t).trim(); } catch { return t.trim(); }
}

const ANN_TEXTS: Record<string, string> = {
  ...Object.fromEntries((Object.keys(AREA_LABELS) as AreaKey[]).map((a) => [`area_${a}`, areaMessage(a)])),
  reply_1: REPLY_1,
  reply_2: REPLY_2,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const auth = await verifyAdminOrCron(req, ["admin"]);
  if (!auth.ok) return json({ error: auth.error }, auth.status);

  const svc = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const apiKey = Deno.env.get("VERIMOR_BULUTSANTRAL_API_KEY");
  let body: any = {};
  try { body = await req.json(); } catch { /* */ }
  const action = String(body.action || "");

  try {
    if (action === "sample") {
      const area = (body.area in AREA_LABELS ? body.area : "bireysel") as AreaKey;
      const mp3 = await tts(areaMessage(area));
      return json({ audio: `data:audio/mpeg;base64,${b64(mp3)}`, text: areaMessage(area) });
    }

    if (action === "eligible") {
      const leads = await eligibleLeads(svc);
      return json({ count: leads.length, cli: "0216 706 06 11" });
    }

    if (action === "stop") {
      if (!apiKey) throw new Error("Verimor anahtarı yok");
      const { data: c } = await svc.from("lead_ivr_campaigns").select("id, verimor_campaign_id")
        .eq("status", "running").order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (!c) return json({ ok: true, message: "Çalışan kampanya yok" });
      if (c.verimor_campaign_id) {
        await fetch(`${VERIMOR}/ivr_campaigns/${c.verimor_campaign_id}?key=${apiKey}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "off" }),
        });
      }
      await svc.from("lead_ivr_campaigns").update({ status: "stopped", updated_at: new Date().toISOString() }).eq("id", c.id);
      return json({ ok: true });
    }

    if (action !== "start") return json({ error: "Geçersiz işlem" }, 400);
    if (!apiKey) throw new Error("Verimor anahtarı yok");

    const testPhone = body.test_phone ? normalizeMobile(String(body.test_phone)) : null;
    if (body.test_phone && !testPhone) return json({ error: "Geçerli bir cep numarası girin" }, 400);

    if (!testPhone) {
      const since = new Date(Date.now() - 3 * 864e5).toISOString();
      const { data: running } = await svc.from("lead_ivr_campaigns").select("id")
        .eq("status", "running").gte("created_at", since).limit(1).maybeSingle();
      if (running) return json({ error: "Zaten devam eden bir toplu arama var. Önce durdurun." }, 409);
    }

    const ann = await ensureAnnouncements(svc, apiKey);

    type Row = { lead_id: string | null; phone: string; area: AreaKey };
    let rows: Row[];
    if (testPhone) {
      const area = (body.area in AREA_LABELS ? body.area : "cift") as AreaKey;
      rows = [{ lead_id: null, phone: testPhone, area }];
    } else {
      const limit = Math.min(Math.max(Number(body.limit) || 1000, 1), 1000);
      rows = (await eligibleLeads(svc)).slice(0, limit);
    }
    if (rows.length === 0) return json({ error: "Aranacak danışan yok" }, 400);

    const token = crypto.randomUUID() + crypto.randomUUID();
    const { data: camp, error: ce } = await svc.from("lead_ivr_campaigns").insert({
      cli: CLI, total: rows.length, status: testPhone ? "test" : "creating", webhook_token_hash: await sha256(token),
    }).select("id").single();
    if (ce) throw ce;

    if (!testPhone) {
      const { error: ie } = await svc.from("lead_ivr_calls").insert(
        rows.map((r) => ({ campaign_id: camp.id, lead_id: r.lead_id, phone: r.phone, area_key: r.area })),
      );
      if (ie) throw ie;
    }

    const now = new Date(Date.now() + 3 * 3600e3); // Türkiye saati
    const day = now.toISOString().slice(0, 10);
    const end = new Date(now.getTime() + 3 * 864e5).toISOString().slice(0, 10);
    const webhook = `${Deno.env.get("SUPABASE_URL")}/functions/v1/lead-ivr-webhook?c=${camp.id}&t=${token}`;

    const payload = {
      call_type: "ivr",
      name: `${testPhone ? "TEST " : ""}Acmayanlar ${day} ${camp.id.slice(0, 6)}`,
      date_range_begin: day,
      date_range_end: testPhone ? day : end,
      time_range_begin: testPhone ? "00:00" : "09:30",
      time_range_end: testPhone ? "23:59" : "20:00",
      active_days: [1, 2, 3, 4, 5, 6, 7],
      max_thread_count: testPhone ? 1 : 2,
      ring_timeout: 35,
      cli: CLI,
      call_retries: 0,
      digit_retries: 1,
      digit_timeout: 6,
      webhook_url: webhook,
      digit_target_1: `announcement/${ann.reply_1}`,
      digit_target_2: `announcement/${ann.reply_2}`,
      timeout_target: "hangup/hangup",
      invalid_target: "hangup/hangup",
      is_commercial: false,
      phone_list: rows.map((r) => ({ phone: r.phone, phrase: `#${ann[`area_${r.area}`]}` })),
    };

    const vr = await fetch(`${VERIMOR}/ivr_campaigns.json?key=${apiKey}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
    });
    const vt = (await vr.text()).trim();
    if (!vr.ok) {
      await svc.from("lead_ivr_campaigns").update({ status: "failed", error: `${vr.status}: ${vt.slice(0, 500)}` }).eq("id", camp.id);
      return json({ error: `Verimor kampanyayı kabul etmedi (${vr.status}): ${vt.slice(0, 300)}` }, 502);
    }
    await svc.from("lead_ivr_campaigns").update({
      status: testPhone ? "test" : "running", verimor_campaign_id: vt, updated_at: new Date().toISOString(),
    }).eq("id", camp.id);
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
  const { data: recent } = await svc.from("lead_ivr_calls").select("lead_id").gte("created_at", since).limit(5000);
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

async function ensureAnnouncements(svc: any, apiKey: string): Promise<Record<string, string>> {
  const { data } = await svc.from("lead_ivr_announcements").select("key, text, voice_id, announcement_id");
  const have = new Map((data || []).map((r: any) => [r.key, r]));
  const out: Record<string, string> = {};
  for (const [key, text] of Object.entries(ANN_TEXTS)) {
    const row: any = have.get(key);
    if (row && row.text === text && row.voice_id === VOICE_ID) { out[key] = row.announcement_id; continue; }
    const id = await uploadAnnouncement(apiKey, `DO IVR ${key}`.slice(0, 60), await tts(text));
    await svc.from("lead_ivr_announcements").upsert({ key, text, voice_id: VOICE_ID, announcement_id: id });
    out[key] = id;
  }
  return out;
}
