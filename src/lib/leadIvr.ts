// Mirrors supabase/functions/_shared/leadIvr.ts for display.
export function expertsForTherapy(raw: string | null | undefined): string {
  const s = (raw || "").toLocaleLowerCase("tr-TR");
  if (s.includes("çift") || s.includes("cift") || s.includes("aile") || s.includes("ilişki") || s.includes("iliski")) return "Aile Danışmanı";
  return "Psikolog, Psikolojik Danışman, Klinik Psikolog";
}
