import { assertEquals } from "jsr:@std/assert@1";
import { buildFollowMeList } from "./followMeList.ts";

Deno.test("uzman numarası 80 ve 81 hatlarıyla iki satır olarak yazılır", () => {
  assertEquals(buildFollowMeList("05308232275"), "805308232275#-815308232275#");
  assertEquals(buildFollowMeList("+90 530 823 22 75"), "805308232275#-815308232275#");
});
Deno.test("geçersiz numara boş liste verir", () => {
  assertEquals(buildFollowMeList("123"), "");
});
