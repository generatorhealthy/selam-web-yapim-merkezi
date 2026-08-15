// ============================================================================
// WhatsApp Danışan Yönlendirme Botu — Konuşma Motoru
// ----------------------------------------------------------------------------
// GÜVENLİK: Gerçek WhatsApp mesajı YALNIZCA whatsapp_bot_settings.enabled = true
// VE test_mode = false iken gönderilir. Varsayılan ayar: kapalı + test modu.
// Bu fonksiyon uzman aramak için ASLA dış kaynak/AI kullanmaz; sadece
// platformda kayıtlı uzmanlar arasında kurallı eşleştirme yapar.
//
// Aksiyonlar:
//   simulate -> Gerçek mesaj göndermeden tüm akışı ve seçim nedenini döner
//   match    -> Sadece uzman eşleştirme sonucunu döner
//   start    -> Danışan için bot oturumu açar (mesaj gönderimi ayara bağlı)
//   reply    -> Danışanın buton/metin cevabını işler
// ============================================================================
import { createClient } from "npm:@supabase/supabase-js@2";
import { verifyAdminOrCron } from "../_shared/adminAuth.ts";
import {
  Candidate,
  loadCandidates,
  matchSpecialist,
  MatchResult,
  therapyLabel,
} from "../_shared/botMatcher.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), {
    status: s,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const BRAND = "Doktorumol.com.tr";

type Step = { from: "bot" | "client"; text: string; buttons?: string[] };

const firstName = (name?: string | null) =>
  String(name || "").trim().split(" ")[0] || "Merhaba";

// ---------------------------------------------------------------- mesaj metinleri
const msgConsent = (name: string, therapy: string, mode: string) =>
  `Merhaba ${firstName(name)},\n\n` +
  `*${BRAND}* üzerinden yaptığınız *${therapy}* (${mode}) danışmanlık başvurunuz bize ulaştı.\n\n` +
  `Başvurunuzdaki tercihler doğrultusunda size uygun bir uzman yönlendirmesi yapmak için sizinle iletişime geçiyoruz. ` +
  `Görüşmelerin *ücretli* olduğunu belirtmek isteriz.\n\n` +
  `Size uygun uzmanımızın yönlendirilmesini ve uzmanımızın sizinle iletişime geçmesini ister misiniz?`;

const msgSearching = () =>
  `Teşekkür ederiz. Başvurunuz doğrultusunda size uygun uzmanımızı belirliyoruz. ` +
  `Uygun uzmanımızın bilgileri ve yönlendirme süreci kısa süre içinde sizinle paylaşılacaktır.`;

const msgSpecialistFound = (spec: Candidate, mode: string) =>
  `Başvurunuz doğrultusunda size uygun bir uzman belirledik.\n\n` +
  `*${spec.name}*${spec.specialty ? ` — ${spec.specialty}` : ""}\n` +
  `Görüşme şekli: ${mode}\n\n` +
  `Uzmanımız sizinle gün içerisinde iletişime geçerek görüşme detayları hakkında bilgi verecektir. ` +
  `Görüşmeler ücretlidir.\n\n` +
  `Uzmanımızın sizinle iletişime geçmesini onaylıyor musunuz?`;

const msgNoCitySpecialist = (city?: string | null) =>
  `Başvurunuz için teşekkür ederiz. ${city ? `*${city}*` : "Seçmiş olduğunuz şehir"} içinde, tercih ettiğiniz hizmeti ` +
  `yüz yüze sunan uygun bir uzmanımız şu anda bulunmamaktadır.\n\n` +
  `Dilerseniz size online görüşme gerçekleştirebileceğiniz, başvurunuzun alanına uygun bir uzmanımızı yönlendirebiliriz.\n\n` +
  `Online danışmanlık seçeneğini değerlendirmek ister misiniz?`;

const msgNoSpecialistAtAll = () =>
  `Başvurunuz için teşekkür ederiz. Şu anda başvurunuza uygun müsait bir uzmanımız bulunmamaktadır. ` +
  `Uygun uzmanımız olduğunda size tekrar dönüş sağlayacağız.`;

