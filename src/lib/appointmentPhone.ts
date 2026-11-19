import { supabase } from '@/integrations/supabase/client';
// Remains disabled until the separately approved database and function release.
export const APPOINTMENT_PHONE_ENABLED = false;
export async function phoneRequest(body: object): Promise<{challengeId?: string; proof?: string; appointmentId?: string}> {
 const {data,error}=await supabase.functions.invoke('appointment-phone',{body});
 if(error) {
  let message='Telefon doğrulaması tamamlanamadı.';
  try {const payload=await error.context?.json(); if(typeof payload?.error==='string') message=payload.error;} catch {}
  throw new Error(message);
 }
 if(data?.error) throw new Error(data.error);
 return data;
}