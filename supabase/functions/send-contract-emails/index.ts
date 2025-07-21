import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import jsPDF from "https://esm.sh/jspdf@2.5.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CustomerData {
  name: string;
  surname: string;
  email: string;
  phone?: string;
  tcNo?: string;
  address?: string;
  city?: string;
  customerType: string;
  companyName?: string;
  taxNo?: string;
  taxOffice?: string;
}

interface PackageData {
  name: string;
  price: number;
  originalPrice: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { customerData, packageData, paymentMethod, clientIP, orderId } = await req.json();

    console.log('Contract emails request received:', { 
      customerEmail: customerData?.email,
      packageName: packageData?.name,
      orderId: orderId 
    });

    let preInfoBase64, distanceSalesBase64;
    let finalCustomerData = customerData;
    let finalPackageData = packageData;
    let finalPaymentMethod = paymentMethod;
    let finalClientIP = clientIP;

    // Create Supabase client for database queries
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // If only orderId is provided, fetch all data from database
    if (orderId && (!customerData || !packageData)) {
      console.log('Fetching order data from database for order:', orderId);
      
      const orderResponse = await fetch(`${supabaseUrl}/rest/v1/orders?id=eq.${orderId}&select=*`, {
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
          'Content-Type': 'application/json'
        }
      });

      if (orderResponse.ok) {
        const orders = await orderResponse.json();
        if (orders.length > 0) {
          const order = orders[0];
          
          finalCustomerData = {
            name: order.customer_name.split(' ')[0] || order.customer_name,
            surname: order.customer_name.split(' ').slice(1).join(' ') || '',
            email: order.customer_email,
            phone: order.customer_phone,
            tcNo: order.customer_tc_no,
            address: order.customer_address,
            city: order.customer_city,
            customerType: order.customer_type,
            companyName: order.company_name,
            taxNo: order.company_tax_no,
            taxOffice: order.company_tax_office
          };
          
          finalPackageData = {
            name: order.package_name,
            price: order.amount,
            originalPrice: order.amount
          };
          
          finalPaymentMethod = order.payment_method || 'banka_havalesi';
          finalClientIP = order.contract_ip_address || '127.0.0.1';
          
          console.log('Order data fetched successfully');
        }
      }
    }

    // If orderId is provided, try to get PDFs from database first
    if (orderId) {
      console.log('Fetching contract PDFs from database for order:', orderId);
      
      const response = await fetch(`${supabaseUrl}/rest/v1/orders?id=eq.${orderId}&select=pre_info_pdf_content,distance_sales_pdf_content`, {
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const orders = await response.json();
        if (orders.length > 0 && orders[0].pre_info_pdf_content && orders[0].distance_sales_pdf_content) {
          console.log('Using stored PDFs from database');
          preInfoBase64 = orders[0].pre_info_pdf_content;
          distanceSalesBase64 = orders[0].distance_sales_pdf_content;
        }
      }
    }

    // If no PDFs found in database, generate new ones (fallback)
    if (!preInfoBase64 || !distanceSalesBase64) {
      console.log('Generating new PDFs as fallback');
      
      // Fetch dynamic form content from database
      const formContentResponse = await fetch(`${supabaseUrl}/rest/v1/form_contents?form_type=eq.pre_info&select=content`, {
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
          'Content-Type': 'application/json'
        }
      });
      
      let formContent = '';
      if (formContentResponse.ok) {
        const formData = await formContentResponse.json();
        if (formData.length > 0) {
          formContent = formData[0].content;
        }
      }
      
      // Generate pre-info PDF
      const preInfoPDF = generatePreInfoPDF(finalCustomerData, finalPackageData, finalPaymentMethod, finalCustomerData.customerType, finalClientIP, formContent);
      preInfoBase64 = preInfoPDF.output('datauristring').split(',')[1];

      // Generate distance sales PDF
      const distanceSalesPDF = generateDistanceSalesPDF(finalCustomerData, finalPackageData, finalPaymentMethod, finalCustomerData.customerType, finalClientIP, formContent);
      distanceSalesBase64 = distanceSalesPDF.output('datauristring').split(',')[1];
    }

    // Send email with Brevo
    const emailResponse = await sendEmailWithBrevo(
      finalCustomerData,
      finalPackageData,
      finalPaymentMethod,
      preInfoBase64,
      distanceSalesBase64
    );

    console.log('Email sent successfully:', emailResponse);

    return new Response(
      JSON.stringify({ success: true, message: 'Contract emails sent successfully' }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );

  } catch (error) {
    console.error('Error in send-contract-emails function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );
  }
});

