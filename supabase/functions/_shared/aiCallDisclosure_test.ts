import { assert } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { AI_CALL_OPENING_DISCLOSURE, AI_CALL_TRANSPARENCY_RULES } from "./aiCallDisclosure.ts";
Deno.test("açılış metni yapay zekâ ve aydınlatma bağlantısını içerir", () => {
  assert(AI_CALL_OPENING_DISCLOSURE.includes("yapay zekâ destekli"));
  assert(AI_CALL_OPENING_DISCLOSURE.includes("doktorumol.com.tr/aydinlatma-metni"));
});
Deno.test("kurallar insan temsilci seçeneği sunar", () => {
  assert(AI_CALL_TRANSPARENCY_RULES.includes("insan temsilciyle"));
});
