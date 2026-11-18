import {createClient} from 'npm:@supabase/supabase-js@2';
import {corsHeaders} from 'npm:@supabase/supabase-js@2/cors';
import {verifyAdminOrCron} from '../_shared/adminAuth.ts';
import {REELS_SENDER,REELS_RECIPIENT,reelsMessage} from '../_shared/reelsRules.ts';
// Mirrors the public route slug normalization without importing frontend code.
const specialtySlug=(s:string)=>s.replace(/[ğĞüÜşŞıİöÖçÇ]/g,c=>({'ğ':'g','Ğ':'G','ü':'u','Ü':'U','ş':'s','Ş':'S','ı':'i','İ':'i','ö':'o','Ö':'O','ç':'c','Ç':'C'}[c]??c)).toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'').replace(/-+/g,'-').replace(/^-+|-+$/g,'');
const reply=(b:unknown,status=200)=>new Response(JSON.stringify(b),{status,headers:{...corsHeaders,'Content-Type':'application/json'}});
Deno.serve(async req=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:corsHeaders});
 if(req.method!=='POST')return reply({error:'POST required'},405);
 const auth=await verifyAdminOrCron(req,['admin']);if(!auth.ok)return reply({error:auth.error},auth.status);
 try{
  const url=Deno.env.get('SUPABASE_URL'),key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  let waha=(Deno.env.get('WAHA_BASE_URL')||Deno.env.get('WAHA_API_URL'))?.replace(/\/dashboard.*$/,'').replace(/\/+$/,'');
  if(waha&&!waha.startsWith('http'))waha=`https://${waha}`;
  const waKey=Deno.env.get('WAHA_API_KEY');
  if(!url||!key||!waha||!waKey)return reply({error:'Hizmet hazır değil'},503);
  const db=createClient(url,key,{auth:{persistSession:false}});
  const {error:syncError}=await db.rpc('reels_sync_jobs',{p_baseline:false});if(syncError)throw new Error('sync');
  const {data:line,error:lineError}=await db.from('whatsapp_lines').select('id,is_active').eq('phone_number',REELS_SENDER).maybeSingle();
  if(lineError)throw new Error('line');if(!line?.is_active)return reply({waiting:true});
  const headers={'X-Api-Key':waKey,'Content-Type':'application/json'};
  const response=await fetch(`${waha}/api/sessions?all=true`,{headers,signal:AbortSignal.timeout(10000)});
  if(!response.ok)return reply({waiting:true});
  const sessions=await response.json();
  const session=Array.isArray(sessions)?sessions.find(s=>s.status==='WORKING'&&s.me?.id?.split('@')[0]===REELS_SENDER):null;
  if(!session?.name)return reply({waiting:true});
  const {data:job,error}=await db.rpc('reels_claim_notice');if(error)throw new Error('claim');
  if(!job){await db.rpc('reels_stop_if_drained');return reply({skipped:true});}
  // Claim stays unknown on timeout/non-OK: never blindly repeat a possibly delivered message.
  const sent=await fetch(`${waha}/api/sendText`,{method:'POST',headers,signal:AbortSignal.timeout(20000),body:JSON.stringify({session:session.name,chatId:`${REELS_RECIPIENT}@c.us`,text:reelsMessage(job.name,job.slug,specialtySlug(job.specialty||'')),linkPreview:false})});
  if(!sent.ok)return reply({unknown:true},502);
  const result=await sent.json();const id=typeof result.id==='string'?result.id:result.id?._serialized;
  if(!id)return reply({unknown:true},502);
  const {error:saved}=await db.from('reels_jobs').update({notice_status:'sent',notice_sent_at:new Date().toISOString(),notice_message_id:id}).eq('id',job.id).eq('notice_status','unknown');
  if(saved)return reply({unknown:true},503);
  await db.rpc('reels_stop_if_drained');
  return reply({accepted:true});
 }catch{return reply({error:'Bildirim tamamlanamadı'},503);}
});