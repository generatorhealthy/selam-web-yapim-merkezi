import { verifyAdminOrCron } from "../_shared/adminAuth.ts";
import { createLovableAiGatewayProvider } from "../_shared/ai-gateway.ts";
import { generateText } from "npm:ai";
import { z } from "npm:zod";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const AD_ACCOUNT_ID = "939321929194033";
const GRAPH_API_VERSION = "v21.0";
const BASE_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

const ActionSchema = z.union([
  z.literal("list"),
  z.literal("toggleStatus"),
  z.literal("updateBudget"),
  z.literal("createCampaign"),
  z.literal("aiSuggestions"),
  z.literal("targetingSearch"),
  z.literal("insights"),
]);

const BodySchema = z.object({
  action: ActionSchema,
  campaignId: z.string().optional(),
  adSetId: z.string().optional(),
  status: z.enum(["ACTIVE", "PAUSED"]).optional(),
  budget: z.number().positive().optional(),
  name: z.string().min(1).optional(),
  objective: z.string().min(1).optional(),
  specialAdCategories: z.array(z.string()).default([]),
  targeting: z.record(z.any()).optional(),
  creative: z.record(z.any()).optional(),
  suggestions: z.object({
    specialty: z.string().min(1),
    goal: z.string().min(1),
    audienceNotes: z.string().optional(),
    tone: z.string().optional(),
  }).optional(),
  q: z.string().optional(), // targeting search query
  fields: z.array(z.string()).optional(),
  since: z.string().optional(),
  until: z.string().optional(),
  level: z.enum(["campaign", "adset", "ad"]).default("campaign"),
});

function metaError(status: number, message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function metaResponse(data: unknown) {
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function metaFetch(path: string, token: string, options: RequestInit = {}) {
  const url = `${BASE_URL}${path}${path.includes("?") ? "&" : "?"}access_token=${encodeURIComponent(token)}`;
  const res = await fetch(url, { ...options, headers: { ...options.headers, "Content-Type": "application/json" } });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Meta API ${res.status}: ${text}`);
  }
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const auth = await verifyAdminOrCron(req);
  if (!auth.ok) {
    return metaError(auth.status, auth.error);
  }

  const token = Deno.env.get("META_ADS_ACCESS_TOKEN");
  if (!token) {
    return metaError(500, "META_ADS_ACCESS_TOKEN not configured");
  }

  const parseResult = BodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parseResult.success) {
    return metaError(400, parseResult.error.message);
  }
  const body = parseResult.data;

  try {
    switch (body.action) {
      case "list": {
        // campaigns + adsets + ads compact list
        const fields = [
          "id",
          "name",
          "status",
          "objective",
          "effective_status",
          "configured_status",
          "daily_budget",
          "lifetime_budget",
          "spend_cap",
          "created_time",
          "start_time",
          "stop_time",
        ].join(",");
        const campaigns = await metaFetch(
          `/act_${AD_ACCOUNT_ID}/campaigns?fields=${fields}&limit=50`,
          token,
        );
        return metaResponse(campaigns);
      }

      case "insights": {
        const level = body.level || "campaign";
        const datePreset = "last_30d";
        const fields = (body.fields || ["spend", "impressions", "reach", "clicks", "cpc", "ctr", "cpm", "actions", "cost_per_action_type"]).join(",");
        const sinceParam = body.since ? `&since=${body.since}` : "";
        const untilParam = body.until ? `&until=${body.until}` : "";
        const insights = await metaFetch(
          `/act_${AD_ACCOUNT_ID}/insights?level=${level}&fields=${fields}&date_preset=${datePreset}&limit=100${sinceParam}${untilParam}`,
          token,
        );
        return metaResponse(insights);
      }

      case "toggleStatus": {
        if (!body.campaignId) return metaError(400, "campaignId required");
        const status = body.status || "PAUSED";
        const result = await metaFetch(
          `/${body.campaignId}?status=${status}`,
          token,
          { method: "POST" },
        );
        return metaResponse({ success: true, result });
      }

      case "updateBudget": {
        if (!body.adSetId) return metaError(400, "adSetId required");
        if (!body.budget) return metaError(400, "budget required");
        // budget in cents
        const dailyBudget = Math.round(body.budget * 100);
        const result = await metaFetch(
          `/${body.adSetId}?daily_budget=${dailyBudget}`,
          token,
          { method: "POST" },
        );
        return metaResponse({ success: true, result });
      }

      case "createCampaign": {
        if (!body.name || !body.objective) {
          return metaError(400, "name and objective required");
        }
        const params = new URLSearchParams();
        params.append("name", body.name);
        params.append("objective", body.objective);
        params.append("status", "PAUSED");
        params.append("special_ad_categories", JSON.stringify(body.specialAdCategories));
        params.append("access_token", token);
        const res = await fetch(`${BASE_URL}/act_${AD_ACCOUNT_ID}/campaigns`, {
          method: "POST",
          body: params.toString(),
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        });
        const text = await res.text();
        if (!res.ok) throw new Error(`Meta API ${res.status}: ${text}`);
        return metaResponse({ success: true, result: JSON.parse(text) });
      }

      case "targetingSearch": {
        if (!body.q) return metaError(400, "q required");
        const result = await metaFetch(
          `/search?type=adinterest&q=${encodeURIComponent(body.q)}&limit=25`,
          token,
        );
        return metaResponse(result);
      }

      case "aiSuggestions": {
        if (!body.suggestions) return metaError(400, "suggestions required");
        const { specialty, goal, audienceNotes, tone } = body.suggestions;
        const lovKey = Deno.env.get("LOVABLE_API_KEY");
        if (!lovKey) {
          return metaError(500, "LOVABLE_API_KEY not configured for AI suggestions");
        }
        const gateway = createLovableAiGatewayProvider(lovKey);
        const { text } = await generateText({
          model: gateway("google/gemini-3.7-flash"),
          system:
            "You are a senior Meta Ads strategist for a Turkish mental-health & therapy platform (Doktorumol.com.tr). " +
            "Return ONLY a JSON object with no markdown. Fields: targeting (object: ageMin, ageMax, genders, interests[] with name, audienceSizeHint), " +
            "primaryText (string), headline (string), description (string), ctaButton (string), " +
            "budgetRecommendation (object: dailyBudgetTL, reason), and platformRecommendations[]. " +
            "Interests must be real Facebook ad interest names. Text must be Turkish.",
          prompt: `Branş/Alan: ${specialty}\nHedef: ${goal}\nEk notlar: ${audienceNotes || "yok"}\nTon: ${tone || "profesyonel, güven veren"}`,
        });
        let json: any;
        try {
          json = JSON.parse(text);
        } catch {
          // fallback: extract JSON from code block if any
          const match = text.match(/\{[\s\S]*\}/);
          json = match ? JSON.parse(match[0]) : { raw: text };
        }
        return metaResponse(json);
      }

      default: {
        return metaError(400, "Unknown action");
      }
    }
  } catch (err: any) {
    console.error("meta-ads-manager error:", err);
    return metaError(500, err.message || "Meta API error");
  }
});
