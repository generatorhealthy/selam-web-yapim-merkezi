// Admin-only read-only statistics.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { makeStatsHandler } from "./statistics-handler.ts";
import { readIvrPages } from "../_shared/leadIvr.ts";

Deno.serve(async request => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return new Response("method", { status: 405, headers: corsHeaders });
  const url = Deno.env.get("SUPABASE_URL"), key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"), anon = Deno.env.get("SUPABASE_ANON_KEY");
  if (!url || !key || !anon) return new Response("unavailable", { status: 503, headers: corsHeaders });
  const svc = createClient(url, key);
  const handler = makeStatsHandler({
    authorize: async req => {
      const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
      if (!token || token === key) return false;
      const { data, error } = await svc.auth.getUser(token);
      if (error || !data.user) return false;
      const caller = createClient(url, anon, { global: { headers: { Authorization: `Bearer ${token}` } } });
      const { data: access, error: accessError } = await caller.rpc("get_my_panel_access");
      return !accessError && access?.[0]?.role === "admin" && access?.[0]?.is_approved === true;
    },
    campaigns: async () => readIvrPages(async (from, to) => {
      const { data, error } = await svc.from("lead_ivr_campaigns").select("id,created_at,total,status").order("created_at", { ascending: false }).range(from, to);
      if (error) throw error; return data || [];
    }),
    calls: async (filters, campaignId) => {
      const rows = await readIvrPages<any>(async (from, to) => {
        let query = svc.from("lead_ivr_calls").select("id,campaign_id,lead_id,phone,area_key,state,digit,call_status,created_at,dispatched_at,notified_at,pbx_call_id,danisan_basvurulari(full_name)").order("created_at", { ascending: false }).order("id").range(from, to);
        if (campaignId) query = query.eq("campaign_id", campaignId);
        query = filters.scope === "test" ? query.is("lead_id", null) : query.not("lead_id", "is", null);
        if (filters.from) query = query.gte("created_at", `${filters.from}T00:00:00+03:00`);
        if (filters.to) query = query.lt("created_at", new Date(Date.parse(`${filters.to}T00:00:00+03:00`) + 86400000).toISOString());
        const { data, error } = await query; if (error) throw error; return data || [];
      });
      const telemetry = new Map<string, any>();
      const source = new Map<string, string>();
      const campaignIds = [...new Set(rows.map(row => row.campaign_id))];
      for (let i = 0; i < campaignIds.length; i += 200) {
        const { data, error } = await svc.from("lead_ivr_campaign_metadata").select("campaign_id,source_status").in("campaign_id", campaignIds.slice(i, i + 200));
        if (error) throw error;
        for (const record of data || []) source.set(record.campaign_id, record.source_status);
      }
      for (let i = 0; i < rows.length; i += 200) {
        const { data, error } = await svc.from("lead_ivr_telemetry").select("*").in("call_id", rows.slice(i, i + 200).map(row => row.id));
        if (error) throw error;
        for (const record of data || []) telemetry.set(record.call_id, record);
      }
      return rows.map(row => { const { danisan_basvurulari, ...call } = row; return { ...call, name: danisan_basvurulari?.full_name || undefined, source_status: source.get(row.campaign_id), ...telemetry.get(row.id) }; });
    },
    telemetryReady: async () => {
      const { count, error } = await svc.from("lead_ivr_call_events").select("call_id", { count: "exact", head: true }).gte("received_at", new Date(Date.now() - 15000).toISOString());
      return !error && Boolean(count);
    },
  });
  const response = await handler(request);
  return new Response(response.body, { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" } });
});