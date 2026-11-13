import {createClient} from 'npm:@supabase/supabase-js@2';
import {corsHeaders} from 'npm:@supabase/supabase-js@2/cors';
import {z} from 'npm:zod@3';
const schema=z.object({orderId:z.string().uuid(),specialistId:z.string().uuid(),bankReference:z.string().trim().min(8).max(120),amount:z.number().positive(),statementChecked:z.literal(true)}).strict();
Deno.serve(async(req)=>{
 const json=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{...corsHeaders,'Content-Type':'application/json'}});
 if(req.method==='OPTIONS')return new Response('ok',{headers:corsHeaders});
 if(req.method!=='POST')return json({error:'Method not allowed'},405);
 const url=Deno.env.get('SUPABASE_URL')||'',anon=Deno.env.get('SUPABASE_ANON_KEY')||'',service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
 if(!url||!anon||!service)return json({error:'Sunucu yapılandırması eksik'},503);
 const token=(req.headers.get('authorization')||'').replace(/^Bearer\s+/i,'');
 if(!token||token===service)return json({error:'Yönetici oturumu gerekli'},401);
 const {data:{user},error:authError}=await createClient(url,anon).auth.getUser(token);
 if(authError||!user)return json({error:'Geçersiz oturum'},401);
 const db=createClient(url,service);
 const {data:profile,error:profileError}=await db.from('user_profiles').select('role,is_approved').eq('user_id',user.id).maybeSingle();
 if(profileError||profile?.role!=='admin'||profile.is_approved!==true)return json({error:'Yalnız onaylı yönetici'},403);
 let input;
 try{input=schema.safeParse(await req.json());}catch{return json({error:'Geçersiz istek'},400);}
 if(!input.success)return json({error:'Banka referansı, tam tutar ve gerçek banka hareketi kontrolü gerekli'},400);
 const b=input.data;
 const {data,error}=await db.rpc('confirm_bank_transfer_server',{p_actor_id:user.id,p_order_id:b.orderId,p_specialist_id:b.specialistId,p_bank_reference:b.bankReference,p_amount:b.amount,p_statement_checked:b.statementChecked});
 if(error)return json({error:error.message},error.code==='42501'?403:409);
 return json({success:true,result:data});
});