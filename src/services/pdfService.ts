import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel } from 'docx';

// Türkçe karakterler için DejaVu Sans font import
import 'jspdf-fonts/DejaVuSans-Bold/DejaVuSans-Bold';
import 'jspdf-fonts/DejaVuSans/DejaVuSans';

// Font declarations for TypeScript
declare module 'jspdf' {
  interface jsPDF {
    addFileToVFS(filename: string, content: string): void;
    addFont(filename: string, fontName: string, fontStyle: string): void;
  }
}

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

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    // Türkçe karakterler için DejaVu Sans font ekle
    doc.addFont('DejaVuSans.ttf', 'DejaVuSans', 'normal');
    doc.addFont('DejaVuSans-Bold.ttf', 'DejaVuSans', 'bold');
    
    // PDF metadatalarını ayarla
    doc.setProperties({
      title: `Ön Bilgilendirme Formu - ${orderData.customer_name}`,
      subject: `Sipariş: ${orderData.id}`,
      author: 'Doktorum Ol',
      creator: 'Doktorum Ol System'
    });

    // Sayfa boyutları ve marjinlar
    let yPosition = 25;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginLeft = 20;
    const marginRight = 20;
    const contentWidth = pageWidth - marginLeft - marginRight;

    // Yardımcı fonksiyonlar
    const addTextBlock = (text: string, size = 11, style = 'normal', center = false, textColor = [0, 0, 0]) => {
      // Türkçe karakterler için DejaVu Sans font kullan
      try {
        if (style === 'bold') {
          doc.setFont('DejaVuSans', 'bold');
        } else {
          doc.setFont('DejaVuSans', 'normal');
        }
      } catch (e) {
        // Fallback to helvetica if DejaVu Sans is not available
        if (style === 'bold') {
          doc.setFont('helvetica', 'bold');
        } else {
          doc.setFont('helvetica', 'normal');
        }
      }
      
      doc.setFontSize(size);
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      
      // Metin satırlarına böl
      const lines = doc.splitTextToSize(text, contentWidth - 10);
      
      lines.forEach((line: string) => {
        // Sayfa sonu kontrolü
        if (yPosition > pageHeight - 25) {
          doc.addPage();
          yPosition = 25;
        }
        
        // Ortalama veya sol hizalama
        let xPos = marginLeft;
        if (center) {
          const textWidth = doc.getTextWidth(line);
          xPos = (pageWidth - textWidth) / 2;
        }
        
        doc.text(line, xPos, yPosition);
        yPosition += size * 0.5 + 1;
      });
    };

    const addSpacing = (space: number) => {
      yPosition += space;
    };

    const addBlueBox = (content: string[], title: string) => {
      // Başlık kutusu
      doc.setFillColor(33, 150, 243); // Mavi arka plan
      doc.setTextColor(255, 255, 255); // Beyaz yazı
      
      // Türkçe karakterler için font ayarla
      try {
        doc.setFont('DejaVuSans', 'bold');
      } catch (e) {
        doc.setFont('helvetica', 'bold');
      }
      doc.setFontSize(12);
      
      const titleHeight = 10;
      const boxWidth = contentWidth;
      doc.rect(marginLeft, yPosition - 2, boxWidth, titleHeight, 'F');
      doc.text(title, marginLeft + 5, yPosition + 6);
      yPosition += titleHeight + 2;
      
      // İçerik kutusu
      doc.setDrawColor(33, 150, 243);
      doc.setLineWidth(0.5);
      const contentStartY = yPosition;
      
      doc.setTextColor(0, 0, 0);
      try {
        doc.setFont('DejaVuSans', 'normal');
      } catch (e) {
        doc.setFont('helvetica', 'normal');
      }
      doc.setFontSize(11);
      
      content.forEach((item) => {
        if (yPosition > pageHeight - 25) {
          doc.addPage();
          yPosition = 25;
        }
        doc.text(item, marginLeft + 5, yPosition);
        yPosition += 7;
      });
      
      yPosition += 3;
      const boxHeight = yPosition - contentStartY;
      doc.rect(marginLeft, contentStartY - 2, boxWidth, boxHeight, 'S');
      
      addSpacing(15);
    };

    // BAŞLIK - Ortalanmış
    addTextBlock('ÖN BİLGİLENDİRME FORMU', 18, 'bold', true, [33, 150, 243]);
    addSpacing(25);

    // MÜŞTERİ BİLGİLERİ
    const customerInfo = [
      `Müşteri Adı: ${orderData.customer_name}`,
      `E-posta: ${orderData.customer_email}`,
      `Telefon: ${orderData.customer_phone || 'Belirtilmemiş'}`,
      `TC Kimlik No: ${orderData.customer_tc_no || 'Belirtilmemiş'}`,
      `Adres: ${orderData.customer_address || 'Belirtilmemiş'}`,
      `Şehir: ${orderData.customer_city || 'Belirtilmemiş'}`,
      `Müşteri Tipi: ${orderData.customer_type === 'corporate' ? 'Kurumsal' : 'Bireysel'}`
    ];
    
    addBlueBox(customerInfo, 'MÜŞTERİ BİLGİLERİ:');

    // PAKET BİLGİLERİ
    const paymentMethodText = orderData.payment_method === 'bank_transfer' ? 'Banka Havalesi/EFT' : 
                             orderData.payment_method === 'credit_card' ? 'Kredi Kartı' : 
                             orderData.payment_method;
    
    const packageInfo = [
      `Seçilen Paket: ${orderData.package_name}`,
      `Fiyat: ${orderData.amount} ₺`,
      `Ödeme Yöntemi: ${paymentMethodText}`
    ];
    
    addBlueBox(packageInfo, 'PAKET BİLGİLERİ:');

    // TARİHLER
    const createdDate = new Date(orderData.created_at).toLocaleDateString('tr-TR');
    const createdDateTime = new Date(orderData.created_at).toLocaleString('tr-TR');
    
    const dateInfo = [
      `Sözleşme Oluşturulma Tarihi: ${createdDate}`,
      `Dijital Onaylama Tarihi: ${createdDateTime}`
    ];
    
    addBlueBox(dateInfo, 'TARİHLER:');

    // SÖZLEŞME İÇERİĞİ BAŞLIĞI - Ortalanmış
    addSpacing(15);
    addTextBlock('DOKTORUM OL ÜYELİK SÖZLEŞMESİ', 16, 'bold', true, [0, 0, 0]);
    addSpacing(20);
    
    // Form içeriğini ekle - HTML etiketlerini temizle ve düzenle
    if (formContent && formContent !== 'DOKTORUM OL ÜYELİK SÖZLEŞMESİ') {
      const cleanContent = formContent
        .replace(/<p><br><\/p>/g, '\n')
        .replace(/<br>/g, '\n')
        .replace(/<\/p><p>/g, '\n\n')
        .replace(/<p>/g, '')
        .replace(/<\/p>/g, '\n')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .trim();
      
      const lines = cleanContent.split('\n');
      
      lines.forEach((line, index) => {
        const trimmedLine = line.trim();
        
        // Boş satırları atla
        if (!trimmedLine) {
          addSpacing(5);
          return;
        }
        
        // Ana başlıklar (büyük harflerle yazılmış uzun satırlar)
        const isMainTitle = trimmedLine.length > 15 && 
                           (trimmedLine.includes('DOKTORUM OL ÜYELİK SÖZLEŞMESİ') ||
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
        
        // Madde başlıkları (sayı ile başlayan)
        const isArticle = /^\d+\.(?!\d)/.test(trimmedLine);
        
        // Alt maddeler (sayı.sayı ile başlayan)
        const isSubArticle = /^\d+\.\d+/.test(trimmedLine);
        
        if (isMainTitle) {
          addSpacing(15);
          addTextBlock(trimmedLine, 14, 'bold', false, [33, 150, 243]);
          addSpacing(10);
        } else if (isArticle) {
          addSpacing(10);
          addTextBlock(trimmedLine, 12, 'bold', false, [0, 0, 0]);
          addSpacing(5);
        } else if (isSubArticle) {
          addSpacing(8);
          addTextBlock(trimmedLine, 11, 'bold', false, [0, 0, 0]);
          addSpacing(5);
        } else {
          addTextBlock(trimmedLine, 10, 'normal', false, [0, 0, 0]);
          addSpacing(4);
        }
      });
    }

    console.log('✅ PDF başarıyla oluşturuldu');
    return doc;
  
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