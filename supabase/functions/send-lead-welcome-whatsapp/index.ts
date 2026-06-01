// Send a WhatsApp welcome message to a new lead based on the therapy topic they applied for
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Payload {
  leadId?: string;
  name: string;
  phone: string;
  therapyType?: string | null;
}

// Pretty labels matching the frontend THERAPY_LABELS map.
const THERAPY_LABELS: Record<string, string> = {
  bireysel_terapi: "Bireysel Terapi",
  cift_terapisi: "Çift Terapisi",
  "çift_terapisi": "Çift Terapisi",
  aile_terapisi: "Aile Terapisi",
  cocuk_terapisi: "Çocuk Terapisi",
  "çocuk_terapisi": "Çocuk Terapisi",
  ergen_terapisi: "Ergen Terapisi",
};

function prettyTherapy(raw?: string | null): string {
  if (!raw) return "";
  const key = raw.trim().toLowerCase();
  if (THERAPY_LABELS[key]) return THERAPY_LABELS[key];
  return raw
    .replace(/_/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toLocaleUpperCase("tr-TR") + w.slice(1))
    .join(" ");
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
    const body = (await req.json()) as Payload;
    const { leadId, name, phone, therapyType } = body;

    if (!name || !phone) {
      return new Response(
        JSON.stringify({ success: false, error: "Eksik alan" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const waPhone = normalizePhoneToWa(phone);
    if (!waPhone) {
      return new Response(
        JSON.stringify({ success: false, error: "Geçersiz telefon numarası" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const firstName = name.trim().split(" ")[0];
    const topic = prettyTherapy(therapyType);
    const topicLine = topic
      ? `*${topic}* hizmetimiz hakkında bilgi almak için başvurduğunuzu görüyoruz. `
      : "Hizmetlerimiz hakkında bilgi almak için başvurduğunuzu görüyoruz. ";

    const waMessage =
      `Merhaba ${firstName} 👋\n\n` +
      `*Doktorumol.com.tr Randevu Sitesi*'ne hoş geldiniz! İlginiz için teşekkür ederiz.\n\n` +
      topicLine +
      `Uzman ekibimiz en kısa zamanda sizinle iletişime geçerek detaylı bilgilendirme yapacaktır.\n\n` +
      `Herhangi bir sorunuz olursa bu numara üzerinden bize yazabilirsiniz.\n\n` +
      `Sağlıklı günler dileriz 🌿\n` +
      `_Doktorumol.com.tr_`;

    // Find a WORKING WhatsApp session
    const { data: activeLines, error: lineError } = await supabase
      .from("whatsapp_lines")
      .select("id, phone_number, is_active, sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (lineError) {
      console.error("Failed to fetch active WhatsApp lines:", lineError);
    }

    const lines = (activeLines || []) as any[];
    if (lines.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Aktif WhatsApp hattı bulunamadı" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const candidates = lines.map((l) => getSessionNameForLineId(l.id));
    const activePhones = new Set(
      lines.map((l) => String(l.phone_number || "").replace(/\D/g, "")).filter(Boolean)
    );

    let sessionName: string | null = null;
    try {
      const sessionsRes = await supabase.functions.invoke("waha-proxy", {
        body: { action: "sessions.list" },
      });
      const sessions = Array.isArray((sessionsRes.data as any)?.data) ? (sessionsRes.data as any).data : [];
      sessionName = candidates.find((c) =>
        sessions.some((s: any) => s?.name === c && String(s?.status || "").toUpperCase() === "WORKING")
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
      return new Response(
        JSON.stringify({ success: false, error: "Bağlı/çalışan aktif WhatsApp hattı bulunamadı" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const waRes = await supabase.functions.invoke("waha-proxy", {
      body: {
        action: "sendText",
        sessionName,
        payload: {
          chatId: `${waPhone}@c.us`,
          text: waMessage,
        },
      },
    });

    const ok = !waRes.error && (waRes.data as any)?.success !== false;

    // Mark welcome sent on the lead record if leadId is given
    if (ok && leadId) {
      await supabase
        .from("danisan_basvurulari")
        .update({ welcome_sent_at: new Date().toISOString() })
        .eq("id", leadId);
    }

    return new Response(
      JSON.stringify({
        success: ok,
        sessionName,
        data: waRes.data,
        error: waRes.error?.message || ((waRes.data as any)?.success === false ? (waRes.data as any)?.error : undefined),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("send-lead-welcome-whatsapp error:", e);
    return new Response(
      JSON.stringify({ success: false, error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
