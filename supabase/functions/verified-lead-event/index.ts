import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { leadAdapter } from "./lead-adapter.ts";
Deno.serve(async req => {
 if(req.method === "OPTIONS") return new Response("ok", {headers:corsHeaders});
 try {
 const admin=createClient(Deno.env.get("SUPABASE_URL")??"",Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??"");
 const result=await leadAdapter(admin)(req);
 const headers=new Headers(result.headers);Object.entries(corsHeaders).forEach(([k,v])=>headers.set(k,v));
 return new Response(result.body,{status:result.status,headers});
 } catch {return Response.json({error:"tracking_unavailable"},{status:503,headers:corsHeaders});}
});
