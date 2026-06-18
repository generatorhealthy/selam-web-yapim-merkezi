// Detect missed specialist transfers (uzman telefonu açmadı) from FreePBX CDR and
// send automatic WhatsApp notifications to BOTH the specialist and the client.
// Idempotent: each transfer is notified only once (tracked in pbx_missed_transfer_notifications).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function normalizePhoneToWa(raw: string): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("90") && digits.length === 12) return digits;
  if (digits.startsWith("0") && digits.length === 11) return "9" + digits;
  if (digits.length === 10) return "90" + digits;
  return null;
}

function getSessionNameForLineId(lineId: string) {
  return `line_${lineId.replace(/-/g, "").slice(0, 16)}`;
}

function firstName(name?: string | null): string {
  if (!name) return "";
  return name.trim().split(/\s+/)[0] || "";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // 1) Pull recent CDR transfers (today + yesterday window)
    const pad = (n: number) => String(n).padStart(2, "0");
    const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const now = new Date();
    const to = fmt(now);
    const from = fmt(new Date(now.getTime() - 24 * 60 * 60 * 1000));

    const { data: cdr, error: cdrErr } = await supabase.functions.invoke("freepbx-create-extension", {
      body: { action: "cdr_stats", from, to },
    });
    if (cdrErr) throw cdrErr;
    if ((cdr as any)?.error) throw new Error((cdr as any).error);

    const transfers: any[] = Array.isArray((cdr as any)?.transfers) ? (cdr as any).transfers : [];

    // Only inbound transfers to a specialist that were NOT answered
    const missed = transfers.filter(
      (t) => Number(t.acti ?? 0) === 0 && String(t.yon ?? "") === "transfer",
    );

    if (missed.length === 0) {
      return new Response(JSON.stringify({ success: true, processed: 0, sent: 0 }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2) Resolve a WORKING WhatsApp session once
    const { data: activeLines } = await supabase
      .from("whatsapp_lines")
      .select("id, phone_number, is_active, sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    const lines = (activeLines || []) as any[];
    let sessionName: string | null = null;
    if (lines.length > 0) {
      const candidates = lines.map((l) => getSessionNameForLineId(l.id));
      const activePhones = new Set(
        lines.map((l) => String(l.phone_number || "").replace(/\D/g, "")).filter(Boolean),
      );
      try {
        const sessionsRes = await supabase.functions.invoke("waha-proxy", {
          body: { action: "sessions.list" },
        });
        const sessions = Array.isArray((sessionsRes.data as any)?.data) ? (sessionsRes.data as any).data : [];
        sessionName =
          candidates.find((c) =>
            sessions.some((s: any) => s?.name === c && String(s?.status || "").toUpperCase() === "WORKING"),
          ) || null;
        if (!sessionName) {
          const matched = sessions.find((s: any) => {
            if (String(s?.status || "").toUpperCase() !== "WORKING") return false;
            const mePhone = String(s?.me?.id || "").split("@")[0]?.replace(/\D/g, "") || "";
            return mePhone && activePhones.has(mePhone);
          });
          if (matched) sessionName = matched.name;
        }
      } catch (e) {
        console.error("WAHA sessions.list error:", e);
      }
    }

    if (!sessionName) {
      return new Response(
        JSON.stringify({ success: false, error: "Bağlı/çalışan aktif WhatsApp hattı bulunamadı" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const sendText = async (waPhone: string, text: string): Promise<boolean> => {
      try {
        const res = await supabase.functions.invoke("waha-proxy", {
          body: {
            action: "sendText",
            sessionName,
            payload: { chatId: `${waPhone}@c.us`, text },
          },
        });
        return !res.error && (res.data as any)?.success !== false;
      } catch (e) {
        console.error("sendText error:", e);
        return false;
      }
    };

    let sent = 0;
    let processed = 0;
    const details: any[] = [];

    for (const t of missed) {
      const clientPhone = String(t.musteri ?? "");
      const ext = String(t.uzman_ext ?? "");
      const callDate = t.calldate ? new Date(t.calldate).toISOString() : null;
      const signature = `${t.calldate ?? ""}|${clientPhone}|${ext}`;

      processed++;

      // Skip if already notified
      const { data: existing } = await supabase
        .from("pbx_missed_transfer_notifications")
        .select("id")
        .eq("signature", signature)
        .maybeSingle();
      if (existing) continue;

      // Lookup specialist (name + phone) by extension
      const { data: extRow } = await supabase
        .from("freepbx_extensions")
        .select("customer_name, customer_phone")
        .eq("extension", ext)
        .maybeSingle();

      const specialistName = extRow?.customer_name || "Uzmanımız";
      const specialistPhone = extRow?.customer_phone || "";

      const callTime = t.calldate
        ? new Date(t.calldate).toLocaleString("tr-TR", {
            timeZone: "Europe/Istanbul",
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "";

      // --- Specialist message ---
      let specialistOk = false;
      const specialistWa = normalizePhoneToWa(specialistPhone);
      if (specialistWa) {
        const msg =
          `👋 *Sayın ${specialistName}*,\n\n` +
          `Tarafınıza bir *danışan yönlendirmesi* yapıldı ancak telefonla ulaşmaya çalıştığımızda hattınıza erişim sağlanamadı.\n\n` +
          `📞 Danışan İletişim No: *${clientPhone}*\n` +
          (callTime ? `🕒 Yönlendirme Saati: *${callTime}*\n` : "") +
          `\n` +
          `Danışanın mağdur olmaması adına, en kısa sürede yukarıdaki numara üzerinden iletişime geçmenizi rica ederiz. 🙏\n\n` +
          `_Doktorumol.com.tr_`;
        specialistOk = await sendText(specialistWa, msg);
        if (specialistOk) sent++;
      }

      // --- Client message ---
      let clientOk = false;
      const clientWa = normalizePhoneToWa(clientPhone);
      if (clientWa) {
        const msg =
          `Merhaba 👋\n\n` +
          `Talebiniz doğrultusunda sizi ilgili *uzmanımıza aktardık*. Ancak uzmanımız şu anda müsait olmadığı için görüşme sağlanamadı.\n\n` +
          `Endişelenmenize gerek yok 🌿 — uzmanımız bilgilendirildi ve *en kısa sürede sizinle iletişime geçecektir.*\n\n` +
          `Sağlıklı günler dileriz,\n` +
          `_Doktorumol.com.tr_`;
        clientOk = await sendText(clientWa, msg);
        if (clientOk) sent++;
      }

      // Record notification (idempotency). Insert only when at least one attempted.
      await supabase.from("pbx_missed_transfer_notifications").insert({
        signature,
        call_date: callDate,
        client_phone: clientPhone,
        specialist_ext: ext,
        specialist_name: specialistName,
        specialist_phone: specialistPhone,
        whatsapp_specialist_ok: specialistOk,
        whatsapp_client_ok: clientOk,
      });

      details.push({ signature, specialistOk, clientOk, specialistName });
    }

    return new Response(JSON.stringify({ success: true, processed, sent, details }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("notify-missed-transfers error:", e);
    return new Response(JSON.stringify({ success: false, error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
