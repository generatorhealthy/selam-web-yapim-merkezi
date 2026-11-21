# Otomatik Arama İstatistiği

## Ekran
Danışan Yönlendirme sayfasına, yalnız yöneticiye görünen **Otomatik Arama İstatistiği** düğmesi eklenir. Düğme ayrı, tam genişlikte bir istatistik ekranını açar; **Danışanlara dön** ile mevcut listeye dönülür. Mevcut kartlar ve toplu arama işlemleri korunur.

Açık kurumsal görünüm, ince çizgiler, saydam yüzeyler ve büyük okunur rakamlar; mevcut panelin renkleri kullanılır. Mavi arama, yeşil yanıt, kırmızı hata ve nötr bekleme göstergeleri yalnız renk değil yazı ve simgeyle de ayrılır.

### Görsel yerleşim taslağı
```text
← Danışanlara dön    Otomatik Arama İstatistiği    ● Güncel  Yenile

Kampanya seçimi          Tarih aralığı            Hat: Tümü / 80 / 81

Toplam     Sırada     Aranıyor     Açan     Açmayan     Hata
─────────────────────────────────────────────────────────
ANLIK ARAMALAR                          KAMPANYA İLERLEMESİ
81 · 0531 789 38 80                     Tamamlanan / Toplam
Kişi · Çalıyor · 00:24                  Kalan kişi · çalışma saati
80 · 0532 822 22 75                     Yanıt / tuşlama oranları
Kişi · Görüşmede · 00:17                1 · 2 · Tuşlamayan
─────────────────────────────────────────────────────────
ARAMA GEÇMİŞİ      Ara       Sonuç seçimi       CSV indir
Kişi / Telefon  Hat  Başlangıç  Çalma  Görüşme  Tuş  Sonuç
─────────────────────────────────────────────────────────
Satıra tıkla → çağrı ayrıntısı ve zaman çizelgesi
Sıraya alındı → çaldı → açıldı → 1/2 → kapandı
```
Telefonda özetler iki sütun olur; iki hat alt alta, arama geçmişi okunur kişi satırları halinde gösterilir. Uzun telefonlar ve adlar taşmaz.

## Gösterilecek bilgiler
- O anda aranan kişinin adı, telefonu, kayıtlı terapi türü, kaynak kategorisi ve kullanılan hat.
- **Sırada / aranıyor / çalıyor / görüşmede / tamamlandı** ayrımı; çağrının başladığından ve cevaplandığından beri geçen saniyeler.
- Başlama, açılma, tuşlama ve kapanma zamanı; çalma, görüşme ve toplam süre. Kapanan çağrıda canlı sayaç durur.
- **1'i tuşladı / 2'yi tuşladı / açtı ama tuşlamadı / yanıt yok / meşgul / hat hatası / durduruldu / sonuç doğrulanamadı** ayrı sonuçları.
- Kampanya ilerlemesi, bekleyen kişi sayısı, yanıt oranı, tuşlama oranı ve ölçülebilen görüşmelerin ortalama süresi. Kalan süre tahmini yalnız yeterli doğrulanmış veri varsa gösterilir; 10:00–18:00 sınırı hesaba katılır.
- Kampanya, tarih, hat ve sonuç filtreleri; ad/telefon araması; sayfalı geçmiş ve filtrelenmiş CSV indirme.
- Çağrı ayrıntısında olay sırası ve anlaşılır kapanma nedeni. Teknik sırlar ve ham santral çıktısı görünmez.
- Son güncelleme zamanı; bağlantı kesilirse son veriler korunur ve **güncel değil** uyarısı görünür. Ekran arama başlatmaz veya duran kampanyayı yeniden başlatmaz.

## Verilerin doğruluğu
Mevcut kayıtlarda tuş ve gönderim zamanı var, ancak gerçek açılma/kapanma zamanları yok. `no_digit` tek başına kişinin telefonu açmadığını kanıtlamaz. Eski kayıtlarda bilinmeyen süre ve sonuç **Kaydedilmemiş / doğrulanamadı** olarak gösterilir; geriye dönük sahte süre veya cevaplanma bilgisi oluşturulmaz.

Yeni ayrıntılar yalnız santralden doğrulanmış olaylarla kaydedilir. Ses kaydı veya konuşma metni alınmaz. Test aramaları ayrı etiketlenir; gerçek danışan istatistikleriyle karıştırılmaz. 1/2'ye basınca yalnız uygun kaynak kategorisindeki kayıt ilgili karta taşınmaya devam eder.

## Teknik uygulama
1. Yeni salt okunur istatistik ekranı ve ortak sonuç/süre hesaplamaları; ayrı sunucu istatistik işlemi yalnız doğrulanmış yöneticiye izin verir. Sunucu tarafında filtreleme/sayfalama ve tüm kampanyayı kapsayan toplamlar kullanılır; 1000 kayıt kesilmez.
2. Mevcut çağrı tablosuna ek zaman/hat/kapanma alanları ve tekilleştirilmiş olay kayıtları için küçük, eklemeli migration hazırlanır. Açık yetki verilmez; mevcut kayıtlar ve personel erişimi değişmez, yeni ayrıntı erişimi yöneticiyle sınırlandırılır.
3. FreePBX sunucusunda yerel AMI olaylarını **yalnız okuyabilen**, çağrı kimliğini taşıyan ve yalnız bu IVR çağrılarını izleyen yardımcı hazırlanır. Arama yetkisi verilmez. Çalma, cevaplanma ve son kanal kapanışı ilişkilendirilir; Local kanalın ilk kapanışı görüşmenin bittiği sanılmaz.
4. Çağrıya bağlı imzalı olay alımı, tekrar/sıra dışı olaylara dayanıklı güncelleme ve ilk geçerli tuşu koruma uygulanır. Tuşlama görüşmenin bittiği sayılmaz. Hata/boş veri cevaplanmış çağrıya dönüştürülmez.
5. Ekran görünürken yaklaşık 5 saniyede bir güncellenir; sekme gizlenince sorgulama durur, tekrar açılınca yenilenir. Kapanan ekranın sayaçları ve sorguları temizlenir.

## Kontrol ve yayın
- Sentetik çağrılarla yanıt yok, meşgul, 1/2, tuşlamadan kapanma, aynı olayın tekrarı, gecikmiş olay, iki hat, bağlantı kaybı ve geçmiş eksik bilgi kontrolleri.
- Yönetici dışı erişim reddi; 1600'den fazla kayıt için toplam/sayfalama doğruluğu; bilgisayar ve telefonda filtre → detay → geri dönüş kontrolü.
- Gerçek kişilere deneme araması başlatılmaz. Mevcut arama saatleri, iki hat kapasitesi ve 24 saat kuralı değişmez. Önceki hızlandırma önerisi bu pakette uygulanmaz.
- **Bu planın onayı ekranın ve yerel testlerin hazırlanması içindir.** Canlı migration ve arama hizmeti değişiklikleri sonuçlarıyla ayrıca onaya sunulur. FreePBX yardımcısının Hostinger'a kurulması gerekir; kurulum doğrulanmadan anlık santral bilgileri hazır gösterilmez.
- Geri dönüşte yeni ekran/hizmet kapatılır ve santral yardımcısı durdurulur; eklenen kayıtlar ve geçmiş çağrılar silinmez.