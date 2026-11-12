// Real SDK adapter candidate shared by web/mobile registration and OAuth callback.
import {supabase} from '@/integrations/supabase/client';
export async function emailSignup(email:string,password:string,redirectTo:string){
 const {data,error}=await supabase.auth.signUp({email:email.trim(),password,options:{emailRedirectTo:redirectTo}});
 if(error)throw error;
 // Never insert consent/profile with an unverified signup user ID.
 return data.session?'verify_server_identity':'check_email';
}
export async function oauthSignup(provider:'google'|'apple',redirectTo:string){
 const {error}=await supabase.auth.signInWithOAuth({provider,options:{redirectTo}});if(error)throw error;
}
export async function finalizeEmailReceipt(receiptId:string,capability:string){
 const {data,error}=await supabase.functions.invoke('pending-consent',{body:{action:'finalize',receiptId,capability}});
 if(error||data?.finalized!==true)throw new Error('Doğrulanmış onay geçişi tamamlanamadı.');
}
export async function prepareEmailChoices(email:string,choices:Record<string,boolean>,captchaToken:string):Promise<{receiptId:string;capability:string}>{
 const {data,error}=await supabase.functions.invoke('pending-consent',{body:{action:'prepare',email:email.trim(),disclosureShown:true,choices,captchaToken}});
 if(error||!data?.receiptId||!data?.capability)throw new Error('Kayıt öncesi tercihler kaydedilemedi.');return data;
}
// OAuth callback must use fresh recordChoice, never finalize a pre-OAuth email receipt.
// Mobile receipts go in OS secure credential storage, not Preferences/localStorage or redirect URLs.