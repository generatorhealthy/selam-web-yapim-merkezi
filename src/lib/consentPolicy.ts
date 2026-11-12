// KVKK izin türleri ve sağlık verisi toplama kapısı.
// Aydınlatma gösterimi rıza değildir; her izin ayrı ve varsayılan olarak kapalıdır.
export type ConsentPurpose =
  | "health_test"        // psikolojik testte özel nitelikli veri (m.6)
  | "health_appointment" // randevu/başvuruda sağlık açıklaması (m.6)
  | "marketing_etk"      // ticari elektronik ileti (6563)
  | "ads_analytics";     // zorunlu olmayan reklam/analitik

export const CONSENT_PURPOSES: ConsentPurpose[] = [
  "health_test", "health_appointment", "marketing_etk", "ads_analytics",
];

export interface ConsentState {
  disclosureShown: boolean;
  granted: Partial<Record<ConsentPurpose, boolean>>;
}

export const emptyConsent = (): ConsentState => ({ disclosureShown: false, granted: {} });

/** Test cevapları yalnız aydınlatma gösterildi VE ayrı sağlık rızası verildiyse gönderilebilir. */
export function canSubmitHealthTest(s: ConsentState): boolean {
  return s.disclosureShown && s.granted.health_test === true;
}

/** Randevu her zaman genel bilgilerle alınabilir; sağlık açıklaması yalnız rızayla gönderilir. */
export function buildAppointmentPayload<T extends Record<string, unknown>>(
  base: T,
  healthNote: string | null | undefined,
  s: ConsentState,
): T & { notes: string | null } {
  const allowed = s.disclosureShown && s.granted.health_appointment === true;
  const note = allowed && healthNote && healthNote.trim() ? healthNote.trim() : null;
  return { ...base, notes: note };
}

/** Bir izin diğerini asla kapsamaz (paket rıza yok). */
export function isGranted(s: ConsentState, p: ConsentPurpose): boolean {
  return s.granted[p] === true;
}
