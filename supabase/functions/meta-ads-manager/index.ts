import { verifyAdminOrCron } from "../_shared/adminAuth.ts";
import { createLovableAiGatewayProvider } from "../_shared/ai-gateway.ts";
import { generateText } from "npm:ai";
import { z } from "npm:zod";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const AD_ACCOUNT_ID = "939321929194033";
const GRAPH_API_VERSION = "v21.0";
const BASE_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

const ActionSchema = z.enum([
  "list",
  "toggleStatus",
  "updateBudget",
  "createCampaign",
  "aiSuggestions",
  "targetingSearch",
  "insights",
  // editing
  "listAdSets",
  "listAds",
  "updateCampaign",
  "updateAdSet",
  "updateAd",
  "getAdCreative",
  "updateAdCreative",
  "deleteEntity",
  // targeting
  "getAdSetTargeting",
  "aiTargeting",
]);


const BodySchema = z.object({
  action: ActionSchema,
  campaignId: z.string().optional(),
  adSetId: z.string().optional(),
  adId: z.string().optional(),
  entityId: z.string().optional(),
  status: z.enum(["ACTIVE", "PAUSED", "ARCHIVED"]).optional(),
  budget: z.number().positive().optional(),
  lifetimeBudget: z.number().positive().optional(),
  spendCap: z.number().positive().optional(),
  bidAmount: z.number().positive().optional(),
  name: z.string().min(1).optional(),
  objective: z.string().min(1).optional(),
  specialAdCategories: z.array(z.string()).default([]),
  targeting: z.record(z.any()).optional(),
  ageMin: z.number().int().min(13).max(65).optional(),
  ageMax: z.number().int().min(13).max(65).optional(),
  genders: z.array(z.number().int()).optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  creative: z.object({
    message: z.string().optional(),
    headline: z.string().optional(),
    description: z.string().optional(),
    link: z.string().optional(),
    cta: z.string().optional(),
  }).optional(),
  suggestions: z.object({
    specialty: z.string().min(1),
    goal: z.string().min(1),
    audienceNotes: z.string().optional(),
    tone: z.string().optional(),
  }).optional(),
  q: z.string().optional(),
  instruction: z.string().max(2000).optional(),
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

// POST with form-urlencoded body (required for complex params like targeting JSON)
async function metaPost(path: string, token: string, params: Record<string, string>) {
  const body = new URLSearchParams({ ...params, access_token: token });
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    body: body.toString(),
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Meta API ${res.status}: ${text}`);
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
          "bid_strategy",
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

      case "listAdSets": {
        if (!body.campaignId) return metaError(400, "campaignId required");
        const fields = [
          "id",
          "name",
          "status",
          "effective_status",
          "daily_budget",
          "lifetime_budget",
          "bid_amount",
          "billing_event",
          "optimization_goal",
          "start_time",
          "end_time",
          "targeting",
          "campaign_id",
        ].join(",");
        const adsets = await metaFetch(
          `/${body.campaignId}/adsets?fields=${fields}&limit=100`,
          token,
        );
        return metaResponse(adsets);
      }

      case "listAds": {
        if (!body.adSetId) return metaError(400, "adSetId required");
        const fields = [
          "id",
          "name",
          "status",
          "effective_status",
          "adset_id",
          "creative{id,name,title,body,object_story_spec,thumbnail_url,image_url}",
        ].join(",");
        const ads = await metaFetch(
          `/${body.adSetId}/ads?fields=${fields}&limit=100`,
          token,
        );
        return metaResponse(ads);
      }

      case "insights": {
        const level = body.level || "campaign";
        const fields = (body.fields || ["campaign_id", "campaign_name", "adset_id", "adset_name", "ad_id", "ad_name", "spend", "impressions", "reach", "clicks", "cpc", "ctr", "cpm", "actions", "cost_per_action_type"]).join(",");
        const range = body.since && body.until
          ? `&time_range=${encodeURIComponent(JSON.stringify({ since: body.since, until: body.until }))}`
          : `&date_preset=last_30d`;
        const insights = await metaFetch(
          `/act_${AD_ACCOUNT_ID}/insights?level=${level}&fields=${fields}&limit=200${range}`,
          token,
        );
        return metaResponse(insights);
      }

      case "toggleStatus": {
        const id = body.campaignId || body.adSetId || body.adId || body.entityId;
        if (!id) return metaError(400, "id required");
        const status = body.status || "PAUSED";
        const result = await metaPost(`/${id}`, token, { status });
        return metaResponse({ success: true, result });
      }

      case "updateBudget": {
        const id = body.adSetId || body.campaignId;
        if (!id) return metaError(400, "adSetId or campaignId required");
        if (!body.budget && !body.lifetimeBudget) return metaError(400, "budget required");
        const params: Record<string, string> = {};
        if (body.budget) params.daily_budget = String(Math.round(body.budget * 100));
        if (body.lifetimeBudget) params.lifetime_budget = String(Math.round(body.lifetimeBudget * 100));
        const result = await metaPost(`/${id}`, token, params);
        return metaResponse({ success: true, result });
      }

      case "updateCampaign": {
        if (!body.campaignId) return metaError(400, "campaignId required");
        const params: Record<string, string> = {};
        if (body.name) params.name = body.name;
        if (body.status) params.status = body.status;
        if (body.budget) params.daily_budget = String(Math.round(body.budget * 100));
        if (body.lifetimeBudget) params.lifetime_budget = String(Math.round(body.lifetimeBudget * 100));
        if (body.spendCap) params.spend_cap = String(Math.round(body.spendCap * 100));
        if (Object.keys(params).length === 0) return metaError(400, "Güncellenecek alan yok");
        const result = await metaPost(`/${body.campaignId}`, token, params);
        return metaResponse({ success: true, result });
      }

      case "updateAdSet": {
        if (!body.adSetId) return metaError(400, "adSetId required");
        const params: Record<string, string> = {};
        if (body.name) params.name = body.name;
        if (body.status) params.status = body.status;
        if (body.budget) params.daily_budget = String(Math.round(body.budget * 100));
        if (body.lifetimeBudget) params.lifetime_budget = String(Math.round(body.lifetimeBudget * 100));
        if (body.bidAmount) params.bid_amount = String(Math.round(body.bidAmount * 100));
        if (body.startTime) params.start_time = body.startTime;
        if (body.endTime) params.end_time = body.endTime;

        if (body.targeting) {
          params.targeting = JSON.stringify(body.targeting);
        } else if (body.ageMin || body.ageMax || body.genders) {
          // merge into existing targeting so we don't wipe geo/interests
          const current = await metaFetch(`/${body.adSetId}?fields=targeting`, token);
          const targeting = { ...(current?.targeting || {}) };
          if (body.ageMin) targeting.age_min = body.ageMin;
          if (body.ageMax) targeting.age_max = body.ageMax;
          if (body.genders) {
            if (body.genders.length === 0) delete targeting.genders;
            else targeting.genders = body.genders;
          }
          params.targeting = JSON.stringify(targeting);
        }

        if (Object.keys(params).length === 0) return metaError(400, "Güncellenecek alan yok");
        const result = await metaPost(`/${body.adSetId}`, token, params);
        return metaResponse({ success: true, result });
      }

      case "updateAd": {
        if (!body.adId) return metaError(400, "adId required");
        const params: Record<string, string> = {};
        if (body.name) params.name = body.name;
        if (body.status) params.status = body.status;
        if (Object.keys(params).length === 0) return metaError(400, "Güncellenecek alan yok");
        const result = await metaPost(`/${body.adId}`, token, params);
        return metaResponse({ success: true, result });
      }

      case "getAdCreative": {
        if (!body.adId) return metaError(400, "adId required");
        const result = await metaFetch(
          `/${body.adId}?fields=id,name,status,creative{id,name,title,body,object_story_spec,asset_feed_spec,thumbnail_url}`,
          token,
        );
        return metaResponse(result);
      }

      case "updateAdCreative": {
        if (!body.adId) return metaError(400, "adId required");
        if (!body.creative) return metaError(400, "creative required");

        // Meta creatives are immutable: read current creative, clone it with new
        // texts, then point the ad to the new creative.
        const adInfo = await metaFetch(
          `/${body.adId}?fields=creative{id,name,object_story_spec,degrees_of_freedom_spec}`,
          token,
        );
        const spec = adInfo?.creative?.object_story_spec;
        if (!spec) {
          return metaError(
            400,
            "Bu reklamın metni panelden düzenlenemiyor (dinamik/katalog reklam öğesi). Ads Manager kullanın.",
          );
        }

        const newSpec: any = JSON.parse(JSON.stringify(spec));
        const c = body.creative;
        const applyToData = (data: any) => {
          if (!data) return;
          if (c.message !== undefined) data.message = c.message;
          if (c.headline !== undefined) data.name = c.headline;
          if (c.description !== undefined) data.description = c.description;
          if (c.link !== undefined && data.link !== undefined) data.link = c.link;
          if (c.cta && data.call_to_action?.type) data.call_to_action.type = c.cta;
        };
        applyToData(newSpec.link_data);
        applyToData(newSpec.video_data);
        if (newSpec.photo_data && c.message !== undefined) newSpec.photo_data.caption = c.message;

        const created = await metaPost(`/act_${AD_ACCOUNT_ID}/adcreatives`, token, {
          name: `${adInfo?.creative?.name || "Creative"} (panel ${new Date().toISOString().slice(0, 16)})`,
          object_story_spec: JSON.stringify(newSpec),
        });

        const result = await metaPost(`/${body.adId}`, token, {
          creative: JSON.stringify({ creative_id: created.id }),
        });
        return metaResponse({ success: true, creativeId: created.id, result });
      }

      case "deleteEntity": {
        const id = body.entityId || body.adId || body.adSetId || body.campaignId;
        if (!id) return metaError(400, "id required");
        // soft delete: archive keeps history/reporting intact
        const result = await metaPost(`/${id}`, token, { status: "ARCHIVED" });
        return metaResponse({ success: true, result });
      }

      case "createCampaign": {
        if (!body.name || !body.objective) {
          return metaError(400, "name and objective required");
        }
        const result = await metaPost(`/act_${AD_ACCOUNT_ID}/campaigns`, token, {
          name: body.name,
          objective: body.objective,
          status: "PAUSED",
          special_ad_categories: JSON.stringify(body.specialAdCategories),
        });
        return metaResponse({ success: true, result });
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
