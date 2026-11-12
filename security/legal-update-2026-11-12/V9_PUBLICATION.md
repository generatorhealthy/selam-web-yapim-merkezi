# v9 Genel Aydınlatma ve Çağrı Merkezi Yayını — 12 Kasım 2026 21:07 UTC

## Karar
Şirket yetkilisinin açık yazılı talimatıyla (yüklenen "KVKK VE ÇAĞRI MERKEZİ AYDINLATMA METİNLERİNİN CANLI YAYINI" dosyası) iki sayfa bilgilendirme kapsamında yayıma açıldı. Kapsam: `public_information_only_not_compliance_certification` — sayfalar şeffaf bilgilendirmedir, tam KVKK uyum beyanı değildir.

## Neden artık engelli değil
Önceki engel, metinlerin eksik hukuki dayanağı gizleyerek "tamamlanmış aydınlatma" gibi sunulma riskiydi. v9 metinleri bu riski taşımıyor:
- Geçmiş test/sağlık kayıtları için somut m.6 şartının doğrulanmadığı metinde açıkça yazıyor; geriye dönük rıza üretilmiyor.
- m.9 yurt dışı aktarım güvenceleri varmış gibi gösterilmiyor; tamamlanması gereken iş olarak belirtiliyor.
- "Telefon görüşmeleri ses dosyası olarak kaydedilmemektedir" şirket beyanı korunuyor; üçüncü taraf sağlayıcı garantisi verilmiyor.
- AI sesli asistan kapalı olarak anlatılıyor.

## Yayın kaydı (publication.json)
- disclosure (/aydinlatma-metni): legal_approved_at = publication_authorized_at = published_at = 2026-11-12T21:07:08Z
- call (/cagri-merkezi-aydinlatma-metni): aynı üç zaman damgası
- consent (/acik-riza): değişmedi (20:45:41Z yayın, 20:52:26Z canlı doğrulama)

## Belge SHA-256 (değişmedi)
- aydinlatma-metni.md: 00cf77757d5da1d61407c8c775a7ed7c3576966c0901bed1e023f35f27001fc9
- cagri-merkezi.md: 42d0821c41275ee0eb0c2563e0722592735e4d98d88380e48497e23de9c4197d

## Doğrulama
- 9/9 hukuki yayın kapısı testi geçti (testler yeni yayın durumuna güncellendi).
- Build OK; prerender üç sayfa için tam script-free HTML üretti (dist/pre/, canonical + legal-document-sha256 + legal-published-at meta).
- Yerel Playwright (1280×1800 ve 390×844): iki sayfa index/follow, canonical doğru, "Yayın adayı" bandı yok, ses kaydı beyanı ve m.6 açıklamaları görünüyor.
- Eski kısa DisclosureText özeti, kapı açıkken artık /aydinlatma-metni ve /disclosure-text yollarında gösterilmiyor.

## Bekleyen
- Gerçek doktorumol.com.tr HTML/hash doğrulaması: GitHub Actions → Hostinger FTP dağıtımı tamamlandıktan sonra yapılacak; ardından deployment_verified_at işaretlenecek.
- Eski sağlık kayıtlarının saklama dayanağı ve m.9 aktarım güvenceleri ayrı operasyonel iş olarak açık kalıyor.

## Dokunulmayanlar
Paket B/C güvenliği, AI döküm erişim kısıtları, eski mobil INSERT yetkisi, Supabase bağlantısı ve tüm canlı kayıtlar değiştirilmedi.
