import { callLine, callResult, isActiveCall, remainingWorkSeconds, summarizeCalls, type IvrCall } from "../../supabase/functions/_shared/ivrStatistics.ts";

export interface StatsFilters { campaign: string; line: string; scope: string; search: string; result: string; from: string; to: string; page: number; export: boolean }
export interface StatsPorts {
  authorize: (request: Request) => Promise<boolean>;
  campaigns: () => Promise<{ id: string; created_at: string; total: number; status: string }[]>;
  calls: (filters: StatsFilters, campaignId: string | null) => Promise<IvrCall[]>;
  telemetryReady: () => Promise<boolean>;
}
export function makeStatsHandler(ports: StatsPorts) {
  return async (request: Request) => {
    try {
      if (!await ports.authorize(request)) return Response.json({ error: "Bu ekran yalnız yöneticilere açıktır" }, { status: 403 });
    } catch { return Response.json({ error: "Oturum doğrulanamadı" }, { status: 503 }); }
    let body: Record<string, unknown>;
    try { body = await request.json(); } catch { return Response.json({ error: "Geçersiz istek" }, { status: 400 }); }
    const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
    const date = (value: unknown) => value === "" || typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
    const filters: StatsFilters = { campaign: String(body.campaign ?? "latest"), line: String(body.line ?? "all"), scope: String(body.scope ?? "real"), search: String(body.search ?? "").trim(), result: String(body.result ?? "all"), from: String(body.from ?? ""), to: String(body.to ?? ""), page: Number(body.page ?? 1), export: body.export === true };
    if (!(["latest", "all"].includes(filters.campaign) || uuid.test(filters.campaign)) || !["all", "80", "81"].includes(filters.line) || !["real", "test"].includes(filters.scope) || !Number.isInteger(filters.page) || filters.page < 1 || filters.page > 100000 || filters.search.length > 100 || !date(filters.from) || !date(filters.to) || filters.from && filters.to && filters.from > filters.to || !["all", "queued", "dialing", "ringing", "talking", "pressed_1", "pressed_2", "no_key", "no_answer", "busy", "failed", "cancelled", "unknown"].includes(filters.result)) return Response.json({ error: "Geçersiz filtre" }, { status: 400 });
    try {
      const campaigns = await ports.campaigns();
      const available = campaigns.filter(c => filters.scope === "test" ? c.status === "test" : c.status !== "test");
      const id = filters.campaign === "latest" ? available[0]?.id || null : filters.campaign === "all" ? null : filters.campaign;
      const raw = filters.campaign === "latest" && !id ? [] : await ports.calls(filters, id);
      const scoped = raw.filter(call => (filters.scope === "test" ? call.lead_id === null : call.lead_id !== null) && (filters.line === "all" || callLine(call) === filters.line));
      const term = filters.search.toLocaleLowerCase("tr-TR");
      const filtered = scoped.filter(call => (filters.result === "all" || callResult(call) === filters.result) && (!term || `${call.name || ""} ${call.phone}`.toLocaleLowerCase("tr-TR").includes(term)));
      return Response.json({ campaigns: available, calls: filters.export ? filtered : filtered.slice((filters.page - 1) * 50, filters.page * 50), activeCalls: scoped.filter(isActiveCall), summary: summarizeCalls(scoped), total: filtered.length, page: filters.page, remainingSeconds: remainingWorkSeconds(scoped), updatedAt: new Date().toISOString(), telemetryReady: await ports.telemetryReady() });
    } catch { return Response.json({ error: "İstatistik verileri alınamadı" }, { status: 503 }); }
  };
}