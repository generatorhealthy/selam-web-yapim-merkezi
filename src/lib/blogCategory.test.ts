import { describe, it, expect } from "vitest";
import { blogCategoryOf } from "./blogCategory";

describe("blogCategoryOf", () => {
  it("beslenme yazılarını ayırır", () => expect(blogCategoryOf("Sağlıklı Kilo Verme Rehberi")).toBe("Beslenme"));
  it("aile yazılarını ayırır", () => expect(blogCategoryOf("Aile ve Çift Terapisi Nedir?")).toBe("Aile & İlişkiler"));
  it("psikoloji yazılarını ayırır", () => expect(blogCategoryOf("Kaygı Bozukluğu ile Baş Etme")).toBe("Psikoloji"));
  it("kadın sağlığı yazılarını ayırır", () => expect(blogCategoryOf("Gebelikte Dikkat Edilmesi Gerekenler")).toBe("Kadın Sağlığı"));
  it("eşleşmeyenler Sağlık Rehberi olur", () => expect(blogCategoryOf("Fizyoterapi Seansı")).toBe("Sağlık Rehberi"));
});
