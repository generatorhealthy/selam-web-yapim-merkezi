// Send WhatsApp welcome message to newly registered specialist via WAHA
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Payload {
  name: string;
  phone: string;
}

interface WhatsappLine {
  id: string;
  is_active: boolean;
  sort_order: number | null;
}

// Normalize TR phone to 90XXXXXXXXXX (WhatsApp chatId format)
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

async function getWorkingSessionName(supabase: ReturnType<typeof createClient>) {
  const { data: activeLines, error: lineError } = await supabase
    .from("whatsapp_lines")
    .select("id, is_active, sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (lineError) {
    console.error("Failed to fetch active WhatsApp lines:", lineError);
    return { sessionName: null, error: "Aktif WhatsApp hattı okunamadı" };
  }

  const sessionCandidates = ((activeLines || []) as WhatsappLine[]).map((line) => getSessionNameForLineId(line.id));
  if (sessionCandidates.length === 0) {
    return { sessionName: null, error: "Aktif WhatsApp hattı bulunamadı" };
  }

  const sessionsRes = await supabase.functions.invoke("waha-proxy", {
    body: { action: "sessions.list" },
  });

  if (sessionsRes.error) {
    console.error("WAHA sessions.list error:", sessionsRes.error);
    return { sessionName: null, error: sessionsRes.error.message || "WAHA oturumları kontrol edilemedi" };
  }

  const sessions = Array.isArray((sessionsRes.data as any)?.data) ? (sessionsRes.data as any).data : [];
  const workingSession = sessionCandidates.find((candidate) =>
    sessions.some((session: any) => session?.name === candidate && String(session?.status || "").toUpperCase() === "WORKING")
  );

  if (!workingSession) {
    console.error("No active WORKING WhatsApp session found", { sessionCandidates, sessions });
    return { sessionName: null, error: "Bağlı/çalışan aktif WhatsApp hattı bulunamadı" };
  }

  return { sessionName: workingSession, error: null };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, phone } = (await req.json()) as Payload;

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

    const waMessage =
      `🎉 *Doktorumol.com.tr'ye Hoş Geldiniz!*\n\n` +
      `Sayın *${name}*,\n\n` +
      `Uzman profiliniz başarıyla oluşturulmuştur. ✅\n\n` +
      `Profilinizin yayına alınması ve hastalarla buluşmaya başlamanız için son bir adım kaldı: üyelik ödemenizin tamamlanması.\n\n` +
      `🔗 *Ödeme & Aktivasyon:*\n` +
      `https://doktorumol.com.tr/ozel-firsat\n\n` +
      `📌 *Sizi neler bekliyor?*\n` +
      `• Binlerce hastaya ulaşma imkânı\n` +
      `• Online randevu ve danışmanlık altyapısı\n` +
      `• Profesyonel uzman profil sayfası\n\n` +
      `Saygılarımızla,\n` +
      `*Doktorumol.com.tr Ekibi* 👨‍⚕️👩‍⚕️`;

    const { sessionName, error: sessionError } = await getWorkingSessionName(supabase);
    if (!sessionName) {
      return new Response(
        JSON.stringify({ success: false, error: sessionError || "Aktif WhatsApp hattı bulunamadı" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const chatId = `${waPhone}@c.us`;

    // 1) Önce PDF (Özel Fırsat) gönder
    let pdfRes: any = null;
    try {
      pdfRes = await supabase.functions.invoke("waha-proxy", {
        body: {
          action: "sendFile",
          sessionName,
          payload: {
            chatId,
            file: {
              url: "https://doktorumol.com.tr/ozel-firsat.pdf",
              filename: "ozel-firsat.pdf",
              mimetype: "application/pdf",
            },
            caption: "📄 Özel Fırsat Bilgilendirme Dökümanı",
          },
        },
      });
    } catch (e) {
      console.error("PDF send error:", e);
    }

    // Kısa bekleme: WhatsApp'ta dosya önce, sonra metin görünmeli
    await new Promise((r) => setTimeout(r, 1500));

    // 2) Hoş geldin metnini gönder
    const waRes = await supabase.functions.invoke("waha-proxy", {
      body: {
        action: "sendText",
        sessionName,
        payload: {
          chatId,
          text: waMessage,
        },
      },
    });

    const ok = !waRes.error && (waRes.data as any)?.success !== false;

    return new Response(
      JSON.stringify({
        success: ok,
        sessionName,
        pdf: pdfRes?.data,
        data: waRes.data,
        error: waRes.error?.message || ((waRes.data as any)?.success === false ? (waRes.data as any)?.error : undefined),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("send-registration-whatsapp error:", e);
    return new Response(
      JSON.stringify({ success: false, error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
