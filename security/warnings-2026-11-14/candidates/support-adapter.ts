import { supportHandler } from './support.ts';
/** SDK adapter injected for tests; deploy only after migration + independent approval. */
export function supportAdapter(admin:any, send:(body:Record<string,unknown>)=>Promise<void>) {
 return supportHandler({
  user:async req=>{const t=(req.headers.get('Authorization')??'').replace(/^Bearer\s+/i,'');if(!t)return null;const {data,error}=await admin.auth.getUser(t);return error?null:data?.user?.id??null;},
  ticket:async id=>{const {data,error}=await admin.from('support_tickets').select('id,specialist_id,title,description,category,priority').eq('id',id).maybeSingle();return error?null:data;},
  specialist:async id=>{const {data,error}=await admin.from('specialists').select('id,user_id,name,email').eq('id',id).maybeSingle();return error?null:data;},
  legacyTickets:async(uid,title,description)=>{
   const {data:specs,error}=await admin.from('specialists').select('id').eq('user_id',uid).limit(10);
   if(error||!specs?.length)return [];
   const {data,error:e}=await admin.from('support_tickets').select('id,specialist_id,title,description,category,priority')
    .in('specialist_id',specs.map((s:any)=>s.id)).eq('title',title).eq('description',description)
    .gte('created_at',new Date(Date.now()-15*60*1000).toISOString()).limit(2);
   return e?[]:data??[];
  },
  claim:async id=>{const {error}=await admin.from('support_notification_claims').insert({ticket_id:id});if(error&&error.code!=='23505')throw new Error('claim_unavailable');return !error;},
  finish:async(id,state)=>{const {error}=await admin.from('support_notification_claims').update({state}).eq('ticket_id',id);if(error)throw new Error('claim_update_unavailable');},
  mail:send,
 });
}
