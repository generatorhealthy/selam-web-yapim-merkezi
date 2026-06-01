import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============================================================================
// Danışan Otomatik Yönlendirme Motoru
// ----------------------------------------------------------------------------
// Bu fonksiyon "Yeni Gelenler" (danisan_basvurulari.status = 'new') danışanları
// alır ve her biri için hangi uzmana yönlendirileceğini hesaplar.
//
// ÖNEMLİ: Şu an TEST modundayız. dry_run === true (varsayılan) iken HİÇBİR
// arama yapılmaz, HİÇBİR veritabanı yazımı yapılmaz. Sadece "plan" döndürülür.
// ============================================================================

// Başvuru türü -> uzman kategorisi eşlemesi
// Bireysel Terapi  -> Psikolog / Psikolojik Danışman / Klinik Psikolog
// Aile/Çift/Çocuk  -> Aile Danışmanı
const FAMILY_THERAPIES = [
  "aile_terapisi",
  "cift_terapisi",
  "çift_terapisi",
  "cocuk_terapisi",
  "çocuk_terapisi",
];

const THERAPY_LABELS: Record<string, string> = {
  bireysel_terapi: "Bireysel Terapi",
  cift_terapisi: "Çift Terapisi",
  "çift_terapisi": "Çift Terapisi",
  aile_terapisi: "Aile Terapisi",
  cocuk_terapisi: "Çocuk Terapisi",
  "çocuk_terapisi": "Çocuk Terapisi",
  ergen_terapisi: "Ergen Terapisi",
};

const normalize = (s: string | null | undefined) =>
  (s || "").toLocaleLowerCase("tr-TR").trim();

const therapyLabel = (raw: string | null) => {
  if (!raw) return "danışmanlık";
  const key = normalize(raw);
  return THERAPY_LABELS[key] || raw.replace(/_/g, " ");
};

// Başvuru aile/çift/çocuk terapisi mi?
const isFamilyTherapy = (therapy: string | null) =>
  FAMILY_THERAPIES.includes(normalize(therapy));

// Uzmanın uzmanlık alanı, başvuru kategorisine uygun mu?
// NOT: Bazı uzmanların unvanı sadece isimlerinde kısaltma olarak geçer:
//   "Psk." -> psikolog, "Kl./Kln. Psk." -> klinik psikolog,
//   "Psk. Dan." -> psikolojik danışman, "Aile Dan." -> aile danışmanı
// Bu yüzden hem specialty hem de name alanına bakarız.
const specialistMatchesCategory = (
  specialty: string | null,
  name: string | null,
  family: boolean,
): boolean => {
  const s = `${normalize(specialty)} ${normalize(name)}`;
  // "aile dan" hem "aile danışmanı" hem de "aile dan." kısaltmasını yakalar
  const isFamilyCounselor = /aile danış|aile dan\.?\b/.test(s);
  // "psk", "psk.", "kl. psk", "kln. psk", "psikolog", "psikolojik danış", "klinik"
  const isIndividual = /(psikolog|psikolojik danış|klinik|psk\.?|kl(n)?\.? ?psk|psk\.? ?dan)/.test(s);
  if (family) return isFamilyCounselor;
  // Bireysel: psikolog / psikolojik danışman / klinik psikolog
  // (saf aile danışmanlarını dışla)
  return isIndividual && !isFamilyCounselor;
};

const calculateDaysUntilPayment = (paymentDay: number): number => {
  const now = new Date();
  const currentDay = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  if (paymentDay >= currentDay) return paymentDay - currentDay;
  return daysInMonth - currentDay + paymentDay;
};

interface SpecialistMetric {
  id: string;
  name: string;
  specialty: string | null;
  city: string | null;
  internal_number: string | null;
  payment_day: number | null;
  online_consultation: boolean;
  face_to_face_consultation: boolean;
  totalReferrals: number;
  lastReferralTs: number | null;
  daysSinceLastReferral: number | null;
  daysUntilPayment: number;
  urgent: boolean; // 20+ gün veya hiç yönlendirme yok
}

