/**
 * İçerik yazarı etiketi.
 *
 * Yönetici veya personel tarafından yazılan yazılarda veritabanındaki yazar
 * adı ("Editör", "Admin", "Staff Editörü" ...) ziyaretçiye hiç gösterilmez;
 * her zaman markanın ortak yazar adı kullanılır. Uzman yazılarında uzmanın
 * kendi adı korunur.
 *
 * Bu dosya hem React arayüzü hem de scripts/prerender-blog.mjs tarafından
 * kullanılır; böylece tarayıcıya giden HTML ile ekranda görünen ad aynı kalır.
 */
export const EDITOR_LABEL = "İçerik Editörü";

const EDITOR_NAMES = [
  "editor",
  "staff editoru",
  "doktorum ol",
  "admin",
  "icerik editoru",
  "saglik icerik editoru",
  "saglik icerik editorleri",
  "doktorum ol icerik editorleri",
  "doktorum ol saglik icerik editorleri",
];

const FOLD_MAP = {
  "İ": "i", "I": "i", "ı": "i",
  "Ş": "s", "ş": "s",
  "Ç": "c", "ç": "c",
  "Ö": "o", "ö": "o",
  "Ü": "u", "ü": "u",
  "Ğ": "g", "ğ": "g",
  "â": "a", "î": "i", "û": "u",
};

const fold = (s) =>
  String(s == null ? "" : s)
    .replace(/[İIıŞşÇçÖöÜüĞğâîû]/g, (c) => FOLD_MAP[c] || c)
    .toLowerCase()
    .trim();

/** Yazar adı bir editör imzası mı (gerçek kişi adı değil mi)? */
export function isEditorName(name) {
  return EDITOR_NAMES.includes(fold(name));
}

/**
 * Ziyaretçiye gösterilecek yazar adı.
 * Editör imzaları ortak etikete dönüşür, uzman adları aynen kalır.
 */
export function authorDisplayName(name, authorType) {
  const n = String(name == null ? "" : name).trim();
  if (!n || isEditorName(n)) return EDITOR_LABEL;
  if (authorType === "admin" || authorType === "staff" || authorType === "editor") return EDITOR_LABEL;
  return n;
}
