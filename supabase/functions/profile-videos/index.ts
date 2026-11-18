import {createClient} from 'npm:@supabase/supabase-js@2';
import {corsHeaders} from 'npm:@supabase/supabase-js@2/cors';
import {z} from 'npm:zod@3';
import {detectReelsVideo} from '../_shared/reelsRules.ts';
import {hasVideoTrack,PROFILE_VIDEO_MAX_BYTES,canReviewProfileVideo} from '../_shared/profileVideoRules.ts';
const bucket='profile-videos';
const schema=z.discriminatedUnion('action',[
 z.object({action:z.literal('list'),specialistId:z.string().uuid()}).strict(),
 z.object({action:z.literal('mine'),specialistId:z.string().uuid()}).strict(),
 z.object({action:z.literal('review-list'),offset:z.number().int().min(0).default(0)}).strict(),
 z.object({action:z.literal('review'),videoId:z.string().uuid(),decision:z.enum(['approved','rejected'])}).strict(),
 z.object({action:z.literal('upload'),specialistId:z.string().uuid(),filename:z.string().min(1).max(200),mime:z.enum(['video/mp4','video/quicktime','video/webm']),size:z.number().int().min(17).max(PROFILE_VIDEO_MAX_BYTES)}).strict(),
 z.object({action:z.literal('finalize'),videoId:z.string().uuid()}).strict(),
 z.object({action:z.literal('delete'),videoId:z.string().uuid()}).strict(),
]);
const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...corsHeaders,'Content-Type':'application/json','Cache-Control':'no-store'}});
Deno.serve(async req=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:corsHeaders});
 if(req.method!=='POST')return reply({error:'Geçersiz işlem'},405);
 try{
  if(Number(req.headers.get('content-length')||0)>8000)return reply({error:'İstek çok büyük'},400);
  const parsed=schema.safeParse(await req.json());if(!parsed.success)return reply({error:'Geçersiz video bilgisi'},400);
  const url=Deno.env.get('SUPABASE_URL'),key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if(!url||!key)return reply({error:'Video hizmeti hazır değil'},503);
  const db=createClient(url,key,{auth:{persistSession:false}}),body=parsed.data;
  if(body.action==='list'){
   const {data:s,error}=await db.from('specialists').select('id').eq('id',body.specialistId).eq('is_active',true).maybeSingle();
   if(error)throw error;if(!s)return reply({videos:[]});
   const {data:rows,error:readError}=await db.from('specialist_profile_videos').select('id,storage_path,created_at').eq('specialist_id',s.id).eq('status','ready').eq('moderation_status','approved').order('created_at').limit(6);
   if(readError)throw readError;
   const videos=await Promise.all((rows||[]).map(async v=>{const {data,error:signError}=await db.storage.from(bucket).createSignedUrl(v.storage_path,3600);if(signError)throw signError;return {id:v.id,url:data?.signedUrl,created_at:v.created_at};}));
   return reply({videos});
  }
  const token=req.headers.get('Authorization')?.replace(/^Bearer\s+/i,'');if(!token)return reply({error:'Giriş yapmalısınız'},401);
  const {data:{user},error:authError}=await db.auth.getUser(token);if(authError||!user)return reply({error:'Oturum doğrulanamadı'},401);
  if(body.action==='review-list'||body.action==='review'){
   const {data:profile}=await db.from('user_profiles').select('role,is_approved').eq('user_id',user.id).maybeSingle();
   if(!canReviewProfileVideo(profile?.role||'',profile?.is_approved===true))return reply({error:'Yalnız yönetici video değerlendirebilir'},403);
   if(body.action==='review'){
    const {data:changed,error}=await db.rpc('review_profile_video',{p_actor:user.id,p_video:body.videoId,p_decision:body.decision});
    if(error)throw error;if(!changed)return reply({error:'Video zaten değerlendirildi veya kaldırıldı'},409);
    return reply({success:true});
   }
   const {data:rows,error,count}=await db.from('specialist_profile_videos').select('id,storage_path,filename,created_at,specialist_id,specialists(name,profile_picture)',{count:'exact'}).eq('status','ready').eq('moderation_status','pending').order('created_at').range(body.offset,body.offset+19);
   if(error)throw error;
   const videos=await Promise.all((rows||[]).map(async({storage_path,...v})=>{const {data,error}=await db.storage.from(bucket).createSignedUrl(storage_path,300);if(error)throw error;return {...v,url:data?.signedUrl};}));
   return reply({videos,total:count||0});
  }
  if(body.action==='mine'){
   const {data:owner}=await db.from('specialists').select('user_id').eq('id',body.specialistId).maybeSingle();
   if(owner?.user_id!==user.id)return reply({error:'Yalnız kendi videolarınızı görebilirsiniz'},403);
   const {data:rows,error}=await db.from('specialist_profile_videos').select('id,storage_path,created_at,moderation_status').eq('specialist_id',body.specialistId).eq('status','ready').order('created_at').limit(6);
   if(error)throw error;
   const videos=await Promise.all((rows||[]).map(async({storage_path,...v})=>{const {data,error}=await db.storage.from(bucket).createSignedUrl(storage_path,300);if(error)throw error;return {...v,url:data?.signedUrl};}));
   return reply({videos});
  }
  if(body.action==='upload'){
   const ext={'video/mp4':'mp4','video/quicktime':'mov','video/webm':'webm'}[body.mime];
   if(body.filename.toLowerCase().split('.').pop()!==ext)return reply({error:'Yalnız MP4, MOV veya WebM video yükleyin'},400);
   const {data:id,error}=await db.rpc('reserve_profile_video',{p_actor:user.id,p_specialist:body.specialistId,p_filename:body.filename,p_mime:body.mime,p_size:body.size});
   if(error)return reply({error:error.code==='54000'?'En fazla 6 video ekleyebilirsiniz':'Yükleme izni doğrulanamadı'},error.code==='54000'?409:403);
   const path=`quarantine/${body.specialistId}/${id}`;
   const {data:signed,error:signError}=await db.storage.from(bucket).createSignedUploadUrl(path,{upsert:false});
   if(signError||!signed){await db.from('specialist_profile_videos').update({status:'rejected'}).eq('id',id);throw signError;}
   return reply({videoId:id,path,token:signed.token});
  }
  const {data:v,error}=await db.from('specialist_profile_videos').select('*').eq('id',body.videoId).maybeSingle();
  if(error||!v)return reply({error:'Video bulunamadı'},404);
  const {data:owner}=await db.from('specialists').select('user_id,is_active').eq('id',v.specialist_id).maybeSingle();
  if(owner?.user_id!==user.id||!owner?.is_active)return reply({error:'Yalnız kendi profilinizin videolarını düzenleyebilirsiniz'},403);
  if(body.action==='delete'){
   if(v.status==='validating')return reply({error:'Video doğrulanıyor, lütfen bekleyin'},409);
   const {data:claimed}=await db.from('specialist_profile_videos').update({status:'deleting'}).eq('id',v.id).eq('status',v.status).select('id').maybeSingle();
   if(!claimed)return reply({error:'Video başka bir işlemde'},409);
   const {error:removeError}=await db.storage.from(bucket).remove([v.storage_path]);if(removeError)throw removeError;
   const {error:deleteError}=await db.from('specialist_profile_videos').delete().eq('id',v.id);if(deleteError)throw deleteError;
   return reply({success:true});
  }
  if(v.status==='ready')return reply({success:true});
  if(v.status!=='pending'||Date.now()-new Date(v.created_at).getTime()>3600000)return reply({error:'Yükleme süresi doldu'},409);
  const {data:claim}=await db.from('specialist_profile_videos').update({status:'validating'}).eq('id',v.id).eq('status','pending').select('id').maybeSingle();
  if(!claim)return reply({error:'Video zaten doğrulanıyor'},409);
  try{
   const {data:file,error:downloadError}=await db.storage.from(bucket).download(v.storage_path);if(downloadError||!file)throw new Error('read');
   if(file.size!==v.byte_size||file.size>PROFILE_VIDEO_MAX_BYTES)throw new Error('size');
   const bytes=new Uint8Array(await file.arrayBuffer());
   const ext=detectReelsVideo(bytes.slice(0,65536),v.mime_type,v.filename,file.size);
   if(!ext||!hasVideoTrack(bytes,v.mime_type))throw new Error('format');
   const path=`published/${v.specialist_id}/${v.id}.${ext}`;
   const {error:moveError}=await db.storage.from(bucket).move(v.storage_path,path);if(moveError)throw moveError;
   const {error:saveError}=await db.from('specialist_profile_videos').update({status:'ready',storage_path:path}).eq('id',v.id).eq('status','validating');if(saveError)throw saveError;
   return reply({success:true});
  }catch{
   await db.storage.from(bucket).remove([v.storage_path]);await db.from('specialist_profile_videos').update({status:'rejected'}).eq('id',v.id).eq('status','validating');
   return reply({error:'Video doğrulanamadı. Geçerli MP4, MOV veya WebM dosyası yükleyin.'},400);
  }
 }catch{return reply({error:'Video işlemi tamamlanamadı. Lütfen tekrar deneyin.'},503);}
});