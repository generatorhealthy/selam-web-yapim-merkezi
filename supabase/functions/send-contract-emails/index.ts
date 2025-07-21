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
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Better font settings for Turkish characters
  doc.setFont('helvetica');
  
  // Header - Company info with blue background  
  doc.setFillColor(52, 152, 219);
  doc.rect(15, 15, 180, 30, 'F');
  
  // Company name in header
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Doktorum Ol', 105, 25, { align: 'center' });
  
  // Company details
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const companyAddress = 'Kucukbakkalkoy Mahallesi Selvili Sokak No:4 Ic Kapi No: 20 Atasehir / Istanbul';
  doc.text(companyAddress, 105, 32, { align: 'center' });
  doc.text('0216 706 06 11        info@doktorumol.com.tr', 105, 38, { align: 'center' });

  // Reset color for body
  doc.setTextColor(0, 0, 0);
  let yPosition = 60;

  // Title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('ON BILGILENDIRME FORMU', 105, yPosition, { align: 'center' });
  yPosition += 20;

  // Customer Info Section
  doc.setFillColor(52, 152, 219);
  doc.rect(20, yPosition, 170, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('MUSTERI BILGILERI:', 25, yPosition + 6);
  yPosition += 15;

  // White background for customer details
  doc.setFillColor(248, 249, 250);
  doc.rect(20, yPosition, 170, 60, 'F');
  doc.setDrawColor(52, 152, 219);
  doc.rect(20, yPosition, 170, 60);

  // Customer details
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  yPosition += 8;
  
  const customerLines = [
    `Musteri Adi: ${customerData.name || ''} ${customerData.surname || ''}`,
    `E-posta: ${customerData.email || 'Belirtilmemis'}`,
    `Telefon: ${customerData.phone || 'Belirtilmemis'}`,
    `TC Kimlik No: ${customerData.tcNo || 'Belirtilmemis'}`,
    `Adres: ${customerData.address || 'Belirtilmemis'}`,
    `Sehir: ${customerData.city || 'Belirtilmemis'}`,
    `Musteri Tipi: ${customerType === 'individual' ? 'Bireysel' : 'Kurumsal'}`
  ];

  customerLines.forEach(line => {
    const wrappedLine = doc.splitTextToSize(line, 160);
    doc.text(wrappedLine, 25, yPosition);
    yPosition += wrappedLine.length * 6 + 2;
  });

  yPosition += 10;

  // Package Info Section
  doc.setFillColor(52, 152, 219);
  doc.rect(20, yPosition, 170, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('PAKET BILGILERI:', 25, yPosition + 6);
  yPosition += 15;

  // White background for package details
  doc.setFillColor(248, 249, 250);
  doc.rect(20, yPosition, 170, 30, 'F');
  doc.setDrawColor(52, 152, 219);
  doc.rect(20, yPosition, 170, 30);

  // Package details
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  yPosition += 8;
  
  const packageLines = [
    `Secilen Paket: ${packageData.name || 'Belirtilmemis'}`,
    `Fiyat: ${packageData.price ? packageData.price.toLocaleString('tr-TR') : '0'} TL`,
    'Odeme Yontemi: Banka Havalesi/EFT'
  ];

  packageLines.forEach(line => {
    const wrappedLine = doc.splitTextToSize(line, 160);
    doc.text(wrappedLine, 25, yPosition);
    yPosition += wrappedLine.length * 6 + 2;
  });

  yPosition += 10;

  // Date Section
  doc.setFillColor(52, 152, 219);
  doc.rect(20, yPosition, 170, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('TARIHLER:', 25, yPosition + 6);
  yPosition += 15;

  // White background for dates
  doc.setFillColor(248, 249, 250);
  doc.rect(20, yPosition, 170, 25, 'F');
  doc.setDrawColor(52, 152, 219);
  doc.rect(20, yPosition, 170, 25);

  // Date details
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  yPosition += 8;
  
  const currentDate = new Date();
  const dateLines = [
    `Sozlesme Olusturma Tarihi: ${currentDate.toLocaleDateString('tr-TR')}`,
    `Dijital Onaylama Tarihi: ${currentDate.toLocaleDateString('tr-TR')} ${currentDate.toLocaleTimeString('tr-TR')}`
  ];

  dateLines.forEach(line => {
    const wrappedLine = doc.splitTextToSize(line, 160);
    doc.text(wrappedLine, 25, yPosition);
    yPosition += wrappedLine.length * 6 + 2;
  });

  yPosition += 10;

  // Service Period Section
  doc.setFillColor(52, 152, 219);
  doc.rect(20, yPosition, 170, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('HIZMET SURESI:', 25, yPosition + 6);
  yPosition += 15;

  // White background for service period
  doc.setFillColor(248, 249, 250);
  doc.rect(20, yPosition, 170, 20, 'F');
  doc.setDrawColor(52, 152, 219);
  doc.rect(20, yPosition, 170, 20);

  // Service period
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  yPosition += 8;
  
  const serviceLine = 'Uyelik baslangic dijital onay tarihiyle birlikte 365 Gun ( 12 Ay ) Taahhutlu';
  const wrappedServiceText = doc.splitTextToSize(serviceLine, 160);
  doc.text(wrappedServiceText, 25, yPosition);

  // Add new page for contract content if exists
  if (formContent) {
    doc.addPage();
    yPosition = 30;

    // Contract title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(52, 152, 219);
    doc.text('DOKTORUM OL UYELIK SOZLESMESI', 105, yPosition, { align: 'center' });
    yPosition += 20;

    // Clean HTML content and convert Turkish characters
    let cleanContent = formContent
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/ğ/g, 'g')
      .replace(/Ğ/g, 'G')
      .replace(/ü/g, 'u')
      .replace(/Ü/g, 'U')
      .replace(/ş/g, 's')
      .replace(/Ş/g, 'S')
      .replace(/ı/g, 'i')
      .replace(/İ/g, 'I')
      .replace(/ö/g, 'o')
      .replace(/Ö/g, 'O')
      .replace(/ç/g, 'c')
      .replace(/Ç/g, 'C')
      .trim();

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);

    // Split content into lines with proper width
    const lines = doc.splitTextToSize(cleanContent, 170);
    const pageHeight = 297;
    const bottomMargin = 25;

    for (let i = 0; i < lines.length; i++) {
      if (yPosition > pageHeight - bottomMargin) {
        doc.addPage();
        yPosition = 20;
      }
      doc.text(lines[i], 20, yPosition);
      yPosition += 4;
    }

    // IP address at the end
    if (yPosition > pageHeight - 20) {
      doc.addPage();
      yPosition = 20;
    }

    yPosition += 15;
    doc.setFont('helvetica', 'bold');
    doc.text(`IP Adresi: ${clientIP}`, 20, yPosition);
  }

  return doc;
}

function generateDistanceSalesPDF(customerData: CustomerData, packageData: PackageData, paymentMethod: string, customerType: string, clientIP: string, formContent?: string): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Better font settings for Turkish characters
  doc.setFont('helvetica');
  
  // Header - Company info with blue background  
  doc.setFillColor(52, 152, 219);
  doc.rect(15, 15, 180, 30, 'F');
  
  // Company name in header
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Doktorum Ol', 105, 25, { align: 'center' });
  
  // Company details
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const companyAddress = 'Kucukbakkalkoy Mahallesi Selvili Sokak No:4 Ic Kapi No: 20 Atasehir / Istanbul';
  doc.text(companyAddress, 105, 32, { align: 'center' });
  doc.text('0216 706 06 11        info@doktorumol.com.tr', 105, 38, { align: 'center' });

  // Reset color for body
  doc.setTextColor(0, 0, 0);
  let yPosition = 60;

  // Title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('MESAFELI SATIS SOZLESMESI', 105, yPosition, { align: 'center' });
  yPosition += 20;

  // Parties Section - Seller
  doc.setFillColor(52, 152, 219);
  doc.rect(20, yPosition, 170, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('SATICI BILGILERI:', 25, yPosition + 6);
  yPosition += 15;

  // White background for seller details
  doc.setFillColor(248, 249, 250);
  doc.rect(20, yPosition, 170, 40, 'F');
  doc.setDrawColor(52, 152, 219);
  doc.rect(20, yPosition, 170, 40);

  // Seller details
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  yPosition += 8;
  
  const sellerLines = [
    'Unvan: SELAM WEB YAPIM MERKEZI',
    'Adres: Kucukbakkalkoy Mahallesi Selvili Sokak No:4 Ic Kapi No: 20 Atasehir / Istanbul',
    'Telefon: 0 216 706 06 11',
    'E-posta: info@doktorumol.com.tr'
  ];

  sellerLines.forEach(line => {
    const wrappedLine = doc.splitTextToSize(line, 160);
    doc.text(wrappedLine, 25, yPosition);
    yPosition += wrappedLine.length * 6 + 2;
  });

  yPosition += 10;

  // Parties Section - Buyer
  doc.setFillColor(52, 152, 219);
  doc.rect(20, yPosition, 170, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('ALICI BILGILERI:', 25, yPosition + 6);
  yPosition += 15;

  // White background for buyer details
  doc.setFillColor(248, 249, 250);
  doc.rect(20, yPosition, 170, 30, 'F');
  doc.setDrawColor(52, 152, 219);
  doc.rect(20, yPosition, 170, 30);

  // Buyer details
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  yPosition += 8;
  
  const buyerLines = [
    `Ad Soyad: ${customerData.name || ''} ${customerData.surname || ''}`,
    `E-posta: ${customerData.email || 'Belirtilmemis'}`,
    `Telefon: ${customerData.phone || 'Belirtilmemis'}`
  ];

  buyerLines.forEach(line => {
    const wrappedLine = doc.splitTextToSize(line, 160);
    doc.text(wrappedLine, 25, yPosition);
    yPosition += wrappedLine.length * 6 + 2;
  });

  yPosition += 10;

  // Contract Subject Section
  doc.setFillColor(52, 152, 219);
  doc.rect(20, yPosition, 170, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('SOZLESMENIN KONUSU:', 25, yPosition + 6);
  yPosition += 15;

  // White background for contract subject
  doc.setFillColor(248, 249, 250);
  doc.rect(20, yPosition, 170, 30, 'F');
  doc.setDrawColor(52, 152, 219);
  doc.rect(20, yPosition, 170, 30);

  // Contract subject details
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  yPosition += 8;
  
  const subjectLines = [
    `Hizmet: ${packageData.name || 'Belirtilmemis'}`,
    `Bedel: ${packageData.price ? packageData.price.toLocaleString('tr-TR') : '0'} TL`,
    'Odeme Sekli: Banka Havalesi/EFT'
  ];

  subjectLines.forEach(line => {
    const wrappedLine = doc.splitTextToSize(line, 160);
    doc.text(wrappedLine, 25, yPosition);
    yPosition += wrappedLine.length * 6 + 2;
  });

  yPosition += 15;

  // General Terms Section
  doc.setFillColor(52, 152, 219);
  doc.rect(20, yPosition, 170, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('GENEL HUKUMLER:', 25, yPosition + 6);
  yPosition += 15;

  // White background for general terms
  doc.setFillColor(248, 249, 250);
  doc.rect(20, yPosition, 170, 70, 'F');
  doc.setDrawColor(52, 152, 219);
  doc.rect(20, yPosition, 170, 70);

  // General terms details
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  yPosition += 8;
  
  const generalTerms = [
    '1. Bu sozlesme, 6502 sayili Tuketicinin Korunmasi Hakkinda Kanun kapsaminda duzenlenmistir.',
    '2. Hizmet bedeli pesin olarak tahsil edilir.',
    '3. Hizmet suresi secilen pakete gore belirlenir.',
    '4. Taraflar bu sozlesmeyi kabul etmis sayilir.',
    '5. Uyusmazliklar Istanbul mahkemelerinde cozulur.'
  ];

  generalTerms.forEach(term => {
    const wrappedTerm = doc.splitTextToSize(term, 160);
    doc.text(wrappedTerm, 25, yPosition);
    yPosition += wrappedTerm.length * 5 + 3;
  });

  // Add new page for detailed contract content
  doc.addPage();
  yPosition = 30;

  // Contract title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(52, 152, 219);
  doc.text('DOKTORUM OL UYELIK SOZLESMESI', 105, yPosition, { align: 'center' });
  yPosition += 20;

  // Contract content sections
  doc.setTextColor(0, 0, 0);
  
  // Section 1
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('1. SOZLESMENIN KONUSU VE TARAFLAR', 20, yPosition);
  yPosition += 10;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const section1Text = 'Bu Sozlesme geregi, Hizmet Alan, Uyelik hizmetleri dahilinde Doktorum Ol tarafindan sunulan hizmetleri, talep ettigi sekilde almayi kabul eder ve beyan eder. Doktorum Ol, bu Sozlesme cercevesinde Hizmet Alan\'a satin aldigi abonelikte bulunan hizmetleri sunmayi taahhut eder.';
  const section1Lines = doc.splitTextToSize(section1Text, 170);
  doc.text(section1Lines, 20, yPosition);
  yPosition += section1Lines.length * 4 + 10;

  // Section 2
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('2. HIZMET KAPSAMI VE AMAC', 20, yPosition);
  yPosition += 10;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const section2Text = 'Bu sozlesmenin temel amaci, Doktorum Ol\'un Premium Uyelik hizmetlerinden faydalanmak isteyen kisi adina Doktorum Ol tarafindan www.doktorumol.com.tr alan adindaki web sitesinde bir profil olusturulmasidir. Premium Uyelik paketi kapsaminda sunulan hizmetler, bu sozlesme ile belirtilen sekilde Doktorum Ol tarafindan sunulacak ve karsiligi Hizmet Alan kisinin bu sozlesmede belirtilen hizmet ucretini Doktorum Ol sitesine odemesi gerekmektedir.';
  const section2Lines = doc.splitTextToSize(section2Text, 170);
  const pageHeight = 297;
  const bottomMargin = 25;

  for (let i = 0; i < section2Lines.length; i++) {
    if (yPosition > pageHeight - bottomMargin) {
      doc.addPage();
      yPosition = 20;
    }
    doc.text(section2Lines[i], 20, yPosition);
    yPosition += 4;
  }

  // Add date and IP at the end
  if (yPosition > pageHeight - 25) {
    doc.addPage();
    yPosition = 20;
  }

  yPosition += 15;
  doc.setFont('helvetica', 'bold');
  doc.text(`Sozlesme Tarihi: ${new Date().toLocaleDateString('tr-TR')}`, 20, yPosition);
  yPosition += 8;
  doc.text(`IP Adresi: ${clientIP}`, 20, yPosition);

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