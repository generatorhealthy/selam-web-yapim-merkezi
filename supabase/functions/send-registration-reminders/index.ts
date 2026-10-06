// Yarıda kalan uzman kayıtlarına otomatik hatırlatma gönderir.
// 1. hatırlatma: kayıttan 1 saat sonra  (WhatsApp)
// 2. hatırlatma: kayıttan 1 gün sonra  (WhatsApp)
// 3. hatırlatma: kayıttan 3 gün sonra  (SMS)
// Kaydını tamamlayan (specialists kaydı olan) veya onaylanan uzmana mesaj gitmez.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { verifyAdminOrCron } from "../_shared/adminAuth.ts";
import { isBlockedPhone } from "../_shared/blocklist.ts";

interface WhatsappLine {
  id: string;
  phone_number: string | null;
  is_active: boolean;
  sort_order: number | null;
}

function normalizePhoneToWa(raw: string): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("90") && digits.length === 12) return digits;
  if (digits.startsWith("0") && digits.length === 11) return "9" + digits;
  if (digits.length === 10) return "90" + digits;
  return null;
}

// SMS'te Türkçe karakter mesaj hakkını artırdığı için ASCII'ye indirger.
function toAsciiTr(input: string): string {
  const map: Record<string, string> = {
    "ç": "c", "Ç": "C", "ğ": "g", "Ğ": "G", "ı": "i", "I": "I",
    "İ": "I", "ö": "o", "Ö": "O", "ş": "s", "Ş": "S", "ü": "u", "Ü": "U",
  };
  return input.replace(/[çÇğĞıIİöÖşŞüÜ]/g, (ch) => map[ch] ?? ch);
}

function getSessionNameForLineId(lineId: string) {
  return `line_${lineId.replace(/-/g, "").slice(0, 16)}`;
}

