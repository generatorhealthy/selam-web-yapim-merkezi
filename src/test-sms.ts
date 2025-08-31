import { supabase } from "@/integrations/supabase/client";

// Test SMS gönderimi
export const testSms = async () => {
  try {
    console.log('Test SMS gönderiliyor...');
    
    const { data, error } = await supabase.functions.invoke('send-sms-via-static-proxy', {
      body: {
        phone: '05347654321',
        message: 'Test SMS - DoktorumOl sisteminden gönderildi. SMS relay çalışıyor!'
      }
    });

    if (error) {
      console.error('SMS test hatası:', error);
      return { success: false, error };
    }

    console.log('SMS test sonucu:', data);
    return { success: true, data };
  } catch (error) {
    console.error('SMS test hatası:', error);
    return { success: false, error };
  }
};

// Test butonuna basıldığında çalıştır
(window as any).testSms = testSms;