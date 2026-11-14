import {panelSmsHandler} from './sms-delivery.ts';
const hash=async(v:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(v)))).map(b=>b.toString(16).padStart(2,'0')).join('');
export function smsAdapter(admin:any,send:(phone:string,message:string)=>Promise<void>) {
 return panelSmsHandler({
  principal:async req=>{
   const token=(req.headers.get('Authorization')??'').replace(/^Bearer\s+/i,'');if(!token)return null;
   const {data,error}=await admin.auth.getUser(token);if(error||!data?.user)return null;
   const {data:p,error:e}=await admin.from('user_profiles').select('role,is_approved').eq('user_id',data.user.id).maybeSingle();
   return e||!p?null:{id:data.user.id,role:p.role,approved:p.is_approved===true};
  },
  specialist:async id=>{const {data,error}=await admin.from('specialists').select('id,phone').eq('id',id).maybeSingle();return error?null:data;},
  claim:async(request_id,user_id,specialist_id,payload)=>{
   const {error}=await admin.from('panel_sms_claims').insert({request_id,user_id,specialist_id,payload_hash:await hash(payload)});
   if(error&&error.code!=='23505')throw new Error('claim_unavailable');return !error;
  },
  finish:async(request_id,state)=>{const {error}=await admin.from('panel_sms_claims').update({state}).eq('request_id',request_id);if(error)throw new Error('claim_unavailable');},
  send,
 });
}
