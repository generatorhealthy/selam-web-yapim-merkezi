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
  groupForTherapy,
  publicSpecialtyLabel,
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
const msgConsent = (name: string, therapy: string, mode: string, role: string) =>
  `Merhaba ${firstName(name)},\n\n` +
  `*${BRAND}* üzerinden yaptığınız *${therapy}* (${mode}) başvurunuz bize ulaştı.\n\n` +
  `Başvurunuzdaki tercihler doğrultusunda size uygun bir *${role.toLocaleLowerCase("tr-TR")}* yönlendirmesi yapmak için sizinle iletişime geçiyoruz. ` +
  `Görüşmelerin *ücretli* olduğunu belirtmek isteriz.\n\n` +
  `Size uygun ${role.toLocaleLowerCase("tr-TR")}umuzun sizinle iletişime geçmesini ister misiniz?`
    .replace("aile danışmanıumuzun", "aile danışmanımızın")
    .replace("psikologumuzun", "psikoloğumuzun");

const msgRoleInfo = (role: string) => {
  const r = role.toLocaleLowerCase("tr-TR");
  return (
    `Başvurunuz doğrultusunda sistemimizde size uygun bir *${r}* araştırması yapacağız ve ` +
    `alanında yetkin bir ${r}a yönlendirmenizi sağlayacağız.\n\n` +
    `Görüşme detaylarını, randevu saatini ve *seans ücretlerini* doğrudan ${r}ımızdan öğrenebilirsiniz.\n\n` +
    `Onaylıyor musunuz?`
  )
    .replace(/aile danışmanıa/g, "aile danışmanına")
    .replace(/aile danışmanıımızdan/g, "aile danışmanımızdan")
    .replace(/psikologa/g, "psikoloğa")
    .replace(/psikologımızdan/g, "psikoloğumuzdan");
};

const msgSearching = () =>
  `Teşekkür ederiz. Başvurunuz doğrultusunda size uygun uzmanımızı belirliyoruz. ` +
  `Uygun uzmanımızın bilgileri ve yönlendirme süreci kısa süre içinde sizinle paylaşılacaktır.`;

const msgSpecialistFound = (spec: Candidate, mode: string, role = "Uzman") =>
  `Başvurunuz doğrultusunda size uygun bir ${role.toLocaleLowerCase("tr-TR")} belirledik.\n\n` +
  `*${spec.name}* — ${role}\n` +
  `Görüşme şekli: ${mode}\n\n` +
  `${role} sizinle gün içerisinde iletişime geçerek görüşme detayları hakkında bilgi verecektir. ` +
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

const YES_NO = ["Evet, yönlendirme istiyorum", "Hayır, vazgeçtim"];
const Q_CONSENT = "Size uygun bir uzman yönlendirmesi yapmamızı ister misiniz?";
const Q_INFO = "Yönlendirme sürecini onaylıyor musunuz?";
const Q_APPROVAL = "Uzmanımızın sizinle iletişime geçmesini onaylıyor musunuz?";
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

// ------------------------------------------------- çoklu adım (canlı akış) metinleri
const AREA_OPTIONS: { label: string; therapy: string }[] = [
  { label: "Bireysel Terapi", therapy: "bireysel_terapi" },
  { label: "Çocuk / Ergen Terapisi", therapy: "cocuk_terapisi" },
  { label: "İlişki / Çift Terapisi", therapy: "cift_terapisi" },
  { label: "Aile Danışmanlığı", therapy: "aile_danismanligi" },
];
const AREA_LABELS = AREA_OPTIONS.map((a) => a.label);
const MODE_OPTIONS = ["Online görüşme", "Yüz yüze görüşme"];

const msgAskArea = () =>
  `Hangi alanda destek almak istiyorsunuz? Lütfen aşağıdaki seçeneklerden birini işaretleyin.`;
const msgAskMode = () =>
  `Görüşmeyi nasıl yapmak istersiniz? Lütfen bir seçenek işaretleyin.`;
const msgAskCity = () =>
  `Yüz yüze görüşme için hangi şehirde olduğunuzu yazar mısınız? (Örn: İstanbul)`;

