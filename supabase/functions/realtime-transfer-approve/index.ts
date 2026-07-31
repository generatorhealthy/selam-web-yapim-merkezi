// Uzman aktarımı yalnızca burada onaylanır. Prompt tek başına aktarım yapamaz.
// Gürültü, öksürük, nefes veya belirsiz kısa yanıtlar reddedilir.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const NOISE = [
  "hı", "hıhı", "hı hı", "ıı", "eee", "ee", "ah", "öhö", "öhöm", "hmm", "hm",
  "of", "aa", "ııı", "uh", "uhh", "ha",
];

const APPROVAL_WORDS = [
  "olur", "tamam", "evet", "kabul", "bağlayın", "bağla", "aktar", "görüşmek isterim",
  "isterim", "uygun", "peki", "devam edelim", "konuşmak isterim",
];

function isMeaningfulConfirmation(raw: string) {
  const t = (raw || "").toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
  if (!t) return { ok: false, reason: "empty" };
  if (NOISE.includes(t)) return { ok: false, reason: "noise" };
  const words = t.split(" ").filter(Boolean);
  if (words.length < 2 && !APPROVAL_WORDS.includes(t)) return { ok: false, reason: "too_short" };
  if (t.length < 3) return { ok: false, reason: "too_short" };
  const approved = APPROVAL_WORDS.some((w) => t.includes(w));
  if (!approved) return { ok: false, reason: "no_explicit_consent" };
  return { ok: true, reason: "approved" };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const text = typeof body.confirmation_text === "string" ? body.confirmation_text : "";
    const specialistSelected = Boolean(body.specialist_selected);
    const infoCompleted = body.info_completed !== false;

    const check = isMeaningfulConfirmation(text);
    if (!check.ok) {
      return json({ approved: false, reason: check.reason, message: "Aktarım onaylanmadı: net onay alınmadı." });
    }
    if (!specialistSelected) {
      return json({ approved: false, reason: "no_specialist", message: "Önce uygun uzman belirlenmeli." });
    }
    if (!infoCompleted) {
      return json({ approved: false, reason: "info_incomplete", message: "Bilgilendirme tamamlanmadan aktarım yapılamaz." });
    }

    return json({ approved: true, reason: "approved", message: "Aktarım onaylandı." });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
