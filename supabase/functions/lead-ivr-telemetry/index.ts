// Signed metadata events; never dispatches calls or changes lead categories.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { callToken } from "../_shared/leadIvr.ts";
import { makeTelemetryHandler } from "./telemetry-handler.ts";
Deno.serve(async request => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"), url = Deno.env.get("SUPABASE_URL");
  if (!key || !url) return new Response("unavailable", { status: 503, headers: corsHeaders });
  const svc = createClient(url, key);
  const response = await makeTelemetryHandler({
    verify: async (id, token) => (await callToken(id, key)) === token,
    record: async event => {
      const { error } = await svc.rpc("record_ivr_telemetry", { p_call_id: event.call_id, p_event_key: event.event_key, p_kind: event.kind, p_occurred_at: event.occurred_at, p_line: event.line, p_reason: event.reason || null });
      if (error) throw new Error("record_failed");
    },
  })(request);
  return new Response(response.body, { status: response.status, headers: { ...corsHeaders, "Cache-Control": "no-store" } });
});