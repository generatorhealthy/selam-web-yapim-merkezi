// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { TEMPLATE_BASE64 } from "./templates.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

const BUCKET = "instagram-posts";
const MODEL = "google/gemini-3-pro-image-preview";

class AiGatewayError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// Load template bundled in function
function loadTemplate(name: string): string {
  const template = TEMPLATE_BASE64[name];
  if (!template) throw new Error(`Şablon bulunamadı: ${name}`);
  return template;
}

async function urlToBase64(url: string): Promise<string | null> {
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    const buf = new Uint8Array(await r.arrayBuffer());
    let bin = "";
    for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
    return btoa(bin);
  } catch {
    return null;
  }
}

async function generateImage(prompt: string, images: string[]): Promise<Uint8Array> {
  const content: any[] = [{ type: "text", text: prompt }];
  for (const b64 of images) {
    content.push({
      type: "image_url",
      image_url: { url: `data:image/jpeg;base64,${b64}` },
    });
  }

  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: "user", content }],
      modalities: ["image", "text"],
    }),
  });

  if (!resp.ok) {
    const t = await resp.text();
    if (resp.status === 402) {
      throw new AiGatewayError(402, "Lovable AI kredisi yetersiz. Settings > Workspace > Usage alanından kredi eklenmeli.");
    }
    if (resp.status === 429) {
      throw new AiGatewayError(429, "Lovable AI hız limiti aşıldı. Biraz bekleyip tekrar deneyin.");
    }
    throw new AiGatewayError(resp.status, `AI gateway ${resp.status}: ${t.slice(0, 400)}`);
  }

  const data = await resp.json();
  const dataUrl: string | undefined =
    data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  if (!dataUrl) throw new Error("AI yanıtında görsel yok");
  const b64 = dataUrl.split(",")[1] ?? dataUrl;
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function uploadImage(
  supabase: any,
  specialistId: string,
  kind: "cover" | "about" | "expertise",
  bytes: Uint8Array,
): Promise<string> {
  const path = `${specialistId}/${kind}-${Date.now()}.png`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, bytes, { contentType: "image/png", upsert: true });
  if (error) throw new Error(`Storage upload (${kind}): ${error.message}`);
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

