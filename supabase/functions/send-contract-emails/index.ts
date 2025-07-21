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
    const { customerData, packageData, paymentMethod, clientIP } = await req.json();

    console.log('Contract emails request received:', { 
      customerEmail: customerData.email,
      packageName: packageData.name 
    });

    // Generate pre-info PDF
    const preInfoPDF = generatePreInfoPDF(customerData, packageData, paymentMethod, customerData.customerType, clientIP);
    const preInfoBase64 = preInfoPDF.output('datauristring').split(',')[1];

    // Generate distance sales PDF
    const distanceSalesPDF = generateDistanceSalesPDF(customerData, packageData, paymentMethod, customerData.customerType, clientIP);
    const distanceSalesBase64 = distanceSalesPDF.output('datauristring').split(',')[1];

    // Send email with Brevo
    const emailResponse = await sendEmailWithBrevo(
      customerData,
      packageData,
      paymentMethod,
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

function generatePreInfoPDF(customerData: CustomerData, packageData: PackageData, paymentMethod: string, customerType: string, clientIP: string): jsPDF {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.text('ÖN BİLGİLENDİRME FORMU', 105, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  
  let yPos = 40;
  
  // Seller info
  doc.setFont(undefined, 'bold');
  doc.text('SATICI BİLGİLERİ:', 20, yPos);
  yPos += 10;
  
  doc.setFont(undefined, 'normal');
  doc.text('Unvan: SELAM WEB YAPIM MERKEZİ', 20, yPos);
  yPos += 5;
  doc.text('Adres: Yenişehir, Atatürk Cd. No:621/1, 34912 Pendik/İstanbul', 20, yPos);
  yPos += 5;
  doc.text('Telefon: 0 216 706 06 11', 20, yPos);
  yPos += 5;
  doc.text('E-posta: info@doktorumol.com.tr', 20, yPos);
  yPos += 15;
  
  // Customer info
  doc.setFont(undefined, 'bold');
  doc.text('ALICI BİLGİLERİ:', 20, yPos);
  yPos += 10;
  
  doc.setFont(undefined, 'normal');
  doc.text(`Ad Soyad: ${customerData.name} ${customerData.surname}`, 20, yPos);
  yPos += 5;
  doc.text(`E-posta: ${customerData.email}`, 20, yPos);
  yPos += 5;
  if (customerData.phone) {
    doc.text(`Telefon: ${customerData.phone}`, 20, yPos);
    yPos += 5;
  }
  if (customerData.address) {
    doc.text(`Adres: ${customerData.address}`, 20, yPos);
    yPos += 5;
  }
  yPos += 10;
  
  // Package info
  doc.setFont(undefined, 'bold');
  doc.text('PAKET BİLGİLERİ:', 20, yPos);
  yPos += 10;
  
  doc.setFont(undefined, 'normal');
  doc.text(`Seçilen Paket: ${packageData.name}`, 20, yPos);
  yPos += 5;
  doc.text(`Fiyat: ${packageData.price.toLocaleString('tr-TR')} ₺`, 20, yPos);
  yPos += 5;
  doc.text('Ödeme Yöntemi: Banka Havalesi/EFT', 20, yPos);
  yPos += 15;
  
  // Terms
  doc.setFont(undefined, 'bold');
  doc.text('GENEL ŞARTLAR:', 20, yPos);
  yPos += 10;
  
  doc.setFont(undefined, 'normal');
  const terms = [
    '1. Bu form, 6502 sayılı Tüketicinin Korunması Hakkında Kanun gereği düzenlenmiştir.',
    '2. Hizmet bedeli ön ödeme olarak tahsil edilmektedir.',
    '3. Hizmet süresi paket tipine göre değişmektedir.',
    '4. Cayma hakkı 14 gün olup, hizmetin ifasına başlanması durumunda geçersizdir.',
    '5. Tüm iletişim elektronik ortamda gerçekleştirilecektir.'
  ];
  
  terms.forEach(term => {
    doc.text(term, 20, yPos, { maxWidth: 170 });
    yPos += 10;
  });
  
  yPos += 10;
  doc.text(`Tarih: ${new Date().toLocaleDateString('tr-TR')}`, 20, yPos);
  yPos += 5;
  doc.text(`IP Adresi: ${clientIP}`, 20, yPos);
  
  return doc;
}

function generateDistanceSalesPDF(customerData: CustomerData, packageData: PackageData, paymentMethod: string, customerType: string, clientIP: string): jsPDF {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.text('MESAFELİ SATIŞ SÖZLEŞMESİ', 105, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  
  let yPos = 40;
  
  // Contract parties
  doc.setFont(undefined, 'bold');
  doc.text('TARAFLAR:', 20, yPos);
  yPos += 10;
  
  doc.setFont(undefined, 'normal');
  doc.text('SATICI:', 20, yPos);
  yPos += 5;
  doc.text('SELAM WEB YAPIM MERKEZİ', 30, yPos);
  yPos += 5;
  doc.text('Yenişehir, Atatürk Cd. No:621/1, 34912 Pendik/İstanbul', 30, yPos);
  yPos += 5;
  doc.text('Tel: 0 216 706 06 11 | E-posta: info@doktorumol.com.tr', 30, yPos);
  yPos += 10;
  
  doc.text('ALICI:', 20, yPos);
  yPos += 5;
  doc.text(`${customerData.name} ${customerData.surname}`, 30, yPos);
  yPos += 5;
  doc.text(`E-posta: ${customerData.email}`, 30, yPos);
  yPos += 5;
  if (customerData.phone) {
    doc.text(`Telefon: ${customerData.phone}`, 30, yPos);
    yPos += 5;
  }
  yPos += 10;
  
  // Contract subject
  doc.setFont(undefined, 'bold');
  doc.text('SÖZLEŞMENİN KONUSU:', 20, yPos);
  yPos += 10;
  
  doc.setFont(undefined, 'normal');
  doc.text(`Hizmet: ${packageData.name}`, 20, yPos);
  yPos += 5;
  doc.text(`Bedel: ${packageData.price.toLocaleString('tr-TR')} ₺`, 20, yPos);
  yPos += 5;
  doc.text('Ödeme Şekli: Banka Havalesi/EFT', 20, yPos);
  yPos += 15;
  
  // General terms
  doc.setFont(undefined, 'bold');
  doc.text('GENEL HÜKÜMLER:', 20, yPos);
  yPos += 10;
  
  doc.setFont(undefined, 'normal');
  const contractTerms = [
    '1. Bu sözleşme, 6502 sayılı Tüketicinin Korunması Hakkında Kanun kapsamında düzenlenmiştir.',
    '2. Hizmet bedeli peşin olarak tahsil edilir.',
    '3. Hizmet süresi seçilen pakete göre belirlenir.',
    '4. Taraflar bu sözleşmeyi kabul etmiş sayılır.',
    '5. Uyuşmazlıklar İstanbul mahkemelerinde çözülür.'
  ];
  
  contractTerms.forEach(term => {
    doc.text(term, 20, yPos, { maxWidth: 170 });
    yPos += 8;
  });
  
  yPos += 15;
  doc.text(`Sözleşme Tarihi: ${new Date().toLocaleDateString('tr-TR')}`, 20, yPos);
  yPos += 5;
  doc.text(`IP Adresi: ${clientIP}`, 20, yPos);
  
  return doc;
}

function createOrderCompletionEmailTemplate(customerData: CustomerData, packageData: PackageData, paymentMethod: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
      <div style="background: linear-gradient(135deg, #0369a1, #0284c7); padding: 30px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 28px; font-weight: bold;">Siparişiniz Tamamlandı!</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Doktorum Ol - Profesyonel Doktor Platformu</p>
      </div>
      
      <div style="padding: 30px; line-height: 1.6; color: #333333;">
        <p style="font-size: 16px; margin-bottom: 20px;">
          Sayın <strong>${customerData.name} ${customerData.surname}</strong>,
        </p>
        
        <p style="font-size: 14px; color: #666666; margin-bottom: 25px;">
          Siparişiniz başarıyla tamamlanmıştır. Aşağıda sipariş detaylarınızı bulabilirsiniz:
        </p>
        
        <div style="background-color: #f8fafc; border-left: 4px solid #0369a1; padding: 20px; margin: 20px 0;">
          <h3 style="color: #0369a1; margin-top: 0;">PAKET BİLGİLERİ:</h3>
          <p><strong>Seçilen Paket:</strong> ${packageData.name}</p>
          <p><strong>Fiyat:</strong> ${packageData.price.toLocaleString('tr-TR')} ₺</p>
          <p><strong>Ödeme Yöntemi:</strong> Banka Havalesi/EFT</p>
        </div>
        
        <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; color: #92400e; font-size: 14px;">
            <strong>📎 Ekli Belgeler:</strong> Bu e-posta ile birlikte ön bilgilendirme formu ve mesafeli satış sözleşmesi gönderilmiştir. 
            Lütfen bu belgeleri saklayınız.
          </p>
        </div>
        
        <div style="background-color: #f0f9ff; border: 1px solid #0369a1; border-radius: 6px; padding: 15px; margin: 20px 0;">
          <h4 style="color: #0369a1; margin-top: 0;">Sonraki Adımlar:</h4>
          <ul style="margin: 10px 0; padding-left: 20px;">
            <li>Ödeme işleminizi banka havalesi ile gerçekleştiriniz</li>
            <li>Ödeme onayı sonrası 24 saat içinde hizmetiniz aktif edilecektir</li>
            <li>Profil oluşturma sürecinde size yardımcı olacağız</li>
          </ul>
        </div>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        
        <div style="text-align: center; color: #666666; font-size: 12px;">
          <p>Bu e-posta otomatik olarak gönderilmiştir.</p>
          <p>
            <strong>Doktorum Ol</strong><br>
            📍 Yenişehir, Atatürk Cd. No:621/1, 34912 Pendik/İstanbul<br>
            📞 0 216 706 06 11 | ✉️ info@doktorumol.com.tr
          </p>
        </div>
      </div>
    </div>
  `;
}