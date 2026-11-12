import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { requestSchema, sha, verifiedTestUser } from './policy.ts';

Deno.serve(async (req: Request) => {
 const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
 if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
 if (req.method !== 'POST') return reply({ error: 'method_not_allowed' }, 405);
 const url = Deno.env.get('SUPABASE_URL'), key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
 if (!url || !key) return reply({ error: 'configuration_unavailable' }, 503);
 const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
 try {
  if (Number(req.headers.get('content-length') || 0) > 70000) return reply({ error: 'request_too_large' }, 413);
  const raw = await req.text();
  if (raw.length > 70000) return reply({ error: 'request_too_large' }, 413);
  let json: unknown;
  try { json = JSON.parse(raw); } catch { return reply({ error: 'invalid_request' }, 400); }
  const parsed = requestSchema.safeParse(json);
  if (!parsed.success) return reply({ error: 'invalid_request' }, 400);
  const input = parsed.data;
  // No fallback to legacy INSERT or membership consent if the release is not accepted.
  const { data: release, error: releaseError } = await db.from('health_test_release').select('enabled').eq('singleton', true).maybeSingle();
  if (input.action !== 'withdraw' && (releaseError || release?.enabled !== true)) return reply({ error: 'health_release_unavailable' }, 503);
  if (input.action === 'documents') {
   const { data: documents, error } = await db.from('health_test_documents').select('version,disclosure,consent').not('legal_approved_at','is',null).lte('published_at',new Date().toISOString()).order('published_at',{ ascending:false }).limit(1);
   const document = documents?.[0];
   const { data: test } = await db.from('tests').select('title,specialist_id').eq('id',input.testId).eq('is_active',true).maybeSingle();
   const sid = input.specialistId || test?.specialist_id;
   if (error || !document || !test || !sid) return reply({ error:'documents_unavailable' },503);
   if (sid !== test.specialist_id) {
    const { data: mapping } = await db.from('specialist_tests').select('id').eq('test_id',input.testId).eq('specialist_id',sid).eq('is_enabled',true).limit(1).maybeSingle();
    if (!mapping) return reply({ error:'test_specialist_mismatch' },409);
   }
   const { data: specialist } = await db.from('specialists').select('name').eq('id',sid).eq('is_active',true).maybeSingle();
   if (!specialist) return reply({ error:'specialist_unavailable' },409);
   return reply({ ...document, disclosureHash:await sha(document.disclosure), consentHash:await sha(document.consent), testTitle:test.title, specialistName:specialist.name });
  }
  const authorization = req.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) return reply({ error:'verified_session_required' },401);
  const { data: auth, error: authError } = await db.auth.getUser(authorization.slice(7));
  const userId = verifiedTestUser(auth.user);
  if (authError || !userId) return reply({ error:'verified_session_required' },401);
  if (input.action === 'prepare') {
   const capability = Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');
   const { data, error } = await db.rpc('health_test_prepare',{ p_user:userId,p_test:input.testId,p_specialist:input.specialistId,
    p_capability_hash:await sha(capability),p_version:input.version,p_disclosure_hash:input.disclosureHash,p_consent_hash:input.consentHash });
   if (error || typeof data !== 'string') return reply({ error:'operation_not_authorized' },409);
   return reply({ operationId:data,capability },201);
  }
  if (input.action === 'withdraw') {
   const { data,error } = await db.rpc('health_test_withdraw',{ p_user:userId,p_operation:input.operationId,p_capability_hash:await sha(input.capability) });
   return error || data !== true ? reply({ error:'withdrawal_not_recorded' },409) : reply({ withdrawn:true });
  }
  const { data,error } = await db.rpc('health_test_commit',{ p_user:userId,p_operation:input.operationId,p_capability_hash:await sha(input.capability),p_name:input.name,p_contact:input.contact,p_answers:input.answers });
  if (error || typeof data !== 'string') return reply({ error:'result_not_committed' },409);
  const { data:result,error:readError } = await db.from('test_results').select('id,specialist_id').eq('id',data).maybeSingle();
  if (readError || !result) return reply({ error:'result_readback_unavailable' },503);
  // B/C remain independent. No emails, SMS, push or provider requests are sent by this endpoint.
  return reply({ resultId:result.id,specialistId:result.specialist_id });
 } catch { return reply({ error:'service_unavailable' },503); }
});