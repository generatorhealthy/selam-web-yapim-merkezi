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
    subject: "Siparişiniz tamamlandı",
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

  // Set font for better Turkish character support
  doc.setFont('helvetica');
  
  const pageWidth = 210;
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let yPosition = 30;
  
  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('ON BILGILENDIRME FORMU', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 20;
  
  // Date and IP info
  const currentDate = new Date().toLocaleDateString('tr-TR');
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  yPosition += 10;
  
  // Customer info section with blue background box
  doc.setFillColor(173, 216, 230); // Light blue
  doc.rect(margin, yPosition, contentWidth, 80, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('MUSTERI BILGILERI:', margin + 5, yPosition + 15);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  
  const customerInfo = [
    `Musteri Adi: ${customerData.name || ''} ${customerData.surname || ''}`,
    `E-posta: ${customerData.email || 'Belirtilmemis'}`,
    customerData.phone ? `Telefon: ${customerData.phone}` : 'Telefon: Belirtilmemis',
    customerData.tcNo ? `TC Kimlik No: ${customerData.tcNo}` : 'TC Kimlik No: Belirtilmemis',
    customerData.address ? `Adres: ${customerData.address}, ${customerData.city || ''}` : 'Adres: Belirtilmemis',
    customerData.city ? `Sehir: ${customerData.city}` : '',
    customerType === 'company' ? 'Musteri Tipi: Kurumsal' : 'Musteri Tipi: Bireysel'
  ];
  
  let infoYPos = yPosition + 30;
  customerInfo.forEach((info) => {
    if (info) {
      doc.text(info, margin + 5, infoYPos);
      infoYPos += 8;
    }
  });
  
  yPosition += 90;
  
  // Package info section with blue background box
  doc.setFillColor(173, 216, 230); // Light blue
  doc.rect(margin, yPosition, contentWidth, 50, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('PAKET BILGILERI:', margin + 5, yPosition + 15);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  
  const packageInfo = [
    `Secilen Paket: ${packageData.name || 'Belirtilmemis'}`,
    `Fiyat: ${packageData.price ? packageData.price.toLocaleString('tr-TR') : '0'} TL`,
    `Odeme Yontemi: ${paymentMethod === 'credit_card' ? 'Kredi Karti' : 'Banka Havalesi/EFT'}`
  ];
  
  let packageYPos = yPosition + 30;
  packageInfo.forEach((info) => {
    doc.text(info, margin + 5, packageYPos);
    packageYPos += 8;
  });
  
  yPosition += 60;
  
  // Add detailed pre-information form content with the new contract
  const preInfoContent = `
DOKTORUM OL UYELIK SOZLESMESI

1.1 Bu Sozlesme geregi, Hizmet Alan, Uyelik hizmetleri dahilinde Doktorum Ol tarafindan sunulan hizmetleri, talep ettigi sekilde almayi kabul eder ve beyan eder. Doktorum Ol, bu Sozlesme cercevesinde Hizmet Alan'a satin aldigi abonelikte bulunan hizmetleri sunmayi taahhut eder.

2. TARAFLAR
Bu Sozlesme cercevesinde, Doktorum Ol Sitesi ve Hizmet Alan birlikte "Taraflar" olarak adlandirilacaktir.

3. AMAC VE KONU

Bu sozlesmenin temel amaci, Doktorum Ol'un Premium Uyelik hizmetlerinden faydalanmak isteyen kisi adina Doktorum Ol tarafindan www.doktorumol.com.tr alan adindaki web sitesinde bir profil olusturulmasidir.

Musterinin Hizmet Aldigi Paket Icerigi:
- Detayli profil olusturma ve yonetimi
- Online randevu sistemi entegrasyonu  
- Video ve makale yayinlama imkani
- Hasta takip sistemi erisimi
- SEO optimizasyonu ve dijital pazarlama destegi

Tarih: ${currentDate}
IP Adresi: ${clientIP}
`;
  
  const lines = doc.splitTextToSize(preInfoContent, contentWidth);
  
  lines.forEach((line: string) => {
    if (yPosition > 270) {
      doc.addPage();
      yPosition = 30;
    }
    doc.text(line, margin, yPosition);
    yPosition += 6;
  });
  
  return doc;
}

function generateDistanceSalesPDF(customerData: CustomerData, packageData: PackageData, paymentMethod: string, customerType: string, clientIP: string, formContent?: string): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Set font for better Turkish character support
  doc.setFont('helvetica');
  
  const pageWidth = 210;
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let yPosition = 30;
  
  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Mesafeli Satis Sozlesmesi', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 30;
  
  // Enlightenment text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('KISISEL VERILERE ILISKIN AYDINLATMA METNI', margin, yPosition);
  yPosition += 15;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  
  const enlightenmentText = `Doktorumol.com.tr ("doktorumol" veya "Sirket") olarak, Isbu Aydinlatma Metni ile, Kisisel Verilerin Korunmasi Kanunu ("Kanun") ve Aydinlatma Yukunlulugunun Yerine Getirilmesinde Uyulacak Usul ve Esaslar Hakkinda Teblig kapsaminda aydinlatma yukunlulugunun yerine getirilmesi amaclanmaktadir.

Bu kapsamda bilgi vermekle yukumlu oldugumuz konular asagidaki gibidir:

1. Veri sorumlusunun ve varsa temsilcisinin kimligi

Veri sorumlusu; doktorumol.com.tr'dir.

2. Kisisel verilerin hangi amacla islenecegi

Ad, soyadi, telefon numarasi, e-posta adresi, adres bilgileri, odeme araci bilgileri ve bunlarla sinirli olmamak uzere varsa internet sitesi veya cagri merkezi araciligiyla iletmis oldugunuz genel ve ozel nitelikli kategorilerdeki kisisel verileriniz, internet sitesinde uyeliginizin olusturulmasi, Doktorumol uyeligi sebebiyle aldiginiz hizmetlerin sunumu, alınan hizmet ile ilgili sizinle iletisime gecilmesi, musteri iliskilerinde saglikli ve uzun sureli etkilesim kurulmasi, onay vermeniz halinde tarafınıza ticari elektronik ileti gonderilmesi, talep ve sikayetlerinizin takibi ile ilerde olusabilecek uyusmazlik ve sorunlarin cozulmesi ve mevzuattan kaynaklanan zamanaşımı suresi dogrultusunda bu kisisel verilerinizin Doktorumol tarafindan saklanmasi amaci ile islenmektedir.

Ayrica, internet sitemizi ziyaretiniz ve kullanımınız sirasinda internet sayfasi sunucusu tarafından sabit surucu iletilen kucuk metin dosyalari ("Cerezler") araciligiyla elde edilen kullanici tarayici, IP adresi, internet baglantiniz, site`;
  
  const enlightenmentLines = doc.splitTextToSize(enlightenmentText, contentWidth);
  
  enlightenmentLines.forEach((line: string) => {
    if (yPosition > 270) {
      doc.addPage();
      yPosition = 30;
    }
    doc.text(line, margin, yPosition);
    yPosition += 6;
  });
  
  if (yPosition > 200) {
    doc.addPage();
    yPosition = 30;
  }
  
  yPosition += 15;
  
  // Customer info section
  doc.setFillColor(173, 216, 230); // Light blue
  doc.rect(margin, yPosition, contentWidth, 80, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('MUSTERI BILGILERI:', margin + 5, yPosition + 15);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  
  const customerInfo = [
    `Musteri Adi: ${customerData.name || ''} ${customerData.surname || ''}`,
    `E-posta: ${customerData.email || 'Belirtilmemis'}`,
    customerData.phone ? `Telefon: ${customerData.phone}` : 'Telefon: Belirtilmemis',
    customerData.tcNo ? `TC Kimlik No: ${customerData.tcNo}` : 'TC Kimlik No: Belirtilmemis',
    customerData.address ? `Adres: ${customerData.address}, ${customerData.city || ''}` : 'Adres: Belirtilmemis',
    customerData.city ? `Sehir: ${customerData.city}` : '',
    customerType === 'company' ? 'Musteri Tipi: Kurumsal' : 'Musteri Tipi: Bireysel'
  ];
  
  let infoYPos = yPosition + 30;
  customerInfo.forEach((info) => {
    if (info) {
      doc.text(info, margin + 5, infoYPos);
      infoYPos += 8;
    }
  });
  
  yPosition += 90;
  
  // Package info section
  doc.setFillColor(173, 216, 230); // Light blue
  doc.rect(margin, yPosition, contentWidth, 50, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('PAKET BILGILERI:', margin + 5, yPosition + 15);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  
  const packageInfo = [
    `Secilen Paket: ${packageData.name || 'Belirtilmemis'}`,
    `Fiyat: ${packageData.price ? packageData.price.toLocaleString('tr-TR') : '0'} TL`,
    `Odeme Yontemi: ${paymentMethod === 'credit_card' ? 'Kredi Karti' : 'Banka Havalesi/EFT'}`
  ];
  
  let packageYPos = yPosition + 30;
  packageInfo.forEach((info) => {
    doc.text(info, margin + 5, packageYPos);
    packageYPos += 8;
  });
  
  yPosition += 70;
  
  // Footer
  const currentDate = new Date().toLocaleDateString('tr-TR');
  doc.text(`Tarih: ${currentDate}`, margin, yPosition);
  yPosition += 8;
  doc.text(`IP Adresi: ${clientIP}`, margin, yPosition);
  
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
            <p style="margin: 15px 0 0 0; font-size: 18px; color: rgba(255, 255, 255, 0.95); font-weight: 300;">Doktorum Ol Randevu Sitesi</p>
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