# Doktorum Ol — Teknik SEO Denetimi (22 Kasım 2026, yalnız rapor)

Hiçbir kod, yayın veya veri değiştirilmedi. Testler canlı sitede Googlebot kimliğiyle yapıldı.

## A) Doğrulanmış kritik sorunlar
1. **Soft 404 — var olmayan sayfalar 200 dönüyor.**
   - Kanıt: `/yok-boyle-bir-sayfa-xyz` → 301 → `/blog/yok-boyle-bir-sayfa-xyz` → **200**, ana sayfa başlığıyla boş (13,8 KB) şablon.
   - Aynı şablon: `/psikolog/nur-seyda-peker` (kaldırılmış profil) → 200, ana sayfa başlığı, canonical yok.
   - `/category/uzman-psikolog/` ve `/category/psikoloji/` → 301 → slashsız → **200** boş şablon.
   - Etki: Google bu adresleri "ana sayfa başlıklı ince içerik" olarak görür; markalı "Doktorum Ol" başlığını taşıyan çok sayıda kopya sayfa oluşur. Sıra düşüşüne neden olduğu kanıtlanmadı ama en güçlü teknik aday budur.
   - Kaynak: `public/.htaccess` satır ~233–244 (bilinmeyen tek kelimeli adresi /blog/'a 301) ve SPA fallback'in her bilinmeyen adrese `index.html` ile 200 vermesi.

## B) Orta / düşük önem
2. `https://doktorumol.com.tr//` (çift eğik çizgi) → 200, yönlendirme yok (düşük).
3. `/kayit-ol` boş şablonla 200 veriyor; robots.txt'te engelli olduğu için etkisi düşük.
4. Ana sayfada aynı kurum için hem `Organization` hem `MedicalBusiness` var; profilde ikinci `Organization` bloğu (düşük, tek kimlikte birleştirilebilir).
5. HTTP www → önce https www, sonra çıplak alan adı (2 adımlı yönlendirme; düşük).
6. robots.txt düzeltmesi (dosya uzantılı adresler /blog'a gitmesin) commit edildi, Hostinger'a henüz yayınlanmadı.

## Sorunsuz doğrulananlar
- Ana sayfa, /uzmanlar, /blog, /hakkimizda, /iletisim, aktif profiller (Zerrin Gündüz, Pelin Gülbayrak, Şeyma Cengiz, Merve Akyüz): 200, gerçek HTML, tek doğru canonical, noindex/X-Robots-Tag yok.
- http→https, www→çıplak, sondaki eğik çizgi, /index.html → hepsi 301 doğru.
- robots.txt 200, kritik sayfa engellemiyor, sitemap adresi doğru.
- sitemap.xml: 1.729 URL, tamamı kendi alan adı; rastgele 60 URL'nin 60'ı 200.
- Search Console URL Inspection (ana sayfa): "Gönderildi ve dizine eklendi", son tarama 21 Kasım 23:37, Google canonical = sizin canonical, robots izinli, mobil tarama.
- Yanıt süresi 0,1–0,2 sn; 403/429/5xx görülmedi; sunucu LiteSpeed.

## C) Doğrulanamayanlar
- Manuel işlem ve güvenlik sorunları API'de yok; Search Console ekranından bakılmalı.
- Sıra düşüşünün kesin nedeni (algoritma, rakip, dizin rehberi siteleri) kanıtlanmadı.
- Gerçek kullanıcı Core Web Vitals (CrUX) verisi okunmadı.
- Blog içerik kopyaları/ince içerik taraması yapılmadı.

## E) Düşük riskli çözüm planı (onay bekliyor)
1. Ön-render listesinde olmayan uzman profili, kategori ve blog adresleri için gerçek **404** (veya taşınmış profiller için doğru profile 301) döndürmek; `.htaccess` tek kelime → /blog yönlendirmesini yalnız gerçekten var olan blog yazılarıyla sınırlamak (ön-render dosyası varsa).
2. `/category/*` eski WordPress adreslerini /blog veya /uzmanlar'a 301.
3. `//` çift eğik çizgiyi `/`'a 301.
4. Yapılandırılmış veride tek kurum kimliği.
Regresyon riski: yanlış kural gerçek blog/profil sayfasını 404 yapabilir → sitemap'teki 1.729 URL'nin tamamı yayından önce ve sonra 200 testi şart.

## F) Testler
- Öncesi/sonrası: sitemap'teki tüm URL'ler 200; bilinmeyen adres 404; kaldırılmış profil 404/301; aktif profiller tek canonical; robots.txt/sitemap.xml 200 ve yönlendirmesiz; ödeme/kayıt/giriş/panel adresleri değişmeden açılıyor.
