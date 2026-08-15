// ============================================================================
// WhatsApp Danışan Yönlendirme Botu — Uzman Eşleştirme Motoru
// ----------------------------------------------------------------------------
// Kurallar (Danışan Takvimi mantığıyla birebir aynı):
//  1) Başvuru türü -> uzman branşı filtresi
//       Bireysel Terapi / Çocuk Terapisi / Ergen Terapisi / İlişki Danışmanlığı
//         -> Psikolog, Psikolojik Danışman, Klinik Psikolog
//       Aile Danışmanlığı / Aile Terapisi / Çift Terapisi
//         -> Aile Danışmanı
//  2) Görüşme şekli filtresi (online / yüz yüze)
//  3) Şehir filtresi (yalnızca yüz yüze)
//  4) Uzman aktif olmalı, gizlenen/test kayıtları hariç
//  5) Acil yönlendirme gerekli uzmanlar (X gündür yönlendirme almayan veya hiç
//     almamış) önce
//  6) Acil yoksa: bu ay en az yönlendirme alan uygun uzman
// Sistem ASLA platform dışından uzman aramaz; yalnızca kayıtlı uzmanlar.
// ============================================================================

export const HIDDEN_INTERNAL_NUMBERS = ["0000", "111111111111", "1155"];
export const HIDDEN_NAMES = ["Faydalı Bilgiler"];

export const THERAPY_LABELS: Record<string, string> = {
  bireysel_terapi: "Bireysel Terapi",
  cocuk_terapisi: "Çocuk Terapisi",
  "çocuk_terapisi": "Çocuk Terapisi",
  ergen_terapisi: "Ergen Terapisi",
  iliski_danismanligi: "İlişki Danışmanlığı",
  "ilişki_danışmanlığı": "İlişki Danışmanlığı",
  cift_terapisi: "Çift Terapisi",
  "çift_terapisi": "Çift Terapisi",
  aile_danismanligi: "Aile Danışmanlığı",
  "aile_danışmanlığı": "Aile Danışmanlığı",
  aile_terapisi: "Aile Terapisi",
};

export type SpecialistGroup = "psikoloji" | "aile_danismani";

export const normalize = (s?: string | null) =>
  (s || "").toLocaleLowerCase("tr-TR").trim();

const deTr = (s: string) =>
  s
    .replace(/ı/g, "i")
    .replace(/İ/g, "i")
    .replace(/ş/g, "s")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c");

export const therapyKey = (raw?: string | null) =>
  normalize(raw).replace(/[\s-]+/g, "_");

export const therapyLabel = (raw?: string | null) => {
  if (!raw) return "danışmanlık";
  return THERAPY_LABELS[therapyKey(raw)] || String(raw).replace(/_/g, " ");
};

// Başvuru türünden hedef uzman grubunu belirle.
export function groupForTherapy(therapy?: string | null): SpecialistGroup {
  const k = deTr(therapyKey(therapy));
  // Aile Danışmanlığı / Aile Terapisi / Çift Terapisi -> aile danışmanı
  if (/(aile|cift)/.test(k)) return "aile_danismani";
  // Bireysel / Çocuk / Ergen / İlişki -> psikoloji grubu
  return "psikoloji";
}

// Uzmanın branşı, hedef gruba uygun mu?
// Bazı uzmanların unvanı sadece isimlerinde kısaltma olarak geçer:
//   "Psk." psikolog, "Kl./Kln. Psk." klinik psikolog,
//   "Psk. Dan." psikolojik danışman, "Aile Dan." aile danışmanı
export function specialistInGroup(
  specialty: string | null | undefined,
  name: string | null | undefined,
  group: SpecialistGroup,
): boolean {
  const s = deTr(`${normalize(specialty)} ${normalize(name)}`);
  const isFamilyCounselor = /aile danis|aile dan\.?/.test(s);
  const isPsychology =
    /(psikolog|psikolojik danis|klinik|psk\.?|kl(n)?\.? ?psk|psk\.? ?dan)/.test(s);
  if (group === "aile_danismani") return isFamilyCounselor;
  return isPsychology && !isFamilyCounselor;
}

export interface Candidate {
  id: string;
  name: string;
  specialty: string | null;
  city: string | null;
  internal_number: string | null;
  online_consultation: boolean;
  face_to_face_consultation: boolean;
  monthlyReferrals: number;
  totalReferrals: number;
  lastReferralAt: string | null;
  daysSinceLastReferral: number | null;
  urgent: boolean;
}

export interface MatchInput {
  therapyType?: string | null;
  online: boolean;
  city?: string | null;
  urgentDays?: number;
}

export interface MatchResult {
  group: SpecialistGroup;
  groupLabel: string;
  therapyLabel: string;
  mode: "online" | "yuz_yuze";
  city: string | null;
  totalInGroup: number;
  eligibleCount: number;
  urgentCount: number;
  selected: Candidate | null;
  selectionReason: string | null;
  reasonCode: "urgent" | "least_monthly" | "none" | null;
  eligible: Candidate[];
}

export const groupLabel = (g: SpecialistGroup) =>
  g === "aile_danismani" ? "Aile Danışmanı" : "Psikolog / Psikolojik Danışman / Klinik Psikolog";

const cityMatches = (specialistCity?: string | null, wanted?: string | null) => {
  const a = deTr(normalize(specialistCity));
  const b = deTr(normalize(wanted));
  if (!a || !b) return false;
  return a === b || a.includes(b) || b.includes(a);
};

