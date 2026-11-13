import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { decideHookAuth } from "./wahaWebhookGuard.ts";
const S = "s3cr3t-value-0123456789abcdef";
for (const enforce of [false, true]) {
  Deno.test(`anahtarsız istek reddedilir (enforce=${enforce})`, () => assertEquals(decideHookAuth(null, S, enforce).allow, false));
  Deno.test(`yanlış anahtar reddedilir (enforce=${enforce})`, () => assertEquals(decideHookAuth("wrong", S, enforce).allow, false));
  Deno.test(`doğru anahtar geçer (enforce=${enforce})`, () => assertEquals(decideHookAuth(S, S, enforce), { allow: true, state: "signed" }));
  Deno.test(`sır yoksa fail-closed (enforce=${enforce})`, () => assertEquals(decideHookAuth(null, undefined, enforce).allow, false));
}
