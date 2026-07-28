// Uzman seçim motoru — Danışan Takvimi ile birebir aynı öncelik mantığı.
// (auto-call-router içindeki mantığın paylaşılan sürümü)

// Aile Danışmanlarına yönlendirilecek talepler:
//   İlişki Danışmanlığı, Aile Danışmanlığı / Aile Terapisi, Çift Terapisi
// Psikolog / Psikolojik Danışman / Klinik Psikologlara yönlendirilecekler:
//   Bireysel Terapi, Çocuk Terapisi, Ergen Terapisi (aşağıdaki listede yer almayan her şey)
export const FAMILY_THERAPIES = [
  "aile_terapisi",
  "aile_danismanligi",
  "aile_danışmanlığı",
  "iliski_danismanligi",
  "ilişki_danışmanlığı",
  "cift_terapisi",
  "çift_terapisi",
  "cift_danismanligi",
  "çift_danışmanlığı",
];

export const THERAPY_LABELS: Record<string, string> = {
  bireysel_terapi: "Bireysel Terapi",
  cift_terapisi: "Çift Terapisi",
  "çift_terapisi": "Çift Terapisi",
  aile_terapisi: "Aile Terapisi",
  aile_danismanligi: "Aile Danışmanlığı",
  "aile_danışmanlığı": "Aile Danışmanlığı",
  iliski_danismanligi: "İlişki Danışmanlığı",
  "ilişki_danışmanlığı": "İlişki Danışmanlığı",
  cocuk_terapisi: "Çocuk Terapisi",
  "çocuk_terapisi": "Çocuk Terapisi",
  ergen_terapisi: "Ergen Terapisi",
};

// Danışan takviminde gizlenen / yönlendirme istemeyen uzmanlar
export const EXCLUDED_INTERNAL_NUMBERS = ["0000", "1155"];

export const normalize = (s: string | null | undefined) =>
  (s || "").toLocaleLowerCase("tr-TR").trim();

export const therapyLabel = (raw: string | null) => {
  if (!raw) return "danışmanlık";
  return THERAPY_LABELS[normalize(raw)] || raw.replace(/_/g, " ");
};

export const isFamilyTherapy = (therapy: string | null) =>
  FAMILY_THERAPIES.includes(normalize(therapy));

export const specialistMatchesCategory = (
  specialty: string | null,
  name: string | null,
  family: boolean,
): boolean => {
  const s = `${normalize(specialty)} ${normalize(name)}`;
  const isFamilyCounselor = /aile danış|aile dan\.?\b/.test(s);
  const isIndividual =
    /(psikolog|psikolojik danış|klinik|psk\.?|kl(n)?\.? ?psk|psk\.? ?dan)/.test(s);
  if (family) return isFamilyCounselor;
  return isIndividual && !isFamilyCounselor;
};

export interface SpecialistMetric {
  id: string;
  name: string;
  specialty: string | null;
  city: string | null;
  internal_number: string | null;
  online_consultation: boolean;
  face_to_face_consultation: boolean;
  totalReferrals: number;
  lastReferralTs: number | null;
  daysSinceLastReferral: number | null;
  urgent: boolean;
}

export const priorityCompare = (a: SpecialistMetric, b: SpecialistMetric): number => {
  if (a.urgent !== b.urgent) return a.urgent ? -1 : 1;
  if (a.urgent) {
    const aNever = a.daysSinceLastReferral === null;
    const bNever = b.daysSinceLastReferral === null;
    if (aNever !== bNever) return aNever ? -1 : 1;
    if (aNever && bNever) return a.totalReferrals - b.totalReferrals;
    return (b.daysSinceLastReferral as number) - (a.daysSinceLastReferral as number);
  }
  if (a.totalReferrals !== b.totalReferrals) return a.totalReferrals - b.totalReferrals;
  return (a.lastReferralTs ?? 0) - (b.lastReferralTs ?? 0);
};

// deno-lint-ignore no-explicit-any
export async function loadSpecialistMetrics(supabase: any): Promise<SpecialistMetric[]> {
  const { data: specialists, error: specError } = await supabase
    .from("specialists")
    .select(
      "id, name, specialty, city, internal_number, online_consultation, face_to_face_consultation, is_active",
    )
    .eq("is_active", true);
  if (specError) throw new Error(`Uzmanlar alınamadı: ${specError.message}`);

  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  const { data: referrals, error: refError } = await supabase
    .from("client_referrals")
    .select("specialist_id, referred_at, is_referred, referral_count")
    .eq("is_referred", true)
    .gte("referred_at", threeMonthsAgo.toISOString());
  if (refError) throw new Error(`Yönlendirmeler alınamadı: ${refError.message}`);

  const now = Date.now();
  const map = new Map<string, SpecialistMetric>();

  for (const s of specialists || []) {
    const internal = String(s.internal_number || "").trim();
    if (s.name?.trim() === "Faydalı Bilgiler" || EXCLUDED_INTERNAL_NUMBERS.includes(internal)) {
      continue;
    }
    if (!internal) continue; // dahilisi olmayana aktarım yapılamaz
    map.set(s.id, {
      id: s.id,
      name: s.name,
      specialty: s.specialty,
      city: s.city,
      internal_number: internal,
      online_consultation: !!s.online_consultation,
      face_to_face_consultation: !!s.face_to_face_consultation,
      totalReferrals: 0,
      lastReferralTs: null,
      daysSinceLastReferral: null,
      urgent: true,
    });
  }

  for (const r of referrals || []) {
    const m = map.get(r.specialist_id);
    if (!m) continue;
    m.totalReferrals += r.referral_count || 1;
    if (r.referred_at) {
      const ts = new Date(r.referred_at).getTime();
      if (m.lastReferralTs === null || ts > m.lastReferralTs) m.lastReferralTs = ts;
    }
  }

  for (const m of map.values()) {
    if (m.lastReferralTs !== null) {
      m.daysSinceLastReferral = Math.floor((now - m.lastReferralTs) / 86400000);
      m.urgent = m.daysSinceLastReferral >= 20;
    } else {
      m.daysSinceLastReferral = null;
      m.urgent = true;
    }
  }

  return Array.from(map.values());
}

export function candidatesFor(
  all: SpecialistMetric[],
  family: boolean,
  online: boolean,
  city: string | null,
): SpecialistMetric[] {
  return all
    .filter((m) => specialistMatchesCategory(m.specialty, m.name, family))
    .filter((m) => (online ? m.online_consultation : m.face_to_face_consultation))
    .filter((m) => {
      if (online || !city) return true;
      const a = normalize(m.city);
      const b = normalize(city);
      return !!a && !!b && (a.includes(b) || b.includes(a));
    })
    .sort(priorityCompare);
}