async function sendEmailWithBrevo(
  customerData: CustomerData,
  packageData: PackageData,
  paymentMethod: string,
  preInfoBase64: string,
  distanceSalesBase64: string
) {
  const brevoApiKey = Deno.env.get('BREVO_API_KEY');
  
  if (!brevoApiKey) {
    throw new Error('BREVO_API_KEY not found in environment variables');
  }

  const emailTemplate = createOrderCompletionEmailTemplate(customerData, packageData, paymentMethod);

  const emailData = {
    sender: {
      name: "Doktorum Ol",
      email: "info@doktorumol.com.tr"
    },
    to: [
      {
        email: customerData.email,
        name: `${customerData.name} ${customerData.surname}`
      }
    ],
    cc: [
      {
        email: "satinalma@doktorumol.com.tr",
        name: "Doktorum Ol - Satın Alma"
      }
    ],
    bcc: [
      {
        email: "info@doktorumol.com.tr",
        name: "Doktorum Ol"
      }
    ],
    subject: "Siparişiniz Tamamlandı - Sözleşme Belgeleri",
    htmlContent: emailTemplate,
    attachment: [
      {
        content: preInfoBase64,
        name: "on-bilgilendirme-formu.pdf",
        type: "application/pdf"
      },
      {
        content: distanceSalesBase64,
        name: "mesafeli-satis-sozlesmesi.pdf",
        type: "application/pdf"
      }
    ]
  };

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'api-key': brevoApiKey
    },
    body: JSON.stringify(emailData)
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Brevo API error: ${response.status} ${errorData}`);
  }

  return await response.json();
}

function generatePreInfoPDF(customerData: CustomerData, packageData: PackageData, paymentMethod: string, customerType: string, clientIP: string, formContent?: string): jsPDF {
  const doc = new jsPDF();
  
  // Company header
  doc.setFillColor(70, 130, 180);
  doc.rect(0, 0, 210, 35, 'F');
  
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.setFont(undefined, 'bold');
  doc.text('Doktorum Ol', 105, 15, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text('Küçükbakkalköy Mahallesi Selvili Sokak No:4 İç Kapı No: 20 Ataşehir / İstanbul', 105, 22, { align: 'center' });
  doc.text('☎ 0 216 706 06 11', 85, 28);
  doc.text('info@doktorumol.com.tr', 125, 28);
  
  doc.setTextColor(0, 0, 0);
  
  // Title
  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.text('ÖN BİLGİLENDİRME FORMU', 105, 50, { align: 'center' });
  
  let yPos = 70;
  
  // Customer info box
  doc.setDrawColor(0, 150, 255);
  doc.setLineWidth(0.5);
  doc.rect(15, yPos - 5, 180, 85, 'S');
  
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(0, 100, 200);
  doc.text('MÜŞTERİ BİLGİLERİ:', 20, yPos + 5);
  
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.setFont(undefined, 'normal');
  yPos += 15;
  
  doc.text(`Müşteri Adı: ${customerData.name} ${customerData.surname}`, 20, yPos);
  yPos += 8;
  doc.text(`E-posta: ${customerData.email}`, 20, yPos);
  yPos += 8;
  
  if (customerData.phone) {
    doc.text(`Telefon: ${customerData.phone}`, 20, yPos);
    yPos += 8;
  }
  
  if (customerData.tcNo) {
    doc.text(`TC Kimlik No: ${customerData.tcNo}`, 20, yPos);
    yPos += 8;
  }
  
  if (customerData.address) {
    doc.text(`Adres: ${customerData.address}`, 20, yPos, { maxWidth: 170 });
    yPos += 8;
  }
  
  if (customerData.city) {
    doc.text(`Şehir: ${customerData.city}`, 20, yPos);
    yPos += 8;
  }
  
  doc.text(`Müşteri Tipi: ${customerType === 'individual' ? 'Bireysel' : 'Kurumsal'}`, 20, yPos);
  yPos += 15;
  
  // Package info box
  doc.setDrawColor(0, 150, 255);
  doc.rect(15, yPos - 5, 180, 55, 'S');
  
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(0, 100, 200);
  doc.text('PAKET BİLGİLERİ:', 20, yPos + 5);
  
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.setFont(undefined, 'normal');
  yPos += 15;
  
  doc.text(`Seçilen Paket: ${packageData.name}`, 20, yPos);
  yPos += 8;
  doc.text(`Fiyat: ${packageData.price.toLocaleString('tr-TR')} ₺`, 20, yPos);
  yPos += 8;
  doc.text(`Ödeme Yöntemi: Banka Havalesi/EFT`, 20, yPos);
  yPos += 15;
  
  // Date info box
  doc.setDrawColor(0, 150, 255);
  doc.rect(15, yPos - 5, 180, 35, 'S');
  
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(0, 100, 200);
  doc.text('TARİHLER:', 20, yPos + 5);
  
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.setFont(undefined, 'normal');
  yPos += 15;
  
  doc.text(`Sözleşme Oluşturulma Tarihi: ${new Date().toLocaleDateString('tr-TR')}`, 20, yPos);
  yPos += 8;
  doc.text(`Dijital Onaylama Tarihi: ${new Date().toLocaleString('tr-TR')}`, 20, yPos);
  yPos += 15;
  
  // Service period info box
  doc.setDrawColor(0, 150, 255);
  doc.rect(15, yPos - 5, 180, 25, 'S');
  
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(0, 100, 200);
  doc.text('HİZMET SÜRESİ:', 20, yPos + 5);
  
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.setFont(undefined, 'normal');
  yPos += 15;
  
  const serviceDescription = `Üyelik başlangıç dijital onay tarihiyle birlikte 365 Gün ( 12 Ay ) Taahhütlü Hizmet Süresi.`;
  doc.text(serviceDescription, 20, yPos, { maxWidth: 170 });
  
  // Add a new page for contract content
  doc.addPage();
  yPos = 30;
  
  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(0, 100, 200);
  doc.text('DOKTORUM OL ÜYELİK SÖZLEŞMESİ', 105, yPos, { align: 'center' });
  
  yPos += 20;
  
  if (formContent) {
    // Clean HTML content and format for PDF
    const cleanContent = formContent
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim();
    
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(0, 0, 0);
    
    const lines = doc.splitTextToSize(cleanContent, 170);
    const pageHeight = 297;
    const bottomMargin = 20;
    
    for (let i = 0; i < lines.length; i++) {
      if (yPos > pageHeight - bottomMargin) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(lines[i], 20, yPos);
      yPos += 5;
    }
    
    // IP address at the end
    if (yPos > pageHeight - 30) {
      doc.addPage();
      yPos = 20;
    }
    
    yPos += 10;
    doc.setFont(undefined, 'bold');
    doc.text(`IP Adresi: ${clientIP}`, 20, yPos);
  }
  
  return doc;
}

function generateDistanceSalesPDF(customerData: CustomerData, packageData: PackageData, paymentMethod: string, customerType: string, clientIP: string, formContent?: string): jsPDF {
  const doc = new jsPDF();
  
  // Company header
  doc.setFillColor(70, 130, 180);
  doc.rect(0, 0, 210, 35, 'F');
  
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.setFont(undefined, 'bold');
  doc.text('Doktorum Ol', 105, 15, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text('Küçükbakkalköy Mahallesi Selvili Sokak No:4 İç Kapı No: 20 Ataşehir / İstanbul', 105, 22, { align: 'center' });
  doc.text('☎ 0 216 706 06 11', 85, 28);
  doc.text('info@doktorumol.com.tr', 125, 28);
  
  doc.setTextColor(0, 0, 0);
  
  // Title
  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.text('MESAFELİ SATIŞ SÖZLEŞMESİ', 105, 50, { align: 'center' });
  
  let yPos = 70;
  
  // Parties section
  doc.setDrawColor(0, 150, 255);
  doc.setLineWidth(0.5);
  doc.rect(15, yPos - 5, 180, 75, 'S');
  
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(0, 100, 200);
  doc.text('TARAFLAR:', 20, yPos + 5);
  
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.setFont(undefined, 'normal');
  yPos += 15;
  
  doc.text('SATICI:', 20, yPos);
  yPos += 8;
  doc.text('SELAM WEB YAPIM MERKEZİ', 30, yPos);
  yPos += 6;
  doc.text('Küçükbakkalköy Mahallesi Selvili Sokak No:4 İç Kapı No: 20 Ataşehir /', 30, yPos);
  yPos += 6;
  doc.text('İstanbul', 30, yPos);
  yPos += 6;
  doc.text('Tel: 0 216 706 06 11 | E-posta: info@doktorumol.com.tr', 30, yPos);
  yPos += 10;
  
  doc.text('ALICI:', 20, yPos);
  yPos += 6;
  doc.text(`${customerData.name} ${customerData.surname}`, 30, yPos);
  yPos += 6;
  doc.text(`E-posta: ${customerData.email}`, 30, yPos);
  if (customerData.phone) {
    yPos += 6;
    doc.text(`Telefon: ${customerData.phone}`, 30, yPos);
  }
  yPos += 20;
  
  // Contract subject
  doc.setDrawColor(0, 150, 255);
  doc.rect(15, yPos - 5, 180, 45, 'S');
  
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(0, 100, 200);
  doc.text('SÖZLEŞMENİN KONUSU:', 20, yPos + 5);
  
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.setFont(undefined, 'normal');
  yPos += 15;
  
  doc.text(`Hizmet: ${packageData.name}`, 20, yPos);
  yPos += 8;
  doc.text(`Bedel: ${packageData.price.toLocaleString('tr-TR')} ₺`, 20, yPos);
  yPos += 8;
  doc.text('Ödeme Şekli: Banka Havalesi/EFT', 20, yPos);
  yPos += 15;
  
  // Service period info
  doc.setDrawColor(0, 150, 255);
  doc.rect(15, yPos - 5, 180, 25, 'S');
  
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(0, 100, 200);
  doc.text('HİZMET SÜRESİ:', 20, yPos + 5);
  
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.setFont(undefined, 'normal');
  yPos += 15;
  
  const serviceDescription = `Toplam Hizmet Süresi (Taahhütlü): Üyelik başlangıç dijital onay tarihiyle birlikte 365 Gün ( 12 Ay ) Taahhütlü Hizmet Süresi.`;
  doc.text(serviceDescription, 20, yPos, { maxWidth: 170 });
  yPos += 20;
  
  // Add a new page for detailed contract content
  doc.addPage();
  yPos = 30;
  
  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(0, 100, 200);
  doc.text('DOKTORUM OL ÜYELİK SÖZLEŞMESİ', 105, yPos, { align: 'center' });
  yPos += 20;
  
  // Contract details section
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('1.1', 20, yPos);
  yPos += 8;
  
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  const contractText1 = 'Bu Sözleşme gereği, Hizmet Alan, Üyelik hizmetleri dahilinde Doktorum Ol tarafından sunulan hizmetleri, talep ettiği şekilde almayı kabul eder ve beyan eder. Doktorum Ol, bu Sözleşme çerçevesinde Hizmet Alan\'a satın aldığı abonelikte bulunan hizmetleri sunmayı taahhüt eder.';
  doc.text(contractText1, 20, yPos, { maxWidth: 170 });
  yPos += 20;
  
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text('2. TARAFLAR', 20, yPos);
  yPos += 10;
  
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  const contractText2 = 'Bu Sözleşme çerçevesinde, Doktorum Ol Sitesi ve Hizmet Alan birlikte "Taraflar" olarak adlandırılacaktır.';
  doc.text(contractText2, 20, yPos, { maxWidth: 170 });
  yPos += 20;
  
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text('3. AMAÇ VE KONU', 20, yPos);
  yPos += 10;
  
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  const contractText3 = `Bu sözleşmenin temel amacı, Doktorum Ol'un Premium Üyelik hizmetlerinden faydalanmak isteyen kişi adına Doktorum Ol tarafından www.doktorumol.com.tr alan adındaki web sitesinde bir profil oluşturulmasıdır. Premium Üyelik paketi kapsamında sunulan hizmetler, bu sözleşme ile belirtilen şekilde Doktorum Ol tarafından sunulacak ve karşılığında Hizmet Alan kişinin bu sözleşmede belirtilen hizmet ücretini Doktorum Ol sitesine ödemesi gerekmektedir. Bu sözleşme, tarafların karşılıklı hak ve yükümlülüklerini düzenleyen bir anlaşma olarak kabul edilir ve bu amaç doğrultusunda yürürlüktedir.`;
  
  const lines = doc.splitTextToSize(contractText3, 170);
  const pageHeight = 297;
  const bottomMargin = 20;
  
  for (let i = 0; i < lines.length; i++) {
    if (yPos > pageHeight - bottomMargin) {
      doc.addPage();
      yPos = 20;
    }
    doc.text(lines[i], 20, yPos);
    yPos += 5;
  }
  
  yPos += 15;
  
  // Add more contract sections
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text('4. TANIMLAR', 20, yPos);
  yPos += 10;
  
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  const definitionsText = `İşbu Sözleşmedeki tanımlar aşağıdaki gibidir;

Fikri Mülkiyet Doktorum Ol'un sahip olduğu veya kullanıldığı veya işlerinin yürütülmesi için gerekli olan dünya çapında mevcut veya gelecekte mevcut olabilecek her türlü ticaret markasını, ticari unvanı, hizmet markasını, patentleri, ticaret, faaliyet ve alan adlarını, URL'leri, tasarımları, telif haklarını, spesifikasyonları, yazılımları, ifşa edilmemiş ve gizli bilgi niteliğindeki hakları (müşteri listeleri, süreçler, know-how, ticari sırlar ve buluşlar gibi, patent edilebilir olsun veya olmasın), veya diğer endüstriyel veya fikri mülkiyet haklarını, lisansları, markaları, patentleri, faydalı modelleri ve endüstriyel tasarım haklarını, ve bunlarla ilgili başvuruları, herhangi bir hukuki koruma altında olan veya olmayan her türlü buluşu, geliştirmeyi, iyileştirmeyi, keşfi, know-how'ı, telif hakkını, kavramı ve düşünceyi, her türlü ticari sırrı, herhangi bir hukuki koruma altında olan veya olmayan her türlü bilgisayar programını ve yazılımı (sanatsal, teknik ve tasarım dokümanları, algoritmalar, kaynak kodları, nesne kodları, cron kodları, veri ve veri tabanları dahil), mevcut hukuka uygun olarak "eser sahibi" sıfatıyla sahibi olunan her türlü eserin çoğaltma, işleme, yayma, temsil etme, radyo, televizyon, mobil veya internet kanalı ile veya diğer araçlarla yayınlama, kamuya sunma gibi her türlü mali hakları ve bunlara ilişkin kullanma, yararlanma, devir ve takip hakları, manevi haklar ve telif hakları da dahil olmak üzere tüm hakları ifade eder.`;
  
  const definitionLines = doc.splitTextToSize(definitionsText, 170);
  
  for (let i = 0; i < definitionLines.length; i++) {
    if (yPos > pageHeight - bottomMargin) {
      doc.addPage();
      yPos = 20;
    }
    doc.text(definitionLines[i], 20, yPos);
    yPos += 5;
  }
  
  // Add IP address and date at the end
  if (yPos > pageHeight - 30) {
    doc.addPage();
    yPos = 20;
  }
  
  yPos += 15;
  doc.setFont(undefined, 'bold');
  doc.text(`Sözleşme Tarihi: ${new Date().toLocaleDateString('tr-TR')}`, 20, yPos);
  yPos += 8;
  doc.text(`IP Adresi: ${clientIP}`, 20, yPos);
  
  return doc;
}

