// Client migration DRAFT. Copy into src only with complete rollout approval.
import { supabase } from '@/integrations/supabase/client';
export type Operation={operationId:string;capability:string};
async function invoke(body:unknown){
 const {data,error}=await supabase.functions.invoke('secure-test-submission',{body});
 if(error||!data)throw new Error('Test işlemi tamamlanamadı.');return data;
}
export async function prepareTest(testId:string,specialistId:string|null,guestDeclared:boolean):Promise<Operation>{
 return invoke({action:'prepare',testId,specialistId,guestDeclared});
}
export async function submitTest(operation:Operation,name:string,contact:string,answers:Record<string,unknown>):Promise<{resultId:string;notification:'queued'}>{
 return invoke({action:'submit',...operation,name,contact,answers});
}
// Keep capability in memory only, never URL, analytics, console, email or persistent storage.