// Danışan takvimindeki sıralamayla birebir aynı öncelik mantığı:
// 1) Acil (acil yönlendirme gerekli) uzmanlar önce
//    -> hiç yönlendirme yapılmamışlar en üstte, sonra en uzun süredir
//       yönlendirme yapılmamışlar
// 2) Acil olmayanlar: en az yönlendirme yapılmış -> en çok yapılmış
const priorityCompare = (a: SpecialistMetric, b: SpecialistMetric): number => {
  if (a.urgent !== b.urgent) return a.urgent ? -1 : 1;
  if (a.urgent) {
    const aNever = a.daysSinceLastReferral === null;
    const bNever = b.daysSinceLastReferral === null;
    if (aNever !== bNever) return aNever ? -1 : 1;
    if (aNever && bNever) return a.daysUntilPayment - b.daysUntilPayment;
    return (b.daysSinceLastReferral as number) - (a.daysSinceLastReferral as number);
  }
  // Acil olmayanlar: en az yönlendirme yapılmıştan en çok yapılmışa
  if (a.totalReferrals !== b.totalReferrals) return a.totalReferrals - b.totalReferrals;
  return (a.lastReferralTs ?? 0) - (b.lastReferralTs ?? 0);
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // boş body kabul
    }

    // TEST modu: varsayılan true. false yapılsa bile arama henüz tamamen
    // devre dışı (callsEnabled). Kullanıcı "hiçbir arama yapma" dedi.
    const dryRun = body.dry_run !== false;
    const limit = Math.min(Number(body.limit) || 50, 200);

    // 1) Yeni gelen danışanları çek
    let leadQuery = supabase
      .from("danisan_basvurulari")
      .select("id, full_name, phone, consultation_type, therapy_type, status, call_attempts")
      .eq("status", "new")
      .order("lead_date", { ascending: true });

    if (body.lead_id) leadQuery = leadQuery.eq("id", body.lead_id);

    const { data: leads, error: leadsError } = await leadQuery.limit(limit);
    if (leadsError) throw new Error(`Danışanlar alınamadı: ${leadsError.message}`);

    // 2) Aktif uzmanları ve yönlendirme metriklerini çek
    const { data: specialists, error: specError } = await supabase
      .from("specialists")
      .select(
        "id, name, specialty, city, internal_number, payment_day, online_consultation, face_to_face_consultation, is_active",
      )
      .eq("is_active", true);
    if (specError) throw new Error(`Uzmanlar alınamadı: ${specError.message}`);

    // Son 3 ayın yönlendirmeleri (takvim ile aynı pencere)
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    const { data: referrals, error: refError } = await supabase
      .from("client_referrals")
      .select("specialist_id, referred_at, is_referred, referral_count")
      .eq("is_referred", true)
      .gte("referred_at", threeMonthsAgo.toISOString());
    if (refError) throw new Error(`Yönlendirmeler alınamadı: ${refError.message}`);

    const now = Date.now();
    const metricMap = new Map<string, SpecialistMetric>();

    for (const s of specialists || []) {
      // "Faydalı Bilgiler" test üyeliğini atla
      if (s.name?.trim() === "Faydalı Bilgiler" || String(s.internal_number || "").trim() === "0000") {
        continue;
      }
      metricMap.set(s.id, {
        id: s.id,
        name: s.name,
        specialty: s.specialty,
        city: s.city,
        internal_number: s.internal_number,
        payment_day: s.payment_day,
        online_consultation: !!s.online_consultation,
        face_to_face_consultation: !!s.face_to_face_consultation,
        totalReferrals: 0,
        lastReferralTs: null,
        daysSinceLastReferral: null,
        daysUntilPayment: calculateDaysUntilPayment(s.payment_day || 1),
        urgent: true,
      });
    }

    for (const r of referrals || []) {
      const m = metricMap.get(r.specialist_id);
      if (!m) continue;
      m.totalReferrals += r.referral_count || 1;
      if (r.referred_at) {
        const ts = new Date(r.referred_at).getTime();
        if (m.lastReferralTs === null || ts > m.lastReferralTs) m.lastReferralTs = ts;
      }
    }

    for (const m of metricMap.values()) {
      if (m.lastReferralTs !== null) {
        m.daysSinceLastReferral = Math.floor((now - m.lastReferralTs) / (1000 * 60 * 60 * 24));
        m.urgent = m.daysSinceLastReferral >= 20;
      } else {
        m.daysSinceLastReferral = null;
        m.urgent = true; // hiç yönlendirme yapılmamış = acil
      }
    }

    const allMetrics = Array.from(metricMap.values());

    // Bir danışan için uygun uzmanları öncelik sırasına göre döndürür
    const candidatesFor = (
      family: boolean,
      online: boolean,
      city: string | null,
    ): SpecialistMetric[] => {
      return allMetrics
        .filter((m) => specialistMatchesCategory(m.specialty, m.name, family))
        .filter((m) => (online ? m.online_consultation : m.face_to_face_consultation))
        .filter((m) => {
          if (online) return true;
          // Yüz yüze: şehir eşleşmesi (şehir verildiyse)
          if (!city) return true;
          return normalize(m.city).includes(normalize(city)) || normalize(city).includes(normalize(m.city));
        })
        .sort(priorityCompare);
    };

    const buildTts = (clientName: string, family: boolean, online: boolean) => {
      const first = (clientName || "").trim().split(" ")[0] || "";
      const title = family ? "Aile Danışmanı" : "Psikolog";
      const mode = online ? "online" : "yüz yüze";
      return (
        `Merhaba ${first}, Doktorum Ol'dan ulaşıyoruz size. ` +
        `${title} ile ${mode} görüşme sağlamak için formunuz tarafımıza ulaştı. ` +
        `Sizi uzman ile görüşmeniz için yönlendireceğiz. ` +
        `Seans ücreti ve planlama detaylarını uzmanımızdan öğrenebilirsiniz.`
      );
    };

    // 3) Her danışan için plan oluştur
    const plan = (leads || []).map((lead: any) => {
      const family = isFamilyTherapy(lead.therapy_type);
      const online = normalize(lead.consultation_type) === "online";

      if (online) {
        const candidates = candidatesFor(family, true, null);
        const target = candidates[0] || null;
        return {
          lead_id: lead.id,
          full_name: lead.full_name,
          phone: lead.phone,
          consultation_type: "online",
          therapy_label: therapyLabel(lead.therapy_type),
          category: family ? "Aile Danışmanı" : "Psikolog / Psikolojik Danışman / Klinik Psikolog",
          needs_city_prompt: false,
          target: target
            ? {
                specialist_id: target.id,
                specialist_name: target.name,
                specialty: target.specialty,
                internal_number: target.internal_number,
                urgent: target.urgent,
                days_since_last_referral: target.daysSinceLastReferral,
                total_referrals: target.totalReferrals,
                transfer_dial: `*1${target.internal_number || ""}`,
              }
            : null,
          tts_text: target ? buildTts(lead.full_name, lead.therapy_type, target.name) : null,
          candidate_count: candidates.length,
          note: target ? null : "Uygun uzman bulunamadı",
        };
      }

      // Yüz yüze: şehir telefonda sorulacak. Plan, şehir bazında aday listesini içerir.
      const f2fCandidates = candidatesFor(family, false, null);
      const byCity: Record<string, any[]> = {};
      for (const c of f2fCandidates) {
        const key = (c.city || "Bilinmiyor").trim();
        if (!byCity[key]) byCity[key] = [];
        byCity[key].push({
          specialist_id: c.id,
          specialist_name: c.name,
          internal_number: c.internal_number,
          urgent: c.urgent,
          total_referrals: c.totalReferrals,
          transfer_dial: `*1${c.internal_number || ""}`,
        });
      }

      // ŞEHİRDE YÜZ YÜZE UZMAN YOKSA: online danışmanlık teklif edilir.
      // Danışan "evet" (1) derse online danışmanlık veren öncelikli uzmana
      // aktarılır; "hayır" (2) derse teşekkür edilip telefon kapatılır.
      const onlineCandidates = candidatesFor(family, true, null);
      const onlineTarget = onlineCandidates[0] || null;
      const noCityFallbackText =
        "Maalesef bu şehirde şu an yüz yüze danışmanlık veren bir uzmanımız bulunmuyor. " +
        "Ancak uzmanlarımızdan online olarak da danışmanlık alabilirsiniz; üstelik bu sizin için " +
        "hem çok daha konforlu hem de çok daha pratik olacaktır. " +
        "Online danışmanlık için sizi bir uzmanımıza aktarmamızı ister misiniz? " +
        "Evet için bir tuşuna, hayır için iki tuşuna basınız.";

      return {
        lead_id: lead.id,
        full_name: lead.full_name,
        phone: lead.phone,
        consultation_type: "face_to_face",
        therapy_label: therapyLabel(lead.therapy_type),
        category: family ? "Aile Danışmanı" : "Psikolog / Psikolojik Danışman / Klinik Psikolog",
        needs_city_prompt: true,
        city_prompt_text:
          "Hangi şehirde yüz yüze danışmanlık almak istediğinizi söyler misiniz?",
        candidates_by_city: byCity,
        candidate_count: f2fCandidates.length,
        // Söylenen şehirde uygun uzman yoksa kullanılacak online geçiş akışı:
        no_city_fallback: {
          tts_text: noCityFallbackText,
          // 1 = evet -> online uzmana aktar, 2 = hayır -> teşekkür + kapat
          digit2_text: "Anlayışınız için teşekkür ederiz, iyi günler dileriz.",
          online_target: onlineTarget
            ? {
                specialist_id: onlineTarget.id,
                specialist_name: onlineTarget.name,
                specialty: onlineTarget.specialty,
                internal_number: onlineTarget.internal_number,
                transfer_dial: `*1${onlineTarget.internal_number || ""}`,
              }
            : null,
          online_candidate_count: onlineCandidates.length,
        },
        note: "Yüz yüze: arama sırasında şehir sorulur, söylenen şehre göre öncelikli uzmana *1 + dahili ile aktarılır. O şehirde uzman yoksa online danışmanlık teklif edilir; danışan kabul ederse online uzmana aktarılır.",
      };
    });

    if (!dryRun) {
      // Canlı arama henüz devre dışı (kullanıcı talebi: test aşaması).
      return new Response(
        JSON.stringify({
          success: false,
          error: "Canlı arama devre dışı (test aşaması). dry_run=true ile plan alın.",
          plan_count: plan.length,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        dry_run: true,
        new_lead_count: plan.length,
        active_specialist_count: allMetrics.length,
        plan,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    console.error("auto-call-router error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