function createOrderCompletionEmailTemplate(customerData: CustomerData, packageData: PackageData, paymentMethod: string): string {
  return `
    <!DOCTYPE html>
    <html lang="tr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Siparişiniz Tamamlandı</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
      <div style="max-width: 650px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #06b6d4 100%); padding: 40px 30px; text-align: center; position: relative; overflow: hidden;">
          <div style="position: absolute; top: -50px; right: -50px; width: 100px; height: 100px; background: rgba(255, 255, 255, 0.1); border-radius: 50%;"></div>
          <div style="position: absolute; bottom: -30px; left: -30px; width: 60px; height: 60px; background: rgba(255, 255, 255, 0.1); border-radius: 50%;"></div>
          <div style="position: relative; z-index: 2;">
            <div style="background: rgba(255, 255, 255, 0.2); display: inline-block; padding: 15px; border-radius: 50%; margin-bottom: 20px;">
              <div style="color: white; font-size: 32px;">🎉</div>
            </div>
            <h1 style="margin: 0; font-size: 32px; font-weight: 700; color: white; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">Siparişiniz Tamamlandı!</h1>
            <p style="margin: 15px 0 0 0; font-size: 18px; color: rgba(255, 255, 255, 0.95); font-weight: 300;">Doktorum Ol - Profesyonel Doktor Platformu</p>
          </div>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 35px; line-height: 1.7;">
          
          <!-- Welcome Message -->
          <div style="text-align: center; margin-bottom: 35px;">
            <h2 style="color: #1e293b; font-size: 24px; margin: 0 0 10px 0; font-weight: 600;">
              Hoş geldiniz, ${customerData.name} ${customerData.surname}!
            </h2>
            <p style="font-size: 16px; color: #64748b; margin: 0; font-weight: 300;">
              Doktorum Ol ailesine katıldığınız için teşekkür ederiz.
            </p>
          </div>
          
          <!-- Package Details -->
          <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border: 1px solid #e2e8f0; border-radius: 16px; padding: 30px; margin: 25px 0; position: relative; overflow: hidden;">
            <div style="position: absolute; top: -20px; right: -20px; width: 80px; height: 80px; background: linear-gradient(45deg, #3b82f6, #06b6d4); opacity: 0.1; border-radius: 50%;"></div>
            <div style="position: relative; z-index: 2;">
              <div style="display: flex; align-items: center; margin-bottom: 20px;">
                <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-right: 15px; font-size: 18px;">📦</div>
                <h3 style="color: #1e293b; margin: 0; font-size: 20px; font-weight: 600;">Paket Bilgileriniz</h3>
              </div>
              <div style="background: white; border-radius: 12px; padding: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
                <div style="display: grid; gap: 12px;">
                  <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9;">
                    <span style="color: #64748b; font-weight: 500;">Seçilen Paket:</span>
                    <span style="color: #1e293b; font-weight: 600;">${packageData.name}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9;">
                    <span style="color: #64748b; font-weight: 500;">Fiyat:</span>
                    <span style="color: #059669; font-weight: 700; font-size: 18px;">${packageData.price.toLocaleString('tr-TR')} ₺</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                    <span style="color: #64748b; font-weight: 500;">Ödeme Yöntemi:</span>
                    <span style="color: #1e293b; font-weight: 600;">Banka Havalesi/EFT</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Next Steps -->
          <div style="background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); border: 1px solid #f59e0b; border-radius: 16px; padding: 30px; margin: 25px 0; position: relative;">
            <div style="display: flex; align-items: center; margin-bottom: 20px;">
              <div style="background: #f59e0b; color: white; width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-right: 15px; font-size: 18px;">🚀</div>
              <h3 style="color: #92400e; margin: 0; font-size: 20px; font-weight: 600;">Sonraki Adımlar</h3>
            </div>
            <div style="color: #92400e;">
              <div style="display: flex; align-items: start; margin-bottom: 15px;">
                <div style="background: #f59e0b; color: white; min-width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px; font-size: 12px; font-weight: bold; margin-top: 2px;">1</div>
                <span style="font-weight: 500;">Ödeme işleminizi banka havalesi ile gerçekleştiriniz</span>
              </div>
              <div style="display: flex; align-items: start; margin-bottom: 15px;">
                <div style="background: #f59e0b; color: white; min-width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px; font-size: 12px; font-weight: bold; margin-top: 2px;">2</div>
                <span style="font-weight: 500;">Ödeme onayı sonrası 24 saat içinde hizmetiniz aktif edilecektir</span>
              </div>
              <div style="display: flex; align-items: start;">
                <div style="background: #f59e0b; color: white; min-width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px; font-size: 12px; font-weight: bold; margin-top: 2px;">3</div>
                <span style="font-weight: 500;">Profil oluşturma sürecinde size yardımcı olacağız</span>
              </div>
            </div>
          </div>
          
          <!-- Important Note -->
          <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border: 1px solid #0ea5e9; border-radius: 16px; padding: 25px; margin: 25px 0; text-align: center;">
            <div style="color: #0369a1; font-size: 20px; margin-bottom: 10px;">📄</div>
            <p style="margin: 0; color: #0369a1; font-weight: 600; font-size: 16px;">
              Sözleşme belgeleriniz bu e-postaya eklenmiştir. Lütfen saklayınız.
            </p>
          </div>
          
        </div>
        
        <!-- Footer -->
        <div style="background: #f8fafc; padding: 35px; text-align: center; border-top: 1px solid #e2e8f0;">
          <div style="margin-bottom: 20px;">
            <h4 style="color: #1e293b; margin: 0 0 15px 0; font-size: 20px; font-weight: 600;">Doktorum Ol</h4>
            <div style="color: #64748b; font-size: 14px; line-height: 1.6;">
              <div style="margin-bottom: 8px;">
                <span style="font-weight: 600;">📍</span> Küçükbakkalköy Mahallesi Selvili Sokak No:4 İç Kapı No: 20 Ataşehir / İstanbul
              </div>
              <div style="margin-bottom: 8px;">
                <span style="font-weight: 600;">📞</span> 0 216 706 06 11
              </div>
              <div>
                <span style="font-weight: 600;">✉️</span> info@doktorumol.com.tr
              </div>
            </div>
          </div>
          
          <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; color: #94a3b8; font-size: 12px;">
            <p style="margin: 0;">Bu e-posta otomatik olarak gönderilmiştir.</p>
            <p style="margin: 5px 0 0 0;">© 2025 Doktorum Ol - Tüm hakları saklıdır.</p>
          </div>
        </div>
        
      </div>
    </body>
    </html>
  `;
}