function buildPrompts(s: {
  name: string;
  specialty: string;
  bio: string | null;
}) {
  const bioShort = (s.bio ?? "").replace(/\s+/g, " ").trim().slice(0, 380);

  const cover = `
You are editing the FIRST attached image (Instagram cover template).
KEEP the exact layout, fonts, colors, background pattern, "doktorum ol" logo position at top-left, the blue specialty pill, the quote text style, the two icon boxes at the bottom-left (brain + people icons), the rounded white bottom card with the icon+URL.
REPLACE ONLY:
  - The portrait on the right side: use the person in the SECOND attached image. Match the original lighting and crop style (chest-up portrait, soft background blend on the left edge).
  - The big dark-navy name "Tuğba Yılmaz" -> "${s.name}" (split first name / last name on two lines, same font weight & size).
  - The specialty pill text "Psikolog" -> "${s.specialty}".
DO NOT change: doktorumol logo, icon glyphs, "Bilimsel Yaklaşım / Güvenilir Destek / Ruh Sağlığınız / Bizimle Güvende" labels, footer URL "doktorumol.com.tr/uzmanlar", quote text "Ruhsal iyi oluş halinizi artırmak için yanınızdayız.".
Square 1:1, ultra sharp, vivid colors, professional.`.trim();

  const about = `
You are editing the FIRST attached image (Instagram "Hakkında" template).
KEEP everything: layout, "doktorum ol" logo, blue specialty pill with brain icon, big "Hakkında" headline, decorative blue underline, two icon boxes "Bilimsel Yaklaşım / Güvenilir Destek" and "Ruh Sağlığınız / Bizimle Güvende", footer card with URL.
REPLACE ONLY:
  - The portrait on the right: use the person in the SECOND attached image (chest-up, same lighting/crop).
  - The specialty pill text -> "${s.specialty}".
  - The body paragraphs under "Hakkında": rewrite as 2 short paragraphs (each 2-3 lines) summarising this bio about ${s.name}: "${bioShort}". Same font, same dark-navy color, same line spacing.
DO NOT change the headline word "Hakkında", logo, icons, labels, or footer URL.
Square 1:1, ultra sharp, vivid colors, professional.`.trim();

  const expertise = `
You are editing the FIRST attached image (Instagram "Uzmanlık Alanları" template).
KEEP everything: "doktorum ol" logo at top, big headline "Uzmanlık Alanları" (with "Alanları" in blue), decorative underline, the 2x3 grid of 6 rounded blue icon tiles with white-line icons + label underneath, the footer card with URL, background leaves pattern.
REPLACE ONLY the 6 labels (and their corresponding white-line icons if a label changes) with the most relevant sub-areas for a "${s.specialty}". Pick 6 common expertise topics in Turkish, 1-3 words each, same font/size/color. Icons must stay the same flat white-line style on the same blue gradient rounded square.
DO NOT change logo, headline, footer URL, background, or color palette.
Square 1:1, ultra sharp, vivid colors, professional.`.trim();

  return { cover, about, expertise };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

  let specialistId: string | null = null;
  let force = false;

  try {
    const body = await req.json().catch(() => ({}));
    specialistId = body.specialistId ?? null;
    force = !!body.force;

    if (!specialistId) {
      return new Response(JSON.stringify({ error: "specialistId gerekli" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch specialist
    const { data: spec, error: specErr } = await supabase
      .from("specialists")
      .select("id, name, specialty, bio, profile_picture, is_active")
      .eq("id", specialistId)
      .maybeSingle();

    if (specErr) throw new Error(`Specialist fetch: ${specErr.message}`);
    if (!spec) throw new Error("Uzman bulunamadı");
    if (!spec.is_active) throw new Error("Uzman aktif değil");

    // Skip if already ready and not force
    if (!force) {
      const { data: existing } = await supabase
        .from("specialist_instagram_posts")
        .select("status")
        .eq("specialist_id", specialistId)
        .maybeSingle();
      if (existing?.status === "ready") {
        return new Response(JSON.stringify({ skipped: true, reason: "already ready" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Mark processing
    await supabase
      .from("specialist_instagram_posts")
      .upsert(
        { specialist_id: specialistId, status: "processing", error_message: null },
        { onConflict: "specialist_id" },
      );

    // Load templates + photo
    const coverTpl = loadTemplate("cover");
    const aboutTpl = loadTemplate("about");
    const expertiseTpl = loadTemplate("expertise");

    const photoB64 = spec.profile_picture ? await urlToBase64(spec.profile_picture) : null;
    if (!photoB64) {
      throw new Error("Uzman profil fotoğrafı bulunamadı veya indirilemedi");
    }

    const prompts = buildPrompts({
      name: spec.name,
      specialty: spec.specialty ?? "",
      bio: spec.bio,
    });

    // Generate sequentially to stay under Edge Runtime memory limits.
    const coverBytes = await generateImage(prompts.cover, [coverTpl, photoB64]);
    const aboutBytes = await generateImage(prompts.about, [aboutTpl, photoB64]);
    const expertiseBytes = await generateImage(prompts.expertise, [expertiseTpl]);

    // Upload
    const [coverUrl, aboutUrl, expertiseUrl] = await Promise.all([
      uploadImage(supabase, specialistId, "cover", coverBytes),
      uploadImage(supabase, specialistId, "about", aboutBytes),
      uploadImage(supabase, specialistId, "expertise", expertiseBytes),
    ]);

    await supabase
      .from("specialist_instagram_posts")
      .upsert(
        {
          specialist_id: specialistId,
          cover_url: coverUrl,
          about_url: aboutUrl,
          expertise_url: expertiseUrl,
          status: "ready",
          error_message: null,
          generated_at: new Date().toISOString(),
        },
        { onConflict: "specialist_id" },
      );

    return new Response(
      JSON.stringify({ success: true, coverUrl, aboutUrl, expertiseUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("generate-specialist-instagram-posts error:", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    if (specialistId) {
      await supabase
        .from("specialist_instagram_posts")
        .upsert(
          { specialist_id: specialistId, status: "failed", error_message: msg },
          { onConflict: "specialist_id" },
        );
    }
    const status = e instanceof AiGatewayError ? e.status : 500;
    return new Response(JSON.stringify({ error: msg }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