// Anket cevabını seçenek listesiyle eşleştir (metin veya 1/2/3 numarası)
const matchOption = (raw: string, options: string[]): number => {
  const t = normalizeTr(raw);
  if (!t) return -1;
  const num = parseInt(t, 10);
  if (!Number.isNaN(num) && num >= 1 && num <= options.length) return num - 1;
  const exact = options.findIndex((o) => normalizeTr(o) === t);
  if (exact >= 0) return exact;
  return options.findIndex((o) => normalizeTr(o).includes(t) || t.includes(normalizeTr(o)));
};

function normalizeTr(s: string) {
  return String(s || "")
    .toLocaleLowerCase("tr-TR")
    .trim()
    .replace(/ı/g, "i")
    .replace(/ş/g, "s")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c");
}


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

  const role = publicSpecialtyLabel(groupForTherapy(input.therapyType));
  steps.push({ from: "bot", text: msgConsent(name, therapy, modeLabel(online), role), buttons: YES_NO });

  if (answers.consent === false) {
    steps.push({ from: "client", text: YES_NO[1] });
    steps.push({ from: "bot", text: msgDeclined() });
    return { steps, state: "declined", match: null, fallbackMatch: null, usedOnlineFallback: false };
  }
  steps.push({ from: "client", text: YES_NO[0] });
  steps.push({ from: "bot", text: msgRoleInfo(role), buttons: APPROVE });
  steps.push({ from: "client", text: APPROVE[0] });
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

  steps.push({ from: "bot", text: msgSpecialistFound(match.selected, modeLabel(online), role), buttons: APPROVE });

  if (answers.finalApproval === false) {
    steps.push({ from: "client", text: APPROVE[1] });
    steps.push({ from: "bot", text: msgDeclined() });
    return { steps, state: "declined", match, fallbackMatch, usedOnlineFallback };
  }

  steps.push({ from: "client", text: APPROVE[0] });
  steps.push({ from: "bot", text: msgCompleted(match.selected) });
  return { steps, state: "completed", match, fallbackMatch, usedOnlineFallback };
}

// --------------------------------------------------- WhatsApp gönderim yardımcıları
function getSessionNameForLineId(lineId: string) {
  return `line_${lineId.replace(/-/g, "").slice(0, 16)}`;
}

async function getWorkingSessionName(supabase: any): Promise<string | null> {
  const { data: activeLines } = await supabase
    .from("whatsapp_lines")
    .select("id, phone_number")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const lines = (activeLines || []) as any[];
  if (!lines.length) return null;

  const candidates = lines.map((l) => getSessionNameForLineId(l.id));
  const activePhones = new Set(
    lines.map((l) => String(l.phone_number || "").replace(/\D/g, "")).filter(Boolean),
  );

  const res = await supabase.functions.invoke("waha-proxy", { body: { action: "sessions.list" } });
  const sessions = Array.isArray((res.data as any)?.data) ? (res.data as any).data : [];

  const working = (s: any) => String(s?.status || "").toUpperCase() === "WORKING";
  const direct = candidates.find((c) => sessions.some((s: any) => s?.name === c && working(s)));
  if (direct) return direct;

  const matched = sessions.find((s: any) => {
    if (!working(s)) return false;
    const mePhone = String(s?.me?.id || "").split("@")[0]?.replace(/\D/g, "") || "";
    return mePhone && activePhones.has(mePhone);
  });
  return matched?.name || null;
}

function withButtonHints(text: string, buttons?: string[]) {
  if (!buttons?.length) return text;
  return `${text}\n\n${buttons.map((b, i) => `${i + 1}) ${b}`).join("\n")}`;
}

