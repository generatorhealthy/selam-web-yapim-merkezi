// AI araması bittiğinde köprünün çağırdığı sonuç işleyici.
// - Danışan notuna zaman damgalı kayıt düşer
// - Danışan statüsünü günceller (transferred / no_answer / wrong / callback)
// - Başarılı aktarımda client_referrals kaydını oluşturur (Danışan Takvimi sayacı artar)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-bridge-secret",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const istanbulNow = () =>
  new Intl.DateTimeFormat("tr-TR", {
    timeZone: "Europe/Istanbul",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());

const istanbulParts = () => {
  const p = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const get = (t: string) => p.find((x) => x.type === t)?.value || "00";
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    hour: Number(get("hour")),
    minute: Number(get("minute")),
  };
};

// "14:30" (İstanbul, bugün ya da yarın) -> UTC timestamp
function istanbulTimeToUtc(hhmm: string): string | null {
  const m = /^(\d{1,2})[:.](\d{2})$/.exec(hhmm.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  const { date, hour, minute } = istanbulParts();
  // İstanbul = UTC+3
  let target = new Date(`${date}T${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}:00+03:00`);
  if (h * 60 + min <= hour * 60 + minute) {
    target = new Date(target.getTime() + 86400000);
  }
  return target.toISOString();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const secret = Deno.env.get("AI_BRIDGE_SECRET");
  if (!secret || req.headers.get("x-bridge-secret") !== secret) {
    return json({ error: "unauthorized" }, 401);
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const body = await req.json().catch(() => ({}));
    const {
      session_id,
      lead_id,
      outcome,
      specialist_id,
      specialist_name,
      extension,
      callback_time,
      consultation_mode,
      transcript,
      line_prefix,
      error_message,
      is_test,
    } = body || {};

    if (!lead_id || !outcome) return json({ error: "lead_id ve outcome gerekli" }, 400);

    const { data: lead } = await supabase
      .from("danisan_basvurulari")
      .select("id, full_name, phone, notes, consultation_type, call_attempts, daily_call_count, last_call_date")
      .eq("id", lead_id)
      .maybeSingle();
    if (!lead) return json({ error: "Danışan bulunamadı" }, 404);

    const stamp = istanbulNow();
    let note = "";
    let status: string | null = null;
    let nextCallAt: string | null = null;

    const { data: settings } = await supabase
      .from("ai_call_settings")
      .select("retry_gap_minutes, max_calls_per_day, work_start_hour")
      .limit(1)
      .maybeSingle();
    const retryGap = settings?.retry_gap_minutes ?? 150;
    const maxPerDay = settings?.max_calls_per_day ?? 2;

    const { date: todayIst } = istanbulParts();
    const sameDay = lead.last_call_date === todayIst;
    const dailyCount = (sameDay ? lead.daily_call_count || 0 : 0) + 1;

    if (is_test) {
      // Test aramasi: danisan statusu, yonlendirme kaydi ve hat bekletmesi degistirilmez.
    }

    switch (outcome) {
      case "transferred":
        status = "transferred";
        note = `${stamp} — Yapay zekâ araması: ${specialist_name || "uzman"}${
          extension ? ` (dahili ${extension})` : ""
        } aktarımı yapıldı.`;
        break;
      case "no_answer":
        status = "no_answer";
        note = `${stamp} — Arandı, telefon açılmadı.`;
        if (dailyCount < maxPerDay) {
          nextCallAt = new Date(Date.now() + retryGap * 60000).toISOString();
        } else {
          const t = new Date(Date.now() + 86400000);
          nextCallAt = t.toISOString();
        }
        break;
      case "wrong_lead":
        status = "wrong";
        note = `${stamp} — Arandı, danışan hizmet almak istemediğini belirtti (yanlış ulaşan).`;
        break;
      case "callback": {
        status = "callback";
        const utc = callback_time ? istanbulTimeToUtc(String(callback_time)) : null;
        nextCallAt = utc;
        note = `${stamp} — Arandı, danışan müsait değil. Tekrar arama saati: ${
          callback_time || "belirtilmedi"
        }.`;
        break;
      }
      case "failed":
      default:
        note = `${stamp} — Arama tamamlanamadı${error_message ? `: ${error_message}` : "."}`;
        nextCallAt = new Date(Date.now() + retryGap * 60000).toISOString();
        break;
    }

    const notes = lead.notes ? `${lead.notes}\n${note}` : note;

    const update: Record<string, unknown> = {
      notes,
      call_attempts: (lead.call_attempts || 0) + 1,
      last_called_at: new Date().toISOString(),
      last_call_date: todayIst,
      daily_call_count: dailyCount,
      next_call_at: nextCallAt,
      updated_at: new Date().toISOString(),
    };
    if (status && !is_test) update.status = status;
    if (callback_time) update.preferred_call_time = String(callback_time);
    if (outcome === "transferred" && specialist_id) update.assigned_specialist_id = specialist_id;

    const { error: updErr } = await supabase
      .from("danisan_basvurulari")
      .update(update)
      .eq("id", lead_id);
    if (updErr) throw new Error(`Danışan güncellenemedi: ${updErr.message}`);

    // Başarılı aktarım -> Danışan Yönlendirmesi kaydı
    let referralId: string | null = null;
    if (outcome === "transferred" && specialist_id && !is_test) {
      const now = new Date();
      const nameParts = String(lead.full_name || "").trim().split(/\s+/);
      const clientSurname = nameParts.length > 1 ? nameParts.pop()! : "";
      const clientName = nameParts.join(" ");
      const mode =
        consultation_mode === "online" || consultation_mode === "face_to_face"
          ? consultation_mode
          : (lead.consultation_type || "").toLowerCase() === "online"
          ? "online"
          : "face_to_face";

      const { data: ref, error: refErr } = await supabase
        .from("client_referrals")
        .insert({
          specialist_id,
          year: now.getFullYear(),
          month: now.getMonth() + 1,
          is_referred: true,
          referred_at: now.toISOString(),
          referral_count: 1,
          client_name: clientName || lead.full_name,
          client_surname: clientSurname,
          client_contact: lead.phone,
          consultation_type: mode,
          notes: `Yapay zekâ araması ile otomatik yönlendirildi (${stamp}).`,
        })
        .select("id")
        .maybeSingle();
      if (refErr) {
        console.error("client_referrals insert error:", refErr.message);
      } else {
        referralId = ref?.id ?? null;
      }
    }

    // Oturum kaydını kapat
    if (session_id) {
      await supabase
        .from("ai_call_sessions")
        .update({
          status: "completed",
          outcome,
          transferred_specialist_id: specialist_id || null,
          transferred_specialist_name: specialist_name || null,
          transferred_extension: extension || null,
          callback_at: outcome === "callback" ? nextCallAt : null,
          transcript: transcript ?? [],
          error_message: error_message || null,
          line_prefix: line_prefix || null,
          ended_at: new Date().toISOString(),
        })
        .eq("id", session_id);

      await supabase
        .from("ai_call_queue")
        .update({ status: "done", updated_at: new Date().toISOString() })
        .eq("session_id", session_id);
    }

    // Hat yönetimi: başarılı aktarımda kullanılan hat bir süre meşgul sayılır
    if (outcome === "transferred" && line_prefix && !is_test) {
      const { data: s } = await supabase
        .from("ai_call_settings")
        .select("id, line_cooldown_seconds, line_prefixes, active_line_prefix")
        .limit(1)
        .maybeSingle();
      if (s) {
        const cooldown = (s.line_cooldown_seconds ?? 150) * 1000;
        const busyUntil = new Date(Date.now() + cooldown).toISOString();
        const prefixes: string[] = s.line_prefixes || ["80", "81"];
        const other = prefixes.find((p) => p !== line_prefix) || prefixes[0];
        const patch: Record<string, unknown> = {
          active_line_prefix: other,
          updated_at: new Date().toISOString(),
        };
        if (line_prefix === "80") patch.line_80_busy_until = busyUntil;
        if (line_prefix === "81") patch.line_81_busy_until = busyUntil;
        await supabase.from("ai_call_settings").update(patch).eq("id", s.id);
      }
    }

    return json({ success: true, status, next_call_at: nextCallAt, referral_id: referralId });
  } catch (e: any) {
    console.error("ai-call-result error:", e);
    return json({ success: false, error: e?.message || String(e) }, 500);
  }
});
