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
  instruction: z.string().max(30000).optional(),
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

const ADSET_TARGETING_FIELDS = [
  "id",
  "name",
  "status",
  "effective_status",
  "daily_budget",
  "lifetime_budget",
  "bid_amount",
  "bid_strategy",
  "billing_event",
  "optimization_goal",
  "destination_type",
  "promoted_object",
  "start_time",
  "end_time",
  "targeting",
  "campaign_id",
  "campaign{id,name,objective}",
].join(",");

// Fast, reliable chat-completions call for targeting analysis.
async function callGpt(apiKey: string, system: string, prompt: string): Promise<string> {
  const models = ["google/gemini-3.7-flash", "openai/gpt-5.6-sol"];
  let lastErr = "";
  for (const model of models) {
    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Lovable-API-Key": apiKey,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: system },
            { role: "user", content: prompt },
          ],
        }),
      });
      const text = await res.text();
      if (!res.ok) {
        lastErr = `AI gateway ${res.status}: ${text.slice(0, 300)}`;
        // terminal statuses: don't try other models pointlessly except 400 (bad model)
        if (res.status !== 400 && res.status !== 404) throw new Error(lastErr);
        continue;
      }
      const json = JSON.parse(text);
      const out = json?.choices?.[0]?.message?.content ?? "";
      if (out) return out;
      lastErr = "AI boş yanıt döndü";
    } catch (e: any) {
      lastErr = e?.message || String(e);
    }
  }
  throw new Error(lastErr || "AI çağrısı başarısız");
}


// Meta rejects targeting specs that contain non-existent interest/behavior ids.
// Validate every id, try to recover by name, drop what stays invalid.
const TARGET_LIST_KEYS = [
  "interests",
  "behaviors",
  "work_positions",
  "industries",
  "life_events",
  "education_majors",
  "family_statuses",
  "income",
];

const PLACEMENT_RULES: Record<string, { platform: string; values: Set<string> }> = {
  facebook_positions: {
    platform: "facebook",
    values: new Set([
      "feed", "right_hand_column", "instant_article", "marketplace", "video_feeds",
      "story", "search", "facebook_reels", "in_stream_video", "profile_feed",
      "notification", "facebook_business_explore", "facebook_reels_overlay",
    ]),
  },
  instagram_positions: {
    platform: "instagram",
    values: new Set(["stream", "story", "explore", "explore_home", "reels", "profile_feed", "profile_reels"]),
  },
  messenger_positions: {
    platform: "messenger",
    values: new Set(["messenger_home", "sponsored_messages", "story"]),
  },
  audience_network_positions: {
    platform: "audience_network",
    values: new Set(["classic", "rewarded_video"]),
  },
  threads_positions: {
    platform: "threads",
    values: new Set(["threads_stream"]),
  },
};

function sanitizePlacements(t: Record<string, any>, warnings: string[]) {
  const allowedPlatforms = new Set(["facebook", "instagram", "messenger", "audience_network", "threads"]);
  let platforms = Array.isArray(t.publisher_platforms)
    ? t.publisher_platforms.filter((value: unknown) => typeof value === "string" && allowedPlatforms.has(value))
    : [];

  for (const [key, rule] of Object.entries(PLACEMENT_RULES)) {
    if (!Array.isArray(t[key])) continue;
    const original = t[key].filter((value: unknown) => typeof value === "string");
    const cleaned = Array.from(new Set(original.filter((value: string) => rule.values.has(value))));
    const removed = original.filter((value: string) => !rule.values.has(value));
    if (removed.length > 0) warnings.push(`${key} içindeki geçersiz yerleşimler çıkarıldı: ${Array.from(new Set(removed)).join(", ")}.`);
    if (cleaned.length > 0) {
      t[key] = cleaned;
      if (!platforms.includes(rule.platform)) platforms.push(rule.platform);
    } else {
      delete t[key];
    }
  }

  platforms = Array.from(new Set(platforms));
  if (platforms.length > 0) t.publisher_platforms = platforms;
  else delete t.publisher_platforms;

  if (Array.isArray(t.device_platforms)) {
    const devices = Array.from(new Set(t.device_platforms.filter((value: unknown) => value === "mobile" || value === "desktop")));
    if (devices.length > 0) t.device_platforms = devices;
    else delete t.device_platforms;
  }
}

