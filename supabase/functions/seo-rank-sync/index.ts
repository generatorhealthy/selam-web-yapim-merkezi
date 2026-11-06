import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { verifyAdminOrCron } from "../_shared/adminAuth.ts";
import { classifyPage, clickPotential, pageTarget, type PageStat } from "../_shared/seoRules.ts";

const GATEWAY = "https://connector-gateway.lovable.dev/google_search_console";
const SITE = "https://doktorumol.com.tr/";
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const db = () => createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

function gscHeaders() {
  const a = Deno.env.get("LOVABLE_API_KEY"), b = Deno.env.get("GOOGLE_SEARCH_CONSOLE_API_KEY");
  if (!a || !b) throw new Error("Search Console bağlantısı eksik");
  return { Authorization: `Bearer ${a}`, "X-Connection-Api-Key": b, "Content-Type": "application/json" };
}

async function resolveSite(): Promise<string> {
  const r = await fetch(`${GATEWAY}/webmasters/v3/sites`, { headers: gscHeaders() });
  if (!r.ok) throw new Error(`Search Console mülkleri okunamadı [${r.status}]: ${await r.text()}`);
  const { siteEntry = [] } = await r.json();
  const target = new URL(SITE);
  const matches = (siteEntry as { siteUrl: string; permissionLevel?: string }[]).filter((e) => {
    if (e.permissionLevel === "siteUnverifiedUser") return false;
    if (e.siteUrl.startsWith("sc-domain:")) {
      const d = e.siteUrl.slice(10).toLowerCase();
      return target.hostname === d || target.hostname.endsWith(`.${d}`);
    }
    try { return target.href.startsWith(new URL(e.siteUrl).href); } catch { return false; }
  });
  if (!matches.length) throw new Error("doktorumol.com.tr için doğrulanmış Search Console mülkü yok");
  return (matches.find((m) => m.siteUrl === SITE) ?? matches[0]).siteUrl;
}

const iso = (d: Date) => d.toISOString().slice(0, 10);
async function query(siteUrl: string, start: string, end: string, dims: string[], rowLimit = 25000) {
  const r = await fetch(`${GATEWAY}/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`, {
    method: "POST", headers: gscHeaders(),
    body: JSON.stringify({ startDate: start, endDate: end, dimensions: dims, rowLimit, dataState: "final" }),
  });
  if (r.status === 429) throw new Error("Google geçici olarak sınırladı, daha sonra tekrar denenecek");
  if (!r.ok) throw new Error(`Search Console sorgusu başarısız [${r.status}]: ${await r.text()}`);
  return ((await r.json()).rows ?? []) as { keys: string[]; clicks: number; impressions: number; ctr: number; position: number }[];
}

async function aiRewrite(page: string, q: string | null, title: string, desc: string, issues: string[]) {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) return null;
  const prompt = `Türkçe bir sağlık/psikoloji sitesi (doktorumol.com.tr) için Google arama sonucu başlığı ve açıklaması yaz.
Sayfa: ${page}
En çok aranan kelime: ${q ?? "-"}
Mevcut başlık: ${title || "-"}
Mevcut açıklama: ${desc || "-"}
Sorunlar: ${issues.join(", ")}
Kurallar: başlık 45-60 karakter, aranan kelimeyle başlasın, sonunda gerekirse "| Doktorum Ol"; açıklama 140-155 karakter, aranan soruya cevap verdiğini göstersin, uzmana ulaşmaya davet etsin. Tedavi garantisi, kesin sonuç, abartılı vaat ve tıklama tuzağı yasak. Sadece JSON döndür: {"title":"...","description":"..."}`;
  const r = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST", headers: { "Lovable-API-Key": key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "openai/gpt-6-astra", input: prompt }),
  });
  if (!r.ok) { console.error("AI", r.status, await r.text()); return null; }
  try {
    const res = await r.json();
    const txt: string = res.output_text ?? (res.output ?? []).flatMap((o: { content?: { text?: string }[] }) => o.content ?? []).map((c: { text?: string }) => c.text ?? "").join("");
    const m = txt.match(/\{[\s\S]*\}/);
    if (!m) return null;
    const o = JSON.parse(m[0]);
    if (typeof o.title !== "string" || typeof o.description !== "string") return null;
    return { title: o.title.slice(0, 70), description: o.description.slice(0, 170) };
  } catch { return null; }
}

