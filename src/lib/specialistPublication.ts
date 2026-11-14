import { supabase } from '@/integrations/supabase/client';
export async function setSpecialistPublication(specialistId: string, active: boolean) {
 const {data,error}=await supabase.functions.invoke('set-specialist-publication',{body:{specialistId,active,reason:active?'Yönetici talebiyle ödeme bekleyen üyeliğin aktivasyonu':'Yönetici talebiyle üyeliğin pasifleştirilmesi'}});
 if(error||data?.success!==true){
  const detail=error?.context instanceof Response?await error.context.json().catch(()=>null):data;
  throw new Error(detail?.error||'Üyelik durumu güncellenemedi');
 }
 return data as {success:true;active:boolean;duplicate:boolean};
}