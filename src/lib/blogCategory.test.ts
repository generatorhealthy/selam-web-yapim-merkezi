import { test } from "node:test";
import assert from "node:assert/strict";
import { blogCategoryOf } from "./blogCategory.ts";

test("beslenme yazılarını ayırır", () => assert.equal(blogCategoryOf("Sağlıklı Kilo Verme Rehberi"), "Beslenme"));
test("aile yazılarını ayırır", () => assert.equal(blogCategoryOf("Aile ve Çift Terapisi Nedir?"), "Aile & İlişkiler"));
test("psikoloji yazılarını ayırır", () => assert.equal(blogCategoryOf("Kaygı Bozukluğu ile Baş Etme"), "Psikoloji"));
test("kadın sağlığı yazılarını ayırır", () => assert.equal(blogCategoryOf("Gebelikte Dikkat Edilmesi Gerekenler"), "Kadın Sağlığı"));
test("eşleşmeyenler Sağlık Rehberi olur", () => assert.equal(blogCategoryOf("Fizyoterapi Seansı"), "Sağlık Rehberi"));