Deno.serve(async (req) => {

  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Dahili test tetikleyici (yalnızca test gönderimi için, sır başlığıyla)
  const testToken = Deno.env.get("WA_BOT_TEST_TOKEN");
  const testHeader = req.headers.get("x-wa-bot-test-token");
  const testAuthorized = !!testToken && !!testHeader && testHeader === testToken;

  if (!testAuthorized) {
    const auth = await verifyAdminOrCron(req);
    if (!auth.ok) return json({ success: false, error: auth.error }, auth.status);
  }

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

    // ---------------------------------------------------------------- test_send
    // Belirtilen numaraya botun tüm mesajlarını GERÇEKTEN gönderir.
    // Uzmana hiçbir bildirim gitmez, client_referrals kaydı OLUŞTURULMAZ.
    if (action === "test_send") {
      const phone = String(body.phone || "").replace(/\D/g, "");
      if (phone.length < 10) {
        return json({ success: false, error: "Geçerli bir telefon numarası gerekli" }, 400);
      }

      const all = await loadCandidates(supabase, urgentDays);
      const flow = runFlow(all, body as SimInput, urgentDays);

      const sessionName = await getWorkingSessionName(supabase);
      if (!sessionName) {
        return json({ success: false, error: "Bağlı/çalışan aktif WhatsApp hattı bulunamadı" });
      }

      const botSteps = flow.steps.filter((s) => s.from === "bot");
      const sent: string[] = [];
      const errors: string[] = [];

      for (let i = 0; i < botSteps.length; i++) {
        const step = botSteps[i];
        const prefix = i === 0 ? "🧪 *TEST MESAJI — Sistem denemesi*\n\n" : "";
        const chatId = `${phone}@c.us`;
        const bodyText = prefix + step.text;
        let ok = false;
        let errMsg = "";

        // NOWEB, sendButtons mesajını kabul etse bile WhatsApp'a teslim etmiyor.
        // Dokunulabilir tek seçimli seçenekleri NOWEB'in desteklediği anket olarak gönder.
        if (step.buttons?.length) {
          const btnRes = await supabase.functions.invoke("waha-proxy", {
            body: {
              action: "sendPoll",
              sessionName,
              payload: {
                chatId,
                name: bodyText,
                options: step.buttons,
              },
            },
          });
          ok = !btnRes.error && (btnRes.data as any)?.success !== false;
          if (!ok) errMsg = btnRes.error?.message || (btnRes.data as any)?.error || "seçenekler gönderilemedi";
        }

        // 2) Buton desteklenmiyorsa numaralı metne düş
        const text = bodyText + (step.buttons?.length ? `\n\n${step.buttons.map((b, x) => `${x + 1}) ${b}`).join("\n")}` : "");
        if (!ok) {
          const res = await supabase.functions.invoke("waha-proxy", {
            body: { action: "sendText", sessionName, payload: { chatId, text } },
          });
          ok = !res.error && (res.data as any)?.success !== false;
          if (!ok) errors.push(res.error?.message || (res.data as any)?.error || errMsg || "Bilinmeyen hata");
          else if (errMsg) errors.push(`Dokunulabilir seçenek desteklenmedi, metin olarak gönderildi (${errMsg})`);
        }
        if (ok) sent.push(text);
        if (i < botSteps.length - 1) await new Promise((r) => setTimeout(r, 1500));
      }


      await supabase.from("whatsapp_bot_sessions").insert({
        lead_id: null,
        phone,
        client_name: body.clientName || "Test Danışanı",
        therapy_type: body.therapyType ?? null,
        consultation_type: body.consultationType ?? null,
        city: body.city ?? null,
        state: "completed",
        selected_specialist_id: null,
        selection_reason: "TEST GÖNDERİMİ — uzmana aktarım yapılmadı",
        offered_online_fallback: flow.usedOnlineFallback,
        is_test: true,
        transcript: flow.steps,
        last_message_at: new Date().toISOString(),
      });

      return json({
        success: errors.length === 0,
        testSend: true,
        phone,
        sessionName,
        sentCount: sent.length,
        messages: sent,
        errors,
        note: "Uzmana aktarım yapılmadı, yönlendirme kaydı oluşturulmadı.",
      });
    }


    // ------------------------------------------------------- CANLI AKIŞ (danışan)
    if (action === "start" || action === "reply") {
      if (!liveSendAllowed) {
        return json({
          success: false,
          blocked: true,
          error:
            "WhatsApp botu şu anda kapalı veya test modunda. Gerçek mesaj gönderilmedi. Panelden botu açıp test modunu kapatmalısınız.",
        });
      }

      const sessionName = await getWorkingSessionName(supabase);
      if (!sessionName) {
        return json({ success: false, error: "Bağlı/çalışan aktif WhatsApp hattı bulunamadı" });
      }

      const phone = String(body.phone || "").replace(/\D/g, "");
      if (phone.length < 10) {
        return json({ success: false, error: "Geçerli bir telefon numarası gerekli" }, 400);
      }
      const chatId = `${phone}@c.us`;

      const sendPlain = async (text: string) => {
        const r = await supabase.functions.invoke("waha-proxy", {
          body: { action: "sendText", sessionName, payload: { chatId, text } },
        });
        return !r.error && (r.data as any)?.success !== false;
      };

      // options varsa: uzun bilgilendirme metni ayrı mesaj, anket sorusu kısa tutulur
      // (WhatsApp anket başlığı ~255 karakterde kesiliyor)
      const send = async (text: string, options?: string[], question?: string) => {
        if (options?.length) {
          const q = question || text;
          if (q !== text) await sendPlain(text);
          const p = await supabase.functions.invoke("waha-proxy", {
            body: { action: "sendPoll", sessionName, payload: { chatId, name: q, options } },
          });
          if (!p.error && (p.data as any)?.success !== false) return true;
        }
        const r = await supabase.functions.invoke("waha-proxy", {
          body: {
            action: "sendText",
            sessionName,
            payload: { chatId, text: withButtonHints(text, options) },
          },
        });
        return !r.error && (r.data as any)?.success !== false;
      };

      // ---- oturumu bul / oluştur
      const { data: existingRow } = await supabase
        .from("whatsapp_bot_sessions")
        .select("*")
        .eq("phone", phone)
        .eq("is_test", false)
        .not("state", "in", "(completed,declined,no_specialist)")
        .order("last_message_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      const existing: any = existingRow;

      const pushTranscript = (s: any, from: "bot" | "client", text: string, buttons?: string[]) => {
        const t = Array.isArray(s?.transcript) ? s.transcript : [];
        t.push({ from, text, buttons });
        return t;
      };

      const saveSession = async (id: string, patch: Record<string, unknown>) => {
        await supabase
          .from("whatsapp_bot_sessions")
          .update({ ...patch, last_message_at: new Date().toISOString() })
          .eq("id", id);
      };

      if (action === "start") {
        if (existing) {
          return json({ success: true, skipped: true, reason: "Aktif oturum mevcut", sessionId: existing.id });
        }
        const clientName = String(body.clientName || "Danışan");
        const question = msgConsent(
          clientName,
          therapyLabel(body.therapyType),
          modeLabel(isOnlineRequest(body.consultationType)),
          publicSpecialtyLabel(groupForTherapy(body.therapyType)),
        );
        const ok = await send(question, YES_NO, Q_CONSENT);
        const { data: created } = await supabase
          .from("whatsapp_bot_sessions")
          .insert({
            lead_id: body.leadId ?? null,
            phone,
            client_name: clientName,
            therapy_type: body.therapyType ?? null,
            consultation_type: body.consultationType ?? null,
            city: body.city ?? null,
            state: "awaiting_consent",
            is_test: false,
            last_question: "consent",
            last_options: YES_NO,
            answers: {},
            transcript: [{ from: "bot", text: question, buttons: YES_NO }],
            last_message_at: new Date().toISOString(),
          })
          .select("id")
          .maybeSingle();

        if (body.leadId) {
          await supabase
            .from("danisan_basvurulari")
            .update({ wa_bot_started_at: new Date().toISOString(), wa_bot_error: ok ? null : "Mesaj gönderilemedi" })
            .eq("id", body.leadId);
        }

        return json({ success: ok, started: true, sessionId: created?.id ?? null, phone });
      }

      // ------------------------------------------------------------------ reply
      const answerRaw = String(body.text || "").trim();
      if (!existing) {
        return json({ success: true, skipped: true, reason: "Aktif bot oturumu yok" });
      }
      if (!answerRaw) {
        return json({ success: true, skipped: true, reason: "Boş cevap" });
      }

      const answers = (existing.answers || {}) as Record<string, unknown>;
      const transcript = pushTranscript(existing, "client", answerRaw);
      const step = String(existing.last_question || "consent");

      const reply = async (text: string, options?: string[], nextState?: string, nextStep?: string, patch?: Record<string, unknown>, question?: string) => {
        await send(text, options, question);
        transcript.push({ from: "bot", text, buttons: options });
        await saveSession(existing.id, {
          transcript,
          answers,
          state: nextState ?? existing.state,
          last_question: nextStep ?? existing.last_question,
          last_options: options ?? null,
          ...(patch || {}),
        });
      };

      // 1) onay adımı
      if (step === "consent") {
        if (isNegative(answerRaw)) {
          answers.consent = false;
          await reply(msgDeclined(), undefined, "declined", "done");
          return json({ success: true, state: "declined" });
        }
        if (!isPositive(answerRaw)) {
          await reply(
            msgConsent(
              existing.client_name || "Danışan",
              therapyLabel(existing.therapy_type),
              modeLabel(isOnlineRequest(existing.consultation_type)),
              publicSpecialtyLabel(groupForTherapy(existing.therapy_type)),
            ),
            YES_NO,
            undefined,
            undefined,
            undefined,
            Q_CONSENT,
          );
          return json({ success: true, state: existing.state, repeated: true });
        }
        answers.consent = true;
        await reply(
          msgRoleInfo(publicSpecialtyLabel(groupForTherapy(existing.therapy_type))),
          APPROVE,
          "awaiting_info_confirm",
          "info_confirm",
          undefined,
          Q_INFO,
        );
        return json({ success: true, state: "awaiting_info_confirm" });
      }

      // 1b) bilgilendirme onayı
      if (step === "info_confirm") {
        if (isNegative(answerRaw)) {
          answers.infoConfirm = false;
          await reply(msgDeclined(), undefined, "declined", "done");
          return json({ success: true, state: "declined" });
        }
        if (!isPositive(answerRaw)) {
          await reply(
            msgRoleInfo(publicSpecialtyLabel(groupForTherapy(existing.therapy_type))),
            APPROVE,
            undefined,
            undefined,
            undefined,
            Q_INFO,
          );
          return json({ success: true, state: existing.state, repeated: true });
        }
        answers.infoConfirm = true;

        // Başvuruda alan bilgisi varsa tekrar sorma, doğrudan sonraki adıma geç
        if (existing.therapy_type) {
          if (existing.consultation_type) {
            const online = isOnlineRequest(existing.consultation_type);
            answers.online = online;
            if (!online && !existing.city) {
              await reply(msgAskCity(), undefined, "awaiting_city", "city");
              return json({ success: true, state: "awaiting_city" });
            }
            return await runMatchStep(online, existing.city);
          }
          await reply(msgAskMode(), MODE_OPTIONS, "awaiting_mode", "mode");
          return json({ success: true, state: "awaiting_mode" });
        }

        await reply(msgAskArea(), AREA_LABELS, "awaiting_area", "area");
        return json({ success: true, state: "awaiting_area" });
      }

      // 2) alan seçimi
      if (step === "area") {
        const idx = matchOption(answerRaw, AREA_LABELS);
        if (idx < 0) {
          await reply(msgAskArea(), AREA_LABELS);
          return json({ success: true, state: existing.state, repeated: true });
        }
        answers.area = AREA_OPTIONS[idx].label;
        await reply(msgAskMode(), MODE_OPTIONS, "awaiting_mode", "mode", {
          therapy_type: AREA_OPTIONS[idx].therapy,
        });
        return json({ success: true, state: "awaiting_mode" });
      }

      // 3) görüşme tipi
      if (step === "mode") {
        const idx = matchOption(answerRaw, MODE_OPTIONS);
        if (idx < 0) {
          await reply(msgAskMode(), MODE_OPTIONS);
          return json({ success: true, state: existing.state, repeated: true });
        }
        const online = idx === 0;
        answers.online = online;
        if (!online && !existing.city) {
          await reply(msgAskCity(), undefined, "awaiting_city", "city", { consultation_type: "yuz_yuze" });
          return json({ success: true, state: "awaiting_city" });
        }
        return await runMatchStep(online, existing.city);
      }

      // 4) şehir (yüz yüze)
      if (step === "city") {
        answers.city = answerRaw;
        await supabase.from("whatsapp_bot_sessions").update({ city: answerRaw }).eq("id", existing.id);
        existing.city = answerRaw;
        return await runMatchStep(false, answerRaw);
      }

      // 5) online alternatif teklifi
      if (step === "online_fallback") {
        if (!isPositive(answerRaw)) {
          answers.onlineFallback = false;
          await reply(msgDeclined(), undefined, "declined", "done");
          return json({ success: true, state: "declined" });
        }
        answers.onlineFallback = true;
        return await runMatchStep(true, null, true);
      }

      // 6) uzman onayı
      if (step === "approval") {
        if (isNegative(answerRaw)) {
          answers.finalApproval = false;
          await reply(msgDeclined(), undefined, "declined", "done");
          return json({ success: true, state: "declined" });
        }
        if (!isPositive(answerRaw)) {
          await reply("Onayınızı alabilmemiz için lütfen aşağıdaki seçeneklerden birini işaretleyin.", APPROVE);
          return json({ success: true, state: existing.state, repeated: true });
        }
        answers.finalApproval = true;

        const specId = existing.selected_specialist_id as string | null;
        const all = await loadCandidates(supabase, urgentDays);
        const spec = all.find((c) => c.id === specId) || null;

        if (spec) {
          const now = new Date();
          const nameParts = String(existing.client_name || "").trim().split(" ");
          await supabase.from("client_referrals").insert({
            specialist_id: spec.id,
            year: now.getFullYear(),
            month: now.getMonth() + 1,
            is_referred: true,
            referred_at: now.toISOString(),
            referral_count: 1,
            client_name: nameParts.slice(0, -1).join(" ") || nameParts[0] || "Danışan",
            client_surname: nameParts.length > 1 ? nameParts[nameParts.length - 1] : "",
            client_contact: existing.phone,
            consultation_type: answers.online === false ? "Yüz yüze" : "Online",
            notes: "WhatsApp botu üzerinden otomatik yönlendirme",
          });
          if (existing.lead_id) {
            await supabase
              .from("danisan_basvurulari")
              .update({ status: "yonlendirildi", assigned_specialist_id: spec.id })
              .eq("id", existing.lead_id);
          }
        }

        await reply(
          spec ? msgCompleted(spec) : "Onayınız için teşekkür ederiz. Ekibimiz en kısa sürede sizinle iletişime geçecektir.",
          undefined,
          "completed",
          "done",
        );
        return json({ success: true, state: "completed", specialistId: spec?.id ?? null });
      }

      return json({ success: true, skipped: true, reason: `Bilinmeyen adım: ${step}` });

      // ---- eşleştirme + uzman onayı sorusu
      async function runMatchStep(online: boolean, city: string | null, usedFallback = false) {
        const all = await loadCandidates(supabase, urgentDays);
        const match = matchSpecialist(all, {
          therapyType: (existing.therapy_type as string) || undefined,
          online,
          city: online ? null : city,
          urgentDays,
        });

        if (!match.selected && !online) {
          await reply(msgNoCitySpecialist(city), ONLINE_FALLBACK, "awaiting_online_fallback", "online_fallback", {
            offered_online_fallback: true,
          }, "Online görüşme seçeneğini değerlendirmek ister misiniz?");
          return json({ success: true, state: "awaiting_online_fallback" });
        }
        if (!match.selected) {
          await reply(msgNoSpecialistAtAll(), undefined, "no_specialist", "done");
          return json({ success: true, state: "no_specialist" });
        }

        const role = publicSpecialtyLabel(groupForTherapy((existing.therapy_type as string) || undefined));
        await reply(msgSpecialistFound(match.selected, modeLabel(online), role), APPROVE, "awaiting_approval", "approval", {
          selected_specialist_id: match.selected.id,
          selection_reason: match.selectionReason ?? null,
          consultation_type: online ? "online" : "yuz_yuze",
          offered_online_fallback: usedFallback || !!existing.offered_online_fallback,
        }, Q_APPROVAL);
        return json({ success: true, state: "awaiting_approval", specialistId: match.selected.id });
      }
    }


    return json({ success: false, error: "Bilinmeyen aksiyon" }, 400);
  } catch (e) {
    console.error("wa-bot-engine error:", e);
    return json({ success: false, error: (e as Error).message }, 500);
  }
});
