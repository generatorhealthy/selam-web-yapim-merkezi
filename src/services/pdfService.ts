import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel } from 'docx';

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

// PDF indirme fonksiyonu - ödeme sayfasından onaylanan ön bilgilendirme form içeriğini PDF'e çevirir
export const generatePreInfoPDF = async (orderId: string) => {
  console.log('🔄 PDF oluşturma başlatıldı, Order ID:', orderId);
  
  try {
    // Import supabase here to avoid issues
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      'https://irnfwewabogveofwemvg.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlybmZ3ZXdhYm9ndmVvZndlbXZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjUzMTAsImV4cCI6MjA2NzAwMTMxMH0.yK3oE_n2a4Y7RcHbeOC2_T_OE-jXcCip2C9QLweRJqs'
    );

    console.log('📡 Sipariş bilgileri sorgulanıyor...');
    
    // Sipariş bilgilerini al
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select(`
        id,
        customer_name,
        customer_email,
        customer_phone,
        customer_tc_no,
        customer_address,
        customer_city,
        package_name,
        amount,
        payment_method,
        customer_type,
        contract_ip_address,
        created_at
      `)
      .eq('id', orderId)
      .maybeSingle();

    if (orderError) {
      console.error('❌ Sipariş veritabanı hatası:', orderError);
      throw new Error(`Sipariş veritabanı hatası: ${orderError.message}`);
    }

    if (!orderData) {
      console.error('❌ Sipariş bulunamadı');
      throw new Error('Sipariş bulunamadı');
    }

    console.log('📊 Sipariş verisi alındı:', orderData);

    // Form içeriğini al
    const { data: formData, error: formError } = await supabase
      .from('form_contents')
      .select('content')
      .eq('form_type', 'pre_info')
      .maybeSingle();

    if (formError) {
      console.error('❌ Form içeriği hatası:', formError);
      throw new Error(`Form içeriği hatası: ${formError.message}`);
    }

    const formContent = formData?.content || 'DOKTORUM OL ÜYELİK SÖZLEŞMESİ';
    console.log('📝 Form içeriği alındı, uzunluk:', formContent.length);

    console.log('✅ Veriler kontrol edildi, PDF oluşturuluyor...');

  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.width;
  const pageHeight = pdf.internal.pageSize.height;
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  const safeBottomMargin = 30;
  const maxY = pageHeight - safeBottomMargin;
  let yPosition = 30;
  
  // Gelişmiş sayfa kontrolü
  const checkNewPageNeeded = (neededHeight: number) => {
    return yPosition + neededHeight > maxY;
  };
  
  const addNewPageIfNeeded = (neededHeight: number) => {
    if (checkNewPageNeeded(neededHeight)) {
      pdf.addPage();
      yPosition = 30;
      return true;
    }
    return false;
  };
  
  // Modern metin bloku ekleme
  const addTextBlock = (
    text: string, 
    fontSize: number = 10, 
    fontWeight: string = 'normal', 
    isTitle: boolean = false, 
    color: number[] = [0, 0, 0],
    backgroundColor?: number[]
  ) => {
    pdf.setFontSize(fontSize);
    pdf.setFont('helvetica', fontWeight);
    pdf.setTextColor(color[0], color[1], color[2]);
    
    const lines = pdf.splitTextToSize(text, contentWidth - 20);
    const lineHeight = fontSize * 0.75;
    const totalHeight = lines.length * lineHeight + (isTitle ? 20 : 10);
    
    // Sayfa kontrolü
    addNewPageIfNeeded(totalHeight);
    
    // Başlık için modern arka plan
    if (backgroundColor) {
      pdf.setFillColor(backgroundColor[0], backgroundColor[1], backgroundColor[2]);
      pdf.roundedRect(margin - 5, yPosition - 8, contentWidth + 10, totalHeight - 2, 3, 3, 'F');
    }
    
    // Gölge efekti için
    if (isTitle && fontSize > 12) {
      pdf.setFillColor(0, 0, 0, 0.1);
      pdf.roundedRect(margin - 3, yPosition - 6, contentWidth + 6, totalHeight - 4, 3, 3, 'F');
    }
    
    pdf.text(lines, margin + (backgroundColor ? 10 : 0), yPosition + 5);
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
  
  // Modern çizgi ekleme
  const addLine = (color: number[] = [220, 220, 220], thickness: number = 0.5) => {
    addNewPageIfNeeded(10);
    pdf.setDrawColor(color[0], color[1], color[2]);
    pdf.setLineWidth(thickness);
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;
  };
  
  // Modern başlık tasarımı
  addNewPageIfNeeded(60);
  
  // Gradient arka plan efekti
  pdf.setFillColor(59, 130, 246);
  pdf.roundedRect(margin - 15, yPosition - 15, contentWidth + 30, 50, 8, 8, 'F');
  
  pdf.setFillColor(30, 64, 175);
  pdf.roundedRect(margin - 10, yPosition - 10, contentWidth + 20, 40, 6, 6, 'F');
  
  pdf.setFontSize(22);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255);
  pdf.text('ÖN BİLGİLENDİRME FORMU', pageWidth / 2, yPosition + 8, { align: 'center' });
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(245, 245, 245);
  pdf.text('(6502 Sayılı Tüketicinin Korunması Hakkında Kanun Kapsamında)', pageWidth / 2, yPosition + 22, { align: 'center' });
  yPosition += 50;
  
  addSpacing(10);
  
  // Modern bilgi kutusu
  const currentDate = new Date().toLocaleDateString('tr-TR');
  pdf.setFillColor(241, 245, 249);
  pdf.roundedRect(margin, yPosition, contentWidth, 25, 4, 4, 'F');
  
  pdf.setFontSize(9);
  pdf.setTextColor(71, 85, 105);
  pdf.text(`📅 Belge Tarihi: ${currentDate}`, margin + 10, yPosition + 8);
  pdf.text(`🌐 IP Adresi: ${orderData.contract_ip_address || 'Bilinmiyor'}`, margin + 10, yPosition + 18);
  yPosition += 35;
  
  // Modern bölüm başlığı
  addTextBlock('🏢 SATICI FİRMA BİLGİLERİ', 14, 'bold', true, [255, 255, 255], [59, 130, 246]);
  
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
  
  addSpacing(15);
  addTextBlock('👤 ALICI MÜŞTERİ BİLGİLERİ', 14, 'bold', true, [255, 255, 255], [34, 197, 94]);
  
  const customerInfo = [
    `Ad Soyad: ${orderData.customer_name}`,
    `E-posta Adresi: ${orderData.customer_email}`,
    `Telefon Numarası: ${orderData.customer_phone}`,
    `TC Kimlik No: ${orderData.customer_tc_no || 'Belirtilmemiş'}`,
    `Teslimat Adresi: ${orderData.customer_address || 'Belirtilmemiş'}, ${orderData.customer_city || ''}`,
    `Fatura Adresi: ${orderData.customer_address || 'Belirtilmemiş'}, ${orderData.customer_city || ''}`
  ];
  
  if (orderData.customer_type === 'company') {
    customerInfo.push(`Müşteri Tipi: Kurumsal`);
  } else {
    customerInfo.push(`Müşteri Tipi: Bireysel`);
  }
  
  customerInfo.forEach((info) => {
    addTextBlock(info, 10);
  });
  
  addSpacing(5);
  
  addSpacing(15);
  
  addTextBlock('📋 HİZMET BİLGİLERİ VE SÖZLEŞME KONUSU', 14, 'bold', true, [255, 255, 255], [239, 68, 68]);
  
  const serviceInfo = [
    `Hizmet Adı: ${orderData.package_name}`,
    `Hizmet Açıklaması: Dijital sağlık platformu kullanım hakkı ve profesyonel doktor profili yönetimi`,
    `Hizmet Süresi: 12 (On İki) Ay`,
    `Toplam Hizmet Bedeli: ${orderData.amount.toLocaleString('tr-TR')} TL (KDV Dahil)`,
    `Ödeme Şekli: ${orderData.payment_method === 'creditCard' ? 'Kredi Kartı/Banka Kartı ile Aylık Otomatik Tahsilat' : 'Banka Havalesi/EFT ile Aylık Manuel Ödeme'}`,
    'KDV Oranı: %20',
    'Para Birimi: Türk Lirası (TL)'
  ];
  
  serviceInfo.forEach((info) => {
    addTextBlock(info, 10);
  });

  addSpacing(15);
  
  // SÖZLEŞME İÇERİĞİ - Form tablosundan alınan içerik
  addTextBlock('📄 SÖZLEŞME İÇERİĞİ', 14, 'bold', true, [255, 255, 255], [168, 85, 247]);
  
  // HTML içeriğini temizle ve düz metne çevir
  const cleanContent = formContent
    .replace(/<[^>]*>/g, '') // HTML etiketlerini kaldır
    .replace(/&nbsp;/g, ' ') // &nbsp; karakterlerini boşluk yap
    .replace(/&amp;/g, '&') // HTML entity'lerini düzelt
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
  
  // İçeriği satır satır böl ve ekle
  const lines = cleanContent.split('\n');
  lines.forEach((line) => {
    const trimmedLine = line.trim();
    if (trimmedLine) {
      // Başlık kontrolü - büyük harfler ve uzun satırlar
      const isTitle = trimmedLine.length > 15 && trimmedLine === trimmedLine.toUpperCase();
      // Madde başlığı kontrolü - sayı ile başlayanlar
      const isArticle = /^\d+\./.test(trimmedLine);
      
      if (isTitle) {
        addSpacing(10);
        addTextBlock(trimmedLine, 12, 'bold', false, [30, 58, 138]);
        addSpacing(5);
      } else if (isArticle) {
        addSpacing(8);
        addTextBlock(trimmedLine, 11, 'bold', false, [0, 0, 0]);
        addSpacing(3);
      } else {
        addTextBlock(trimmedLine, 10, 'normal', false, [0, 0, 0]);
        addSpacing(2);
      }
    } else {
      addSpacing(5);
    }
  });
  
  addSpacing(15);
  
  addTextBlock('📜 DETAYLI HİZMET KOŞULLARI VE BİLGİLERİ', 14, 'bold', true, [255, 255, 255], [168, 85, 247]);
  
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
  
  // Modern imza sayfası
  pdf.addPage();
  yPosition = 30;
  
  // Gradient imza başlığı
  pdf.setFillColor(34, 197, 94);
  pdf.roundedRect(margin - 15, yPosition - 15, contentWidth + 30, 45, 8, 8, 'F');
  
  pdf.setFillColor(16, 185, 129);
  pdf.roundedRect(margin - 10, yPosition - 10, contentWidth + 20, 35, 6, 6, 'F');
  
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255);
  pdf.text('✍️ ONAY VE KABUL', pageWidth / 2, yPosition + 8, { align: 'center' });
  yPosition += 40;
  
  addSpacing(10);
  
  const acceptanceText = [
    'Bu ön bilgilendirme formunda yer alan tüm bilgileri okudum, anladım ve kabul ediyorum. Ürün/hizmet bedeli, ödeme şekli, teslimat koşulları ve diğer tüm şartlar hakkında tam bilgi sahibi olduğumu beyan ederim.',
    '',
    '6502 sayılı Tüketicinin Korunması Hakkında Kanun kapsamındaki cayma hakkım konusunda bilgilendirildiğimi, bu hakkımı 14 gün içerisinde kullanabileceğimi bildiğimi onaylıyorum.',
    '',
    'Bu belge elektronik ortamda düzenlenmiş olup, 5070 sayılı Elektronik İmza Kanunu kapsamında geçerlidir.',
    '',
    `Kabul Tarihi: ${currentDate}`,
    `Kabul Saati: ${new Date().toLocaleTimeString('tr-TR')}`,
    `IP Adresi: ${orderData.contract_ip_address || 'Bilinmiyor'}`,
    '',
    'MÜŞTERİ BİLGİLERİ VE DİJİTAL ONAYI:',
    `Ad Soyad: ${orderData.customer_name}`,
    `E-posta: ${orderData.customer_email}`,
    `Telefon: ${orderData.customer_phone}`,
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
  
  console.log('✅ PDF başarıyla oluşturuldu');
  return pdf;
  
  } catch (error) {
    console.error('❌ PDF oluşturma hatası:', error);
    throw new Error(`PDF dosyası oluşturulurken hata oluştu: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
  }
};

export const generateDistanceSalesPDF = (
  customerData: CustomerData,
  packageData: PackageData,
  paymentMethod: string,
  customerType: string,
  clientIP: string
) => {
  // Basit bir mesafeli satış PDF'i oluşturma fonksiyonu
  const pdf = new jsPDF();
  
  pdf.setFontSize(20);
  pdf.text('MESAFELİ SATIŞ SÖZLEŞMESİ', 20, 30);
  
  pdf.setFontSize(12);
  pdf.text(`Müşteri: ${customerData.name} ${customerData.surname}`, 20, 60);
  pdf.text(`Hizmet: ${packageData.name}`, 20, 80);
  pdf.text(`Fiyat: ${packageData.price} TL`, 20, 100);
  
  return pdf;
};

// Word document generator for pre-info form with content from database
export const generatePreInfoWord = async (
  customerData: CustomerData,
  packageData: PackageData,
  paymentMethod: string,
  customerType: string,
  clientIP: string
) => {
  // Import supabase here to avoid issues
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    'https://zqtfqekmtxltaydbxrkv.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxdGZxZWttdHhsdGF5ZGJ4cmt2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU2NjI2NTcsImV4cCI6MjA1MTIzODY1N30.hs4VbGklGdwZe5KEFrvPOGhGm8BnHk2zfCJRlwFxazM'
  );

  // Get form content from database
  const { data: formData, error } = await supabase
    .from('form_contents')
    .select('content')
    .eq('form_type', 'pre_info')
    .single();

  if (error) {
    console.error('Form içeriği alınamadı:', error);
  }

  const formContent = formData?.content || 'DOKTORUM OL ÜYELİK SÖZLEŞMESİ';
  
  // Clean HTML content and split into lines
  const cleanContent = formContent.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
  
  // Split content into lines and filter out undefined
  const lines = cleanContent.split('\n').filter(line => line !== undefined);
  
  const paragraphs = [];
  
  // Modern title section with customer and package info
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "ÖN BİLGİLENDİRME FORMU",
          bold: true,
          size: 36,
          color: "000000"
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
    })
  );
  

  // Customer Information Section
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "MÜŞTERİ BİLGİLERİ",
          bold: true,
          size: 24,
          color: "000000"
        }),
      ],
      alignment: AlignmentType.LEFT,
      spacing: { before: 400, after: 300 },
    })
  );

  const customerInfoLines = [
    `Müşteri Adı: ${customerData.name} ${customerData.surname}`,
    `E-posta: ${customerData.email}`,
    `Telefon: ${customerData.phone}`,
    `TC Kimlik No: ${customerData.tcNo}`,
    `Adres: ${customerData.address}, ${customerData.city} ${customerData.postalCode}`
  ];

  customerInfoLines.forEach(line => {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: line,
            size: 20,
          }),
        ],
        spacing: { after: 150 },
      })
    );
  });

  // Package Information Section
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "PAKET BİLGİLERİ",
          bold: true,
          size: 24,
          color: "000000"
        }),
      ],
      alignment: AlignmentType.LEFT,
      spacing: { before: 400, after: 300 },
    })
  );

  const packageInfoLines = [
    `Seçilen Paket: ${packageData.name}`,
    `Paket Fiyatı: ${packageData.price.toLocaleString('tr-TR')} TL`,
    `Ödeme Yöntemi: ${paymentMethod === 'creditCard' ? 'Kredi Kartı' : 'Banka Transferi'}`,
    `Müşteri Tipi: ${customerType === 'individual' ? 'Bireysel' : 'Kurumsal'}`,
    `Belge Tarihi: ${new Date().toLocaleDateString('tr-TR')}`,
    `IP Adresi: ${clientIP}`
  ];

  packageInfoLines.forEach(line => {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: line,
            size: 20,
          }),
        ],
        spacing: { after: 150 },
      })
    );
  });

  // Contract Content Header
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "DOKTORUM OL ÜYELİK SÖZLEŞMESİ",
          bold: true,
          size: 24,
          color: "000000"
        }),
      ],
      alignment: AlignmentType.LEFT,
      spacing: { before: 600, after: 400 },
    })
  );

  // Each line as a paragraph with proper spacing
  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    
    // Empty lines for spacing
    if (trimmedLine === '') {
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text: "", size: 20 })],
          spacing: { after: 200 },
        })
      );
      return;
    }
    
    // Main titles (uppercase and long lines)
    const isMainTitle = trimmedLine.length > 10 && trimmedLine === trimmedLine.toUpperCase() && 
                        (trimmedLine.includes('DOKTORUM OL') || 
                         trimmedLine.includes('TARAFLAR') || 
                         trimmedLine.includes('AMAÇ VE KONU') ||
                         trimmedLine.includes('TANIMLAR') ||
                         trimmedLine.includes('HAK VE YÜKÜMLÜLÜK') ||
                         trimmedLine.includes('KİŞİSEL VERİLER') ||
                         trimmedLine.includes('HİZMET BEDELİ') ||
                         trimmedLine.includes('SÜRE VE FESİH') ||
                         trimmedLine.includes('GİZLİLİK') ||
                         trimmedLine.includes('MÜCBİR SEBEPLER') ||
                         trimmedLine.includes('FİKRİ MÜLKİYET') ||
                         trimmedLine.includes('ÇEŞİTLİ HÜKÜMLER') ||
                         trimmedLine.includes('AYDINLATMA METNİ') ||
                         trimmedLine.includes('RIZA METNİ'));
    
    // Article titles (start with number)
    const isArticleTitle = /^\d+\.(?!\d)/.test(trimmedLine);
    
    // Sub articles (start with number.number)
    const isSubArticle = /^\d+\.\d+/.test(trimmedLine);
    
    let fontSize = 20;
    let bold = false;
    let spacing = { before: 200, after: 200 };
    let color = "000000";
    
    if (isMainTitle) {
      fontSize = 28;
      bold = true;
      spacing = { before: 800, after: 600 };
      color = "000000";
    } else if (isArticleTitle) {
      fontSize = 24;
      bold = true;
      spacing = { before: 600, after: 400 };
      color = "000000";
    } else if (isSubArticle) {
      fontSize = 22;
      bold = true;
      spacing = { before: 400, after: 300 };
      color = "000000";
    }
    
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: trimmedLine,
            bold: bold,
            size: fontSize,
            color: color,
          }),
        ],
        spacing: spacing,
      })
    );
  });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440,    // 1 inch
              right: 1440,  // 1 inch  
              bottom: 1440, // 1 inch
              left: 1440,   // 1 inch
            },
          },
        },
        children: paragraphs,
      },
    ],
  });

  return await Packer.toBlob(doc);
};

// Function to download Word document
export const downloadPreInfoWord = async (
  customerData: CustomerData,
  packageData: PackageData,
  paymentMethod: string,
  customerType: string,
  clientIP: string
) => {
  try {
    const blob = await generatePreInfoWord(customerData, packageData, paymentMethod, customerType, clientIP);
    
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `on-bilgi-formu-${customerData.name}-${customerData.surname}.docx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Word dosyası oluşturulurken hata:', error);
    throw error;
  }
};