import { describe, it, expect } from "vitest";
import { buildAppointmentPayload, canSubmitHealthTest, emptyConsent, isGranted } from "./consentPolicy";

describe("consentPolicy", () => {
  it("aydınlatma gösterilse bile rıza yoksa test gönderilemez", () => {
    expect(canSubmitHealthTest({ disclosureShown: true, granted: {} })).toBe(false);
  });
  it("rıza var ama aydınlatma gösterilmediyse test gönderilemez", () => {
    expect(canSubmitHealthTest({ disclosureShown: false, granted: { health_test: true } })).toBe(false);
  });
  it("aydınlatma + ayrı sağlık rızasıyla test gönderilebilir", () => {
    expect(canSubmitHealthTest({ disclosureShown: true, granted: { health_test: true } })).toBe(true);
  });
  it("varsayılan durumda hiçbir izin verilmiş sayılmaz", () => {
    const s = emptyConsent();
    expect(isGranted(s, "health_test")).toBe(false);
    expect(isGranted(s, "marketing_etk")).toBe(false);
  });
  it("randevu rızasız alınır ama sağlık notu düşürülür", () => {
    const p = buildAppointmentPayload({ name: "A" }, "kaygı", { disclosureShown: true, granted: {} });
    expect(p.notes).toBeNull();
    expect(p.name).toBe("A");
  });
  it("randevu rızasıyla sağlık notu korunur", () => {
    const p = buildAppointmentPayload({}, " kaygı ", { disclosureShown: true, granted: { health_appointment: true } });
    expect(p.notes).toBe("kaygı");
  });
  it("test rızası randevu rızası yerine geçmez", () => {
    const p = buildAppointmentPayload({}, "x", { disclosureShown: true, granted: { health_test: true } });
    expect(p.notes).toBeNull();
  });
});