const msgCompleted = (spec: Candidate) =>
  `Onayınız için teşekkür ederiz. Yönlendirmeniz tamamlandı.\n\n` +
  `*${spec.name}* en kısa süre içinde sizinle iletişime geçecektir. Sağlıklı günler dileriz.`;

const msgDeclined = () =>
  `Anladık. Talebiniz doğrultusunda herhangi bir uzman yönlendirmesi yapılmayacaktır. ` +
  `İleride destek almak isterseniz bizimle tekrar iletişime geçebilirsiniz.`;

const YES_NO = ["Evet, uzman yönlendirmesi istiyorum", "Hayır, vazgeçtim"];
const APPROVE = ["Onaylıyorum", "Vazgeçtim"];
const ONLINE_FALLBACK = ["Evet, online uzman istiyorum", "Hayır, istemiyorum"];

const modeLabel = (online: boolean) => (online ? "Online" : "Yüz yüze");

// Danışan cevabını yorumla (buton metni, 1/2 veya serbest metin)
const isPositive = (raw: string) => {
  const t = String(raw || "").toLocaleLowerCase("tr-TR").trim();
  if (["1", "evet", "e", "olur", "onay", "onaylıyorum", "onayliyorum", "tamam", "kabul"].includes(t)) return true;
  return /(evet|onayl|istiyorum|olur|kabul)/.test(t) && !/istemiyorum|vazge/.test(t);
};
const isNegative = (raw: string) => {
  const t = String(raw || "").toLocaleLowerCase("tr-TR").trim();
  if (["2", "hayır", "hayir", "h", "vazgeçtim", "vazgectim", "istemiyorum"].includes(t)) return true;
  return /(hayır|hayir|istemiyorum|vazge|gerek yok)/.test(t);
};

// ------------------------------------------------------------------- simülasyon
interface SimInput {
  clientName?: string;
  therapyType?: string;
  consultationType?: string; // online | yuz_yuze
  city?: string | null;
  answers?: {
    consent?: boolean;
    onlineFallback?: boolean;
    finalApproval?: boolean;
  };
}

const isOnlineRequest = (raw?: string | null) => {
  const t = String(raw || "").toLocaleLowerCase("tr-TR");
  if (!t) return true;
  return !/(yüz|yuz|f2f|yerinde|ofis)/.test(t);
};

