import { assertEquals, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { decideNotification, pickSpecialistPhone, specialistSms } from "./appointmentNotify.ts";
const now = Date.parse("2026-11-12T12:00:00Z");
Deno.test("yeni randevu ilk kez bildirilir", () => assertEquals(decideNotification({ exists: true, alreadyNotified: false, createdAt: "2026-11-12T11:55:00Z", now }), { send: true }));
Deno.test("aynı randevu ikinci kez bildirilmez", () => assertEquals(decideNotification({ exists: true, alreadyNotified: true, createdAt: "2026-11-12T11:55:00Z", now }).send, false));
Deno.test("eski randevu için dışarıdan tetikleme gönderim yapmaz", () => assertEquals(decideNotification({ exists: true, alreadyNotified: false, createdAt: "2026-11-01T10:00:00Z", now }), { send: false, reason: "stale" }));
Deno.test("olmayan randevu reddedilir", () => assertEquals(decideNotification({ exists: false, alreadyNotified: false, createdAt: null, now }).send, false));
Deno.test("gelecek tarihli oluşturma zamanı kabul edilmez", () => assertEquals(decideNotification({ exists: true, alreadyNotified: false, createdAt: "2026-11-12T14:00:00Z", now }).send, false));
Deno.test("uzman telefonu kayıttan alınır", () => assertEquals(pickSpecialistPhone("05321112233", ["05559998877"]).source, "specialists"));
Deno.test("uzman kaydı boşsa kendi siparişinden", () => assertEquals(pickSpecialistPhone(null, [null, "05559998877"]).source, "orders_email"));
Deno.test("santral numarası alıcı sayılmaz", () => assertEquals(pickSpecialistPhone("0216 706 06 11", []).phone, null));
Deno.test("SMS not ve sağlık açıklaması içermez", () => {
  const s = specialistSms({ patientName: "A B", date: "12 Kasım", time: "10:00", type: "Online", patientPhone: "05320000000" });
  assert(!/Not:|Konu|kaygı|depresyon/i.test(s));
});
