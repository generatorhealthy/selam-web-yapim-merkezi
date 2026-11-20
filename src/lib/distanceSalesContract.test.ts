import { describe, expect, it } from "vitest";
import { buildDistanceSalesData } from "./distanceSalesContract";

const base = { formData: { name: "Ayşe", surname: "Kaya", email: "a@b.com", gsmNumber: "05551112233", address: "Moda Cad. 1", city: "İstanbul" }, selectedPackage: { name: "Premium", price: 4000 }, paymentMethod: "bank_transfer", customerType: "individual", clientIP: "1.2.3.4", orderCreatedAt: "2026-11-20T07:24:28Z" };

describe("mesafeli satış alıcı bilgileri", () => {
  it("uzmanın girdiği telefon ve adresi kullanır", () => {
    const d = buildDistanceSalesData(base);
    expect(d.phone).toBe("05551112233");
    expect(d.address).toBe("Moda Cad. 1");
  });
  it("12 aylık toplamı hesaplar", () => {
    expect(buildDistanceSalesData(base).total).toBe("48.000 TL (KDV dahil)");
  });
  it("onay saatini Türkiye saatiyle yazar", () => {
    expect(buildDistanceSalesData(base).time).toBe("10:24:28");
  });
});