async function sanitizeTargeting(
  targeting: Record<string, any>,
  token: string,
  warnings: string[],
): Promise<Record<string, any>> {
  const t = JSON.parse(JSON.stringify(targeting ?? {}));
  sanitizePlacements(t, warnings);

  const groups: any[] = [];
  const pushGroups = (node: any) => {
    if (!node || typeof node !== "object") return;
    groups.push(node);
    for (const key of ["flexible_spec", "exclusions"]) {
      const val = node[key];
      if (Array.isArray(val)) val.forEach((g) => g && groups.push(g));
      else if (val) groups.push(val);
    }
  };
  pushGroups(t);

  const ids = new Set<string>();
  for (const g of groups) {
    for (const key of TARGET_LIST_KEYS) {
      if (Array.isArray(g[key])) {
        for (const item of g[key]) if (item?.id) ids.add(String(item.id));
      }
    }
  }
  const valid = new Set<string>();
  const idList = Array.from(ids);
  for (let i = 0; i < idList.length; i += 40) {
    const chunk = idList.slice(i, i + 40);
    try {
      const res = await metaFetch(
        `/search?type=adTargetingCategory&limit=100&id_list=${encodeURIComponent(JSON.stringify(chunk))}`,
        token,
      );
      for (const item of res?.data || []) valid.add(String(item.id));
    } catch (_e) {
      // if validation call fails, assume chunk is fine rather than wiping targeting
      chunk.forEach((id) => valid.add(id));
    }
  }

  const resolveByName = async (name?: string): Promise<string | null> => {
    if (!name) return null;
    try {
      const res = await metaFetch(
        `/search?type=adinterest&limit=5&q=${encodeURIComponent(name)}`,
        token,
      );
      const hit = (res?.data || [])[0];
      return hit?.id ? String(hit.id) : null;
    } catch {
      return null;
    }
  };

  for (const g of groups) {
    for (const key of TARGET_LIST_KEYS) {
      if (!Array.isArray(g[key])) continue;
      const kept: any[] = [];
      for (const item of g[key]) {
        const id = item?.id ? String(item.id) : "";
        if (id && valid.has(id)) {
          kept.push(item);
          continue;
        }
        const recovered = key === "interests" ? await resolveByName(item?.name) : null;
        if (recovered) {
          kept.push({ ...item, id: recovered });
          warnings.push(`"${item?.name || id}" ilgi alanı ID'si düzeltildi (${id || "yok"} → ${recovered}).`);
        } else {
          warnings.push(`"${item?.name || id}" geçersiz olduğu için hedeflemeden çıkarıldı.`);
        }
      }
      if (kept.length > 0) g[key] = kept;
      else delete g[key];
    }
  }

  // drop empty flexible_spec groups (Meta rejects empty objects)
  for (const node of [t]) {
    if (Array.isArray(node.flexible_spec)) {
      node.flexible_spec = node.flexible_spec.filter(
        (g: any) => g && Object.keys(g).length > 0,
      );
      if (node.flexible_spec.length === 0) delete node.flexible_spec;
    }
    if (node.exclusions && Object.keys(node.exclusions).length === 0) delete node.exclusions;
  }

  return t;
}

