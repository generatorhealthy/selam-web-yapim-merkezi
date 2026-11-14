import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3.25.76';
const schema = z.object({ specialistId: z.string().uuid(), active: z.boolean(), reason: z.string().trim().min(5).max(1000) }).strict();
const reply = (body: unknown, status=200) => new Response(JSON.stringify(body), {status,headers:{...corsHeaders,'Content-Type':'application/json'}});
Deno.serve(async(req: Request)=>{
 if(req.method==='OPTIONS') return new Response('ok',{headers:corsHeaders});
 if(req.method!=='POST') return reply({error:'POST gerekli'},405);
 const authorization=req.headers.get('Authorization');
 if(!authorization) return reply({error:'Yönetici oturumu gerekli'},401);
 try {
  const parsed=schema.safeParse(await req.json());
  if(!parsed.success) return reply({error:'Geçerli uzman, durum ve gerekçe gerekli'},400);
  const url=Deno.env.get('SUPABASE_URL'),anon=Deno.env.get('SUPABASE_ANON_KEY'),service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if(!url||!anon||!service) return reply({error:'İşlem şu anda kullanılamıyor'},503);
  const client=createClient(url,anon,{global:{headers:{Authorization:authorization}}});
  const {data:identity,error:identityError}=await client.auth.getUser();
  if(identityError||!identity.user) return reply({error:'Geçerli oturum gerekli'},401);
  const {data:admin,error:roleError}=await client.rpc('is_admin_user');
  if(roleError||admin!==true) return reply({error:'Yalnız yönetici üyeliği aktifleştirebilir'},403);
  const {specialistId,active,reason}=parsed.data;
  const server=createClient(url,service);
  const {data,error}=await server.rpc('set_specialist_publication_server',{p_specialist_id:specialistId,p_active:active,p_reason:reason,p_actor_id:identity.user.id});
  if(error) return reply({error:'Üyelik durumu değiştirilemedi; kayıtlı uzman hesabı doğrulanmalıdır'},409);
  return reply(data);
 }catch{return reply({error:'İşlem doğrulanamadı; üyelik durumunu yeniden kontrol edin'},500);}
});