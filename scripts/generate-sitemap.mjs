/**
 * Build-time sitemap generator.
 *
 * Google cross-host sitemap yönlendirmelerini (302/301 -> supabase.co) çoğunlukla
 * yok sayıyor. Bu yüzden sitemap artık kendi domainimizde GERÇEK dosya olarak
 * sunuluyor: build/dev öncesi edge function'dan canlı veri çekilip
 * public/sitemap.xml dosyasına yazılıyor.
 *
 * Hata durumunda mevcut public/sitemap.xml korunur, build asla kırılmaz.
 */
import { writeFileSync, existsSync, statSync } from "fs";
import { resolve } from "path";

const ENDPOINT =
  "https://irnfwewabogveofwemvg.supabase.co/functions/v1/generate-sitemap?format=xml";
const OUTPUT = resolve("public/sitemap.xml");

async function main() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45000);

  try {
    const res = await fetch(ENDPOINT, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const xml = await res.text();
    if (!xml.includes("<urlset") || !xml.trim().endsWith("</urlset>")) {
      throw new Error("Geçersiz sitemap içeriği");
    }

    writeFileSync(OUTPUT, xml, "utf8");
    const count = (xml.match(/<url>/g) || []).length;
    console.log(`sitemap.xml yazıldı (${count} URL)`);
  } catch (err) {
    const hasExisting = existsSync(OUTPUT) && statSync(OUTPUT).size > 0;
    console.warn(
      `sitemap.xml üretilemedi (${err.message}) — ${
        hasExisting ? "mevcut dosya korunuyor" : "dosya yok!"
      }`
    );
  } finally {
    clearTimeout(timer);
  }
}

main();