function parseJsonLoose(text: string): any {

  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch { /* fallthrough */ }
    }
    return null;
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

        const warnings: string[] = [];
        if (body.targeting) {
          const clean = await sanitizeTargeting(body.targeting, token, warnings);
          params.targeting = JSON.stringify(clean);
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
        return metaResponse({ success: true, result, warnings });

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

      case "getAdSetTargeting": {
        if (!body.adSetId) return metaError(400, "adSetId required");
        const adset = await metaFetch(`/${body.adSetId}?fields=${ADSET_TARGETING_FIELDS}`, token);

        // Resolve interest/behavior ids to readable names where Meta returns ids only
        const t = adset?.targeting || {};
        const collectIds = (node: any): string[] => {
          const ids: string[] = [];
          const scan = (obj: any) => {
            if (!obj || typeof obj !== "object") return;
            for (const key of ["interests", "behaviors", "work_positions", "industries", "life_events", "education_majors", "family_statuses", "income"]) {
              const arr = obj[key];
              if (Array.isArray(arr)) {
                for (const item of arr) {
                  if (item?.id && !item?.name) ids.push(String(item.id));
                }
              }
            }
          };
          scan(node);
          for (const key of ["flexible_spec", "exclusions"]) {
            const val = node?.[key];
            if (Array.isArray(val)) val.forEach(scan);
            else if (val) scan(val);
          }
          return ids;
        };
        const missing = Array.from(new Set(collectIds(t))).slice(0, 40);
        let names: Record<string, string> = {};
        if (missing.length > 0) {
          try {
            const res = await metaFetch(
              `/search?type=adTargetingCategory&limit=100&id_list=${encodeURIComponent(JSON.stringify(missing))}`,
              token,
            );
            for (const item of res?.data || []) names[String(item.id)] = item.name;
          } catch (_e) {
            names = {};
          }
        }

        return metaResponse({ adSet: adset, targetingNames: names });
      }

      case "aiTargeting": {
        if (!body.adSetId) return metaError(400, "adSetId required");
        const lovKey = Deno.env.get("LOVABLE_API_KEY");
        if (!lovKey) return metaError(500, "LOVABLE_API_KEY not configured");

        const adset = await metaFetch(`/${body.adSetId}?fields=${ADSET_TARGETING_FIELDS}`, token);

        let perf: unknown = null;
        try {
          const insightFields = ["spend", "impressions", "reach", "clicks", "ctr", "cpc", "cpm", "actions", "cost_per_action_type"].join(",");
          const res = await metaFetch(
            `/${body.adSetId}/insights?fields=${insightFields}&date_preset=last_30d`,
            token,
          );
          perf = res?.data?.[0] ?? null;
        } catch (_e) {
          perf = null;
        }

        const system =
          "Sen Doktorumol.com.tr (Türkiye merkezli online psikolog/terapi & uzman platformu) için kıdemli bir Meta Ads hedefleme stratejistisin. " +
          "SADECE geçerli JSON döndür, markdown veya açıklama yazma. Şema: " +
          '{"summary": string, "changes": [{"field": string, "from": string, "to": string, "reason": string}], ' +
          '"warnings": [string], "targeting": object, "budgetAdvice": string}. ' +
          "targeting alanı Meta Marketing API targeting spec'i olarak DOĞRUDAN gönderilebilir, tam ve geçerli olmalı: " +
          "geo_locations, age_min, age_max, genders, flexible_spec (interests/behaviors id+name ile), exclusions, " +
          "locales, publisher_platforms, facebook_positions, instagram_positions, device_platforms, targeting_automation. " +
          "Mevcut geo_locations ve custom_audiences'ı kullanıcı aksini istemedikçe koru. " +
          "Interest/behavior kullanırken gerçek Facebook hedefleme kategorileri ve gerçek id'ler kullan; id'den emin değilsen o kalemi ekleme ve warnings'e yaz. " +
          "Türkiye pazarına uygun, sağlık/psikoloji reklam politikalarına uyumlu (kişisel özellik ima etmeyen) öneriler ver. " +
          "summary, changes.reason, warnings ve budgetAdvice Türkçe olmalı. " +
          "KULLANICI TALEBİ en yüksek önceliktedir: talimat uzun ve detaylı olsa da tüm maddelerini eksiksiz uygula; " +
          "uygulayamadığın maddeyi warnings'e gerekçesiyle yaz ve changes listesinde talimattaki her maddeye karşılık gelen değişikliği göster.";

        const prompt = [
          `Kampanya hedefi (objective): ${adset?.campaign?.objective || "bilinmiyor"}`,
          `Reklam seti adı: ${adset?.name}`,
          `Optimizasyon: ${adset?.optimization_goal || "-"} / Faturalama: ${adset?.billing_event || "-"}`,
          `Günlük bütçe (kuruş): ${adset?.daily_budget || "-"} | Toplam bütçe (kuruş): ${adset?.lifetime_budget || "-"}`,
          `Mevcut hedefleme JSON:\n${JSON.stringify(adset?.targeting ?? {}, null, 2)}`,
          `Son 30 gün performansı:\n${perf ? JSON.stringify(perf, null, 2) : "veri yok"}`,
          `Kullanıcı talebi: ${body.instruction?.trim() || "Genel optimizasyon yap: daha nitelikli potansiyel müşteri getirecek şekilde hedeflemeyi iyileştir."}`,
        ].join("\n\n");

        const text = await callGpt(lovKey, system, prompt);
        const json = parseJsonLoose(text);
        if (!json) {
          return metaError(502, "AI yanıtı çözümlenemedi, tekrar deneyin.");
        }
        return metaResponse({ ...json, currentTargeting: adset?.targeting ?? {} });
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
