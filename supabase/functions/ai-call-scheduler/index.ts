// AI arama zamanlayıcısı — pg_cron tarafından her dakika çağrılır.
// ai_call_settings.enabled = false iken HİÇBİR arama başlatmaz.
import { createClient } from "npm:@supabase/supabase-js@2";
import { verifyAdminOrCron } from "../_shared/adminAuth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

function istanbulHourMinute() {
  const p = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Istanbul",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const get = (t: string) => Number(p.find((x) => x.type === t)?.value || "0");
  return { hour: get("hour"), minute: get("minute") };
}

export function pickLine(settings: any): string | null {
  const prefixes: string[] = settings.line_prefixes || ["80", "81"];
  const now = Date.now();
  const busy: Record<string, number> = {
    "80": settings.line_80_busy_until ? new Date(settings.line_80_busy_until).getTime() : 0,
    "81": settings.line_81_busy_until ? new Date(settings.line_81_busy_until).getTime() : 0,
  };
  const active = settings.active_line_prefix || prefixes[0];
  const ordered = [active, ...prefixes.filter((p) => p !== active)];
  for (const p of ordered) {
    if ((busy[p] || 0) <= now) return p;
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const auth = await verifyAdminOrCron(req);
  if (!auth.ok) return json({ error: auth.error }, auth.status);

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: settings } = await supabase.from("ai_call_settings").select("*").limit(1).maybeSingle();
    if (!settings) return json({ success: false, error: "Ayar kaydı yok" }, 500);
    if (!settings.enabled) return json({ success: true, skipped: "sistem kapalı" });

    const { hour } = istanbulHourMinute();
    if (hour < settings.work_start_hour || hour >= settings.work_end_hour) {
      return json({ success: true, skipped: `çalışma saati dışı (${hour}:00)` });
    }

    // Aynı anda tek aktif çağrı
    const tenMinAgo = new Date(Date.now() - 10 * 60000).toISOString();
    const { count: activeCount } = await supabase
      .from("ai_call_sessions")
      .select("id", { count: "exact", head: true })
      .in("status", ["dialing", "in_progress"])
      .gte("started_at", tenMinAgo);
    if ((activeCount || 0) > 0) return json({ success: true, skipped: "aktif çağrı var" });

    const line = pickLine(settings);
    if (!line) return json({ success: true, skipped: "tüm hatlar meşgul" });

    const nowIso = new Date().toISOString();
    const todayIst = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul" }).format(new Date());

    const selectCols =
      "id, full_name, phone, status, consultation_type, therapy_type, next_call_at, daily_call_count, last_call_date, lead_date";

    const eligible = (rows: any[]) =>
      (rows || []).filter((r) => {
        if (!r.phone) return false;
        const used = r.last_call_date === todayIst ? r.daily_call_count || 0 : 0;
        return used < (settings.max_calls_per_day ?? 2);
      });

    let lead: any = null;

    // 1) Zamanı gelmiş "daha sonra ara" kayıtları her zaman önceliklidir
    const { data: callbacks } = await supabase
      .from("danisan_basvurulari")
      .select(selectCols)
      .eq("status", "callback")
      .not("next_call_at", "is", null)
      .lte("next_call_at", nowIso)
      .order("next_call_at", { ascending: true })
      .limit(20);
    lead = eligible(callbacks || [])[0] || null;

    // 2) 10:00 - 12:00 arası: açmayanlar
    if (!lead && hour < settings.no_answer_window_end_hour) {
      const { data: noAnswer } = await supabase
        .from("danisan_basvurulari")
        .select(selectCols)
        .eq("status", "no_answer")
        .or(`next_call_at.is.null,next_call_at.lte.${nowIso}`)
        .order("lead_date", { ascending: true })
        .limit(20);
      lead = eligible(noAnswer || [])[0] || null;
    }

    // 3) 12:00 sonrası: önce yeni gelenler, sonra açmayanlar
    if (!lead && hour >= settings.no_answer_window_end_hour) {
      const { data: fresh } = await supabase
        .from("danisan_basvurulari")
        .select(selectCols)
        .eq("status", "new")
        .or(`next_call_at.is.null,next_call_at.lte.${nowIso}`)
        .order("lead_date", { ascending: true })
        .limit(20);
      lead = eligible(fresh || [])[0] || null;

      if (!lead) {
        const { data: noAnswer } = await supabase
          .from("danisan_basvurulari")
          .select(selectCols)
          .eq("status", "no_answer")
          .or(`next_call_at.is.null,next_call_at.lte.${nowIso}`)
          .order("lead_date", { ascending: true })
          .limit(20);
        lead = eligible(noAnswer || [])[0] || null;
      }
    }

    if (!lead) return json({ success: true, skipped: "aranacak danışan yok" });

    const { data: session, error: sessErr } = await supabase
      .from("ai_call_sessions")
      .insert({
        lead_id: lead.id,
        lead_name: lead.full_name,
        lead_phone: lead.phone,
        line_prefix: line,
        status: "dialing",
      })
      .select("id")
      .maybeSingle();
    if (sessErr) throw new Error(`Oturum oluşturulamadı: ${sessErr.message}`);

    await supabase.from("ai_call_queue").insert({
      lead_id: lead.id,
      scheduled_at: nowIso,
      status: "dialing",
      session_id: session!.id,
    });

    const bridgeUrl = Deno.env.get("AI_BRIDGE_URL");
    const bridgeSecret = Deno.env.get("AI_BRIDGE_SECRET");
    if (!bridgeUrl || !bridgeSecret) {
      await supabase
        .from("ai_call_sessions")
        .update({ status: "failed", error_message: "AI_BRIDGE_URL/SECRET tanımlı değil", ended_at: nowIso })
        .eq("id", session!.id);
      return json({ success: false, error: "AI köprüsü yapılandırılmamış" }, 500);
    }

    const res = await fetch(`${bridgeUrl.replace(/\/$/, "")}/originate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-bridge-secret": bridgeSecret },
      body: JSON.stringify({
        session_id: session!.id,
        lead_id: lead.id,
        phone: lead.phone,
        line_prefix: line,
      }),
    });
    const text = await res.text();
    if (!res.ok) {
      await supabase
        .from("ai_call_sessions")
        .update({ status: "failed", error_message: `Köprü hatası [${res.status}]: ${text}`, ended_at: new Date().toISOString() })
        .eq("id", session!.id);
      return json({ success: false, error: `Köprü hatası [${res.status}]`, details: text }, res.status);
    }

    return json({ success: true, called: lead.full_name, line, session_id: session!.id });
  } catch (e: any) {
    console.error("ai-call-scheduler error:", e);
    return json({ success: false, error: e?.message || String(e) }, 500);
  }
});
