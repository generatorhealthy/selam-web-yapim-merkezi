// GEÇİCİ teşhis fonksiyonu — santral CDR kayıtlarını filtreleyerek döner.
// İş bittiğinde silinecek.
const TOKEN = "tmp_9f2c41b8e7d34a56";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-debug-token",
};

function normalize(url: string, path: string) {
  const u = (url || "").trim().replace(/\/$/, "");
  if (!u) return "";
  return u.endsWith(".php") ? u : u + path;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.headers.get("x-debug-token") !== TOKEN) {
    return new Response(JSON.stringify({ error: "no" }), { status: 401, headers: cors });
  }
  const body = await req.json().catch(() => ({}));
  const url = normalize(Deno.env.get("FREEPBX_BULK_URL") ?? "", "/freepbx-ext.php");
  const secret = (Deno.env.get("FREEPBX_BULK_SECRET") ?? "").trim();
  if (!url || !secret) {
    return new Response(JSON.stringify({ error: "bulk url/secret yok" }), { status: 500, headers: cors });
  }
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "cdr_stats", secret, from: body.from ?? "", to: body.to ?? "" }),
  });
  const text = await res.text();
  let json: any;
  try {
    json = JSON.parse(text);
  } catch {
    return new Response(JSON.stringify({ error: "parse", text: text.slice(0, 2000) }), { status: 500, headers: cors });
  }
  const needle = String(body.phone || "").replace(/\D/g, "").slice(-10);
  const ext = String(body.ext || "").trim();
  const all: any[] = json?.transfers || [];
  const filtered = needle || ext
    ? all.filter((t) => {
        const m = String(t.musteri || "").replace(/\D/g, "");
        const okPhone = !needle || m.endsWith(needle);
        const okExt = !ext || String(t.uzman_ext || "").trim() === ext;
        return okPhone && okExt;
      })
    : all;
  return new Response(
    JSON.stringify({ total: all.length, matched: filtered.length, rows: filtered.slice(0, 50) }),
    { headers: { ...cors, "Content-Type": "application/json" } },
  );
});
