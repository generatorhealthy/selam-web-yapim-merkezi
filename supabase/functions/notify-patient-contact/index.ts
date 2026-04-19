// Patient contact request: send WhatsApp + SMS to the patient with the specialist link
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Payload {
  patientName: string;
  patientPhone: string;
  specialistName: string;
  specialistSpecialty?: string;
  specialistUrl: string;
}

// Normalize TR phone to 90XXXXXXXXXX (WhatsApp chatId format) and 0XXXXXXXXXX (Verimor)
function normalizePhone(raw: string): { wa: string; sms: string } | null {
  if (!raw) return null;
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("90") && digits.length === 12) {
    return { wa: digits, sms: "0" + digits.slice(2) };
  }
  if (digits.startsWith("0") && digits.length === 11) {
    return { wa: "9" + digits, sms: digits };
  }
  if (digits.length === 10) {
    return { wa: "90" + digits, sms: "0" + digits };
  }
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
    const { patientName, patientPhone, specialistName, specialistSpecialty, specialistUrl } = body;

    if (!patientName || !patientPhone || !specialistName || !specialistUrl) {
      return new Response(
        JSON.stringify({ success: false, error: "Eksik alan" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const phones = normalizePhone(patientPhone);
    if (!phones) {
      return new Response(
        JSON.stringify({ success: false, error: "Geçersiz telefon numarası" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const firstName = patientName.trim().split(" ")[0];
    const specialtyText = specialistSpecialty ? ` (${specialistSpecialty})` : "";

    const waMessage =
      `Merhaba ${firstName} 👋\n\n` +
      `Doktorumol.com.tr'ye hoş geldiniz! İlginiz için teşekkür ederiz.\n\n` +
      `*${specialistName}*${specialtyText} ile randevunuzu aşağıdaki profil sayfasından kolayca oluşturabilirsiniz:\n\n` +
      `🔗 ${specialistUrl}\n\n` +
      `📅 Profil sayfasından uygun gün ve saati seçerek randevunuzu hemen ayırtabilirsiniz.\n\n` +
      `Herhangi bir sorunuz olursa bu numara üzerinden bize yazabilirsiniz, size yardımcı olmaktan memnuniyet duyarız.\n\n` +
      `Sağlıklı günler dileriz 🌿\n` +
      `_Doktorumol.com.tr_`;

    const smsMessage =
      `Doktorumol: Merhaba ${firstName}, ${specialistName} profilinden uygun gun ve saati secerek randevunuzu olusturabilirsiniz: ${specialistUrl} Iyi gunler dileriz.`;

    const results: Record<string, unknown> = {};

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

    const whatsappSessionName = activeLine?.id ? getSessionNameForLineId(activeLine.id) : null;
    results.whatsappSession = whatsappSessionName;

    // 1) WhatsApp via waha-proxy
    try {
      if (!whatsappSessionName) {
        throw new Error("Aktif WhatsApp hattı bulunamadı");
      }

      const waRes = await supabase.functions.invoke("waha-proxy", {
        body: {
          action: "sendText",
          sessionName: whatsappSessionName,
          payload: {
            chatId: `${phones.wa}@c.us`,
            text: waMessage,
          },
        },
      });

      const waSuccess = !waRes.error && (waRes.data as any)?.success !== false;
      results.whatsapp = {
        ok: waSuccess,
        data: waRes.data,
        error: waRes.error?.message || ((waRes.data as any)?.success === false ? (waRes.data as any)?.error : undefined),
      };
    } catch (e) {
      results.whatsapp = { ok: false, error: (e as Error).message };
    }

    // 2) SMS via existing service (static proxy preferred)
    try {
      let smsRes = await supabase.functions.invoke("send-sms-via-static-proxy", {
        body: { phone: phones.sms, message: smsMessage },
      });
      if (smsRes.error || (smsRes.data as any)?.success === false) {
        smsRes = await supabase.functions.invoke("send-verimor-sms", {
          body: { phone: phones.sms, message: smsMessage },
        });
      }
      results.sms = {
        ok: !smsRes.error && (smsRes.data as any)?.success !== false,
        data: smsRes.data,
        error: smsRes.error?.message || ((smsRes.data as any)?.success === false ? (smsRes.data as any)?.error : undefined),
      };
    } catch (e) {
      results.sms = { ok: false, error: (e as Error).message };
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("notify-patient-contact error:", error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
