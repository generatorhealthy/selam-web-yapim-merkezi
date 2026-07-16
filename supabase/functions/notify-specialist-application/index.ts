// Send WhatsApp welcome/info message to a newly-applied specialist via WAHA
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Payload {
  fullName: string;
  phone: string;
  branch?: string | null;
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

function buildMessage(fullName: string, branch?: string | null) {
  const firstName = (fullName || "").trim().split(" ")[0] || "Değerli Uzmanımız";
  const branchLine = branch ? `🩺 Branşınız: *${branch}*\n\n` : "";

  return (
    `👋 Merhaba *${firstName}*,\n\n` +
    `*Doktorumol.com.tr* uzman başvurunuz için teşekkür ederiz! 🌿\n` +
    `${branchLine}` +
    `⚡ *HEMEN ONLİNE KAYIT*\n` +
    `━━━━━━━━━━━━━━━\n\n` +
    `Profilinizi hemen oluşturmak için:\n` +
    `🔗 https://doktorumol.com.tr/kayit-ol\n\n` +
    `Kayıt işleminiz sonrası uzman ekibimiz profilinizi aktif hale getirecektir.\n\n` +
    `En kısa sürede uzman danışmanlarımız sizi arayarak detaylı bilgi verecektir.\n\n` +
    `👑 *PREMİUM PAKET – ÖZEL KAMPANYA*\n` +
    `━━━━━━━━━━━━━━━\n\n` +
    `💰 Normal Fiyat: ~6500₺~\n` +
    `🔥 *Kampanya Fiyatı: 4000₺*\n` +
    `🎁 *%38 İndirim – Özel Fırsat!*\n` +
    `📅 *12 Aylık Abonelik*\n\n` +
    `✅ *PAKET İÇERİĞİ*\n` +
    `━━━━━━━━━━━━━━━\n\n` +
    `🎯 Her Ay Danışan Yönlendirme Garantisi\n` +
    `👨‍⚕️ Uzman Profili\n` +
    `📋 Detaylı Profil\n` +
    `📞 İletişim Bilgileri\n` +
    `📍 Adres ve Konum\n` +
    `🎥 Video Yayınlama\n` +
    `⭐ Danışan Görüşleri\n` +
    `🔍 Uzman Sayfasına Özgün SEO Çalışması\n` +
    `📅 Online Randevu Takimi\n` +
    `🤖 Yapay Zeka Destekli Blog Sayfası\n` +
    `📱 Sosyal Medya Paylaşımları\n` +
    `👥 Danışan Takibi\n` +
    `🧠 Yapay Zeka Destekli Testler\n` +
    `🔔 SMS Hatırlatıcısı\n` +
    `☎️ Dahili Hat Tanımlama\n\n` +
    `🛡️ *DANIŞAN YÖNLENDİRME GARANTİSİ*\n` +
    `━━━━━━━━━━━━━━━\n\n` +
    `Her ay düzenli olarak yeni danışanlar tarafınıza yönlendirilir.\n` +
    `❗ *Herhangi bir ay danışan yönlendirilmediği takdirde, o aya ait ödemeniz tarafınıza iade edilir.*\n` +
    `Bu bizim size verdiğimiz *yazılı garantidir.* ✍️\n\n` +
    `📞 Sorularınız için bu numara üzerinden bize yazabilirsiniz.\n` +
    `Sağlıklı günler dileriz 🌿\n\n` +
    `_Doktorumol.com.tr_`
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as Payload;
    const { fullName, phone, branch } = body;

    if (!fullName || !phone) {
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

    const { data: activeLines } = await supabase
      .from("whatsapp_lines")
      .select("id, phone_number, is_active, sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

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
        JSON.stringify({ success: false, error: "Çalışan aktif WhatsApp hattı bulunamadı" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const message = buildMessage(fullName, branch);

    const waRes = await supabase.functions.invoke("waha-proxy", {
      body: {
        action: "sendText",
        sessionName,
        payload: {
          chatId: `${waPhone}@c.us`,
          text: message,
        },
      },
    });

    const ok = !waRes.error && (waRes.data as any)?.success !== false;

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
    console.error("notify-specialist-application error:", e);
    return new Response(
      JSON.stringify({ success: false, error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
