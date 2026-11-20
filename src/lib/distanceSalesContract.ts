import { DISTANCE_SALES_CALL_CENTER_MD, DISTANCE_SALES_KVKK_MD } from "@/content/contracts/distanceSalesTexts";

export const DISTANCE_SALES_VERSION = "Mesafeli Satış Sözleşmesi v2026-11-20";
export const PRE_INFO_VERSION = "Ön Bilgilendirme Formu v2026-11-20";
export const COMMITMENT_MONTHS = 12;

const esc = (s: unknown) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const inline = (s: string) => esc(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

export function markdownToHtml(md: string): string {
  const out: string[] = [];
  let list: string[] = [];
  const flush = () => { if (list.length) { out.push(`<ul>${list.join("")}</ul>`); list = []; } };
  for (const raw of md.split("\n")) {
    const line = raw.trim();
    if (!line) { flush(); continue; }
    if (line.startsWith("- ")) { list.push(`<li>${inline(line.slice(2))}</li>`); continue; }
    flush();
    if (line.startsWith("# ")) out.push(`<h2>${inline(line.slice(2))}</h2>`);
    else if (line.startsWith("### ")) out.push(`<h3>${inline(line.slice(4))}</h3>`);
    else out.push(`<p>${inline(line)}</p>`);
  }
  flush();
  return out.join("\n");
}

const val = (v: unknown, fallback = "Belirtilmemiş") => {
  const s = String(v ?? "").trim();
  return s ? s : fallback;
};

const tl = (n: number) => `${Number(n || 0).toLocaleString("tr-TR")} TL (KDV dahil)`;

export interface DistanceSalesInput {
  formData: Record<string, any>;
  selectedPackage: { name?: string; price: number };
  paymentMethod: string;
  customerType: string;
  clientIP: string;
  orderCreatedAt: string;
}

export function buildDistanceSalesData({ formData, selectedPackage, paymentMethod, customerType, clientIP, orderCreatedAt }: DistanceSalesInput) {
  const d = new Date(orderCreatedAt);
  const date = d.toLocaleDateString("tr-TR", { timeZone: "Europe/Istanbul" });
  const time = d.toLocaleTimeString("tr-TR", { timeZone: "Europe/Istanbul", hour12: false });
  const corporate = customerType === "company";
  return {
    name: val(`${formData.name ?? ""} ${formData.surname ?? ""}`),
    email: val(formData.email),
    phone: val(formData.phone || formData.gsmNumber),
    tcNo: val(formData.tcNo || formData.identityNumber),
    address: val(formData.address),
    city: val(formData.city),
    customerType: corporate ? "Kurumsal kayıt" : "Bireysel kayıt",
    companyName: corporate ? val(formData.companyName) : null,
    taxNumber: corporate ? val(formData.taxNumber) : null,
    taxOffice: corporate ? val(formData.taxOffice) : null,
    packageName: val(selectedPackage.name),
    monthly: tl(selectedPackage.price),
    total: tl(selectedPackage.price * COMMITMENT_MONTHS),
    paymentMethod: paymentMethod === "credit_card" ? "Kredi Kartı" : "Banka Havalesi / EFT",
    paymentStatus: paymentMethod === "credit_card" ? "Kart ödemesi bekleniyor" : "Havale/EFT ödemesi bekleniyor; banka kaydı ile doğrulanacaktır",
    startDate: "Ödemenin onaylandığı tarihte başlar",
    date, time, ip: val(clientIP),
  };
}

export function buildDistanceSalesHtml(input: DistanceSalesInput): string {
  const x = buildDistanceSalesData(input);
  const row = (k: string, v: string | null) => (v === null ? "" : `<p><strong>${k}:</strong> ${esc(v)}</p>`);
  const buyer = `
<h2>ALICI VE HİZMET BİLGİLERİ</h2>
<h3>1. HİZMET SAĞLAYICI</h3>
${row("Ticaret Unvanı", "Doktorum Ol Bilgi ve Teknoloji Hizmetleri Limited Şirketi")}
${row("MERSİS No", "0309075357800001")}
${row("Adres", "Küçükbakkalköy Mahallesi, Selvili Sokak No:4 İç Kapı No:20 Ataşehir/İstanbul")}
${row("E-posta", "info@doktorumol.com.tr")}
${row("KEP", "doktorumol@hs01.kep.tr")}
${row("İnternet Sitesi", "www.doktorumol.com.tr")}
<h3>2. HİZMET ALAN BİLGİLERİ</h3>
${row("Ad Soyad", x.name)}
${row("E-posta", x.email)}
${row("Telefon", x.phone)}
${row("TC Kimlik No", x.tcNo)}
${row("Adres", x.address)}
${row("Şehir", x.city)}
${row("Müşteri Tipi", x.customerType)}
${row("Firma Adı", x.companyName)}
${row("Vergi No", x.taxNumber)}
${row("Vergi Dairesi", x.taxOffice)}
<h3>3. SATIN ALINAN HİZMET</h3>
${row("Paket Adı", x.packageName)}
${row("Aylık Hizmet Bedeli", x.monthly)}
${row("Taahhüt Süresi", `${COMMITMENT_MONTHS} Ay`)}
${row(`${COMMITMENT_MONTHS} Aylık Toplam Taahhüt Bedeli`, x.total)}
${row("Ödeme Yöntemi", x.paymentMethod)}
${row("Ödeme Durumu", x.paymentStatus)}
${row("Hizmet Başlangıç Tarihi", x.startDate)}
<h3>4. SÖZLEŞME VE ELEKTRONİK ONAY BİLGİLERİ</h3>
${row("Sözleşme Tarihi", x.date)}
${row("Elektronik Onay Tarihi", x.date)}
${row("Elektronik Onay Saati", `${x.time} (Türkiye saati)`)}
${row("IP Adresi", x.ip)}
${row("Onaylanan Sözleşme Versiyonu", DISTANCE_SALES_VERSION)}
${row("Ön Bilgilendirme Versiyonu", PRE_INFO_VERSION)}
${row("Elektronik Onay Yöntemi", "Ödeme sayfasında sözleşme onay kutusunun işaretlenmesi")}
<h3>5. HİZMET KOŞULLARI</h3>
<p>Premium Paket kapsamında sunulan hizmetler, elektronik olarak onaylanan üyelik sözleşmesinin ve ilgili hizmet paketinin hükümlerine tabidir.</p>
<p>Aylık hizmet bedeli, ${COMMITMENT_MONTHS} aylık taahhüt süresi, fesih koşulları, danışan yönlendirme garantisi ve varsa otomatik yenileme hükümleri, Hizmet Alan'a sözleşmenin kurulmasından önce sunulur.</p>
<p>Hizmet Alan'ın kanundan doğan hakları saklıdır.</p>
<p><strong>Doktorum Ol Bilgi ve Teknoloji Hizmetleri Limited Şirketi</strong></p>`;
  return [markdownToHtml(DISTANCE_SALES_KVKK_MD), markdownToHtml(DISTANCE_SALES_CALL_CENTER_MD), buyer].join("\n<hr />\n");
}
