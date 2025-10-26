
import { supabase } from "@/integrations/supabase/client";

// Verimor SMS API ile SMS gönderme
export const sendSms = async (phone: string, message: string) => {
  try {
    console.log(`Sending SMS to ${phone}: ${message}`);
    
    // Statik IP proxy kullanarak Edge function'ı çağır (öncelikli)
    const tryInvoke = async (fnName: string) => {
      const res = await supabase.functions.invoke(fnName, {
        body: { phone, message }
      });
      console.log(`[smsService] ${fnName} response:`, res);
      return res;
    };

    let used = 'send-sms-via-static-proxy';
    let { data, error } = await tryInvoke('send-sms-via-static-proxy');

    if (error || (data && (data as any).success === false)) {
      console.warn('[smsService] Primary failed, trying fallbacks...');
      for (const fn of ['send-sms-via-proxy', 'send-verimor-sms']) {
        const r = await tryInvoke(fn);
        if (!r.error && (!r.data || (r.data as any).success !== false)) {
          used = fn;
          data = r.data; error = undefined;
          break;
        }
        error = r.error || new Error((r.data as any)?.error || 'Unknown fallback error');
      }
    }

    if (error) {
      console.error('SMS gönderim hatası:', error);
      return { success: false, error } as any;
    }

    console.log(`[smsService] Sent OK via ${used}`);
    return { success: true, data } as any;
  } catch (error) {
    console.error('SMS gönderim hatası:', error);
    return { success: false, error } as any;
  }
};

// Export with both names for compatibility
export const sendSMS = sendSms;
