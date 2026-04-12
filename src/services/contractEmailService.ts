
import { sendEmail } from './emailService';
import { generatePreInfoPDF, generateDistanceSalesPDF } from './pdfService';

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

export const sendContractEmailsAfterPurchase = async (
  customerData: CustomerData,
  packageData: PackageData,
  paymentMethod: string,
  customerType: string,
  clientIP: string,
  orderId: string,
  isFirstMonth: boolean = true
) => {
  try {
    // Email service temporarily disabled
    console.log('Email sending disabled - would have sent to:', customerData.email);
    return;
    if (isFirstMonth) {
      // Generate PDFs
      const preInfoPDF = await generatePreInfoPDF(orderId);
      const distanceSalesPDF = await generateDistanceSalesPDF(customerData, packageData, paymentMethod, customerType, clientIP);
      
      // Convert PDFs to base64 for email attachment
      const preInfoPDFBase64 = preInfoPDF.output('datauristring').split(',')[1];
      const distanceSalesPDFBase64 = distanceSalesPDF.output('datauristring').split(',')[1];
      
      // Create better file names with current date
      const currentDate = new Date().toLocaleDateString('tr-TR').replace(/\./g, '-');
      const preInfoFileName = `${customerData.name}_${customerData.surname}_OnBilgilendirme_${currentDate}.pdf`;
      const distanceSalesFileName = `${customerData.name}_${customerData.surname}_MesafeliSatis_${currentDate}.pdf`;
      
      // Send email with contracts and detailed order information
      const emailTemplate = createOrderCompletionEmailTemplate(customerData, packageData, paymentMethod, customerType);
      
      await sendEmail({
        to: customerData.email,
        subject: 'DoktorumOL - Siparişiniz Tamamlandı - Sözleşme Belgeleri',
        message: emailTemplate,
        attachments: [
          {
            filename: preInfoFileName,
            content: preInfoPDFBase64,
            contentType: 'application/pdf'
          },
          {
            filename: distanceSalesFileName,
            content: distanceSalesPDFBase64,
            contentType: 'application/pdf'
          }
        ]
      });
      
      console.log('Sipariş tamamlama ve sözleşme e-postaları gönderildi:', customerData.email);
    } else {
      // Send monthly payment notification
      const monthlyEmailTemplate = createMonthlyPaymentEmailTemplate(customerData, packageData);
      
      await sendEmail({
        to: customerData.email,
        subject: 'DoktorumOL - Aylık Ödeme Bildirimi',
        message: monthlyEmailTemplate
      });
      
      console.log('Aylık ödeme bildirimi gönderildi:', customerData.email);
    }
  } catch (error) {
    console.error('Sözleşme e-posta gönderim hatası:', error);
    throw error;
  }
};

