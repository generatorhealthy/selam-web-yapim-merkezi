# İstatistik yayını — santral kurulumu bekliyor

21 Kasım 2026 12:40 UTC kullanıcı onayıyla SQL ve üç Edge hizmeti canlı yayımlandı. İstatistik anonim403, biçimli imzasız olay403 döndü; yeni service-only politikalar doğrulandı. Web ekranı hazır; gerçek oturum kabulü bu harici Supabase ortamında doğrulanamadı. Hostinger observer kurulmadan açılma/kapanma saniyeleri gelmez; sahte veri içermez. Önceden var olan 155 güvenlik bulgusu bu paketten bağımsızdır; yeni uyarı yoktur.

## Ayrı canlı paket
- schema.sql: eklemeli olay tablosu, service-only imzalı olay RPC'si, yalnız service erişimli özet görünümü. Mevcut çağrı/lead satırlarına dokunmaz; mevcut personel yetkileri korunur.
- edge-statistics.ts, statistics-handler.ts ve ortak kurallar doğru içe aktarımlarla `lead-ivr-statistics` olarak yayımlandı. Yetki, doğrulanmış oturumun caller-scoped get_my_panel_access sonucudur; yalnız onaylı admin.
- edge-telemetry.ts ve telemetry-handler.ts `lead-ivr-telemetry` olarak yayımlandı. Çağrı HMAC imzası olmadan olay kabul edilmez. 1/2 geçmiş kategori güncellemeleri mevcut webhook'ta kalır.
- Bu paket arama hızını, 24 saat kuralını, saatleri veya kapasiteyi değiştirmez. Yeni otomatik arama başlatmaz.

## Hostinger santral hazırlığı
Kurulum ancak bu pakete ve santral değişikliğine ayrı onaydan sonra yapılır. `collector.py` henüz kurulmadı. Python yardımcı yalnız yerel AMI'ye bağlanır; Login dışında AMI Action göndermez. AMI hesabı `deny=0.0.0.0/0.0.0.0`, `permit=127.0.0.1/255.255.255.255`, `read=call,dialplan`, `write=` ile salt okunur olmalı; gerçek sürümde VarSet/Newstate/Hangup olaylarının geldiği doğrulanmalıdır. Parola güvenli yapılandırma dosyasında, root:root 0600 saklanır; kaynakta parola yoktur.

FreePBX call file Setvar değerleri `__IVR_CALL`, `__IVR_URL`, `__IVR_AREA` biçiminde miras alınır; zaten kullanılan `/n` korunur. Böylece iki Local leg ve taşıdığı çağrı kimliği ilişkilendirilir. Santral yardımcısının ayrı yedeği alınır; aktif kampanya sırasında dosya/dialplan değiştirilmez.

Önerilen systemd servis: collector.py, root-owned configuration; Restart=on-failure, PrivateTmp=true, NoNewPrivileges=true, ProtectSystem=strict, ProtectHome=true, ReadWritePaths=/var/lib/doktorumol-ivr-observer. AMI kopuşu kesin kapanma kabul edilmez; ekran son durumun güncel olmadığını gösterir. Teslim kuyruğu root-only SQLite outbox'tadır (klasör 0700 / dosya 0600); tekrar teslim aynı olay anahtarıyla yapılır, süreç yeniden başlayınca bekleyen teslimler korunur. Teslim edilmeyen metadata en fazla 24 saat bekler; gecikmiş olay kabul süresi aşılırsa sonuç doğrulanamadı kalır.

## Açık kabul sınırları
- Kalan çalışma süresi en az 10 doğrulanmış bitmiş denemeden sonra iki hat üzerinden tahmin üretir; 18:00 sonrası kalan süre sonraki çalışma saatindedir. Kesin takvim bitişi vaat edilmez. Kaynak snapshot tablosu hazırdır; tarihsel kampanyalarda kategori bilinmiyor. Canlı onayda kampanya oluşturmaya yeni metadata INSERT'i eklenir; eski kayıtlar doldurulmaz.
- Yeni observer sonrası tuşlayan bir çağrının kapanma kaydı olmadan mevcut webhook `state=done` diyebilir. Hazırlanan anlık ekranın aktif seçimi `answered_at/ended_at/observed_at` kanıtlarını da kullanır; tuşlama çağrıyı kapanmış gibi göstermez.
- Yerel testler gerçek GSM hattı, AMI sürümü veya gerçek yönetici oturumu kabulü değildir.
- Eski `no_digit` kayıtları yanıt yok sayılmaz; eski süreler doldurulmaz.
- Geri dönüş: yeni hizmetleri kapat, observer'ı durdur, PHP yedeğini geri yükle; olaylar ve tarihsel kayıtlar silinmez.