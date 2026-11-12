// Replacement endpoint candidate: intentionally never reads even a byte of old health payloads.
export function legacyHandler(req: Request): Response {
 const headers = {'Access-Control-Allow-Origin':'*',
  'Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type',
  'Content-Type':'application/json','Cache-Control':'no-store'};
 if(req.method==='OPTIONS') return new Response(null,{headers});
 if(req.method!=='POST') return new Response(JSON.stringify({error:'method_not_allowed'}),{status:405,headers});
 return new Response(JSON.stringify({error:'direct_delivery_disabled',notification:'not_sent'}),{status:401,headers});
}