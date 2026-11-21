import { test } from "node:test";
import assert from "node:assert/strict";
import { makeStatsHandler } from "./statistics-handler";
import type { IvrCall } from "../../supabase/functions/_shared/ivrStatistics";
const campaign = "00000000-0000-0000-0000-000000000001";
const rows: IvrCall[] = Array.from({ length: 1607 }, (_, i) => ({ id: String(i), campaign_id: campaign, lead_id: String(i), name: `Sentetik ${i}`, phone: "905550000001", area_key: "cift", state: "done", digit: i === 1606 ? "2" : null, call_status: "no_digit", created_at: "2026-11-21T10:00:00Z", dispatched_at: "2026-11-21T10:00:00Z", notified_at: null, pbx_call_id: i % 2 ? "line:80" : "line:81" }));
function fixture(allowed = true) { let reads = 0; return { get reads() { return reads; }, handler: makeStatsHandler({ authorize: async () => allowed, campaigns: async () => [{ id: campaign, created_at: rows[0].created_at, total: 1607, status: "done" }], calls: async () => { reads++; return rows; }, telemetryReady: async () => false }) }; }
const request = (body: object) => new Request("https://synthetic.invalid", { method: "POST", body: JSON.stringify(body) });
test("unauthorized statistics never read calls", async () => { const f = fixture(false); const r = await f.handler(request({})); assert.equal(r.status, 403); await r.text(); assert.equal(f.reads, 0); });
test("1607 aggregate does not truncate to 1000 or page size", async () => { const r = await fixture().handler(request({ page: 33 })); const data = await r.json(); assert.equal(data.summary.total, 1607); assert.equal(data.calls.length, 7); assert.equal(data.calls[6].digit, "2"); });
test("line filter leaves one GSM line", async () => { const data = await (await fixture().handler(request({ line: "80" }))).json(); assert.equal(data.total, 803); assert.equal(data.summary.total, 803); });
test("result filter finds a key beyond the first 1000 rows", async () => { const data = await (await fixture().handler(request({ result: "pressed_2" }))).json(); assert.equal(data.total, 1); assert.equal(data.calls[0].id, "1606"); });
test("export is the whole filtered set rather than visible page", async () => { const data = await (await fixture().handler(request({ export: true }))).json(); assert.equal(data.calls.length, 1607); });
test("invalid line and reversed dates are rejected before reads", async () => { const f = fixture(); for (const body of [{ line: "82" }, { from: "2026-11-22", to: "2026-11-21" }]) { const r = await f.handler(request(body)); assert.equal(r.status, 400); await r.text(); } assert.equal(f.reads, 0); });