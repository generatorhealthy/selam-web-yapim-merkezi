
import { supabase } from "@/integrations/supabase/client";
import { sendEmail } from "./emailService";
import { sendSms } from "./smsService";

export interface NotificationData {
  type: 'email' | 'sms' | 'both';
  recipient: string;
  subject?: string;
  message: string;
  templateData?: any;
}

export const sendNotification = async (data: NotificationData) => {
  try {
    const results = [];
    
    if (data.type === 'email' || data.type === 'both') {
      const emailResult = await sendEmail({
        to: data.recipient,
        subject: data.subject || 'Bildirim',
        message: data.message
      });
      results.push({ type: 'email', success: emailResult.success });
    }
    
    if (data.type === 'sms' || data.type === 'both') {
      const smsResult = await sendSms(data.recipient, data.message);
      results.push({ type: 'sms', success: smsResult.success });
    }
    
    return { success: true, results };
  } catch (error) {
    console.error('Bildirim gönderim hatası:', error);
    return { success: false, error };
  }
};

// Randevu bildirimi - Hastaya gönderilir
export const sendAppointmentNotification = async (
  patientEmail: string,
  patientPhone: string,
  appointmentDetails: any
) => {
  const message = `Randevunuz alındı! 
Uzman: ${appointmentDetails.doctorName}
Tarih: ${appointmentDetails.date}
Saat: ${appointmentDetails.time}
Randevu Türü: ${appointmentDetails.type}
Uzman Telefon: ${appointmentDetails.doctorPhone || 'Belirtilmemiş'}
Uzman E-posta: ${appointmentDetails.doctorEmail || 'Belirtilmemiş'}`;
  
  const results = [];
  
  // E-posta gönder
  if (patientEmail) {
    const emailResult = await sendEmail({
      to: patientEmail,
      subject: 'Randevu Bildirim',
      message
    });
    results.push({ type: 'email', success: emailResult.success });
  }
  
  // SMS gönder
  if (patientPhone) {
    const smsResult = await sendSms(patientPhone, message);
    results.push({ type: 'sms', success: smsResult.success });
  }
  
  return { success: true, results };
};

// Doktor bildirim sistemi - Uzmana gönderilir
export const sendDoctorNotification = async (
  doctorEmail: string,
  doctorPhone: string,
  notificationDetails: any
) => {
  const message = `Yeni randevu talebiniz var!
Hasta: ${notificationDetails.patientName}
Telefon: ${notificationDetails.patientPhone}
E-posta: ${notificationDetails.patientEmail}
Tarih: ${notificationDetails.appointmentDate}
Saat: ${notificationDetails.appointmentTime}
Randevu Türü: ${notificationDetails.appointmentType}
${notificationDetails.notes ? `Notlar: ${notificationDetails.notes}` : ''}`;
  
  const results = [];
  
  // E-posta gönder
  if (doctorEmail) {
    const emailResult = await sendEmail({
      to: doctorEmail,
      subject: 'Yeni Randevu Talebi',
      message
    });
    results.push({ type: 'email', success: emailResult.success });
  }
  
  // SMS gönder
  if (doctorPhone) {
    const smsResult = await sendSms(doctorPhone, message);
    results.push({ type: 'sms', success: smsResult.success });
  }
  
  return { success: true, results };
};

// Sistem bildirimi
export const sendSystemNotification = async (
  recipient: string,
  message: string,
  type: 'email' | 'sms' | 'both' = 'email'
) => {
  return sendNotification({
    type,
    recipient,
    subject: 'Sistem Bildirimi',
    message
  });
};
