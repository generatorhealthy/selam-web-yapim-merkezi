// Uzman kategorilerine göre önerilen "İlgi Alanları" listeleri.
// Kategori, specialty alanına göre belirlenir.

export const INTERESTS_PSIKOLOG: string[] = [
  "Anksiyete (Kaygı) Bozuklukları","Bağlanma Sorunları","Bilişsel ve Davranışçı Terapi","Bireysel Terapi",
  "Çocuk - Ergen Psikolojisi","Depresyon","EMDR Terapisi","Ergenlik Sorunları ve Sınav Kaygısı",
  "Evlilik (Çift) Danışmanlığı","Evlilik(Çift) Terapisi","İlişki Problemleri","Oyun Terapisi",
  "Öfke Kontrol Bozukluğu","Ölüm Ve Yas","Sınav Kaygısı","Sosyal Fobi","Stres","Travma",
  "Travma Sonrası Stres Bozukluğu","Aile Danışmanlığı","Alt Islatma- Kaka Kaçırma",
  "Boşanma Oryantasyonu ve Evlilik Krizleri","Cinsel danışmanlık","Dikkat Eksikliği",
  "Doğum Öncesi ve Sonrası Süreçler","Duygu Durum Bozuklukları","Ebeveyn Danışmanlığı","Ebeveynlik",
  "Fobiler","İletişim Problemleri","İlişkilerde Gelecek Sürenin Planlanması","İlişkilerde Sadakat / Aldatma",
  "Kardeş kıskançlığı","Klostrofobi (Kapalı alan korkusu)","Kurumsal eğitimler","Manik Depresif Bozukluk",
  "Obsesif Kompulsif Bozukluk","Okul Korkusu","Okula uyum güçlükleri","Özgül Öğrenme Güçlüğü (ÖÖG)",
  "Panik Atak","Şema Terapi","Takıntı","Tırnak yeme ve Parmak Emme","Unutkanlık","Yas Danışmanlığı",
  "Yetişkin Danışmanlığı",
];

export const INTERESTS_PSIKOLOJIK_DANISMAN: string[] = [
  "Depresyon","Sosyal Fobi","Panik Atak","Aile İçi İletişim Sorunları","Stres","Sınav Kaygısı",
  "Özgüven Sorunu (Kendine Güven Sorunu)","Obsesif-Kompulsif Bozukluk","Yaygın Anksiyete Bozukluğu",
  "Anksiyete","Otizm Spektrum Bozukluğu","Otizm","Vajinismus","Davranış Bozuklukları",
  "Okula Uyum Sorunları","Okul Başarısızlığı","Kişilik Bozuklukları","Motivasyon Eksikliği",
  "Erken Boşalma","Unutkanlık","Psikolojik Bozukluk","Vücut (Beden) Disformik Bozukluğu",
  "Somatizasyon Bozukluğu","Agorafobi","Özgül Fobi","Cinsel İşlev Bozukluğu",
  "Çocuk Ve Ergen Psikolojisi","Çocuklarda Yeme Problemleri","Çocuklarda Uyku Problemleri",
  "Cinsel Terapi Danışmanlığı","Cinsel İstismar","Cinsel İsteksizlik","Cinsel Travmalar",
  "Cinsel Soğukluk","Kadınlarda Cinsel İsteksizlik","Çocukluk Dönemi Korkuları",
  "Kadınlarda Cinsel Ağrı","Hipokondriazis","Dikkat Eksikliği","Dikkat Dağınıklığı",
  "Anne-Baba Eğitimi ve Danışmanlığı","Travma Sonrası Stres Bozukluğu","Borderline","Yas (Matem)",
  "Distimik Bozukluk (Kronik Depresyon)","Kişilerarası İlişkilerde Bozukluklar","Baş Dönmeleri",
  "Majör Depresif Bozukluk","Ağlama ve Öfke Nöbetleri","Telefon Bağımlılığı","Fobiler","Öfke",
  "Performans Kaygısı","Eş ve Çift Kıskançlığı","Koronofobi","Sigara Bağımlılığı","Öğrenme Güçlüğü",
  "Kadın Uyarılma - Orgazm Bozukluğu","Kronik yorgunluk sendromu","Saldırganlık","Çekingenlik",
  "Lohusalık sendromu","Hiperseksüalite","Saç ve Kıl Koparma Hastalığı (Trikotillomani)",
  "Duygulanım Bozukluğu - Manik Depresif Hastalığı","İş ve Çalışan Psikolojik Problemleri",
  "Adipsi (Susama Yokluğu)","Tırnak Yeme","Oyun Bağımlılığı","Çocukluk Çağı Travmaları","İrkçılık",
  "Kişisel bakım sürdürmeme",
];

export const INTERESTS_AILE_DANISMANI: string[] = [
  "Cinsel Sağlık Danışmanlığı","Aile Problemleri","Cinsel işlev bozuklukları","Bağlanma sorunları",
  "Dikkat Eksikliği Hiperaktivite Bozukluğu (DEHB)","Bireysel Danışmanlık","Ailede yas süreci",
  "Aile-Çift Danışmanlığı","Cinsel isteksizlik","Aile Rehberliği","Boşanma Danışmanlığı",
  "Boşanma Oryantasyonu ve Evlilik Krizleri","Aile İçi İletişimsizlik","Çocuk Ergen Danışmanlığı",
  "Aile Danışmanlığı","Aile İçi İletişim","Ebeveyn danışmanlığı","Aile ergen çatışması",
  "Çift Danışmanlığı","Aile içinde yaşanan travma","Boşanmanın çocuklar üzerinde etkisi",
  "Aile duygusal istismar",
];

const norm = (s?: string | null) =>
  (s || "")
    .toLocaleLowerCase("tr")
    .replace(/[ışŞİĞğÜüÖöÇç]/g, (c) => ({ "ı":"i","ş":"s","Ş":"s","İ":"i","Ğ":"g","ğ":"g","Ü":"u","ü":"u","Ö":"o","ö":"o","Ç":"c","ç":"c" }[c] || c));

export type InterestCategory = "psikolog" | "psikolojik_danisman" | "aile_danismani" | null;

export function detectCategory(specialty?: string | null): InterestCategory {
  const s = norm(specialty);
  if (!s) return null;
  if (s.includes("aile danis")) return "aile_danismani";
  if (s.includes("psikolojik danis")) return "psikolojik_danisman";
  if (s.includes("klinik psikolog") || s.includes("psikolog")) return "psikolog";
  return null;
}

export function getSuggestedInterests(specialty?: string | null): string[] {
  const cat = detectCategory(specialty);
  switch (cat) {
    case "psikolog": return INTERESTS_PSIKOLOG;
    case "psikolojik_danisman": return INTERESTS_PSIKOLOJIK_DANISMAN;
    case "aile_danismani": return INTERESTS_AILE_DANISMANI;
    default: return [];
  }
}

export function hasSuggestedInterests(specialty?: string | null): boolean {
  return detectCategory(specialty) !== null;
}
