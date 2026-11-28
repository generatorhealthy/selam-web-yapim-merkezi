export const BLOG_CATEGORIES = ["Psikoloji", "Aile & İlişkiler", "Beslenme", "Kadın Sağlığı", "Sağlık Rehberi"] as const;
export type BlogCategory = (typeof BLOG_CATEGORIES)[number];

const RULES: [BlogCategory, RegExp][] = [
  ["Beslenme", /diyet|beslen|kilo|obez|vitamin|gıda|besin|kalori|diyetisyen/],
  ["Kadın Sağlığı", /kadın|gebelik|hamile|doğum|jinekolo|menopoz|adet|regl|yumurtlama|lohusa/],
  ["Aile & İlişkiler", /aile|çift|evlilik|ilişki|ebeveyn|boşanma|partner|eş |ergen|çocuk/],
  ["Psikoloji", /psiko|(?<!fizyo)terapi|kaygı|anksiyete|depres|stres|travma|duygu|panik|obsesif|dikkat|zihin/],
];

/** Yazının kategorisi başlık ve etiketlerinden çıkarılır; eşleşme yoksa Sağlık Rehberi. */
export function blogCategoryOf(title: string, tags?: string[] | null): BlogCategory {
  const text = `${title} ${(tags || []).join(" ")}`.toLocaleLowerCase("tr-TR");
  for (const [cat, re] of RULES) if (re.test(text)) return cat;
  return "Sağlık Rehberi";
}
