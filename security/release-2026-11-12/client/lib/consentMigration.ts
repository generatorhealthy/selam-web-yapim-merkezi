// DRAFT integration adapter for new web/mobile consent screens, not imported by src.
import {supabase} from '@/integrations/supabase/client';
export type Purpose='health_test'|'health_appointment'|'sms_marketing'|'email_marketing'|'phone_marketing'|'analytics'|'ads';
export async function recordChoice(operationId:string,purpose:Purpose,action:'grant'|'decline'|'withdraw',reaffirmed:boolean){
 // Client session presence is not proof: secure-consent validates getUser and provider server-side.
 const {data,error}=await supabase.functions.invoke('secure-consent',{body:{operationId,purpose,action,reaffirmed}});
 if(error||!data?.eventId)throw new Error('Onay işlemi kaydedilemedi.');return data.eventId as string;
}
export async function verifiedReturn(){
 const {data,error}=await supabase.auth.getUser();
 if(error||!data.user?.email_confirmed_at)return {status:'await_email_verification' as const};
 if(['google','apple'].includes(data.user.app_metadata?.provider))return {status:'show_new_choices' as const};
 return {status:'show_verified_choices' as const};
}
// Do not derive consent from signup response, metadata or old local checkboxes.
// Pre-session prepare/finalize and old-version rollout remain release blockers.