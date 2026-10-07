// Meta CAPI yanıtını sınıflandırır. Yalnız HTTP 2xx + events_received >= 1 "kabul" sayılır.
// Kişisel veri veya token içermeyen alanları döndürür.
export type MetaStatus = "META_ACCEPTED" | "META_RESPONSE_UNVERIFIED" | "META_REJECTED";

export function classifyCapiResponse(httpStatus: number, bodyText: string) {
  let body: any = null;
  try { body = JSON.parse(bodyText); } catch { /* gövde JSON değil */ }
  const received = typeof body?.events_received === "number" ? body.events_received : null;
  const messages = Array.isArray(body?.messages) ? body.messages.map((m: unknown) => String(m).slice(0, 300)).slice(0, 10) : null;
  const fbtrace = body?.fbtrace_id ?? body?.error?.fbtrace_id ?? null;
  const ok = httpStatus >= 200 && httpStatus < 300;
  const meta_status: MetaStatus = !ok || body?.error
    ? "META_REJECTED"
    : received !== null && received >= 1 ? "META_ACCEPTED" : "META_RESPONSE_UNVERIFIED";
  const error = meta_status === "META_REJECTED"
    ? `[${httpStatus}] ${String(body?.error?.message || bodyText || "").slice(0, 300)}`
    : null;
  return {
    meta_status, http_status: httpStatus, events_received: received,
    meta_messages: messages, fbtrace_id: fbtrace ? String(fbtrace) : null, error,
  };
}
