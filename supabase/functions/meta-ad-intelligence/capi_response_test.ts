import { assertEquals } from "jsr:@std/assert";
import { classifyCapiResponse } from "../_shared/capiResponse.ts";

Deno.test("200 + events_received 1 → META_ACCEPTED", () => {
  const r = classifyCapiResponse(200, '{"events_received":1,"messages":[],"fbtrace_id":"X"}');
  assertEquals(r.meta_status, "META_ACCEPTED");
  assertEquals(r.fbtrace_id, "X");
});
Deno.test("200 ama events_received yok → META_RESPONSE_UNVERIFIED", () => {
  assertEquals(classifyCapiResponse(200, "{}").meta_status, "META_RESPONSE_UNVERIFIED");
  assertEquals(classifyCapiResponse(200, '{"events_received":0}').meta_status, "META_RESPONSE_UNVERIFIED");
});
Deno.test("Meta hatası → META_REJECTED + güvenli mesaj", () => {
  const r = classifyCapiResponse(400, '{"error":{"message":"Invalid parameter","fbtrace_id":"Y"}}');
  assertEquals(r.meta_status, "META_REJECTED");
  assertEquals(r.error, "[400] Invalid parameter");
  assertEquals(r.fbtrace_id, "Y");
});
