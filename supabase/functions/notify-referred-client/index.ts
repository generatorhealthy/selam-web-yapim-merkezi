// Notify a referred client via SMS + WhatsApp that they were matched with a specialist,
// including a dedicated review link for that specialist.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Payload {
  specialistId: string;
  clientName: string;
  clientSurname?: string;
  clientContact: string;
  consultationType?: string | null;
}

const SITE = "https://doktorumol.com.tr";

function slugify(input: string): string {
  const map: Record<string, string> = {
    ğ: "g", Ğ: "g", ü: "u", Ü: "u", ş: "s", Ş: "s", ı: "i", İ: "i", ö: "o", Ö: "o", ç: "c", Ç: "c",
  };
  return input
    .split("")
    .map((c) => map[c] ?? c)
    .join("")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { specialistId, clientName, clientSurname, clientContact, consultationType } =
      (await req.json()) as Payload;

    if (!specialistId || !clientName || !clientContact) {
      return new Response(JSON.stringify({ success: false, error: "Eksik alan" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: specialist, error: specError } = await supabase
      .from("specialists")
      .select("id, name, specialty, slug, city")
      .eq("id", specialistId)
      .maybeSingle();

    if (specError || !specialist) {
      return new Response(JSON.stringify({ success: false, error: "Uzman bulunamadı" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const specialtySlug = slugify(specialist.specialty || "uzman");
    const nameSlug = specialist.slug || slugify(specialist.name || "");
    const reviewUrl = `${SITE}/${specialtySlug}/${nameSlug}/uzmani-degerlendir`;

    const firstName = String(clientName).trim().split(" ")[0];
    const typeLabel =
      consultationType === "face_to_face"
        ? "Yüz Yüze Danışmanlık"
        : consultationType === "online"
        ? "Online Danışmanlık"
        : "";

    const smsMessage =
      `Sayın ${firstName}, başvurunuz doğrultusunda size uygun uzmanımıza yönlendirmeniz yapılmıştır.\n\n` +
      `Uzmanınız: ${specialist.name} (${specialist.specialty})\n` +
      (typeLabel ? `Danışmanlık Türü: ${typeLabel}\n` : "") +
      `\nUzmanınız en kısa sürede sizinle iletişime geçecektir. Görüşmenizin ardından uzmanınızı puanlayarak deneyiminizi paylaşabilirsiniz:\n` +
      `${reviewUrl}\n\n` +
      `Sağlıklı günler dileriz.\nDoktorumol.com.tr`;

    const waMessage =
      `Merhaba ${firstName} 👋\n\n` +
      `Başvurunuz doğrultusunda sizi alanında uzman danışmanımıza *yönlendirdik*.\n\n` +
      `*Uzmanınız*\n` +
      `👤 ${specialist.name}\n` +
      `🩺 ${specialist.specialty}\n` +
      (typeLabel ? `💬 ${typeLabel}\n` : "") +
      `\nUzmanınız en kısa sürede sizinle iletişime geçecektir.\n\n` +
      `⭐ *Görüşmenizin ardından uzmanınızı değerlendirin:*\n${reviewUrl}\n\n` +
      `Geri bildiriminiz hizmet kalitemizi artırmamıza ve diğer danışanlara yol göstermemize yardımcı oluyor.\n\n` +
      `Sağlıklı günler dileriz 🌿\n_Doktorumol.com.tr_`;

    // ---- SMS (Verimor via proxies) ----
    let smsSent = false;
    let smsError: string | undefined;
    for (const fn of ["send-sms-via-static-proxy", "send-sms-via-proxy", "send-verimor-sms"]) {
      try {
        const res = await supabase.functions.invoke(fn, {
          body: { phone: clientContact, message: smsMessage },
        });
        if (!res.error && (res.data as any)?.success !== false) {
          smsSent = true;
          break;
        }
        smsError = res.error?.message || (res.data as any)?.error || "Bilinmeyen SMS hatası";
      } catch (e) {
        smsError = (e as Error).message;
      }
    }

    // ---- WhatsApp (WAHA) ----
    let waSent = false;
    let waError: string | undefined;
    const waPhone = normalizePhoneToWa(clientContact);
    if (!waPhone) {
      waError = "Geçersiz telefon numarası";
    } else {
      const { data: activeLines } = await supabase
        .from("whatsapp_lines")
        .select("id, phone_number, is_active, sort_order")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      const lines = (activeLines || []) as any[];
      if (lines.length === 0) {
        waError = "Aktif WhatsApp hattı bulunamadı";
      } else {
        const candidates = lines.map((l) => getSessionNameForLineId(l.id));
        const activePhones = new Set(
          lines.map((l) => String(l.phone_number || "").replace(/\D/g, "")).filter(Boolean)
        );

        let sessionName: string | null = null;
        try {
          const sessionsRes = await supabase.functions.invoke("waha-proxy", {
            body: { action: "sessions.list" },
          });
          const sessions = Array.isArray((sessionsRes.data as any)?.data)
            ? (sessionsRes.data as any).data
            : [];
          sessionName =
            candidates.find((c) =>
              sessions.some(
                (s: any) => s?.name === c && String(s?.status || "").toUpperCase() === "WORKING"
              )
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

        if (!sessionName) {
          waError = "Bağlı/çalışan WhatsApp hattı bulunamadı";
        } else {
          const waRes = await supabase.functions.invoke("waha-proxy", {
            body: {
              action: "sendText",
              sessionName,
              payload: { chatId: `${waPhone}@c.us`, text: waMessage },
            },
          });
          waSent = !waRes.error && (waRes.data as any)?.success !== false;
          if (!waSent) {
            waError = waRes.error?.message || (waRes.data as any)?.error || "WhatsApp gönderilemedi";
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: smsSent || waSent,
        reviewUrl,
        specialistName: specialist.name,
        clientName: `${clientName}${clientSurname ? " " + clientSurname : ""}`.trim(),
        smsSent,
        smsError,
        waSent,
        waError,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("notify-referred-client error:", e);
    return new Response(JSON.stringify({ success: false, error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
