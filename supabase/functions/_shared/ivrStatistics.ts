export type IvrResult = "queued" | "dialing" | "ringing" | "talking" | "pressed_1" | "pressed_2" | "no_key" | "no_answer" | "busy" | "failed" | "cancelled" | "unknown";
export interface IvrCall {
  id: string; campaign_id: string; lead_id: string | null; phone: string; area_key: string;
  state: string; digit: string | null; call_status: string | null;
  created_at: string; dispatched_at: string | null; notified_at: string | null; pbx_call_id: string | null;
  name?: string; source_status?: string; line?: string | null;
  ringing_at?: string | null; answered_at?: string | null; digit_at?: string | null;
  ended_at?: string | null; end_reason?: string | null; observed_at?: string | null;
}
export const IVR_RESULT_LABELS: Record<IvrResult, string> = {
  queued: "Sırada", dialing: "Arama gönderildi", ringing: "Çalıyor", talking: "Görüşmede",
  pressed_1: "1'i tuşladı", pressed_2: "2'yi tuşladı", no_key: "Açtı · tuşlamadı",
  no_answer: "Yanıt yok", busy: "Meşgul", failed: "Hat / arama hatası", cancelled: "Durduruldu", unknown: "Sonuç doğrulanamadı",
};
export function callLine(call: IvrCall): string | null {
  return call.line || (/^line:(80|81)$/.exec(call.pbx_call_id || "")?.[1] ?? null);
}
export function secondsBetween(start?: string | null, end?: string | null): number | null {
  if (!start || !end) return null;
  const seconds = (Date.parse(end) - Date.parse(start)) / 1000;
  return Number.isFinite(seconds) && seconds >= 0 ? Math.floor(seconds) : null;
}
export function callResult(call: IvrCall): IvrResult {
  if (call.digit === "1") return "pressed_1";
  if (call.digit === "2") return "pressed_2";
  if (call.digit === "none" && call.notified_at && !call.observed_at) return "no_key";
  if (call.ended_at) {
    if (call.answered_at) return "no_key";
    if (call.end_reason === "busy") return "busy";
    if (call.end_reason === "no_answer") return "no_answer";
    if (call.end_reason === "failed") return "failed";
    if (call.end_reason === "cancelled") return "cancelled";
    return "unknown";
  }
  if (call.observed_at && call.answered_at) return "talking";
  if (call.observed_at && call.ringing_at) return "ringing";
  if (call.state === "queued") return "queued";
  if (call.state === "cancelled") return "cancelled";
  if (call.state === "failed") return "failed";
  if (call.state === "dialing") return "dialing";
  return "unknown";
}
export function isAnswered(call: IvrCall): boolean {
  return Boolean(call.answered_at || call.digit === "1" || call.digit === "2" || call.digit === "none" && call.notified_at);
}
export function isActiveCall(call: IvrCall): boolean {
  return !call.ended_at && (call.state === "dialing" || Boolean(call.observed_at && call.answered_at));
}
export function summarizeCalls(calls: IvrCall[]) {
  const counts = Object.fromEntries(Object.keys(IVR_RESULT_LABELS).map(key => [key, 0])) as Record<IvrResult, number>;
  let answered = 0, completed = 0, durationTotal = 0, measured = 0;
  for (const call of calls) {
    counts[callResult(call)]++;
    if (isAnswered(call)) answered++;
    if (call.ended_at || !call.observed_at && ["done", "failed", "cancelled"].includes(call.state)) completed++;
    const duration = secondsBetween(call.answered_at, call.ended_at);
    if (duration !== null) { measured++; durationTotal += duration; }
  }
  const attempted = calls.filter(call => Boolean(call.dispatched_at)).length;
  return { total: calls.length, counts, answered, completed, measured,
    active: calls.filter(isActiveCall).length,
    answerRate: attempted ? Math.round(answered / attempted * 100) : null,
    keyRate: answered ? Math.round((counts.pressed_1 + counts.pressed_2) / answered * 100) : null,
    averageTalk: measured ? Math.round(durationTotal / measured) : null,
  };
}
export type IvrSummary = ReturnType<typeof summarizeCalls>;
export interface IvrStatsResponse {
  campaigns: { id: string; created_at: string; total: number; status: string }[];
  calls: IvrCall[]; activeCalls: IvrCall[]; summary: IvrSummary; total: number; page: number;
  updatedAt: string; telemetryReady: boolean;
  remainingSeconds?: number | null;
}
export function remainingWorkSeconds(calls: IvrCall[]): number | null {
  const measured = calls.map(call => secondsBetween(call.dispatched_at, call.ended_at)).filter((value): value is number => value !== null);
  if (measured.length < 10) return null;
  const remaining = calls.filter(call => call.state === "queued" || isActiveCall(call)).length;
  return Math.ceil(measured.reduce((sum, value) => sum + value, 0) / measured.length * remaining / 2);
}