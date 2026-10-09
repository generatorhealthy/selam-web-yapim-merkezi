// Şehir + branş ve online açılış sayfaları için ortak kurallar.
// Hem uygulama (SpecialtyRoute) hem scripts/prerender-blog.mjs bunu kullanır; adresler birebir aynı kalsın diye tek kaynak.

const TR = { ğ: "g", Ğ: "G", ü: "u", Ü: "U", ş: "s", Ş: "S", ı: "i", I: "I", İ: "i", ö: "o", Ö: "O", ç: "c", Ç: "C" };
export const slugifyTr = (s = "") =>
  String(s)
    .replace(/[ğĞüÜşŞıIİöÖçÇ]/g, (c) => TR[c])
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

/** Sayfa açılan branş grupları. */
export const LOCAL_BRANCHES = [
  {
    slug: "klinik-psikolog",
    name: "Klinik Psikolog",
    match: (l) => l.includes("klinik psikolog"),
    about:
      "Klinik psikologlar; kaygı, depresif belirtiler, travma sonrası zorlanmalar ve uzun süredir devam eden duygusal sorunlarda psikolojik değerlendirme ve terapi desteği sunar. İlaç yazmazlar; ilaç gerekebilecek durumlarda psikiyatri hekimiyle birlikte çalışılması önerilir.",
  },
  {
    slug: "psikolojik-danismanlik",
    name: "Psikolojik Danışman",
    match: (l) => l.includes("psikolojik dan"),
    about:
      "Psikolojik danışmanlar; stres, sınav ve iş kaygısı, ilişki sorunları, karar verme güçlükleri ve kişisel gelişim konularında görüşmeler yoluyla destek verir.",
  },
  {
    slug: "psikolog",
    name: "Psikolog",
    match: (l) => l.includes("psikolog") && !l.includes("klinik"),
    about:
      "Psikologlar; kaygı, stres, özgüven, ilişki ve uyum sorunları gibi konularda görüşmeler ve terapi yöntemleriyle destek sunar. Görüşmeler online ya da yüz yüze yapılabilir.",
  },
  {
    slug: "aile-danismani",
    name: "Aile Danışmanı",
    match: (l) => l.includes("aile") || l.includes("ilişki") || l.includes("evlilik"),
    about:
      "Aile danışmanları; evlilik ve çift ilişkisi sorunları, iletişim güçlükleri, boşanma süreci, ebeveynlik ve aile içi çatışmalarda bireylere, çiftlere ve ailelere destek verir.",
  },
];

export const branchOf = (specialty) => {
  const l = String(specialty || "").toLocaleLowerCase("tr");
  return LOCAL_BRANCHES.find((b) => b.match(l)) || null;
};

const CITY_ALIAS = { gebze: "Kocaeli", izmit: "Kocaeli", darica: "Kocaeli" };
/** "İstanbul Kadıköy", "İSTANBUL", "Gebze / Darıca" → il adı ve slug'ı */
export const cityOf = (raw) => {
  const first = String(raw || "").trim().split(/[\s/,\-]+/)[0];
  if (!first) return null;
  const slug = slugifyTr(first);
  if (!slug) return null;
  const name = CITY_ALIAS[slug] || first.toLocaleLowerCase("tr").replace(/^./, (c) => c.toLocaleUpperCase("tr"));
  return { slug: slugifyTr(name), name };
};

const isTrue = (v) => v === true || v === "true" || v === "True";

/**
 * Uzman listesinden açılacak sayfaları üretir (yalnız gerçekten uzmanı olanlar).
 * slug biçimi: "<sehir>-<brans>" (istanbul-psikolog) veya "online-<brans>".
 */
export function buildLocalPages(specialists) {
  const pages = new Map();
  const add = (slug, data, s) => {
    if (!pages.has(slug)) pages.set(slug, { slug, ...data, list: [] });
    pages.get(slug).list.push(s);
  };
  for (const s of specialists || []) {
    const b = branchOf(s.specialty);
    if (!b) continue;
    const c = cityOf(s.city);
    if (c) add(`${c.slug}-${b.slug}`, { kind: "city", branch: b, city: c }, s);
    if (isTrue(s.online_consultation)) add(`online-${b.slug}`, { kind: "online", branch: b, city: null }, s);
  }
  return [...pages.values()];
}

/** Bir adres yerel sayfa mı? (uzman verisi olmadan biçim kontrolü) */
export function parseLocalSlug(slug) {
  const s = String(slug || "");
  if (LOCAL_BRANCHES.some((x) => x.slug === s)) return null; // "klinik-psikolog" bir branş sayfasıdır, şehir değil
  const b = [...LOCAL_BRANCHES].sort((x, y) => y.slug.length - x.slug.length).find((x) => s.endsWith(`-${x.slug}`));
  if (!b) return null;
  const prefix = s.slice(0, -(b.slug.length + 1));
  if (!/^[a-z]+$/.test(prefix)) return null;
  return { kind: prefix === "online" ? "online" : "city", branch: b, citySlug: prefix === "online" ? null : prefix };
}

export const localTitle = (p) =>
  p.kind === "online"
    ? `Online ${p.branch.name} - Görüntülü Görüşme Randevusu | Doktorum Ol`
    : `${p.city.name} ${p.branch.name} - Online ve Yüz Yüze Randevu | Doktorum Ol`;

export const localHeading = (p) => (p.kind === "online" ? `Online ${p.branch.name}` : `${p.city.name} ${p.branch.name}`);

export const localDescription = (p) => {
  const n = p.list.length;
  return p.kind === "online"
    ? `Online görüşme yapan ${n} ${p.branch.name.toLocaleLowerCase("tr")} profilini inceleyin. Bulunduğunuz yerden görüntülü görüşmeyle randevu alın.`
    : `${p.city.name} şehrindeki ${n} ${p.branch.name.toLocaleLowerCase("tr")} profilini inceleyin, uzmanlık alanlarını karşılaştırın ve online ya da yüz yüze randevu alın.`;
};

/** Sayfaya özgü sık sorulan sorular — yalnız platformda doğru olan genel bilgiler. */
export const localFaq = (p) => {
  const b = p.branch.name.toLocaleLowerCase("tr");
  const where = p.kind === "online" ? "online" : `${p.city.name} şehrinde`;
  return [
    [`${where === "online" ? "Online" : p.city.name} ${b} randevusu nasıl alınır?`, `Listeden uzmanın profilini açın, uzmanlık alanlarını ve görüşme seçeneklerini inceleyin, ardından profildeki randevu adımlarıyla talebinizi iletin.`],
    [`${p.branch.name} ile online görüşme mümkün mü?`, `Profilinde "Online" yazan uzmanlarla görüntülü görüşme yapılabilir. Online görüşme için sessiz bir ortam ve internet bağlantısı yeterlidir.`],
    [`Hangi ${b} bana uygun?`, `Uzmanların profillerindeki çalıştıkları konuları ve yaklaşımlarını karşılaştırın. İlk görüşmede beklentilerinizi paylaşmanız, uygun uzmanı belirlemenize yardımcı olur.`],
    [`Acil bir durumda ne yapmalıyım?`, `Kendinize veya başkasına zarar verme düşüncesi gibi acil durumlarda randevu beklemeden 112'yi arayın ya da en yakın acil servise başvurun.`],
  ];
};
