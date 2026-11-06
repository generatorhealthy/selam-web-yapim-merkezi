// Kelime Sıralayıcısı kuralları — sunucu (seo-rank-sync) ve panel aynı kuralları kullanır.

// Google organik sonuçlarında sıraya göre beklenen ortalama tıklama oranı (yaklaşık sektör eğrisi).
export function expectedCtr(position: number): number {
  if (position <= 1.5) return 0.28;
  if (position <= 2.5) return 0.15;
  if (position <= 3.5) return 0.10;
  if (position <= 4.5) return 0.07;
  if (position <= 5.5) return 0.05;
  if (position <= 10.5) return 0.03;
  if (position <= 20.5) return 0.01;
  return 0.003;
}

export type PageStat = {
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  topQuery: string | null;
};

export type Issue = { issue: "low_ctr" | "striking_distance" | "title_length" | "missing_description"; severity: "high" | "medium" | "low" };

export function classifyPage(p: PageStat, title: string | null, description: string | null): Issue[] {
  const out: Issue[] = [];
  if (p.impressions >= 300 && p.position <= 20 && p.ctr < expectedCtr(p.position) * 0.5) {
    out.push({ issue: "low_ctr", severity: p.impressions >= 2000 ? "high" : "medium" });
  }
  if (p.impressions >= 200 && p.position > 7.5 && p.position <= 20) {
    out.push({ issue: "striking_distance", severity: p.impressions >= 1000 ? "high" : "medium" });
  }
  const t = (title || "").trim();
  if (t && (t.length > 65 || t.length < 25)) out.push({ issue: "title_length", severity: "low" });
  if (!description || description.trim().length < 70) out.push({ issue: "missing_description", severity: p.impressions >= 500 ? "medium" : "low" });
  return out;
}

// Tıklamayı "beklenen tıklama oranına" çıkarırsak kazanılacak ek tıklama tahmini.
export function clickPotential(p: PageStat): number {
  const target = Math.max(expectedCtr(Math.min(p.position, 3)), p.ctr);
  return Math.max(0, Math.round(p.impressions * target - p.clicks));
}

// Sayfa adresini düzenlenebilir içerik türüne eşler.
export function pageTarget(url: string): { type: "blog" | "specialist" | "other"; slug: string | null } {
  let path: string;
  try { path = new URL(url).pathname; } catch { path = url; }
  const parts = path.split("/").filter(Boolean);
  if (parts[0] === "blog" && parts.length === 2) return { type: "blog", slug: decodeURIComponent(parts[1]) };
  const reserved = new Set(["blog", "uzmanlik", "uzmanlar", "divan_paneli", "kayit-ol", "doktor-paneli", "pre"]);
  if (parts.length === 2 && !reserved.has(parts[0])) return { type: "specialist", slug: decodeURIComponent(parts[1]) };
  return { type: "other", slug: null };
}
