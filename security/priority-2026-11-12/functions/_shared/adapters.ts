// Production adapter DRAFT, isolated from automatic deployment. No service key as caller token.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { type Actor, type Delivery, type Resource, type Ports } from './notices.ts';
export function clients() {
  const url=Deno.env.get('SUPABASE_URL'),service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),anon=Deno.env.get('SUPABASE_ANON_KEY');
  if (!url||!service||!anon) throw new Error('configuration_unavailable');
  return {url,anon,db:createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}})};
}
export function ports(kind: 'test'|'contact', sender: (r:Resource,c:string)=>Promise<Delivery>): Ports {
  const {url,anon,db}=clients();
  return {
    authenticate:async req=>{
      const authorization=req.headers.get('authorization');
      if (!authorization?.startsWith('Bearer ')) return null;
      const userClient=createClient(url,anon,{global:{headers:{Authorization:authorization}},auth:{persistSession:false}});
      const {data,error}=await userClient.auth.getUser();
      if (error||!data.user) return null;
      const {data:staff,error:roleError}=await userClient.rpc('is_admin_or_staff_user');
      if (roleError) throw new Error('role_verification_failed');
      return {id:data.user.id,staff:staff===true} satisfies Actor;
    },
    resource:async id=>{
      if (kind==='test') {
        // No answers/results/health fields queried for notification.
        const {data:r,error}=await db.from('test_results').select('id,specialist_id').eq('id',id).maybeSingle();
        if (error) throw new Error('resource_lookup_failed');
        if (!r) return null;
        const {data:s,error:se}=await db.from('specialists').select('user_id,email').eq('id',r.specialist_id).maybeSingle();
        if (se) throw new Error('specialist_lookup_failed');
        if (!s?.user_id||!s.email) return null;
        return {id:r.id,ownerUserId:s.user_id,recipient:s.email};
      }
      const {data:r,error}=await db.from('client_referrals').select('id,specialist_id,client_contact,is_referred').eq('id',id).maybeSingle();
      if (error) throw new Error('referral_lookup_failed');
      if (!r?.is_referred || !r.client_contact) return null;
      const {data:s,error:se}=await db.from('specialists').select('user_id,slug,specialty').eq('id',r.specialist_id).maybeSingle();
      if (se) throw new Error('specialist_lookup_failed');
      if (!s?.user_id||!s.slug) return null;
      const phone=String(r.client_contact).replace(/\D/g,'').replace(/^90/,'').replace(/^0/,'');
      if (!/^5\d{9}$/.test(phone)) return null;
      const specialty=String(s.specialty??'').replace(/[ğüşıİöçĞÜŞÖÇ]/g,c=>({ğ:'g',ü:'u',ş:'s',ı:'i',İ:'i',ö:'o',ç:'c',Ğ:'G',Ü:'U',Ş:'S',Ö:'O',Ç:'C'}[c]??c)).toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'').replace(/-+/g,'-').replace(/^-+|-+$/g,'');
      return {id:r.id,ownerUserId:s.user_id,recipient:`90${phone}`,profileSlug:s.slug,specialtySlug:specialty};
    },
    claim:async(id,channel)=>{
      const {data,error}=await db.rpc('claim_secure_notice',{p_kind:kind,p_resource:id,p_channel:channel});
      if (error) throw new Error('claim_failed');return typeof data==='string'?data:null;
    },
    send:sender,
    finish:async(id,channel,attempt,result)=>{
      const {data,error}=await db.rpc('finish_secure_notice',{p_kind:kind,p_resource:id,p_channel:channel,p_attempt:attempt,p_status:result.status,p_provider:result.providerId??null});
      return !error && data===true;
    },
  };
}