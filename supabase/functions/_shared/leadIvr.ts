// Shared rules for the "Açmayanlar" bulk IVR call (press 1 / press 2).
export type AreaKey = "bireysel" | "cocuk" | "cift" | "aile" | "iliski";

export const AREA_LABELS: Record<AreaKey, string> = {
  bireysel: "Bireysel Terapi",
  cocuk: "Çocuk Terapisi",
  cift: "Çift Terapisi",
  aile: "Aile Danışmanlığı",
  iliski: "İlişki Danışmanlığı",
};

export const AREA_EXPERTS: Record<AreaKey, string> = {
  bireysel: "Psikolog, Psikolojik Danışman, Klinik Psikolog",
  cocuk: "Psikolog, Psikolojik Danışman, Klinik Psikolog",
  cift: "Aile Danışmanı",
  aile: "Aile Danışmanı",
  iliski: "Aile Danışmanı",
};

export function areaFromTherapy(raw: string | null | undefined): AreaKey {
  const s = (raw || "").toLocaleLowerCase("tr-TR").replace(/_/g, " ");
  if (s.includes("çocuk") || s.includes("cocuk")) return "cocuk";
  if (s.includes("çift") || s.includes("cift")) return "cift";
  if (s.includes("aile")) return "aile";
  if (s.includes("ilişki") || s.includes("iliski")) return "iliski";
  return "bireysel";
}

export function areaMessage(area: AreaKey): string {
  return `Merhaba, ${AREA_LABELS[area]} için Doktorum Ol'a başvurmuşsunuz. Sizi en kısa süre içinde tekrar arayıp uzmanımıza aktaracağız. Aranmak istiyorsanız bir'i, aranmak istemiyorsanız iki'yi tuşlayın.`;
}

export const REPLY_1 = "Teşekkür ederiz, en kısa sürede sizi arayacağız. İyi günler dileriz.";
export const REPLY_2 = "Teşekkür ederiz, talebiniz kaydedildi. İyi günler dileriz.";

// Turkish mobile → 90XXXXXXXXXX, otherwise null.
export function normalizeMobile(phone: string | null | undefined): string | null {
  let d = (phone || "").replace(/\D/g, "");
  if (d.startsWith("90")) d = d.slice(2);
  else if (d.startsWith("0")) d = d.slice(1);
  if (d.length !== 10 || !d.startsWith("5")) return null;
  return "90" + d;
}

// Verimor webhook digit → lead status, or null (keep in Açmayanlar).
export function statusFromDigit(digit: string | null | undefined): "ivr_pressed_1" | "ivr_pressed_2" | null {
  if (digit === "1") return "ivr_pressed_1";
  if (digit === "2") return "ivr_pressed_2";
  return null;
}
