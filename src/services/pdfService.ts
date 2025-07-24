
import jsPDF from 'jspdf';

interface CustomerData {
  name: string;
  surname: string;
  email: string;
  phone: string;
  tcNo: string;
  address: string;
  city: string;
  postalCode: string;
  companyName?: string;
  taxNo?: string;
  taxOffice?: string;
}

interface PackageData {
  name: string;
  price: number;
  originalPrice: number;
}

export const generatePreInfoPDF = (
  customerData: CustomerData,
  packageData: PackageData,
  paymentMethod: string,
  customerType: string,
  clientIP: string
) => {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.width;
  const pageHeight = pdf.internal.pageSize.height;
  const margin = 25;
  const contentWidth = pageWidth - 2 * margin;
  const safeBottomMargin = 40; // Daha büyük güvenli alan
  const maxY = pageHeight - safeBottomMargin;
  let yPosition = 40;
  
  // Gelişmiş sayfa kontrolü - kesin çözüm
  const checkNewPageNeeded = (neededHeight: number) => {
    return yPosition + neededHeight > maxY;
  };
  
  const addNewPageIfNeeded = (neededHeight: number) => {
    if (checkNewPageNeeded(neededHeight)) {
      pdf.addPage();
      yPosition = 40;
      return true;
    }
    return false;
  };
  
  // Estetik metin bloku ekleme fonksiyonu
  const addTextBlock = (text: string, fontSize: number = 10, fontWeight: string = 'normal', isTitle: boolean = false, color: number[] = [0, 0, 0]) => {
    pdf.setFontSize(fontSize);
    pdf.setFont('helvetica', fontWeight);
    pdf.setTextColor(color[0], color[1], color[2]);
    
    const lines = pdf.splitTextToSize(text, contentWidth);
    const lineHeight = fontSize * 0.65;
    const totalHeight = lines.length * lineHeight + (isTitle ? 15 : 8);
    
    // Sayfa kontrolü
    addNewPageIfNeeded(totalHeight);
    
    // Başlık için arka plan rengi
    if (isTitle && fontSize > 11) {
      pdf.setFillColor(245, 248, 250);
      pdf.rect(margin - 5, yPosition - 5, contentWidth + 10, totalHeight - 5, 'F');
    }
    
    pdf.text(lines, margin, yPosition);
    yPosition += totalHeight;
    
    return lines.length;
  };
  
  // Güvenli boşluk ekleme
  const addSpacing = (space: number) => {
    if (checkNewPageNeeded(space)) {
      addNewPageIfNeeded(0);
    } else {
      yPosition += space;
    }
  };
  
  // Dekoratif çizgi ekleme
  const addLine = (color: number[] = [200, 200, 200]) => {
    addNewPageIfNeeded(5);
    pdf.setDrawColor(color[0], color[1], color[2]);
    pdf.setLineWidth(0.5);
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 8;
  };
  
  // Başlık - Estetik tasarım
  addNewPageIfNeeded(50);
  
  // Ana başlık için arka plan
  pdf.setFillColor(30, 41, 59);
  pdf.rect(margin - 10, yPosition - 10, contentWidth + 20, 35, 'F');
  
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255);
  pdf.text('ÖN BİLGİLENDİRME FORMU', pageWidth / 2, yPosition + 8, { align: 'center' });
  
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.text('(6502 Sayılı Tüketicinin Korunması Hakkında Kanun Kapsamında)', pageWidth / 2, yPosition + 20, { align: 'center' });
  yPosition += 40;
  
  // Dekoratif çizgi
  addLine([59, 130, 246]);
  addSpacing(5);
  
  // Tarih ve IP bilgileri - renkli
  const currentDate = new Date().toLocaleDateString('tr-TR');
  addTextBlock(`📅 Belge Tarihi: ${currentDate}`, 10, 'normal', false, [59, 130, 246]);
  addTextBlock(`🌐 IP Adresi: ${clientIP}`, 10, 'normal', false, [59, 130, 246]);
  addSpacing(15);
  
  // Satıcı bilgileri bölümü
  addTextBlock('🏢 SATICI FİRMA BİLGİLERİ', 14, 'bold', true, [30, 41, 59]);
  
  const sellerInfo = [
    'Ünvan: DoktorumOL Dijital Sağlık Hizmetleri',
    'Adres: İstanbul, Türkiye',
    'Telefon: +90 XXX XXX XX XX',
    'E-posta: info@doktorumol.com.tr',
    'Web Sitesi: www.doktorumol.com.tr',
    'Mersis No: XXXXXXXXXXXXXXXXX',
    'Ticaret Sicil No: XXXXXX',
    'Vergi Dairesi: İstanbul Vergi Dairesi',
    'Vergi No: XXXXXXXXXX'
  ];
  
  sellerInfo.forEach((info) => {
    addTextBlock(info, 10);
  });
  
  addSpacing(5);
  
  addLine([220, 220, 220]);
  addTextBlock('👤 ALICI MÜŞTERİ BİLGİLERİ', 14, 'bold', true, [30, 41, 59]);
  
  const customerInfo = [
    `Ad Soyad: ${customerData.name} ${customerData.surname}`,
    `E-posta Adresi: ${customerData.email}`,
    `Telefon Numarası: ${customerData.phone}`,
    `TC Kimlik No: ${customerData.tcNo}`,
    `Teslimat Adresi: ${customerData.address}, ${customerData.city} ${customerData.postalCode}`,
    `Fatura Adresi: ${customerData.address}, ${customerData.city} ${customerData.postalCode}`
  ];
  
  if (customerType === 'company' && customerData.companyName) {
    customerInfo.push(`Firma Adı: ${customerData.companyName}`);
    customerInfo.push(`Vergi No: ${customerData.taxNo}`);
    customerInfo.push(`Vergi Dairesi: ${customerData.taxOffice}`);
  }
  
  customerInfo.forEach((info) => {
    addTextBlock(info, 10);
  });
  
  addSpacing(5);
  
  addLine([220, 220, 220]);
  addTextBlock('📋 HİZMET BİLGİLERİ VE SÖZLEŞME KONUSU', 14, 'bold', true, [30, 41, 59]);
  
  const serviceInfo = [
    `Hizmet Adı: ${packageData.name}`,
    `Hizmet Açıklaması: Dijital sağlık platformu kullanım hakkı ve profesyonel doktor profili yönetimi`,
    `Hizmet Süresi: 12 (On İki) Ay`,
    `Aylık Hizmet Bedeli: ${packageData.price.toLocaleString('tr-TR')} TL (KDV Dahil)`,
    `Toplam Hizmet Bedeli: ${(packageData.price * 12).toLocaleString('tr-TR')} TL (KDV Dahil)`,
    `İndirimli Fiyat: ${packageData.price.toLocaleString('tr-TR')} TL yerine ${packageData.originalPrice.toLocaleString('tr-TR')} TL`,
    `Ödeme Şekli: ${paymentMethod === 'creditCard' ? 'Kredi Kartı/Banka Kartı ile Aylık Otomatik Tahsilat' : 'Banka Havalesi/EFT ile Aylık Manuel Ödeme'}`,
    'KDV Oranı: %20',
    'Para Birimi: Türk Lirası (TL)'
  ];
  
  serviceInfo.forEach((info) => {
    addTextBlock(info, 10);
  });
  
  addSpacing(10);
  
  addLine([220, 220, 220]);
  addTextBlock('📜 DETAYLI HİZMET KOŞULLARI VE BİLGİLERİ', 14, 'bold', true, [30, 41, 59]);
  
  const detailedTerms = [
    '1. HİZMET TANIMI VE KAPSAMI:',
    'Bu sözleşme kapsamında sunulan hizmet, DoktorumOL dijital sağlık platformunda profesyonel doktor profili oluşturma, yönetme ve hasta ile etkileşim kurma imkanı sağlayan dijital bir hizmettir. Hizmet tamamen dijital ortamda sunulmakta olup, herhangi bir fiziksel teslimat içermemektedir.',
    '',
    '2. HİZMET SÜRESİ VE ÖDEME KOŞULLARI:',
    'Hizmet süresi 12 (on iki) ay olup, ödeme aylık taksitler halinde yapılacaktır. İlk ödeme hizmetin başlangıcında, sonraki ödemeler her ayın aynı gününde otomatik olarak tahsil edilecektir. Ödeme yapılmayan durumlarda hizmet askıya alınabilir.',
    '',
    '3. CAYMA HAKKI:',
    'Alıcı, 6502 sayılı Tüketicinin Korunması Hakkında Kanun kapsamında, sözleşme tarihinden itibaren 14 (on dört) gün içerisinde herhangi bir gerekçe göstermeksizin ve cezai şart ödemeksizin bu sözleşmeden cayma hakkına sahiptir. Cayma hakkının kullanılması için bu süre içerisinde satıcıya yazılı olarak bildirim yapılması yeterlidir.',
    '',
    '4. CAYMA HAKKININ KULLANILMASI:',
    'Cayma hakkının kullanılması halinde, alıcı tarafından ödenen tüm bedeller 10 (on) gün içerisinde iade edilir. Cayma bildirimi info@doktorumol.com.tr e-posta adresine veya kayıtlı adrese yazılı olarak yapılabilir.',
    '',
    '5. HİZMET BAŞLANGICI VE AKTİVASYON:',
    'Hizmet, ödeme onayının alınmasından sonra en geç 24 saat içerisinde aktifleştirilir. Kullanıcı hesap bilgileri ayrı bir e-posta ile gönderilir. Hizmetin kullanımı için internet bağlantısı gereklidir.',
    '',
    '6. SORUMLULUKLAR VE YÜKÜMLÜLÜKLER:',
    'Satıcı, platform üzerinden kesintisiz hizmet sunmaya, teknik destek sağlamaya ve kullanıcı verilerinin güvenliğini sağlamaya yükümlüdür. Alıcı, platform kurallarına uymaya, doğru bilgi vermeye ve aylık ödemelerini zamanında yapmaya yükümlüdür.',
    '',
    '7. İPTAL VE SONLANDIRMA:',
    'Hizmet, alıcı tarafından herhangi bir zamanda iptal edilebilir. İptal durumunda kalan aylık ödemeler tahsil edilmez. Ancak kullanılan dönem için ödeme iadesi yapılmaz. Satıcı, platform kurallarının ihlali durumunda hizmeti tek taraflı olarak sonlandırabilir.',
    '',
    '8. KİŞİSEL VERİLERİN KORUNMASI:',
    'Toplanan kişisel veriler, 6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında işlenir ve korunur. Detaylı bilgi için www.doktorumol.com.tr/gizlilik-politikasi adresini ziyaret edebilirsiniz.',
    '',
    '9. UYUŞMAZLIK ÇÖZÜMÜ:',
    'Bu sözleşmeden doğan uyuşmazlıklar öncelikle dostane yollarla çözülmeye çalışılır. Çözüm sağlanamayan hallerde İstanbul Mahkemeleri ve İcra Müdürlükleri yetkilidir. Tüketici şikayetleri için Tüketici Hakem Heyetleri ve Tüketici Mahkemelerine başvuru yapılabilir.',
    '',
    '10. DİĞER HÜKÜMLER:',
    'Bu sözleşme elektronik ortamda akdedilmiş olup, onaylanan şekliyle geçerlidir. Sözleşme şartlarında değişiklik yalnızca yazılı anlaşma ile yapılabilir. Sözleşmenin herhangi bir hükmünün geçersiz olması diğer hükümlerin geçerliliğini etkilemez.'
  ];
  
  detailedTerms.forEach((term) => {
    if (term === '') {
      addSpacing(3);
      return;
    }
    addTextBlock(term, 10);
  });
  
  // İmza sayfası - estetik tasarım
  pdf.addPage();
  yPosition = 40;
  
  // İmza başlığı
  pdf.setFillColor(34, 197, 94);
  pdf.rect(margin - 10, yPosition - 10, contentWidth + 20, 30, 'F');
  
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255);
  pdf.text('✍️ ONAY VE KABUL', pageWidth / 2, yPosition + 5, { align: 'center' });
  yPosition += 35;
  
  addLine([34, 197, 94]);
  
  const acceptanceText = [
    'Bu ön bilgilendirme formunda yer alan tüm bilgileri okudum, anladım ve kabul ediyorum. Ürün/hizmet bedeli, ödeme şekli, teslimat koşulları ve diğer tüm şartlar hakkında tam bilgi sahibi olduğumu beyan ederim.',
    '',
    '6502 sayılı Tüketicinin Korunması Hakkında Kanun kapsamındaki cayma hakkım konusunda bilgilendirildiğimi, bu hakkımı 14 gün içerisinde kullanabileceğimi bildiğimi onaylıyorum.',
    '',
    'Bu belge elektronik ortamda düzenlenmiş olup, 5070 sayılı Elektronik İmza Kanunu kapsamında geçerlidir.',
    '',
    `Kabul Tarihi: ${currentDate}`,
    `Kabul Saati: ${new Date().toLocaleTimeString('tr-TR')}`,
    `IP Adresi: ${clientIP}`,
    '',
    'MÜŞTERİ BİLGİLERİ VE DİJİTAL ONAYI:',
    `Ad Soyad: ${customerData.name} ${customerData.surname}`,
    `E-posta: ${customerData.email}`,
    `Telefon: ${customerData.phone}`,
    '',
    'DİJİTAL İMZA: Bu belge elektronik ortamda kabul edilmiş ve dijital olarak imzalanmıştır.',
    '',
    '* Bu belge müşteri tarafından dijital ortamda onaylanmış ve yasal geçerliliğe sahiptir.',
    '* Belgenin dijital kopyası müşterinin e-posta adresine gönderilmiştir.',
    '* Sorularınız için info@doktorumol.com.tr adresinden bizimle iletişime geçebilirsiniz.'
  ];
  
  acceptanceText.forEach((text) => {
    if (text === '') {
      addSpacing(3);
      return;
    }
    addTextBlock(text, 10);
  });
  
  return pdf;
};