async function sync(supabase: ReturnType<typeof db>) {
  const { data: run } = await supabase.from("seo_sync_runs").insert({}).select("id").single();
  try {
    const siteUrl = await resolveSite();
    const end = new Date(Date.now() - 3 * 864e5);
    const start = new Date(end.getTime() - 27 * 864e5);
    const pEnd = new Date(start.getTime() - 864e5);
    const pStart = new Date(pEnd.getTime() - 27 * 864e5);
    const [cur, prev, pages] = await Promise.all([
      query(siteUrl, iso(start), iso(end), ["query", "page"]),
      query(siteUrl, iso(pStart), iso(pEnd), ["query", "page"]),
      query(siteUrl, iso(start), iso(end), ["page"], 5000),
    ]);
    const fetched_at = new Date().toISOString();
    const toRows = (rows: typeof cur, period: string) => rows.map((r) => ({
      period, query: r.keys[0], page: r.keys[1], clicks: r.clicks, impressions: r.impressions,
      ctr: r.ctr, position: Math.round(r.position * 10) / 10, fetched_at,
    }));
    await supabase.from("seo_keyword_snapshots").delete().in("period", ["current", "previous"]);
    const all = [...toRows(cur, "current"), ...toRows(prev, "previous")];
    for (let i = 0; i < all.length; i += 1000) {
      const { error } = await supabase.from("seo_keyword_snapshots").insert(all.slice(i, i + 1000));
      if (error) throw error;
    }

    // Sayfa bazında en çok gösterim alan kelime
    const topQ = new Map<string, { q: string; imp: number }>();
    for (const r of cur) {
      const t = topQ.get(r.keys[1]);
      if (!t || r.impressions > t.imp) topQ.set(r.keys[1], { q: r.keys[0], imp: r.impressions });
    }
    const stats: PageStat[] = pages.map((r) => ({
      page: r.keys[0], clicks: r.clicks, impressions: r.impressions, ctr: r.ctr,
      position: r.position, topQuery: topQ.get(r.keys[0])?.q ?? null,
    })).filter((p) => p.impressions >= 200).sort((a, b) => clickPotential(b) - clickPotential(a)).slice(0, 120);

    // Yapay zekâ yazımı yavaş olduğundan her yenilemede en değerli 12 sayfaya öneri metni yazılır.
    let created = 0, aiBudget = 12;
    for (const p of stats) {
      const t = pageTarget(p.page);
      let row: { id: string; title: string | null; seo_title: string | null; seo_description: string | null; excerpt?: string | null } | null = null;
      if (t.type === "blog") {
        const { data } = await supabase.from("blog_posts").select("id,title,seo_title,seo_description,excerpt").eq("slug", t.slug!).maybeSingle();
        row = data as typeof row;
      } else if (t.type === "specialist") {
        const { data } = await supabase.from("specialists").select("id,name,seo_title,seo_description").eq("slug", t.slug!).maybeSingle();
        row = data ? { id: data.id, title: data.name, seo_title: data.seo_title, seo_description: data.seo_description } : null;
      }
      const title = row?.seo_title || row?.title || null;
      const desc = row?.seo_description || row?.excerpt || null;
      const issues = classifyPage(p, title, desc);
      if (!issues.length) continue;
      const { data: existing } = await supabase.from("seo_suggestions").select("issue").eq("page", p.page).in("status", ["pending", "applied"]).gte("created_at", new Date(Date.now() - 21 * 864e5).toISOString());
      const have = new Set((existing ?? []).map((e) => e.issue));
      const fresh = issues.filter((i) => !have.has(i.issue));
      if (!fresh.length) continue;
      let ai: { title: string; description: string } | null = null;
      if (row && aiBudget > 0) { aiBudget--; ai = await aiRewrite(p.page, p.topQuery, title ?? "", desc ?? "", fresh.map((f) => f.issue)); }
      for (const f of fresh) {
        const { error } = await supabase.from("seo_suggestions").insert({
          page: p.page, target_type: row ? t.type : "other", target_id: row?.id ?? null, issue: f.issue, severity: f.severity,
          main_query: p.topQuery, impressions: p.impressions, ctr: p.ctr, position: Math.round(p.position * 10) / 10,
          current_title: title, current_description: desc, suggested_title: ai?.title ?? null, suggested_description: ai?.description ?? null,
        });
        if (!error) created++;
      }
    }
    await supabase.from("seo_sync_runs").update({ status: "ok", finished_at: new Date().toISOString(), rows_fetched: all.length, suggestions_created: created }).eq("id", run!.id);
    return { ok: true, rows: all.length, suggestions: created, siteUrl };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await supabase.from("seo_sync_runs").update({ status: "error", finished_at: new Date().toISOString(), error: msg.slice(0, 1000) }).eq("id", run!.id);
    throw e;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const supabase = db();
  try {
    const body = await req.json().catch(() => ({}));
    const action = typeof body.action === "string" ? body.action : "sync";

    if (action === "cron") {
      // Zamanlanmış çağrı: yalnızca son 5 saatte başarılı yenileme yoksa çalışır.
      const { data: last } = await supabase.from("seo_sync_runs").select("started_at").gte("started_at", new Date(Date.now() - 5 * 3600e3).toISOString()).limit(1);
      if (last?.length) return json({ skipped: true });
      return json(await sync(supabase));
    }

    const auth = await verifyAdminOrCron(req);
    if (!auth.ok) return json({ error: auth.error }, auth.status);

    if (action === "sync") return json(await sync(supabase));

    if (action === "apply" || action === "dismiss") {
      const id = String(body.id ?? "");
      if (!/^[0-9a-f-]{36}$/.test(id)) return json({ error: "Geçersiz öneri" }, 400);
      const { data: s } = await supabase.from("seo_suggestions").select("*").eq("id", id).maybeSingle();
      if (!s || s.status !== "pending") return json({ error: "Öneri bulunamadı veya zaten işlendi" }, 404);
      if (action === "dismiss") {
        await supabase.from("seo_suggestions").update({ status: "dismissed", updated_at: new Date().toISOString() }).eq("id", id);
        return json({ ok: true });
      }
      const title = typeof body.title === "string" ? body.title.trim().slice(0, 70) : s.suggested_title;
      const description = typeof body.description === "string" ? body.description.trim().slice(0, 170) : s.suggested_description;
      if (!title || !description) return json({ error: "Başlık ve açıklama gerekli" }, 400);
      if (!s.target_id || !["blog", "specialist"].includes(s.target_type)) return json({ error: "Bu sayfa panelden düzenlenemiyor" }, 400);
      const table = s.target_type === "blog" ? "blog_posts" : "specialists";
      const { error } = await supabase.from(table).update({ seo_title: title, seo_description: description }).eq("id", s.target_id);
      if (error) return json({ error: error.message }, 500);
      await supabase.from("seo_suggestions").update({ status: "applied", applied_at: new Date().toISOString(), suggested_title: title, suggested_description: description, updated_at: new Date().toISOString() })
        .eq("page", s.page).eq("status", "pending");
      return json({ ok: true });
    }
    return json({ error: "Bilinmeyen işlem" }, 400);
  } catch (e) {
    console.error(e);
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
