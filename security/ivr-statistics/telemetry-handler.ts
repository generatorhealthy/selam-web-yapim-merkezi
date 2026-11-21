export interface TelemetryEvent { call_id: string; event_key: string; kind: string; occurred_at: string; line: string; reason?: string | null; token: string }
export interface TelemetryPorts { verify: (call: string, token: string) => Promise<boolean>; record: (event: TelemetryEvent) => Promise<void> }
export function makeTelemetryHandler(ports: TelemetryPorts) {
  return async (request: Request) => {
    if (request.method !== "POST") return new Response("method", { status: 405 });
    let event: TelemetryEvent;
    try { event = await request.json(); } catch { return new Response("invalid", { status: 400 }); }
    if (!event || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(event.call_id) || !/^[0-9a-f]{64}$/.test(event.token) || typeof event.event_key !== "string" || !/^[a-zA-Z0-9_.:-]{1,100}$/.test(event.event_key) || !["ringing", "answered", "digit_1", "digit_2", "ended", "heartbeat"].includes(event.kind) || !["80", "81"].includes(event.line) || typeof event.occurred_at !== "string" || !Number.isFinite(Date.parse(event.occurred_at)) || event.reason && !["no_answer", "busy", "failed", "cancelled", "normal", "unknown"].includes(event.reason)) return new Response("invalid", { status: 400 });
    const time = Date.parse(event.occurred_at);
    if (time > Date.now() + 30000 || time < Date.now() - 86400000) return new Response("expired", { status: 400 });
    try {
      if (!await ports.verify(event.call_id, event.token)) return new Response("forbidden", { status: 403 });
      await ports.record(event);
      return new Response("ok", { status: 200 });
    } catch { return new Response("unavailable", { status: 503 }); }
  };
}