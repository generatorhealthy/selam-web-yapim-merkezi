
import { supabase } from "@/integrations/supabase/client";

// Verimor SMS API ile SMS gönderme
export const sendSms = async (phone: string, message: string) => {
  try {
    console.log(`Sending SMS to ${phone}: ${message}`);
    
    // Statik IP proxy kullanarak Edge function'ı çağır
    const { data, error } = await supabase.functions.invoke('send-sms-via-static-proxy', {
      body: {
        phone: phone,
        message: message
      }
    });

    if (error) {
      console.error('SMS gönderim hatası:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('SMS gönderim hatası:', error);
    return { success: false, error };
  }
};

// Export with both names for compatibility
export const sendSMS = sendSms;