export const generateDistanceSalesPDF = (
  customerData: CustomerData,
  packageData: PackageData,
  paymentMethod: string,
  customerType: string,
  clientIP: string
) => {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.width;
  const pageHeight = pdf.internal.pageSize.height;
  const margin = 25;
  const contentWidth = pageWidth - 2 * margin;
  const safeBottomMargin = 40; // Daha büyük güvenli alan
  const maxY = pageHeight - safeBottomMargin;
  let yPosition = 40;
  
  // Gelişmiş sayfa kontrolü - kesin çözüm
  const checkNewPageNeeded = (neededHeight: number) => {
    return yPosition + neededHeight > maxY;
  };
  
  const addNewPageIfNeeded = (neededHeight: number) => {
    if (checkNewPageNeeded(neededHeight)) {
      pdf.addPage();
      yPosition = 40;
      return true;
    }
    return false;
  };
  
  // Estetik metin bloku ekleme fonksiyonu
  const addTextBlock = (text: string, fontSize: number = 10, fontWeight: string = 'normal', isTitle: boolean = false, color: number[] = [0, 0, 0]) => {
    pdf.setFontSize(fontSize);
    pdf.setFont('helvetica', fontWeight);
    pdf.setTextColor(color[0], color[1], color[2]);
    
    const lines = pdf.splitTextToSize(text, contentWidth);
    const lineHeight = fontSize * 0.65;
    const totalHeight = lines.length * lineHeight + (isTitle ? 15 : 8);
    
    // Sayfa kontrolü
    addNewPageIfNeeded(totalHeight);
    
    // Başlık için arka plan rengi
    if (isTitle && fontSize > 11) {
      pdf.setFillColor(245, 248, 250);
      pdf.rect(margin - 5, yPosition - 5, contentWidth + 10, totalHeight - 5, 'F');
    }
    
    pdf.text(lines, margin, yPosition);
    yPosition += totalHeight;
    
    return lines.length;
  };
  
  // Güvenli boşluk ekleme
  const addSpacing = (space: number) => {
    if (checkNewPageNeeded(space)) {
      addNewPageIfNeeded(0);
    } else {
      yPosition += space;
    }
  };
  
  // Dekoratif çizgi ekleme
  const addLine = (color: number[] = [200, 200, 200]) => {
    addNewPageIfNeeded(5);
    pdf.setDrawColor(color[0], color[1], color[2]);
    pdf.setLineWidth(0.5);
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 8;
  };
  
  // Başlık - Estetik tasarım
  addNewPageIfNeeded(50);
  
  // Ana başlık için arka plan
  pdf.setFillColor(139, 69, 19);
  pdf.rect(margin - 10, yPosition - 10, contentWidth + 20, 35, 'F');
  
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255);
  pdf.text('MESAFELİ SATIŞ SÖZLEŞMESİ', pageWidth / 2, yPosition + 8, { align: 'center' });
  
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.text('(6502 Sayılı Tüketicinin Korunması Hakkında Kanun Uyarınca)', pageWidth / 2, yPosition + 20, { align: 'center' });
  yPosition += 40;
  
  // Dekoratif çizgi
  addLine([197, 112, 42]);
  addSpacing(5);
  
  // Tarih ve IP bilgileri - renkli
  const currentDate = new Date().toLocaleDateString('tr-TR');
  addTextBlock(`📅 Sözleşme Tarihi: ${currentDate}`, 10, 'normal', false, [197, 112, 42]);
  addTextBlock(`🌐 IP Adresi: ${clientIP}`, 10, 'normal', false, [197, 112, 42]);
  addTextBlock(`📄 Sözleşme No: DOL-${Date.now()}`, 10, 'normal', false, [197, 112, 42]);
  addSpacing(15);
  
  // Taraflar bölümü - estetik
  addLine([220, 220, 220]);
  addTextBlock('🤝 SÖZLEŞME TARAFLARI', 14, 'bold', true, [139, 69, 19]);
  
  // Satıcı bilgileri
  addTextBlock('🏢 SATICI:', 12, 'bold', true, [30, 41, 59]);
  
  const sellerDetails = [
    'Ünvan: DoktorumOL Dijital Sağlık Hizmetleri',
    'Adres: İstanbul, Türkiye',
    'Telefon: +90 XXX XXX XX XX',
    'Faks: +90 XXX XXX XX XX',
    'E-posta: info@doktorumol.com.tr',
    'Web Sitesi: www.doktorumol.com.tr',
    'Mersis No: XXXXXXXXXXXXXXXXX',
    'Ticaret Sicil No: XXXXXX',
    'Vergi Dairesi: İstanbul Vergi Dairesi',
    'Vergi No: XXXXXXXXXX',
    'Faaliyet Konusu: Dijital Sağlık Hizmetleri ve Platform İşletmeciliği'
  ];
  
  sellerDetails.forEach((detail) => {
    addTextBlock(`  ${detail}`, 10);
  });
  
  addSpacing(5);
  
  // Alıcı bilgileri
  addLine([220, 220, 220]);
  addTextBlock('👤 ALICI:', 12, 'bold', true, [30, 41, 59]);
  
  const buyerDetails = [
    `Ad Soyad: ${customerData.name} ${customerData.surname}`,
    `E-posta Adresi: ${customerData.email}`,
    `Telefon Numarası: ${customerData.phone}`,
    `TC Kimlik No: ${customerData.tcNo}`,
    `Adres: ${customerData.address}`,
    `İl/İlçe: ${customerData.city}`,
    `Posta Kodu: ${customerData.postalCode || 'Belirtilmemiş'}`
  ];
  
  if (customerType === 'company' && customerData.companyName) {
    buyerDetails.push(`Firma Adı: ${customerData.companyName}`);
    buyerDetails.push(`Vergi No: ${customerData.taxNo}`);
    buyerDetails.push(`Vergi Dairesi: ${customerData.taxOffice}`);
  }
  
  buyerDetails.forEach((detail) => {
    addTextBlock(`  ${detail}`, 10);
  });
  
  addSpacing(10);
  
  // Sözleşme konusu
  addLine([220, 220, 220]);
  addTextBlock('📋 SÖZLEŞME KONUSU VE DETAYLARI', 14, 'bold', true, [139, 69, 19]);
  
  const contractDetails = [
    `Hizmet Adı: ${packageData.name}`,
    `Hizmet Türü: Dijital Platform Kullanım Hakkı`,
    `Hizmet Açıklaması: DoktorumOL dijital sağlık platformunda profesyonel doktor profili oluşturma, yönetme, hasta ile iletişim kurma, randevu alma ve diğer platform özelliklerini kullanma hakkı`,
    `Hizmet Süresi: 12 (On İki) Ay`,
    `Başlangıç Tarihi: ${currentDate}`,
    `Bitiş Tarihi: ${new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toLocaleDateString('tr-TR')}`,
    `Aylık Hizmet Bedeli: ${packageData.price.toLocaleString('tr-TR')} TL`,
    `KDV Dahil Aylık Tutar: ${packageData.price.toLocaleString('tr-TR')} TL`,
    `Toplam Hizmet Bedeli (12 Ay): ${(packageData.price * 12).toLocaleString('tr-TR')} TL`,
    `Ödeme Şekli: ${paymentMethod === 'creditCard' ? 'Kredi Kartı/Banka Kartı (Aylık Otomatik Tahsilat)' : 'Banka Havalesi/EFT (Aylık Manuel Ödeme)'}`,
    'KDV Oranı: %20',
    'Para Birimi: Türk Lirası (TL)',
    'Teslimat Şekli: Dijital Hizmet (Fiziksel Teslimat Yok)',
    'Hizmet Sunumu: Online Platform Üzerinden 7/24'
  ];
  
  contractDetails.forEach((detail) => {
    addTextBlock(detail, 10);
  });
  
  addSpacing(10);
  
  // Genel şartlar
  addLine([220, 220, 220]);
  addTextBlock('📜 GENEL ŞARTLAR VE KOŞULLAR', 14, 'bold', true, [139, 69, 19]);
  
  const comprehensiveTerms = [
    '1. SÖZLEŞME HÜKÜMLERI VE YASAL DAYANAK',
    'Bu sözleşme, 6502 sayılı Tüketicinin Korunması Hakkında Kanun, 6563 sayılı Elektronik Ticaretin Düzenlenmesi Hakkında Kanun ve ilgili mevzuat hükümleri uyarınca düzenlenmiştir. Sözleşme elektronik ortamda akdedilmiş olup, taraflar için bağlayıcıdır.',
    '',
    '2. HİZMET TANIMI VE KAPSAMI',
    'DoktorumOL dijital sağlık platformu üzerinden sunulan hizmetler; doktor profili oluşturma ve düzenleme, hasta ile iletişim kurma, randevu sistemi kullanma, soru-cevap özelliği, video paylaşımı, sosyal medya entegrasyonu, SEO optimizasyonu, Google ve sosyal medya reklam yönetimi, santral sistemden hasta yönlendirme gibi dijital hizmetleri kapsar.',
    '',
    '3. HİZMET SÜRESİ VE ÖDEME KOŞULLARI',
    'Hizmet süresi 12 (on iki) ay olup, aylık ödeme planı uygulanır. İlk ödeme hizmetin başlatılması için gerekli olup, sonraki ödemeler her ayın aynı gününde otomatik olarak (kredi kartı ödemelerinde) veya manuel olarak (havale/EFT ödemelerinde) yapılacaktır. Ödeme gecikmeleri durumunda hizmet askıya alınabilir.',
    '',
    '4. CAYMA HAKKI VE KULLANIMI',
    'Alıcı, sözleşme tarihinden itibaren 14 (on dört) gün içerisinde herhangi bir gerekçe göstermeksizin ve cezai şart ödemeksizin bu sözleşmeden cayabilir. Cayma hakkının kullanılması için bu süre içinde satıcıya yazılı bildirim yapılması yeterlidir. Cayma bildirimi e-posta, faks veya posta yoluyla yapılabilir.',
    '',
    '5. CAYMA HAKKININ SONUÇLARI',
    'Cayma hakkının kullanılması halinde, alıcı tarafından yapılan ödemeler cayma bildiriminin alındığı tarihten itibaren en geç 10 (on) gün içerisinde iade edilir. İade, alıcının ödeme yaptığı araçla aynı yöntemle yapılır. Cayma hakkı kullanıldıktan sonra hizmet erişimi derhal sonlandırılır.',
    '',
    '6. HİZMET BAŞLATILMASI VE AKTİVASYON',
    'Hizmet, ödeme onayının alınmasından sonra en geç 24 saat içerisinde aktifleştirilir. Alıcıya hesap bilgileri ve giriş detayları ayrı bir e-posta ile gönderilir. Platform kullanımı için güncel internet tarayıcısı ve kararlı internet bağlantısı gereklidir.',
    '',
    '7. SATICI YÜKÜMLÜLÜKLERI',
    'Satıcı, platformun kesintisiz çalışması için gerekli teknik altyapıyı sağlamaya, 7/24 teknik destek sunmaya, kullanıcı verilerinin güvenliğini sağlamaya, platform özelliklerini sürekli geliştirmeye ve güncellenmeye yükümlüdür. Planlı bakım çalışmaları önceden duyurulur.',
    '',
    '8. ALICI YÜKÜMLÜLÜKLERI',
    'Alıcı, platform kullanım kurallarına uymaya, doğru ve güncel bilgiler vermeye, aylık ödemelerini zamanında yapmaya, profesyonel davranış sergilemeye, telif haklarına saygı göstermeye ve platform güvenliğini tehdit edecek eylemlerden kaçınmaya yükümlüdür.',
    '',
    '9. ÖDEME GECİKMELERİ VE SONUÇLARI',
    'Aylık ödemenin zamanında yapılmaması durumunda, alıcıya 3 gün içerisinde bildirim gönderilir. Ödeme 7 gün içerisinde yapılmazsa hizmet askıya alınır. 30 gün içerisinde ödeme yapılmazsa sözleşme feshedilir ve hesap kalıcı olarak kapatılır.',
    '',
    '10. HİZMET İPTALİ VE SONLANDIRMA',
    'Alıcı, herhangi bir zamanda hizmeti iptal edebilir. İptal bildirimi yazılı olarak yapılmalıdır. İptal durumunda kalan aylık ödemeler tahsil edilmez, ancak kullanılan dönem için iade yapılmaz. Satıcı, platform kurallarının ciddi ihlali durumunda hizmeti tek taraflı olarak sonlandırabilir.',
    '',
    '11. KİŞİSEL VERİLERİN KORUNMASI VE GİZLİLİK',
    'Toplanan kişisel veriler, 6698 sayılı Kişisel Verilerin Korunması Kanunu ve ilgili mevzuat uyarınca işlenir ve korunur. Veriler üçüncü kişilerle paylaşılmaz, satılmaz veya kiralanmaz. Detaylı bilgi için gizlilik politikası incelenmelidir.',
    '',
    '12. FIKRI MÜLKIYET HAKLARI',
    'Platform üzerindeki tüm içerik, tasarım, yazılım ve fikri mülkiyet hakları satıcıya aittir. Alıcı, bu hakları ihlal edemez, çoğaltamaz veya dağıtamaz. Alıcının platforma yüklediği içeriklerin sorumluluğu kendisine aittir.',
    '',
    '13. SORUMLULUK SINIRLARI',
    'Satıcı, internet kesintisi, teknik arızalar, güncellemeler sırasında oluşabilecek geçici kesintiler için sorumlu değildir. Force majeure halleri nedeniyle oluşabilecek hizmet kesintilerinden sorumlu tutulamaz. Alıcının platform üzerindeki içeriklerinden doğan sorumluluk kendisine aittir.',
    '',
    '14. DEĞİŞİKLİK VE GÜNCELLEMELER',
    'Satıcı, platform özelliklerini geliştirme, güvenlik güncellemeleri yapma ve yeni özellikler ekleme hakkını saklı tutar. Önemli değişiklikler alıcılara önceden bildirilir. Hizmet koşullarında değişiklik olması durumunda alıcılara 30 gün önceden bildirim yapılır.',
    '',
    '15. UYUŞMAZLIK ÇÖZÜMÜ VE YETKİLİ MERCILER',
    'Bu sözleşmeden doğan uyuşmazlıkların çözümünde öncelikle dostane yollar denenir. Çözüm sağlanamayan hallerde İstanbul Merkez (Çağlayan) Mahkemeleri ve İcra Müdürlükleri yetkilidir. Tüketici şikayetleri için Tüketici Hakem Heyetleri ve Tüketici Mahkemelerine başvuru yapılabilir.',
    '',
    '16. ÇEŞITLI HÜKÜMLER',
    'Bu sözleşme elektronik ortamda akdedilmiş olup, 5070 sayılı Elektronik İmza Kanunu kapsamında geçerlidir. Sözleşmenin herhangi bir hükmünün geçersiz olması diğer hükümlerin geçerliliğini etkilemez. Sözleşme hükümlerinde değişiklik yalnızca yazılı anlaşma ile yapılabilir.',
    '',
    '17. YÜRÜRLÜK VE KABUL',
    'Bu sözleşme, alıcı tarafından elektronik ortamda onaylandığı tarihte yürürlüğe girer. Sözleşme şartlarının tamamı alıcı tarafından okunmuş, anlaşılmış ve kabul edilmiştir. Bu sözleşme 12 aylık hizmet süresi boyunca geçerlidir.'
  ];
  
  comprehensiveTerms.forEach((term) => {
    if (term === '') {
      addSpacing(3);
      return;
    }
    addTextBlock(term, 10);
  });
  
  // İmza sayfası - estetik tasarım
  pdf.addPage();  
  yPosition = 40;
  
  // İmza başlığı
  pdf.setFillColor(139, 69, 19);
  pdf.rect(margin - 10, yPosition - 10, contentWidth + 20, 30, 'F');
  
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255);
  pdf.text('✍️ TARAF İMZALARI VE ONAYLAR', pageWidth / 2, yPosition + 5, { align: 'center' });
  yPosition += 35;
  
  addLine([139, 69, 19]);
  
  const signatureSection = [
    'Bu sözleşmeyi okudum, anladım ve kabul ediyorum. Sözleşme şartlarının tamamı hakkında bilgi sahibi olduğumu, cayma hakkım konusunda bilgilendirildiğimi beyan ederim.',
    '',
    'Bu sözleşme elektronik ortamda düzenlenmiş ve dijital olarak imzalanmıştır. 5070 sayılı Elektronik İmza Kanunu uyarınca yasal geçerliliğe sahiptir.',
    '',
    `Sözleşme Tarihi: ${currentDate}`,
    `Sözleşme Saati: ${new Date().toLocaleTimeString('tr-TR')}`,
    `IP Adresi: ${clientIP}`,
    `Sözleşme No: DOL-${Date.now()}`,
    '',
    'ALICI BILGILERI VE DİJİTAL İMZASI:',
    `Ad Soyad: ${customerData.name} ${customerData.surname}`,
    `E-posta: ${customerData.email}`,
    `Telefon: ${customerData.phone}`,
    `TC Kimlik No: ${customerData.tcNo}`,
    '',
    'Dijital İmza: BU SÖZLEŞME ELEKTRONİK ORTAMDA KABUL EDİLMİŞTİR',
    '',
    'SATICI BILGILERI VE İMZASI:',
    'DoktorumOL Dijital Sağlık Hizmetleri',
    'İstanbul, Türkiye',
    'info@doktorumol.com.tr',
    '',
    'Yetkili İmza: [Dijital İmza]',
    `Tarih: ${currentDate}`,
    '',
    '* Bu belge elektronik ortamda düzenlenmiş ve onaylanmıştır.',
    '* Sözleşmenin dijital kopyası taraflara e-posta ile gönderilmiştir.',
    '* Sorular için info@doktorumol.com.tr adresinden iletişime geçilebilir.',
    '* Bu sözleşme 12 ay süreyle geçerlidir.',
    '* Tüketici şikayetleri için www.tuketici.gov.tr adresini ziyaret edebilirsiniz.'
  ];
  
  signatureSection.forEach((text) => {
    if (text === '') {
      addSpacing(3);
      return;
    }
    addTextBlock(text, 10);
  });
  
  return pdf;
};
