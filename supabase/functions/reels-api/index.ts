import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3';
import { sha256 } from 'npm:@noble/hashes@1.8.0/sha256';
import { REELS_BUCKET, REELS_MAX_BYTES, detectReelsVideo } from '../_shared/reelsRules.ts';

const schema = z.discriminatedUnion('action', [
 z.object({action:z.literal('list'),offset:z.number().int().min(0).default(0),search:z.string().max(100).default('')}).strict(),
 z.object({action:z.literal('videos'),jobId:z.string().uuid()}).strict(),
 z.object({action:z.literal('upload'),jobId:z.string().uuid(),filename:z.string().min(1).max(200),mime:z.enum(['video/mp4','video/quicktime','video/webm']),size:z.number().int().min(17).max(REELS_MAX_BYTES)}).strict(),
 z.object({action:z.literal('finalize'),uploadId:z.string().uuid()}).strict(),
 z.object({action:z.literal('url'),videoId:z.string().uuid(),download:z.boolean().default(false)}).strict(),
 z.object({action:z.literal('grant'),userId:z.string().uuid(),active:z.boolean()}).strict(),
]);
const reply=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{...corsHeaders,'Content-Type':'application/json','Cache-Control':'no-store'}});
Deno.serve(async req=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:corsHeaders});
 if(req.method!=='POST')return reply({error:'Geçersiz işlem'},405);
 try{
  const url=Deno.env.get('SUPABASE_URL'),key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if(!url||!key)return reply({error:'Hizmet hazır değil'},503);
  const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const token=req.headers.get('Authorization')?.replace(/^Bearer\s+/i,'');
  if(!token)return reply({error:'Giriş gerekli'},401);
  const {data:{user},error:authError}=await db.auth.getUser(token);
  if(authError||!user)return reply({error:'Oturum doğrulanamadı'},401);
  const [{data:profile,error:profileError},{data:member,error:memberError}]=await Promise.all([
   db.from('user_profiles').select('role,is_approved').eq('user_id',user.id).maybeSingle(),
   db.from('reels_team_members').select('active').eq('user_id',user.id).maybeSingle(),
  ]);
  if(profileError||memberError)return reply({error:'Yetki doğrulanamadı'},503);
  const admin=profile?.role==='admin'&&profile?.is_approved===true;
  if(!admin&&member?.active!==true)return reply({error:'Bu alan için yetkiniz yok'},403);
  if(Number(req.headers.get('content-length')||0)>8000)return reply({error:'İstek çok büyük'},400);
  const parsed=schema.safeParse(await req.json());
  if(!parsed.success)return reply({error:'Geçersiz bilgiler'},400);
  const body=parsed.data;
  if(body.action==='grant'){
   if(!admin)return reply({error:'Yalnız yönetici'},403);
   const {data:target}=await db.from('user_profiles').select('role').eq('user_id',body.userId).maybeSingle();
   // Never layer the restricted role over another privileged role.
   if(!target||!['user'].includes(target.role))return reply({error:'Ekip hesabının başka bir panel yetkisi olmamalı'},409);
   const {error}=await db.from('reels_team_members').upsert({user_id:body.userId,active:body.active});
   if(error)throw new Error('grant');return reply({success:true});
  }
  if(body.action==='list'){
   const {data,error}=await db.rpc('reels_list_jobs_server',{p_actor:user.id,p_offset:body.offset,p_limit:30,p_search:body.search});
   if(error)throw new Error('list');return reply({jobs:data});
  }
  if(body.action==='url'){
   if(body.download&&!admin)return reply({error:'İndirme yalnız yöneticiye açık'},403);
   const {data:video,error}=await db.from('reels_videos').select('id,storage_path,job_id,mime_type').eq('id',body.videoId).maybeSingle();
   if(error||!video)return reply({error:'Video bulunamadı'},404);
   const {data:job}=await db.from('reels_jobs').select('specialist_id').eq('id',video.job_id).maybeSingle();
   if(!job?.specialist_id)return reply({error:'Uzman artık mevcut değil'},404);
   const {data:s}=await db.from('specialists').select('is_active').eq('id',job.specialist_id).maybeSingle();
   if(!s?.is_active&&!admin)return reply({error:'Uzman aktif değil'},403);
   const {data:signed,error:signError}=await db.storage.from(REELS_BUCKET).createSignedUrl(video.storage_path,300,body.download?{download:`reels-${video.id}.${video.storage_path.split('.').pop()}`} : undefined);
   if(signError||!signed)throw new Error('sign');return reply({url:signed.signedUrl,expiresIn:300});
  }
  if(body.action==='finalize'){
   const {data:upload,error}=await db.from('reels_uploads').select('*').eq('id',body.uploadId).eq('uploaded_by',user.id).maybeSingle();
   if(error||!upload)return reply({error:'Yükleme bulunamadı'},404);
   if(upload.status==='ready')return reply({success:true});
   if(upload.status!=='pending'||new Date(upload.created_at).getTime()<Date.now()-60*60*1000)return reply({error:'Yükleme süresi doldu'},409);
   const {data:claimed,error:claimError}=await db.from('reels_uploads').update({status:'validating'}).eq('id',upload.id).eq('status','pending').select('id').maybeSingle();
   if(claimError||!claimed)return reply({error:'Yükleme zaten kontrol ediliyor'},409);
   const {data:signed}=await db.storage.from(REELS_BUCKET).createSignedUrl(upload.storage_path,60);
   if(!signed)throw new Error('missing upload');
   const response=await fetch(signed.signedUrl,{signal:AbortSignal.timeout(90000)});
   if(!response.ok||!response.body)throw new Error('read upload');
   const hash=sha256.create();let total=0;let header=new Uint8Array();let hasVideo=false;let carry=new Uint8Array();
   const reader=response.body.getReader();
   while(true){
    const {done,value}=await reader.read();if(done)break;
    total+=value.length;
    if(total>REELS_MAX_BYTES||total>upload.byte_size){await reader.cancel();break;}
    hash.update(value);
    if(header.length<65536){const n=new Uint8Array(Math.min(65536,header.length+value.length));n.set(header);n.set(value.slice(0,n.length-header.length),header.length);header=n;}
    const scan=new Uint8Array(carry.length+value.length);scan.set(carry);scan.set(value,carry.length);
    // Container must declare a video track, not merely a renamed file/audio.
    for(let i=0;i+24<=scan.length;i++){
     if(scan[i]===0x68&&scan[i+1]===0x64&&scan[i+2]===0x6c&&scan[i+3]===0x72&&scan[i+12]===0x76&&scan[i+13]===0x69&&scan[i+14]===0x64&&scan[i+15]===0x65)hasVideo=true;
    }
    if(upload.mime_type==='video/webm'){
     const text=new TextDecoder().decode(scan);
     if(text.includes('V_VP8')||text.includes('V_VP9')||text.includes('V_AV1'))hasVideo=true;
    }
    carry=scan.slice(-64);
   }
   const ext=detectReelsVideo(header,upload.mime_type,upload.filename,total);
   if(total!==upload.byte_size||!ext||!hasVideo){
    await db.storage.from(REELS_BUCKET).remove([upload.storage_path]);
    await db.from('reels_uploads').update({status:'rejected'}).eq('id',upload.id);
    return reply({error:'Geçerli bir MP4, MOV veya WebM videosu yükleyin'},400);
   }
   const finalPath=`validated/${upload.job_id}/${upload.id}.${ext}`;
   const {error:moveError}=await db.storage.from(REELS_BUCKET).move(upload.storage_path,finalPath);
   if(moveError)throw new Error('move');
   const digest=Array.from(hash.digest()).map(b=>b.toString(16).padStart(2,'0')).join('');
   const {error:saveError}=await db.from('reels_videos').insert({id:upload.id,job_id:upload.job_id,uploaded_by:user.id,storage_path:finalPath,mime_type:upload.mime_type,byte_size:total,sha256:digest});
   if(saveError){await db.storage.from(REELS_BUCKET).remove([finalPath]);throw new Error('save');}
   await db.from('reels_uploads').update({status:'ready'}).eq('id',upload.id);
   return reply({success:true});
  }
  const {data:job,error:jobError}=await db.from('reels_jobs').select('id,specialist_id').eq('id',body.jobId).maybeSingle();
  if(jobError||!job?.specialist_id)return reply({error:'Uzman bulunamadı'},404);
  const {data:spec}=await db.from('specialists').select('is_active').eq('id',job.specialist_id).maybeSingle();
  if(!spec?.is_active)return reply({error:'Uzman aktif değil'},409);
  if(body.action==='videos'){
   const {data,error}=await db.from('reels_videos').select('id,mime_type,byte_size,created_at').eq('job_id',job.id).order('created_at',{ascending:false}).limit(100);
   if(error)throw new Error('videos');return reply({videos:data});
  }
  const ext=body.filename.toLowerCase().split('.').pop();
  const expected={'video/mp4':'mp4','video/quicktime':'mov','video/webm':'webm'}[body.mime];
  if(ext!==expected)return reply({error:'Dosya türü ve uzantısı uyuşmuyor'},400);
  const {count,error:countError}=await db.from('reels_uploads').select('id',{count:'exact',head:true}).eq('uploaded_by',user.id).gte('created_at',new Date(Date.now()-3600000).toISOString());
  if(countError)throw new Error('count');if((count??0)>=20)return reply({error:'Saatlik yükleme sınırına ulaştınız'},429);
  const id=crypto.randomUUID(),path=`quarantine/${user.id}/${id}.${ext}`;
  const {error:insertError}=await db.from('reels_uploads').insert({id,job_id:job.id,uploaded_by:user.id,storage_path:path,filename:body.filename,mime_type:body.mime,byte_size:body.size});
  if(insertError)throw new Error('upload row');
  const {data:signed,error:signError}=await db.storage.from(REELS_BUCKET).createSignedUploadUrl(path,{upsert:false});
  if(signError||!signed)throw new Error('upload sign');
  return reply({uploadId:id,path,token:signed.token});
 }catch{return reply({error:'İşlem tamamlanamadı. Lütfen tekrar deneyin.'},503);}
});