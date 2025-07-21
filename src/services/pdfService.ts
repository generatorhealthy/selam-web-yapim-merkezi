
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
  pdf.addFont('Arial', 'Arial', 'normal');
  pdf.setFont('Arial');
  
  const pageWidth = pdf.internal.pageSize.width;
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let yPosition = 30;
  
  // Header
  pdf.setFontSize(18);
  pdf.setFont('Arial', 'bold');
  pdf.text('ÖN BİLGİLENDİRME FORMU', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 10;
  
  pdf.setFontSize(12);
  pdf.setFont('Arial', 'normal');
  pdf.text('(6502 Sayılı Tüketicinin Korunması Hakkında Kanun Kapsamında)', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 20;
  
  // Date and IP info
  const currentDate = new Date().toLocaleDateString('tr-TR');
  pdf.text(`Belge Tarihi: ${currentDate}`, margin, yPosition);
  yPosition += 8;
  pdf.text(`IP Adresi: ${clientIP}`, margin, yPosition);
  yPosition += 15;
  
  // Seller information section
  pdf.setFont('Arial', 'bold');
  pdf.text('SATICI FİRMA BİLGİLERİ', margin, yPosition);
  pdf.setFont('Arial', 'normal');
  yPosition += 12;
  
  const sellerInfo = [
    'Ünvan: DoktorumOL Dijital Sağlık Hizmetleri',
    'Adres: İstanbul, Türkiye',
    'Telefon: +90 216 706 06 11',
    'E-posta: info@doktorumol.com.tr',
    'Web Sitesi: www.doktorumol.com.tr'
  ];
  
  sellerInfo.forEach((info) => {
    pdf.text(info, margin, yPosition);
    yPosition += 8;
  });
  
  yPosition += 10;
  
  // Customer information section
  pdf.setFont('Arial', 'bold');
  pdf.text('ALICI MÜŞTERİ BİLGİLERİ', margin, yPosition);
  pdf.setFont('Arial', 'normal');
  yPosition += 12;
  
  const customerInfo = [
    `Ad Soyad: ${customerData.name} ${customerData.surname}`,
    `E-posta Adresi: ${customerData.email}`,
    `Telefon Numarası: ${customerData.phone}`,
    `TC Kimlik No: ${customerData.tcNo}`,
    `Adres: ${customerData.address}, ${customerData.city}`
  ];
  
  if (customerType === 'company' && customerData.companyName) {
    customerInfo.push(`Firma Adı: ${customerData.companyName}`);
    customerInfo.push(`Vergi No: ${customerData.taxNo}`);
    customerInfo.push(`Vergi Dairesi: ${customerData.taxOffice}`);
  }
  
  customerInfo.forEach((info) => {
    pdf.text(info, margin, yPosition);
    yPosition += 8;
  });
  
  yPosition += 10;
  
  // Service information
  pdf.setFont('Arial', 'bold');
  pdf.text('HİZMET BİLGİLERİ VE SÖZLEŞME KONUSU', margin, yPosition);
  pdf.setFont('Arial', 'normal');
  yPosition += 12;
  
  const serviceInfo = [
    `Hizmet Adı: ${packageData.name}`,
    'Hizmet Açıklaması: DoktorumOL dijital sağlık platformunda profesyonel doktor profili oluşturma ve yönetme hizmetleri',
    'Hizmet Süresi: 12 (On İki) Ay',
    `Aylık Hizmet Bedeli: ${packageData.price.toLocaleString('tr-TR')} TL (KDV Dahil)`,
    `Toplam Hizmet Bedeli: ${(packageData.price * 12).toLocaleString('tr-TR')} TL (KDV Dahil)`,
    `Ödeme Şekli: ${paymentMethod === 'credit_card' ? 'Kredi Kartı ile Aylık Otomatik Tahsilat' : 'Banka Havalesi/EFT ile Aylık Manuel Ödeme'}`,
    'KDV Oranı: %20',
    'Para Birimi: Türk Lirası (TL)'
  ];
  
  serviceInfo.forEach((info) => {
    if (yPosition > 250) {
      pdf.addPage();
      yPosition = 30;
    }
    pdf.text(info, margin, yPosition);
    yPosition += 8;
  });
  
  // Check if we need a new page
  if (yPosition > 230) {
    pdf.addPage();
    yPosition = 30;
  }
  
  yPosition += 15;
  
  // CAYMA HAKKI section
  pdf.setFont('Arial', 'bold');
  pdf.text('CAYMA HAKKI', margin, yPosition);
  pdf.setFont('Arial', 'normal');
  yPosition += 15;
  
  const caymaHakki = [
    'Alıcı, 6502 sayılı Tüketicinin Korunması Hakkında Kanun kapsamında, sözleşme tarihinden itibaren 14 (on dört) gün içerisinde herhangi bir gerekçe göstermeksizin ve cezai şart ödemeksizin bu sözleşmeden cayma hakkına sahiptir.',
    '',
    'Cayma hakkının kullanılması için bu süre içerisinde satıcıya yazılı olarak bildirim yapılması yeterlidir. Cayma bildirimi info@doktorumol.com.tr e-posta adresine veya kayıtlı adrese yazılı olarak yapılabilir.',
    '',
    'Cayma hakkının kullanılması halinde, alıcı tarafından ödenen tüm bedeller 10 (on) gün içerisinde iade edilir.'
  ];
  
  caymaHakki.forEach((text) => {
    if (text === '') {
      yPosition += 5;
      return;
    }
    
    if (yPosition > 250) {
      pdf.addPage();
      yPosition = 30;
    }
    
    const lines = pdf.splitTextToSize(text, contentWidth);
    pdf.text(lines, margin, yPosition);
    yPosition += lines.length * 6 + 3;
  });
  
  // Add new page for signature section
  pdf.addPage();
  yPosition = 30;
  
  // Signature section
  pdf.setFont('Arial', 'bold');
  pdf.text('ONAY VE KABUL', margin, yPosition);
  pdf.setFont('Arial', 'normal');
  yPosition += 15;
  
  const acceptanceText = [
    'Bu ön bilgilendirme formunda yer alan tüm bilgileri okudum, anladım ve kabul ediyorum. Hizmet bedeli, ödeme şekli, teslimat koşulları ve diğer tüm şartlar hakkında tam bilgi sahibi olduğumu beyan ederim.',
    '',
    '6502 sayılı Tüketicinin Korunması Hakkında Kanun kapsamındaki cayma hakkım konusunda bilgilendirildiğimi, bu hakkımı 14 gün içerisinde kullanabileceğimi bildiğimi onaylıyorum.',
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
    'DİJİTAL İMZA: Bu belge elektronik ortamda kabul edilmiş ve dijital olarak imzalanmıştır.'
  ];
  
  acceptanceText.forEach((text) => {
    if (text === '') {
      yPosition += 5;
      return;
    }
    
    const lines = pdf.splitTextToSize(text, contentWidth);
    pdf.text(lines, margin, yPosition);
    yPosition += lines.length * 6 + 3;
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
  pdf.addFont('Arial', 'Arial', 'normal');
  pdf.setFont('Arial');
  
  const pageWidth = pdf.internal.pageSize.width;
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let yPosition = 30;
  
  // Header
  pdf.setFontSize(18);
  pdf.setFont('Arial', 'bold');
  pdf.text('DOKTORUM OL ÜYELİK SÖZLEŞMESİ', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 20;
  
  // Date and contract info
  const currentDate = new Date().toLocaleDateString('tr-TR');
  pdf.setFontSize(12);
  pdf.setFont('Arial', 'normal');
  pdf.text(`Sözleşme Tarihi: ${currentDate}`, margin, yPosition);
  yPosition += 8;
  pdf.text(`IP Adresi: ${clientIP}`, margin, yPosition);
  yPosition += 8;
  pdf.text(`Sözleşme No: DOL-${Date.now()}`, margin, yPosition);
  yPosition += 15;

  // 1. HİZMET ALAN'IN ÜYELİK PAKETİ VE ÖZELLİKLERİ
  pdf.setFont('Arial', 'bold');
  pdf.text('1. HİZMET ALAN\'IN ÜYELİK PAKETİ VE ÖZELLİKLERİ', margin, yPosition);
  pdf.setFont('Arial', 'normal');
  yPosition += 12;
  
  const uyelikBilgisi = [
    '1.1 Bu Sözleşme gereği, Hizmet Alan, Üyelik hizmetleri dahilinde Doktorum Ol tarafından sunulan hizmetleri, talep ettiği şekilde almayı kabul eder ve beyan eder. Doktorum Ol, bu Sözleşme çerçevesinde Hizmet Alan\'a satın aldığı abonelikte bulunan hizmetleri sunmayı taahhüt eder.',
    '',
    `Müşteri: ${customerData.name} ${customerData.surname}`,
    `E-posta: ${customerData.email}`,
    `Telefon: ${customerData.phone}`,
    `TC Kimlik No: ${customerData.tcNo}`,
    `Adres: ${customerData.address}, ${customerData.city}`,
    ''
  ];

  if (customerType === 'company' && customerData.companyName) {
    uyelikBilgisi.push(`Firma Adı: ${customerData.companyName}`);
    uyelikBilgisi.push(`Vergi No: ${customerData.taxNo}`);
    uyelikBilgisi.push(`Vergi Dairesi: ${customerData.taxOffice}`);
    uyelikBilgisi.push('');
  }

  uyelikBilgisi.push(`Seçilen Paket: ${packageData.name}`);
  uyelikBilgisi.push(`Aylık Hizmet Bedeli: ${packageData.price.toLocaleString('tr-TR')} TL`);
  uyelikBilgisi.push(`Hizmet Süresi: 12 Ay`);
  uyelikBilgisi.push(`Ödeme Yöntemi: ${paymentMethod === 'credit_card' ? 'Kredi Kartı' : 'Banka Havalesi'}`);

  uyelikBilgisi.forEach((text) => {
    if (text === '') {
      yPosition += 5;
      return;
    }
    
    if (yPosition > 250) {
      pdf.addPage();
      yPosition = 30;
    }
    
    const lines = pdf.splitTextToSize(text, contentWidth);
    pdf.text(lines, margin, yPosition);
    yPosition += lines.length * 6 + 3;
  });

  // Check if we need a new page
  if (yPosition > 220) {
    pdf.addPage();
    yPosition = 30;
  }

  yPosition += 10;

  // 2. TARAFLAR
  pdf.setFont('Arial', 'bold');
  pdf.text('2. TARAFLAR', margin, yPosition);
  pdf.setFont('Arial', 'normal');
  yPosition += 12;
  
  const taraflarText = 'Bu Sözleşme çerçevesinde, Doktorum Ol Sitesi ve Hizmet Alan birlikte "Taraflar" olarak adlandırılacaktır.';
  const taraflarLines = pdf.splitTextToSize(taraflarText, contentWidth);
  pdf.text(taraflarLines, margin, yPosition);
  yPosition += taraflarLines.length * 6 + 10;

  // 3. AMAÇ VE KONU
  pdf.setFont('Arial', 'bold');
  pdf.text('3. AMAÇ VE KONU', margin, yPosition);
  pdf.setFont('Arial', 'normal');
  yPosition += 12;
  
  const amacText = 'Bu sözleşmenin temel amacı, Doktorum Ol\'un Premium Üyelik hizmetlerinden faydalanmak isteyen kişi adına Doktorum Ol tarafından www.doktorumol.com.tr alan adındaki web sitesinde bir profil oluşturulmasıdır. Premium Üyelik paketi kapsamında sunulan hizmetler, bu sözleşme ile belirtilen şekilde Doktorum Ol tarafından sunulacak ve karşılığında Hizmet Alan kişinin bu sözleşmede belirtilen hizmet ücretini Doktorum Ol sitesine ödemesi gerekmektedir. Bu sözleşme, tarafların karşılıklı hak ve yükümlülüklerini düzenleyen bir anlaşma olarak kabul edilir ve bu amaç doğrultusunda yürürlüktedir.';
  const amacLines = pdf.splitTextToSize(amacText, contentWidth);
  pdf.text(amacLines, margin, yPosition);
  yPosition += amacLines.length * 6 + 15;

  // Check if we need a new page
  if (yPosition > 230) {
    pdf.addPage();
    yPosition = 30;
  }

  // Continue with remaining sections - Ana sözleşme metnini parçalara böleceğim
  const sectionTexts = [
    {
      title: '4. TANIMLAR',
      content: 'İşbu Sözleşmedeki tanımlar aşağıdaki gibidir;\nFikri Mülkiyet Doktorum Ol\'un sahip olduğu veya kullanıldığı veya işlerinin yürütülmesi için gerekli olan dünya çapında mevcut veya gelecekte mevcut olabilecek her türlü ticaret markasını, ticari unvanı, hizmet markasını, patentleri, ticaret, faaliyet ve alan adlarını, URL\'leri, tasarımları, telif haklarını, spesifikasyonları, yazılımları, ifşa edilmemiş ve gizli bilgi niteliğindeki hakları ifade eder.\n\n"Hizmet", bu Sözleşme uyarınca Hizmet Alan\'ın talebine bağlı olarak oluşturulan üyelik paketi kapsamında Hizmet Alan\'a sunulan; (i) ayrıntılı profil, (ii) soru cevap uygulaması, (iii) makale yayınlama, (iv) video yayınlama, (v) online randevu, (vi) kişiye özel 850\'li hat entegrasyonu, randevu yönetimi hizmetlerinin tamamını veya bir kısmını ifade eder.\n\n"Premium Üyelik", bu Sözleşme kapsamında Doktorum Ol\'un sağladığı Hizmetler\'den faydalanmak için gereken ve Hizmet Alan\'ın dahil olduğu üyelik türünü ifade eder.\n\n"Web Sitesi", Hizmetler\'in sunulacağı, Doktorum Ol Sitesine ait www.doktorumol.com.tr alan adlı internet sitesini ifade eder.'
    },
    {
      title: '5. TARAFLARIN HAK VE YÜKÜMLÜLÜKLERİ',
      content: '5.1: Doktorum Ol, bu Sözleşme\'nin İmza Tarihi\'nden itibaren Premium Üyelik kapsamında yer alan Hizmetleri Hizmet Alan\'a sunmayı taahhüt eder. Taraflar arasındaki anlaşma gereği, Doktorum Ol doğrudan bir Hizmet sunumu yapmayacak; bunun yerine Hizmet Alan, kendi isteği doğrultusunda Sözleşme kapsamındaki Hizmetlerden istediği zaman yararlanabilecektir.\n\n5.2: Doktorum Ol, Web Sitesi üzerinde Hizmet Alan ile birlikte bir profil oluşturacak ve bu profil üzerinde Hizmet Alan\'ın ve gerekirse kurumunda/iş yerinde çalışan bağlı sağlık çalışanlarının bilgilerini paylaşacaktır.\n\n5.3. Doktorum Ol, işbu Sözleşme kapsamında sunulan Hizmetlerin yanı sıra Hizmet Alan tarafından istenmesi durumunda, ek bir ücret karşılığında, işbu Sözleşme süresince Sözleşme konusu Hizmetlerle ilgili olarak iş günleri ve mesai saatleri içinde çağrı merkezi hizmeti ve müşteri hizmeti desteği sunmayı kabul eder.'
    },
    {
      title: '6. KİŞİSEL VERİLER',
      content: '6.1. Hizmet Alan, Kişisel Verileri işleme amacını belirleyen taraf olarak 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında Veri Sorumlusu olup, Sözleşme uyarınca Kişisel Verileri Doktorum Ol Sitesine aktarmak için yetkilendirdiğini kabul eder.\n\n6.2. Hizmet Alan, bu Sözleşme çerçevesinde Doktorum Ol Sitesine ilettiği veya Doktorum Ol\'un onayı ile topladığı ve Hizmet Alan adına işlediği Kişisel Veriler bakımından, Kişisel Veri sahiplerini KVKK, ilgili ikincil düzenlemeler ve Kişisel Verileri Koruma Kurulu\'nun kararlarına uygun şekilde bilgilendirme ve açık rıza alarak Doktorum Ol Sitesine Kişisel Verileri aktardığını kabul eder.'
    },
    {
      title: '7. HİZMET BEDELİ',
      content: '7.1. Bu sözleşme kapsamında sunulan hizmetler için Hizmet Alan tarafından Doktorum Ol Sitesine ödenecek hizmet bedelleri, bu sözleşmenin "Hizmet Alan\'ın Üyelik Paketi ve Özellikleri" başlıklı 1. maddesi doğrultusunda belirlenir. Hizmet bedellerine KDV dahil değildir.\n\n7.2. İlk sözleşme yılı için hizmet bedelleri, Hizmet Alan tarafından bu sözleşmenin imzalandığı tarih itibarıyla 12 aylık periyotlar halinde ödenir.'
    },
    {
      title: '8. SÜRE VE FESİH',
      content: '8.1. Bu sözleşme, imza tarihinde yürürlüğe girecek ve taraflar arasında 12 aylık bir hizmet süresi boyunca geçerli olacaktır.\n\n8.2. Hizmet alan, sözleşme süresinin sona ermesinden en az 15 gün önce Doktorum Ol Sitesine yazılı bildirimde bulunarak bu sözleşmeyi sona erdirebilir.\n\n8.3. Hizmet alan, imza tarihinden itibaren ilk 12 aylık dönem boyunca sözleşmeyi feshetmeme taahhüdünde bulunur.'
    },
    {
      title: '9. GİZLİLİK',
      content: 'Bu Sözleşme uyarınca, her iki taraf da, kendilerine sunulan bilgilerin, şirket sırları da dahil olmak üzere her türlü bilginin gizli olduğunu kabul ederler. Bu bilgileri, Sözleşme\'de belirtilen amaçlar dışında kullanmayacaklarını ve Sözleşme\'nin amacını yerine getirmek için bu bilgilere erişmesi gereken çalışanlar ve yasal makamlar dışında, diğer Taraf\'ın önceden yazılı izni olmaksızın üçüncü taraflara ifşa etmeyeceklerini taahhüt ederler.'
    },
    {
      title: '10. MÜCBİR SEBEPLER',
      content: '10.1. Taraflardan biri, bu Sözleşme\'de belirtilen yükümlülüklerini yerine getirmesi, olayların kontrolünde olmayan ve öngörülemeyecek bir mücbir sebep nedeniyle imkansız veya aşırı derecede zorlaşırsa, bu durumda ilgili Taraf, kendi kusuru olmaksızın bu yükümlülüklerini yerine getirmeme veya gecikmeden sorumlu tutulmayacaktır.'
    },
    {
      title: '11. FİKRİ MÜLKİYET',
      content: 'Doktorum Ol, bu Sözleşme kapsamında sunulan tüm Hizmetlerle ilgili olan her türlü telif hakkı, ticari marka, logo, tanıtıcı öğe, yazılım, teknik bilgi, know-how, yöntem, Web Sitesi/Hasta Takip uygulaması tasarımı ve içeriği, bilgi, buluş, metodoloji, kullanılan araçlar, kodlar, veri tabanları, hesaplama modelleri, projeksiyon analiz metotları, varsayımlar ve yaklaşımlar, bu unsurların analizleri ve bu yöntemlerle ilgili telif hakları, ticari markalar, Fikri Mülkiyet hakları ve teknik bilgiler dahil olmak üzere her türlü diğer hakların sahibidir.'
    },
    {
      title: '12. ÇEŞİTLİ HÜKÜMLER',
      content: '12.1. Taraflar, bu Sözleşme\'nin 2. maddesinde belirtilen adreslerin tebligat adresleri olduğunu kabul ederler ve bu adreslere yapılacak tebligatlar, Tarafların adres değişikliklerini noter kanalıyla bildirmemeleri durumunda geçerlilik kazanır.\n\n12.7. Taraflarca çıkarılan bu Sözleşme, kanunların ihtilaf kurallarına başvurulmadan doğrudan Türk Hukuku\'na tabi olacak ve bu hukuka uygun bir şekilde yorumlanacaktır.\n\n12.8. Bu Sözleşme ile ilgili meydana gelebilecek tüm anlaşmazlıklar, İstanbul\'un Anadolu bölgesindeki mahkemeler ve icra dairelerinde çözümlenecektir.'
    }
  ];

  // Render each section
  sectionTexts.forEach((section) => {
    // Check if we need a new page for the title
    if (yPosition > 250) {
      pdf.addPage();
      yPosition = 30;
    }

    // Add section title
    pdf.setFont('Arial', 'bold');
    pdf.text(section.title, margin, yPosition);
    pdf.setFont('Arial', 'normal');
    yPosition += 15;

    // Split content into manageable parts
    const contentLines = pdf.splitTextToSize(section.content, contentWidth);
    
    // Render content line by line
    for (let i = 0; i < contentLines.length; i++) {
      if (yPosition > 270) {
        pdf.addPage();
        yPosition = 30;
      }
      
      pdf.text(contentLines[i], margin, yPosition);
      yPosition += 6;
    }
    
    yPosition += 15; // Add spacing between sections
  });

  // Add new page for acceptance section
  pdf.addPage();
  yPosition = 30;

  // KİŞİSEL VERİLERE İLİŞKİN AYDINLATMA METNİ
  pdf.setFont('Arial', 'bold');
  pdf.text('KİŞİSEL VERİLERE İLİŞKİN AYDINLATMA METNİ', margin, yPosition);
  pdf.setFont('Arial', 'normal');
  yPosition += 15;

  const aydinlatmaMetni = [
    '1. Kişisel verileriniz, Doktorum Ol Sitesi tarafından aşağıdaki amaçlar doğrultusunda işlenmektedir: Kimlik bilgileriniz (ad, soyad, T.C. kimlik numarası, doğum tarihi), iletişim bilgileriniz (telefon numarası, e-posta adresi, adres bilgileri), ödeme (kredi kartı) bilgileriniz, işitsel kayıtlarınız, fotoğrafınız, vergi kimlik numaranız, uzmanlık alanınız, unvanınız ve özgeçmiş bilgileriniz, Şirket\'in sunduğu hizmetlerin sunulması amacıyla işlenmektedir.',
    '',
    '2. Şirket tarafından işlenen kişisel veriler, aşağıdaki amaçlar doğrultusunda, Türkiye içinde bulunan Şirket hissedarları, iş ortakları, hizmet aldığı diğer şirketler, üçüncü taraf hizmet sağlayıcıları ve resmi kamu kurumlarına aktarılabilecektir.',
    '',
    '3. Kişisel verilerin toplanma yöntemi ve hukuki nedeni şu şekildedir: Kişisel verileriniz, Doktorum Ol ile iletişim kurulması ve/veya hukuki ilişkinin oluşturulması sırasında ve bu ilişkinin sürekli olarak devam etmesi gerektiği durumlarda toplanır.',
    '',
    '4. Kişisel verilerinizle ilgili olarak sahip olduğunuz haklar KVKK kapsamında tanımlanmıştır.',
    '',
    '5. Yukarıdaki metinde belirtilen haklarınızı yazılı bir talebi Şirket\'in e-posta adresi aracılığıyla iletebilirsiniz.',
    '',
    'Başvurularınız için gerekli iletişim bilgileri:',
    'E-mail: info@Doktorumol.com.tr'
  ];

  aydinlatmaMetni.forEach((text) => {
    if (text === '') {
      yPosition += 5;
      return;
    }

    if (yPosition > 250) {
      pdf.addPage();
      yPosition = 30;
    }

    const lines = pdf.splitTextToSize(text, contentWidth);
    pdf.text(lines, margin, yPosition);
    yPosition += lines.length * 6 + 3;
  });

  yPosition += 15;

  // Ticari Elektronik İleti Rıza Metni
  pdf.setFont('Arial', 'bold');
  pdf.text('Ticari Elektronik İleti Rıza Metni', margin, yPosition);
  pdf.setFont('Arial', 'normal');
  yPosition += 12;

  const rizaMetni = 'Doktorum Ol Sitesi tarafından sunulan ürün ve hizmetlerle ilgili olarak, kendileri veya hizmet sağlayıcıları tarafından sunulan her türlü reklam, kampanya, indirim, hediye, çekiliş, promosyon hakkında bilgilendirme yapılması, kişisel ihtiyaçlarıma özel fırsatlar sunulması, müşteri memnuniyeti araştırmaları, anketler, tanıtım etkinlikleri, kutlamalar, onay alınması ve pazarlama çalışmaları gibi amaçlarla kısa mesaj (SMS), görüntülü ve sesli mesaj (MMS), e-posta, mektup, telefon, çağrı merkezi, otomatik arama ve benzeri elektronik iletişim araçlarıyla Ticari Elektronik İleti gönderilmesi ve benimle iletişime geçilmesi talep edilmektedir.';

  if (yPosition > 200) {
    pdf.addPage();
    yPosition = 30;
  }

  const rizaLines = pdf.splitTextToSize(rizaMetni, contentWidth);
  pdf.text(rizaLines, margin, yPosition);
  yPosition += rizaLines.length * 6 + 15;

  // Final signature section
  pdf.setFont('Arial', 'bold');
  pdf.text('SÖZLEŞME ONAYI VE DİJİTAL İMZA', margin, yPosition);
  pdf.setFont('Arial', 'normal');
  yPosition += 15;

  const signatureText = [
    'Bu sözleşmeyi okudum, anladım ve kabul ediyorum. Kişisel verilerimin işlenmesine ve ticari elektronik ileti gönderilmesine onay veriyorum.',
    '',
    `Sözleşme Tarihi: ${currentDate}`,
    `Sözleşme Saati: ${new Date().toLocaleTimeString('tr-TR')}`,
    `IP Adresi: ${clientIP}`,
    '',
    'MÜŞTERİ BİLGİLERİ:',
    `Ad Soyad: ${customerData.name} ${customerData.surname}`,
    `E-posta: ${customerData.email}`,
    `Telefon: ${customerData.phone}`,
    '',
    'Bu sözleşme elektronik ortamda onaylanmış ve dijital olarak imzalanmıştır.',
    '',
    'Doktorum Ol Sitesi',
    'www.doktorumol.com.tr'
  ];

  signatureText.forEach((text) => {
    if (text === '') {
      yPosition += 5;
      return;
    }

    const lines = pdf.splitTextToSize(text, contentWidth);
    pdf.text(lines, margin, yPosition);
    yPosition += lines.length * 6 + 3;
  });

  return pdf;
};