function runFlow(
  all: Candidate[],
  input: SimInput,
  urgentDays: number,
): {
  steps: Step[];
  state: string;
  match: MatchResult | null;
  fallbackMatch: MatchResult | null;
  usedOnlineFallback: boolean;
} {
  const steps: Step[] = [];
  const name = input.clientName || "Danışan";
  const therapy = therapyLabel(input.therapyType);
  let online = isOnlineRequest(input.consultationType);
  const city = input.city || null;
  const answers = input.answers || {};

  steps.push({ from: "bot", text: msgConsent(name, therapy, modeLabel(online)), buttons: YES_NO });

  if (answers.consent === false) {
    steps.push({ from: "client", text: YES_NO[1] });
    steps.push({ from: "bot", text: msgDeclined() });
    return { steps, state: "declined", match: null, fallbackMatch: null, usedOnlineFallback: false };
  }
  steps.push({ from: "client", text: YES_NO[0] });
  steps.push({ from: "bot", text: msgSearching() });

  let match = matchSpecialist(all, { therapyType: input.therapyType, online, city, urgentDays });
  let fallbackMatch: MatchResult | null = null;
  let usedOnlineFallback = false;

  // Yüz yüze isteniyor ama şehirde uygun uzman yok -> online alternatif teklifi
  if (!match.selected && !online) {
    steps.push({ from: "bot", text: msgNoCitySpecialist(city), buttons: ONLINE_FALLBACK });
    if (answers.onlineFallback === false) {
      steps.push({ from: "client", text: ONLINE_FALLBACK[1] });
      steps.push({ from: "bot", text: msgDeclined() });
      return { steps, state: "declined", match, fallbackMatch: null, usedOnlineFallback: false };
    }
    steps.push({ from: "client", text: ONLINE_FALLBACK[0] });
    online = true;
    usedOnlineFallback = true;
    fallbackMatch = matchSpecialist(all, { therapyType: input.therapyType, online: true, city: null, urgentDays });
    match = fallbackMatch;
  }

  if (!match.selected) {
    steps.push({ from: "bot", text: msgNoSpecialistAtAll() });
    return { steps, state: "no_specialist", match, fallbackMatch, usedOnlineFallback };
  }

  steps.push({ from: "bot", text: msgSpecialistFound(match.selected, modeLabel(online)), buttons: APPROVE });

  if (answers.finalApproval === false) {
    steps.push({ from: "client", text: APPROVE[1] });
    steps.push({ from: "bot", text: msgDeclined() });
    return { steps, state: "declined", match, fallbackMatch, usedOnlineFallback };
  }

  steps.push({ from: "client", text: APPROVE[0] });
  steps.push({ from: "bot", text: msgCompleted(match.selected) });
  return { steps, state: "completed", match, fallbackMatch, usedOnlineFallback };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const auth = await verifyAdminOrCron(req);
  if (!auth.ok) return json({ success: false, error: auth.error }, auth.status);

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const body = await req.json().catch(() => ({}));
    const action = String(body.action || "simulate");

    const { data: settings } = await supabase
      .from("whatsapp_bot_settings")
      .select("*")
      .limit(1)
      .maybeSingle();

    const urgentDays = settings?.urgent_days ?? 20;
    const liveSendAllowed = !!settings?.enabled && settings?.test_mode === false;

    if (action === "match") {
      const all = await loadCandidates(supabase, urgentDays);
      const result = matchSpecialist(all, {
        therapyType: body.therapyType,
        online: isOnlineRequest(body.consultationType),
        city: body.city ?? null,
        urgentDays,
      });
      return json({ success: true, result });
    }

    if (action === "simulate") {
      const all = await loadCandidates(supabase, urgentDays);
      const flow = runFlow(all, body as SimInput, urgentDays);

      // Simülasyon kaydı (is_test = true) — panelde görünmesi için
      if (body.saveSession !== false) {
        await supabase.from("whatsapp_bot_sessions").insert({
          lead_id: body.leadId ?? null,
          phone: String(body.phone || "SIMULASYON"),
          client_name: body.clientName || "Test Danışanı",
          therapy_type: body.therapyType ?? null,
          consultation_type: body.consultationType ?? null,
          city: body.city ?? null,
          state: flow.state,
          selected_specialist_id: flow.match?.selected?.id ?? null,
          selection_reason: flow.match?.selectionReason ?? null,
          offered_online_fallback: flow.usedOnlineFallback,
          is_test: true,
          transcript: flow.steps,
          last_message_at: new Date().toISOString(),
        });
      }

      return json({
        success: true,
        liveSendAllowed,
        simulated: true,
        state: flow.state,
        usedOnlineFallback: flow.usedOnlineFallback,
        steps: flow.steps,
        match: flow.match,
        fallbackMatch: flow.fallbackMatch,
      });
    }

    // start / reply: gerçek akış. Mesaj gönderimi ayarlar kapalıyken yapılmaz.
    if (action === "start" || action === "reply") {
      if (!liveSendAllowed) {
        return json({
          success: false,
          blocked: true,
          error:
            "WhatsApp botu şu anda kapalı veya test modunda. Gerçek mesaj gönderilmedi. Panelden botu açıp test modunu kapatmalısınız.",
        });
      }
      return json({
        success: false,
        error: "Canlı gönderim henüz etkinleştirilmedi (WhatsApp API entegrasyonu son aşamada aktif edilecek).",
      });
    }

    return json({ success: false, error: "Bilinmeyen aksiyon" }, 400);
  } catch (e) {
    console.error("wa-bot-engine error:", e);
    return json({ success: false, error: (e as Error).message }, 500);
  }
});
