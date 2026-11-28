import { describe, expect, it } from "bun:test";
import { matchesAppointmentType, matchesSpecialty } from "./specialtyFilter";

describe("ana sayfa uzman filtreleri", () => {
  it("branş adını ve branş bağlantısındaki slug biçimini eşleştirir", () => {
    expect(matchesSpecialty("Psikolog", "Psikolog")).toBe(true);
    expect(matchesSpecialty("Psikolog", "psikolog")).toBe(true);
    expect(matchesSpecialty("Diyetisyen", "psikolog")).toBe(false);
  });

  it("online seçimde yalnız online görüşme sunan uzmanları kabul eder", () => {
    expect(matchesAppointmentType({ online_consultation: true }, "online")).toBe(true);
    expect(matchesAppointmentType({ online_consultation: false, face_to_face_consultation: true }, "online")).toBe(false);
  });

  it("yüz yüze seçimde yalnız yüz yüze görüşme sunan uzmanları kabul eder", () => {
    expect(matchesAppointmentType({ face_to_face_consultation: true }, "yüzyüze")).toBe(true);
    expect(matchesAppointmentType({ online_consultation: true }, "yüzyüze")).toBe(false);
  });

  it("görüşme türü seçilmediyse filtre uygulamaz", () => {
    expect(matchesAppointmentType({}, "")).toBe(true);
  });
});
