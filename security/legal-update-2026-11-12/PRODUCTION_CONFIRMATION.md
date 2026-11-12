# Doktorum Ol — KVKK yayın doğrulaması (güncel ek rapor)

12 Kasım 2026, 20:52:26 UTC / 23:52:26 İstanbul.

## Gerçek sitede doğrulanan yayın

https://doktorumol.com.tr/acik-riza HTTP 200 ile gerçek, script-free Açık Rıza Bilgilendirmesi HTML’ini döndürdü. Yanıt koruma sayfası değil; HTML SHA-256 değeri önceki hazırlanan paketle birebir eşleşti. Gerçek yanıttan alınan HTML masaüstü ve 440×673 mobil boyutta görüntülendi; yatay taşma ve izin kaydeden form yok.

- Belgedeki sürüm/yayın zamanı: **12 Kasım 2026 20:45:41 UTC / 23:45:41 İstanbul**.
- Gerçek sitede yayının doğrulandığı zaman: **20:52:26 UTC / 23:52:26 İstanbul**.
- Tam FTP etkinleşme saniyesi veya Actions logu okunmadı; belge üzerindeki sürüm zamanı ile ilk doğrulama zamanı birbirinden ayrıdır.
- Belge SHA-256: `65664bcab74a33b355e06aab01e6a41672da4142b63300affc2edaa6627ad8aa`.
- Gerçek HTML SHA-256: `791db1963093d325abbc3aa599576c084b35bdbad82ec20a5e17f6c996890f23`.

## Diğer iki belge

- Genel Aydınlatma v9: entegre taslak. Somut eksik: eski test/sağlık niteliğindeki randevu ve yönlendirme verilerinin mevcut işlenmesi/saklanması için faaliyet-kayıt bazlı geçerli m.6 şartı doğrulanmadı. Yeni nihai metin yayımlanmadı.
  - Belge SHA-256: `00cf77757d5da1d61407c8c775a7ed7c3576966c0901bed1e023f35f27001fc9`.
- Çağrı Merkezi v9: entegre taslak. Somut eksik: sağlık içeren geçmiş AI dökümlerinin bugünkü saklanması için kayıt/amaç bazlı geçerli m.6 şartı doğrulanmadı. Yeni nihai metin yayımlanmadı.
  - Belge SHA-256: `42d0821c41275ee0eb0c2563e0722592735e4d98d88380e48497e23de9c4197d`.

20:52:08 UTC gerçek GET kontrolünde genel aydınlatma eski HTML’i döndürdü; yeni belge hash/zaman etiketi yok. Çağrı URL’si uygulama kabuğu döndürdü; yeni belge hash/zaman etiketi yok. Bu iki yanıt yeni metin yayını olarak sayılmadı.

## Korunan sınırlar

Üç metin v8 ile karşılaştırılarak v9’da tutuldu; footer, route, mobil, Apache, prerender ve bağlantılar önceki uygulamada hazırlanmıştı. Bu tekrarlanan talimatta içerikler yeniden yazılmadı. 04 iç değerlendirme kamuya aktarılmadı. Eski sürümler, mevcut Supabase bağlantısı/kayıtlar, ödeme/abonelik ve Paket B/C korunuyor. Yeni sağlık izni etkinleştirilmedi; geriye dönük rıza ve toplu m.6/3-d üretilmedi. Yayın tam KVKK uygunluğu veya doğrulanmış m.9 güvencesi beyanı değildir.

Önceki raporun “gerçek yayın doğrulanmadı” bölümü önceki 20:46 kontrolünü anlatır; **bu ek rapor Açık Rıza sayfası açısından o durumu günceller**. İki aydınlatmanın somut m.6 eksikliği değişmedi.
