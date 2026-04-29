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

    const firstName = name.trim().split(" ")[0];

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

    // Pick active WhatsApp line
    const { data: activeLine, error: lineError } = await supabase
      .from("whatsapp_lines")
      .select("id, is_active, sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (lineError) {
      console.error("Failed to fetch active WhatsApp line:", lineError);
    }

    const sessionName = activeLine?.id ? getSessionNameForLineId(activeLine.id) : null;
    if (!sessionName) {
      return new Response(
        JSON.stringify({ success: false, error: "Aktif WhatsApp hattı bulunamadı" }),
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
    console.error("send-registration-whatsapp error:", e);
    return new Response(
      JSON.stringify({ success: false, error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
