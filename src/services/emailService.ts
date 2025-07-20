
interface EmailAttachment {
  filename: string;
  content: string;
  contentType: string;
}

interface EmailData {
  to: string;
  subject: string;
  message: string;
  attachments?: EmailAttachment[];
}

export const sendEmail = async (emailData: EmailData) => {
  try {
    // Bu fonksiyon gerçek email gönderimi için kullanılacak
    // Şu an için console.log ile simüle ediyoruz
    console.log('📧 E-posta gönderiliyor:', {
      to: emailData.to,
      subject: emailData.subject,
      attachments: emailData.attachments?.map(att => att.filename) || []
    });
    
    // Gerçek email gönderimi buraya implementelenecek
    // Örneğin: Resend, SendGrid, vb. API'leri kullanılabilir
    
    return { success: true };
  } catch (error) {
    console.error('E-posta gönderim hatası:', error);
    throw error;
  }
};

// Doktor kayıt e-posta şablonu
export const createDoctorRegistrationEmailTemplate = (doctorName: string, email: string) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Yeni Doktor Kaydı</h2>
      <p>Sayın ${doctorName}, kaydınız başarıyla oluşturulmuştur.</p>
      <p>E-posta: ${email}</p>
    </div>
  `;
};

// Sipariş tamamlama e-posta şablonu - parametreleri düzeltildi
export const sendOrderCompletionEmail = async (customerEmail: string, orderDetails: any) => {
  const emailTemplate = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Siparişiniz Tamamlandı</h2>
      <p>Siparişiniz başarıyla tamamlanmıştır.</p>
    </div>
  `;
  
  return sendEmail({
    to: customerEmail,
    subject: 'Siparişiniz Tamamlandı',
    message: emailTemplate
  });
};

// Randevu e-posta şablonu
export const createAppointmentEmailTemplate = (patientName: string, appointmentDate: string, doctorName: string) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Randevu Onayı</h2>
      <p>Sayın ${patientName}, randevunuz onaylanmıştır.</p>
      <p>Tarih: ${appointmentDate}</p>
      <p>Doktor: ${doctorName}</p>
    </div>
  `;
};

// Doktor randevu bildirim şablonu
export const createDoctorAppointmentNotificationTemplate = (doctorName: string, patientName: string, appointmentDate: string) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Yeni Randevu</h2>
      <p>Sayın Dr. ${doctorName}, yeni bir randevunuz var.</p>
      <p>Hasta: ${patientName}</p>
      <p>Tarih: ${appointmentDate}</p>
    </div>
  `;
};
