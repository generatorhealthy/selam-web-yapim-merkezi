import { resolveSms, type SmsPrincipal, type SmsInput } from './sms.ts';
export type SmsDeliveryPorts = {
 principal:(r:Request)=>Promise<SmsPrincipal|null>;
 specialist:(id:string)=>Promise<{id:string;phone:string}|null>;
 claim:(id:string,userId:string,specialistId:string,payload:string)=>Promise<boolean>;
 finish:(id:string,state:'sent'|'unknown')=>Promise<void>;
 send:(phone:string,message:string)=>Promise<void>;
};
/** Same persisted request id across ALL three transports. No fallback on unknown delivery. */
export function panelSmsHandler(p:SmsDeliveryPorts) {
 return async(req:Request)=>{
  if(req.method!=='POST')return Response.json({error:'method'},{status:405});
  const principal=await p.principal(req);
  if(!principal||'service' in principal)return Response.json({error:'auth'},{status:401});
  let b:SmsInput;try{b=await req.json();}catch{return Response.json({error:'input'},{status:400});}
  if(!b||typeof b.specialistId!=='string')return Response.json({error:'input'},{status:400});
  const spec=await p.specialist(b.specialistId);
  const resolved=resolveSms(principal,b,spec);
  if(!resolved||!resolved.requestId)return Response.json({error:'forbidden'},{status:403});
  if(!await p.claim(resolved.requestId,principal.id,b.specialistId,JSON.stringify({phone:resolved.phone,message:resolved.message})))
   return Response.json({success:false,error:'already_claimed',retryable:false},{status:409});
  try{await p.send(resolved.phone,resolved.message);await p.finish(resolved.requestId,'sent');return Response.json({success:true});}
  catch{await p.finish(resolved.requestId,'unknown').catch(()=>undefined);return Response.json({success:false,error:'delivery_unknown',retryable:false},{status:503});}
 };
}
