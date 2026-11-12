import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
export const VERSION='test-mail-safe-2026-11-12-v1';
export const NOTICE='Doktorum Ol hesabınızda değerlendirmenizi bekleyen yeni bir kayıt bulunmaktadır. Detayları güvenli uzman panelinizden inceleyebilirsiniz.';
export interface Ports {
 user(token:string):Promise<string|null>;
 route(id:string,user:string):Promise<string|null>;
 claim(id:string,user:string):Promise<boolean>;
 finish(id:string,status:'sent'|'failed'|'unknown'):Promise<void>;
 send(payload:Record<string,unknown>):Promise<'sent'|'failed'|'unknown'>;
}
export function makeHandler(p:Ports){
 return async(req:Request):Promise<Response>=>{
 const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...corsHeaders,'Content-Type':'application/json','Cache-Control':'no-store','X-Notice-Version':VERSION}});
 if(req.method==='OPTIONS')return reply({version:VERSION});
 if(req.method!=='POST')return reply({error:'method_not_allowed'},405);
 let claimed:string|null=null;
 try{
 const token=req.headers.get('authorization')?.match(/^Bearer (\S+)$/i)?.[1];
 if(!token)return reply({error:'unauthorized'},401);
 const user=await p.user(token);
 if(!user)return reply({error:'unauthorized'},401); // No legacy body read before identity verification.
 const body=await req.json().catch(()=>null);
 const id=body?.testResultId;
 if(typeof id!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))return reply({error:'invalid_result'},400);
 const recipient=await p.route(id,user);
 if(!recipient||! /^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(recipient)||/[\r\n]/.test(recipient))return reply({error:'forbidden'},403);
 if(!await p.claim(id,user))return reply({success:true,notification:'already_claimed'});
 claimed=id;
 const status=await p.send({sender:{email:'info@doktorumol.com.tr',name:'Doktorum Ol'},to:[{email:recipient}],subject:'Yeni değerlendirme bildirimi',htmlContent:`<p>${NOTICE}</p>`});
 await p.finish(id,status);
 return reply({success:status==='sent',notification:status},status==='sent'?200:202);
 }catch{
 if(claimed)await p.finish(claimed,'unknown').catch(()=>undefined);
 return reply({error:'notification_not_completed'},503); // No body, provider response or health logs.
 }
 };
}