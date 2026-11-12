// Client migration DRAFT. Copy into src only with complete rollout approval.
import { supabase } from '@/integrations/supabase/client';
export type Operation={operationId:string;capability:string};
async function invoke(body:unknown){
 const {data,error}=await supabase.functions.invoke('secure-test-submission',{body});
 if(error||!data)throw new Error('Test işlemi tamamlanamadı.');return data;
}
export async function testDocuments():Promise<{disclosure:string;consent:string;captchaSiteKey:string|null}>{return invoke({action:'documents'});}
export async function startTest(testId:string,specialistId:string|null,captchaToken:string, decision:{disclosureShown:boolean;healthConsentGranted:boolean}):Promise<Operation>{
 if(decision.disclosureShown!==true||decision.healthConsentGranted!==true)throw new Error('Ayrı sağlık verisi izni gerekli.');
 const {data:user,error}=await supabase.auth.getUser();
 if(user.user){
  if(error||!user.user.email_confirmed_at)throw new Error('E-posta doğrulaması gerekli.');
  const {error:consentError}=await supabase.functions.invoke('secure-consent',{body:{operationId:crypto.randomUUID(),purpose:'health_test',action:'grant',reaffirmed:true}});
  if(consentError)throw new Error('İzin kaydedilemedi.');
 }
 return invoke({action:'prepare',testId,specialistId,guestDeclared:true,disclosureShown:decision.disclosureShown,healthConsentGranted:decision.healthConsentGranted,captchaToken});
}
export async function submitTest(operation:Operation,name:string,contact:string,answers:Record<string,unknown>):Promise<{resultId:string;specialistId:string;results:Record<string,unknown>;notification:'queued'}>{
 return invoke({action:'submit',...operation,name,contact,answers});
}
// Keep capability in memory only, never URL, analytics, console, email or persistent storage.