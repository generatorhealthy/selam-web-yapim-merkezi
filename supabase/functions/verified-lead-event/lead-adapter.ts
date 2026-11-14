const hash=async(v:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(v)))).map(b=>b.toString(16).padStart(2,'0')).join('');
/** User id comes only from getUser, not request JSON. No old attribution adoption. */
export function leadAdapter(admin:any) {
 return async(req:Request)=>{
  if(req.method!=='POST')return Response.json({error:'method'},{status:405});
  let body:any;try{body=await req.clone().json();}catch{return Response.json({error:'input'},{status:400});}
  if(body?.action!=='issue')return atomicLeadEvent(admin,req);
   const session_id='ls_'+crypto.randomUUID();
   const token=Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b=>b.toString(16).padStart(2,'0')).join('');
   const {error}=await admin.from('lead_session_authority').insert({session_id,token_hash:await hash(token),expires_at:new Date(Date.now()+30*86400000).toISOString()});
   if(error)return Response.json({error:'session_unavailable'},{status:503});
   return Response.json({session_id,token});
 };
}
/** Actual dispatch validates token + identity again within one service-only DB RPC. */
export async function atomicLeadEvent(admin:any,req:Request) {
 let b:any;try{b=await req.json();}catch{return Response.json({error:'input'},{status:400});}
 if(!b||typeof b.session_id!=='string'||!/^ls_[0-9a-f-]{36}$/i.test(b.session_id)||typeof b.token!=='string'||!/^[0-9a-f]{64}$/.test(b.token)||typeof b.event_name!=='string'||JSON.stringify(b).length>10000)return Response.json({error:'input'},{status:400});
 const bearer=(req.headers.get('Authorization')??'').replace(/^Bearer\s+/i,'');
 const {data,error}=bearer?await admin.auth.getUser(bearer):{data:null,error:null};
 const {error:e}=await admin.rpc('track_verified_lead_event',{p_session_id:b.session_id,p_token:b.token,p_uid:error?null:data?.user?.id??null,p_event_name:b.event_name,p_event_id:typeof b.event_id==='string'?b.event_id:crypto.randomUUID(),p_properties:b.properties??{},p_touch:b.touch??{}});
 return e?Response.json({error:'unauthorized'},{status:401}):Response.json({success:true});
}