async function getWorkingSessionName(supabase: ReturnType<typeof createClient>) {
  const { data: activeLines, error: lineError } = await supabase
    .from("whatsapp_lines")
    .select("id, phone_number, is_active, sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (lineError || !activeLines || activeLines.length === 0) {
    return null;
  }

  const lines = activeLines as WhatsappLine[];
  const activePhones = new Set(
    lines.map((l) => (l.phone_number || "").replace(/\D/g, "")).filter((p) => p.length > 0)
  );
  const sessionCandidates = lines.map((line) => getSessionNameForLineId(line.id));

  const sessionsRes = await supabase.functions.invoke("waha-proxy", {
    body: { action: "sessions.list" },
  });
  if (sessionsRes.error) return null;

  const sessions = Array.isArray((sessionsRes.data as any)?.data) ? (sessionsRes.data as any).data : [];

  let workingSession = sessionCandidates.find((candidate) =>
    sessions.some((s: any) => s?.name === candidate && String(s?.status || "").toUpperCase() === "WORKING")
  );

  if (!workingSession) {
    const matched = sessions.find((s: any) => {
      if (String(s?.status || "").toUpperCase() !== "WORKING") return false;
      const mePhone = String(s?.me?.id || "").split("@")[0]?.replace(/\D/g, "") || "";
      return mePhone && activePhones.has(mePhone);
    });
    if (matched) workingSession = matched.name;
  }

  return workingSession || null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const auth = await verifyAdminOrCron(req);
  if (!auth.ok) {
    return new Response(JSON.stringify({ error: auth.error }), {
      status: auth.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const now = Date.now();
    const minAgeMs = 55 * 60 * 1000; // en az 55 dakika önce kayıt olmuş
    const maxAgeMs = 4 * 24 * 60 * 60 * 1000; // 4 günden eski kayıtlara mesaj gitmez

    // Yarıda kalan kayıtlar: onaysız uzman profili, telefonu var
    const { data: profiles, error: profilesError } = await supabase
      .from("user_profiles")
      .select("user_id, name, email, phone, created_at")
      .eq("role", "specialist")
      .eq("is_approved", false)
      .not("phone", "is", null)
      .gte("created_at", new Date(now - maxAgeMs).toISOString())
      .lte("created_at", new Date(now - minAgeMs).toISOString())
      .limit(200);

    if (profilesError) throw profilesError;

    const candidates = profiles || [];
    if (candidates.length === 0) {
      return new Response(JSON.stringify({ success: true, sent: 0, reason: "aday yok" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Kaydını tamamlamış olanları (specialists kaydı olanları) ele
    const userIds = candidates.map((p) => p.user_id);
    const { data: completed } = await supabase
      .from("specialists")
      .select("user_id")
      .in("user_id", userIds);
    const completedIds = new Set((completed || []).map((s: any) => s.user_id));

    // Daha önce gönderilen hatırlatmalar
    const { data: sentRows } = await supabase
      .from("registration_reminders")
      .select("user_id, reminder_no")
      .in("user_id", userIds);
    const sentMap = new Map<string, Set<number>>();
    for (const row of sentRows || []) {
      if (!sentMap.has(row.user_id)) sentMap.set(row.user_id, new Set());
      sentMap.get(row.user_id)!.add(row.reminder_no);
    }

    let waSession: string | null = null;
    const results: any[] = [];
    const MAX_PER_RUN = 20;

    for (const profile of candidates) {
      if (results.length >= MAX_PER_RUN) break;
      if (completedIds.has(profile.user_id)) continue;
      if (!profile.phone || isBlockedPhone(profile.phone)) continue;

      const ageMs = now - new Date(profile.created_at).getTime();
      const alreadySent = sentMap.get(profile.user_id) || new Set<number>();

      // Sıradaki hatırlatmayı belirle
      let reminderNo: number | null = null;
      if (!alreadySent.has(1) && ageMs >= 60 * 60 * 1000) reminderNo = 1;
      else if (!alreadySent.has(2) && ageMs >= 24 * 60 * 60 * 1000) reminderNo = 2;
      else if (!alreadySent.has(3) && ageMs >= 3 * 24 * 60 * 60 * 1000) reminderNo = 3;
      if (!reminderNo) continue;

      const name = (profile.name || "Uzmanımız").trim();
      const link = `https://doktorumol.com.tr/kayit-ol?email=${encodeURIComponent(profile.email || "")}`;
      let channel = "whatsapp";
      let ok = false;
      let errorMsg: string | undefined;

      if (reminderNo === 1 || reminderNo === 2) {
        const waPhone = normalizePhoneToWa(profile.phone);
        if (!waPhone) continue;
        if (!waSession) {
          waSession = await getWorkingSessionName(supabase);
          if (!waSession) {
            return new Response(
              JSON.stringify({ success: false, error: "Aktif WhatsApp hattı bulunamadı", results }),
              { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        }
        const text = reminderNo === 1
          ? `Merhaba ${name} 👋\n\nDoktorumol.com.tr'de uzman kaydınızı başlattınız ama tamamlanmamış görünüyor. Kaldığınız yerden 2 dakikada bitirebilirsiniz:\n\n👉 ${link}\n\nYardım isterseniz bu mesaja yanıt verebilirsiniz.`
          : `Merhaba ${name},\n\nProfiliniz yayına alınmayı bekliyor. Doktorumol'da uzmanlarımıza *danışan yönlendirme garantisi* veriyoruz; reklamlarımızdan gelen danışanlar doğrudan size yönlendiriliyor.\n\nKaydınızı tamamlayın:\n${link}`;
        const waRes = await supabase.functions.invoke("waha-proxy", {
          body: { action: "sendText", sessionName: waSession, payload: { chatId: `${waPhone}@c.us`, text } },
        });
        ok = !waRes.error && (waRes.data as any)?.success !== false;
        errorMsg = waRes.error?.message;
      } else {
        channel = "sms";
        const smsText = `Sayin ${toAsciiTr(name)}, Doktorumol.com.tr uzman kaydiniz yarim kaldi. Danisan yonlendirme garantili paketlerimizden yararlanmak icin kaydinizi tamamlayin: ${link}`;
        const smsRes = await supabase.functions.invoke("send-sms-via-static-proxy", {
          body: { phone: profile.phone, message: smsText },
        });
        ok = !smsRes.error && (smsRes.data as any)?.success !== false;
        errorMsg = smsRes.error?.message;
      }

      if (ok) {
        await supabase.from("registration_reminders").insert({
          user_id: profile.user_id,
          reminder_no: reminderNo,
          channel,
        });
      }
      results.push({ user_id: profile.user_id, reminder_no: reminderNo, channel, ok, error: errorMsg });

      // WhatsApp hattını yormamak için kısa bekleme
      await new Promise((r) => setTimeout(r, 1200));
    }

    return new Response(JSON.stringify({ success: true, sent: results.filter((r) => r.ok).length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("send-registration-reminders error:", e);
    return new Response(JSON.stringify({ success: false, error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