// deno-lint-ignore no-explicit-any
export async function loadCandidates(supabase: any, urgentDays = 20): Promise<Candidate[]> {
  const { data: specialists, error } = await supabase
    .from("specialists")
    .select(
      "id, name, specialty, city, internal_number, online_consultation, face_to_face_consultation, is_active",
    )
    .eq("is_active", true);
  if (error) throw new Error(`Uzmanlar alınamadı: ${error.message}`);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);

  const { data: referrals, error: refError } = await supabase
    .from("client_referrals")
    .select("specialist_id, referred_at, referral_count, is_referred")
    .eq("is_referred", true)
    .gte("referred_at", sixMonthsAgo.toISOString());
  if (refError) throw new Error(`Yönlendirmeler alınamadı: ${refError.message}`);

  const map = new Map<string, Candidate>();
  for (const s of specialists || []) {
    const internal = String(s.internal_number || "").trim();
    if (HIDDEN_NAMES.includes(String(s.name || "").trim())) continue;
    if (HIDDEN_INTERNAL_NUMBERS.includes(internal)) continue;
    map.set(s.id, {
      id: s.id,
      name: s.name,
      specialty: s.specialty,
      city: s.city,
      internal_number: internal || null,
      online_consultation: !!s.online_consultation,
      face_to_face_consultation: !!s.face_to_face_consultation,
      monthlyReferrals: 0,
      totalReferrals: 0,
      lastReferralAt: null,
      daysSinceLastReferral: null,
      urgent: true,
    });
  }

  for (const r of referrals || []) {
    const c = map.get(r.specialist_id);
    if (!c) continue;
    const count = r.referral_count || 1;
    c.totalReferrals += count;
    if (!r.referred_at) continue;
    const ts = new Date(r.referred_at);
    if (ts >= monthStart) c.monthlyReferrals += count;
    if (!c.lastReferralAt || ts.getTime() > new Date(c.lastReferralAt).getTime()) {
      c.lastReferralAt = r.referred_at;
    }
  }

  for (const c of map.values()) {
    if (c.lastReferralAt) {
      c.daysSinceLastReferral = Math.floor(
        (now.getTime() - new Date(c.lastReferralAt).getTime()) / 86400000,
      );
      c.urgent = c.daysSinceLastReferral >= urgentDays;
    } else {
      c.daysSinceLastReferral = null;
      c.urgent = true; // hiç yönlendirme almamış -> acil
    }
  }

  return Array.from(map.values());
}

// Acil uzmanlar önce (hiç almamışlar en üstte, sonra en uzun süredir almayanlar),
// ardından bu ay en az yönlendirme alanlar.
export function prioritySort(a: Candidate, b: Candidate): number {
  if (a.urgent !== b.urgent) return a.urgent ? -1 : 1;
  if (a.urgent) {
    const aNever = a.daysSinceLastReferral === null;
    const bNever = b.daysSinceLastReferral === null;
    if (aNever !== bNever) return aNever ? -1 : 1;
    if (aNever && bNever) return a.monthlyReferrals - b.monthlyReferrals;
    return (b.daysSinceLastReferral as number) - (a.daysSinceLastReferral as number);
  }
  if (a.monthlyReferrals !== b.monthlyReferrals) return a.monthlyReferrals - b.monthlyReferrals;
  return (a.totalReferrals || 0) - (b.totalReferrals || 0);
}

export function matchSpecialist(all: Candidate[], input: MatchInput): MatchResult {
  const group = groupForTherapy(input.therapyType);
  const online = input.online;
  const city = input.city?.trim() || null;

  const inGroup = all.filter((c) => specialistInGroup(c.specialty, c.name, group));
  const eligible = inGroup
    .filter((c) => (online ? c.online_consultation : c.face_to_face_consultation))
    .filter((c) => (online ? true : cityMatches(c.city, city)))
    .sort(prioritySort);

  const urgentCount = eligible.filter((c) => c.urgent).length;
  const selected = eligible[0] || null;

  let selectionReason: string | null = null;
  let reasonCode: MatchResult["reasonCode"] = null;

  if (!selected) {
    reasonCode = "none";
    selectionReason = online
      ? "Bu başvuru türüne uygun, online hizmet veren aktif uzman bulunamadı."
      : `${city || "Seçilen şehir"} içinde bu başvuru türüne uygun, yüz yüze hizmet veren aktif uzman bulunamadı.`;
  } else if (selected.urgent) {
    reasonCode = "urgent";
    selectionReason =
      selected.daysSinceLastReferral === null
        ? "Acil yönlendirme: bu uzmana hiç yönlendirme yapılmamış."
        : `Acil yönlendirme: son yönlendirmeden ${selected.daysSinceLastReferral} gün geçmiş.`;
  } else {
    reasonCode = "least_monthly";
    selectionReason = `Acil yönlendirme gereken uygun uzman yok. Bu ay en az yönlendirme alan uygun uzman (${selected.monthlyReferrals} yönlendirme).`;
  }

  return {
    group,
    groupLabel: groupLabel(group),
    therapyLabel: therapyLabel(input.therapyType),
    mode: online ? "online" : "yuz_yuze",
    city,
    totalInGroup: inGroup.length,
    eligibleCount: eligible.length,
    urgentCount,
    selected,
    selectionReason,
    reasonCode,
    eligible: eligible.slice(0, 10),
  };
}
