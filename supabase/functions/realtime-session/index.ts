// Tarayıcı WebRTC istemcisi için kısa ömürlü OpenAI Realtime client secret üretir.
// OPENAI_API_KEY asla tarayıcıya gönderilmez; yalnızca "ek_..." kısa ömürlü anahtar döner.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const MODEL = Deno.env.get("OPENAI_REALTIME_MODEL") || "gpt-realtime";
// Ses YALNIZCA ortam değişkeninden gelir; kodda sabit ses yok.
// Boşsa OpenAI Platform'daki kayıtlı prompt'un sesi kullanılır.
const VOICE = (Deno.env.get("OPENAI_REALTIME_VOICE") || "").trim();
const SPEED = Number(Deno.env.get("OPENAI_REALTIME_SPEED") || 1.0);
const PROMPT_ID = Deno.env.get("OPENAI_REALTIME_PROMPT_ID") || "";
const PROMPT_VERSION = Deno.env.get("OPENAI_REALTIME_PROMPT_VERSION") || "";
const NOISE_REDUCTION = Deno.env.get("OPENAI_REALTIME_NOISE_REDUCTION") || "far_field";
const VAD_TYPE = Deno.env.get("OPENAI_VAD_TYPE") || "server_vad";
const VAD_THRESHOLD = Number(Deno.env.get("OPENAI_VAD_THRESHOLD") || 0.75);
const VAD_PREFIX = Number(Deno.env.get("OPENAI_VAD_PREFIX_PADDING_MS") || 400);
const VAD_SILENCE = Number(Deno.env.get("OPENAI_VAD_SILENCE_MS") || 900);
const VAD_INTERRUPT = (Deno.env.get("OPENAI_VAD_INTERRUPT_RESPONSE") || "true") === "true";

const TOOLS = [
  {
    type: "function",
    name: "pick_specialist",
    description:
      "Danışanın şehrine ve görüşme tercihine göre uygun uzmanı belirler. Yüz yüze talebinde şehir öğrenilince çağır.",
    parameters: {
      type: "object",
      properties: {
        mode: { type: "string", enum: ["online", "face_to_face"] },
        city: { type: "string", description: "Yüz yüze görüşme istenen şehir" },
      },
      required: ["mode"],
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "request_transfer",
    description:
      "Danışan net biçimde onay verdiğinde uzmana aktarım TALEBİ oluşturur. Aktarımı backend onaylar.",
    parameters: {
      type: "object",
      properties: {
        confirmation_text: {
          type: "string",
          description: "Danışanın onay cümlesi (birebir).",
        },
      },
      required: ["confirmation_text"],
      additionalProperties: false,
    },
  },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) return json({ error: "OPENAI_API_KEY tanımlı değil" }, 500);

    const session: Record<string, unknown> = {
      type: "realtime",
      // Kayıtlı prompt kendi modelini taşır; model alanı gönderilirse çakışır.
      ...(PROMPT_ID ? {} : { model: MODEL }),
      output_modalities: ["audio"],
      audio: {
        input: {
          transcription: { model: "whisper-1", language: "tr" },
          ...(NOISE_REDUCTION && NOISE_REDUCTION !== "off"
            ? { noise_reduction: { type: NOISE_REDUCTION } }
            : {}),
          turn_detection: {
            type: VAD_TYPE,
            threshold: VAD_THRESHOLD,
            prefix_padding_ms: VAD_PREFIX,
            silence_duration_ms: VAD_SILENCE,
            create_response: true,
            interrupt_response: VAD_INTERRUPT,
          },
        },
        output: { ...(VOICE ? { voice: VOICE } : {}), speed: SPEED },
      },
      tools: TOOLS,
    };

    // Kayıtlı Realtime prompt (OpenAI Platform üzerinde yönetilir).
    if (PROMPT_ID) {
      session.prompt = {
        id: PROMPT_ID,
        ...(PROMPT_VERSION ? { version: PROMPT_VERSION } : {}),
      };
    }

    const res = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        expires_after: { anchor: "created_at", seconds: 600 },
        session,
      }),
    });

    const text = await res.text();
    if (!res.ok) {
      console.error("client_secrets hatası", res.status, text);
      return json({ error: "Realtime oturumu oluşturulamadı", details: text }, res.status);
    }

    const data = JSON.parse(text);
    return json({
      client_secret: data.value ?? data.client_secret?.value,
      expires_at: data.expires_at,
      model: data.session?.model ?? MODEL,
      voice: data.session?.audio?.output?.voice ?? VOICE,
      prompt_id: PROMPT_ID || null,
      prompt_version: PROMPT_VERSION || null,
    });
  } catch (e) {
    console.error(e);
    return json({ error: (e as Error).message }, 500);
  }
});