const createOrderCompletionEmailTemplate = (
  customerData: CustomerData, 
  packageData: PackageData, 
  paymentMethod: string, 
  customerType: string
) => {
  const orderDate = new Date().toLocaleDateString('tr-TR');
  const orderTime = new Date().toLocaleTimeString('tr-TR');
  
  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; background-color: #f8fafc; padding: 20px;">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 30px 20px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 28px; font-weight: bold;">DoktorumOL</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Profesyonel Sağlık Platformu</p>
      </div>

      <!-- Success Message -->
      <div style="background-color: white; padding: 30px; border-left: 4px solid #10b981;">
        <div style="display: flex; align-items: center; margin-bottom: 20px;">
          <div style="width: 50px; height: 50px; background-color: #10b981; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 15px;">
            <span style="color: white; font-size: 24px;">✓</span>
          </div>
          <div>
            <h2 style="margin: 0; color: #1f2937; font-size: 24px;">Siparişiniz Tamamlandı!</h2>
            <p style="margin: 5px 0 0 0; color: #6b7280;">Teşekkür ederiz, ${customerData.name} ${customerData.surname}</p>
          </div>
        </div>
        
        <p style="color: #374151; line-height: 1.6; margin-bottom: 0;">
          Siparişiniz başarıyla tamamlanmıştır. Sözleşme belgeleriniz bu e-postaya eklenmiştir.
        </p>
      </div>

      <!-- Order Details -->
      <div style="background-color: white; padding: 25px; margin-top: 2px;">
        <h3 style="color: #1f2937; margin-top: 0; margin-bottom: 20px; font-size: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
          📋 Sipariş Detayları
        </h3>
        
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Sipariş Tarihi:</td>
              <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${orderDate} ${orderTime}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Paket:</td>
              <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${packageData.name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Aylık Ücret:</td>
              <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${packageData.price.toLocaleString('tr-TR')} ₺</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Ödeme Yöntemi:</td>
              <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${paymentMethod === 'creditCard' ? 'Kredi Kartı' : 'Banka Havalesi'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Müşteri Tipi:</td>
              <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${customerType === 'individual' ? 'Bireysel' : 'Kurumsal'}</td>
            </tr>
          </table>
        </div>
      </div>

      <!-- Customer Information -->
      <div style="background-color: white; padding: 25px; margin-top: 2px;">
        <h3 style="color: #1f2937; margin-top: 0; margin-bottom: 20px; font-size: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
          👤 Müşteri Bilgileri
        </h3>
        
        <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 6px 0; color: #1e40af; font-weight: 500; width: 140px;">Ad Soyad:</td>
              <td style="padding: 6px 0; color: #1e3a8a; font-weight: 600;">${customerData.name} ${customerData.surname}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #1e40af; font-weight: 500;">E-posta:</td>
              <td style="padding: 6px 0; color: #1e3a8a;">${customerData.email}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #1e40af; font-weight: 500;">Telefon:</td>
              <td style="padding: 6px 0; color: #1e3a8a;">${customerData.phone}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #1e40af; font-weight: 500;">TC Kimlik No:</td>
              <td style="padding: 6px 0; color: #1e3a8a;">${customerData.tcNo}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #1e40af; font-weight: 500;">Şehir:</td>
              <td style="padding: 6px 0; color: #1e3a8a;">${customerData.city}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #1e40af; font-weight: 500; vertical-align: top;">Adres:</td>
              <td style="padding: 6px 0; color: #1e3a8a; line-height: 1.4;">${customerData.address}</td>
            </tr>
            ${customerData.postalCode ? `
            <tr>
              <td style="padding: 6px 0; color: #1e40af; font-weight: 500;">Posta Kodu:</td>
              <td style="padding: 6px 0; color: #1e3a8a;">${customerData.postalCode}</td>
            </tr>
            ` : ''}
            ${customerType === 'company' && customerData.companyName ? `
            <tr>
              <td style="padding: 6px 0; color: #1e40af; font-weight: 500;">Firma Adı:</td>
              <td style="padding: 6px 0; color: #1e3a8a; font-weight: 600;">${customerData.companyName}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #1e40af; font-weight: 500;">Vergi No:</td>
              <td style="padding: 6px 0; color: #1e3a8a;">${customerData.taxNo || 'Belirtilmemiş'}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #1e40af; font-weight: 500;">Vergi Dairesi:</td>
              <td style="padding: 6px 0; color: #1e3a8a;">${customerData.taxOffice || 'Belirtilmemiş'}</td>
            </tr>
            ` : ''}
          </table>
        </div>
      </div>

      <!-- Attachments Info -->
      <div style="background-color: white; padding: 25px; margin-top: 2px;">
        <h3 style="color: #1f2937; margin-top: 0; margin-bottom: 20px; font-size: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
          📎 Ekteki Belgeler
        </h3>
        
        <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b;">
          <p style="color: #92400e; margin: 0 0 15px 0; font-weight: 500;">
            Bu e-postaya aşağıdaki belgeler eklenmiştir:
          </p>
          <ul style="color: #92400e; margin: 0; padding-left: 20px; line-height: 1.8;">
            <li><strong>Ön Bilgilendirme Formu</strong> - Kişiselleştirilmiş belgeniz</li>
            <li><strong>Mesafeli Satış Sözleşmesi</strong> - Hizmet koşullarınız</li>
          </ul>
          <p style="color: #92400e; font-size: 14px; margin: 15px 0 0 0; font-style: italic;">
            Bu belgeler sadılece ilk ödemenizde gönderilmektedir. Sonraki aylarda sadece ödeme bildirimleri alacaksınız.
          </p>
        </div>
      </div>

      <!-- Important Information -->
      <div style="background-color: white; padding: 25px; margin-top: 2px;">
        <div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981;">
          <h4 style="color: #065f46; margin-top: 0; margin-bottom: 15px; font-size: 18px;">⚠️ Önemli Bilgiler</h4>
          <ul style="color: #065f46; line-height: 1.7; margin: 0; padding-left: 20px;">
            <li>Hesabınız 24 saat içerisinde aktifleştirilecektir</li>
            <li>Giriş bilgileriniz ayrı bir e-posta ile gönderilecektir</li>
            <li>14 gün cayma hakkınız bulunmaktadır</li>
            <li>Sonraki aylık ödemeleriniz otomatik olarak tahsil edilecektir</li>
            <li>Hizmet süresi: 24 Ay</li>
          </ul>
        </div>
      </div>

      <!-- Footer -->
      <div style="background-color: #1f2937; color: white; padding: 25px; border-radius: 0 0 12px 12px; text-align: center; margin-top: 2px;">
        <p style="margin: 0 0 10px 0; font-size: 14px;">
          Sorularınız için: <a href="mailto:satinalma@doktorumol.com.tr" style="color: #60a5fa; text-decoration: none;">satinalma@doktorumol.com.tr</a>
        </p>
        <p style="margin: 0; font-size: 12px; opacity: 0.7;">
          © ${new Date().getFullYear()} DoktorumOL - Tüm hakları saklıdır.
        </p>
        <p style="margin: 10px 0 0 0; font-size: 11px; opacity: 0.6;">
          Bu e-posta satinalma@doktorumol.com.tr adresinden gönderilmiştir.
        </p>
      </div>
    </div>
  `;
};

const createMonthlyPaymentEmailTemplate = (customerData: CustomerData, packageData: PackageData) => {
  const currentDate = new Date();
  const nextPaymentDate = new Date(currentDate.setMonth(currentDate.getMonth() + 1));
  
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #2563eb; margin-bottom: 10px;">DoktorumOL</h1>
        <h2 style="color: #1f2937;">Aylık Ödeme Bildirimi</h2>
      </div>

      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #1f2937; margin-top: 0;">Sayın ${customerData.name} ${customerData.surname},</h3>
        <p style="color: #374151; line-height: 1.6;">
          ${packageData.name} paketinizin aylık ödemesi başarıyla tahsil edilmiştir.
        </p>
      </div>

      <div style="background-color: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #1e40af; margin-top: 0;">💳 Ödeme Detayları</h3>
        <table style="width: 100%; color: #1e3a8a;">
          <tr>
            <td style="padding: 8px 0;"><strong>Ödeme Tarihi:</strong></td>
            <td style="padding: 8px 0;">${new Date().toLocaleDateString('tr-TR')}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>Tutar:</strong></td>
            <td style="padding: 8px 0;">${packageData.price.toLocaleString('tr-TR')} ₺</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>Sonraki Ödeme:</strong></td>
            <td style="padding: 8px 0;">${nextPaymentDate.toLocaleDateString('tr-TR')}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>Paket:</strong></td>
            <td style="padding: 8px 0;">${packageData.name}</td>
          </tr>
        </table>
      </div>

      <div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #065f46; margin-top: 0;">✅ Hizmet Durumu</h3>
        <p style="color: #064e3b;">
          Hizmetiniz kesintisiz olarak devam etmektedir. DoktorumOL panelinden 
          tüm özelliklerinize erişebilirsiniz.
        </p>
      </div>

      <div style="text-align: center; margin-top: 30px;">
        <p style="color: #6b7280; font-size: 14px;">
          Sorularınız için: <a href="mailto:satinalma@doktorumol.com.tr" style="color: #2563eb;">satinalma@doktorumol.com.tr</a>
        </p>
        <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">
          © ${new Date().getFullYear()} DoktorumOL - Tüm hakları saklıdır.
        </p>
      </div>
    </div>
  `;
};
