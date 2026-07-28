## Amaç

Danışan Yönlendirme Sistemi'ne gelen danışanları, gerçekçi Türkçe konuşan bir yapay zekâ (OpenAI Realtime "ChatGPT sesli mod") telefonla arayacak, danışanı doğru uzmana FreePBX üzerinden aktaracak ve tüm sonuçları otomatik olarak sisteme işleyecek. Kurulum tamamlanacak, ancak **otomatik başlatma kapalı** kalacak; siz "Başlat" diyene kadar hiçbir arama yapılmayacak.

## Mimari

```text
pg_cron (her 1 dk)
   -> call-scheduler (kimi, ne zaman aramalı?)
        -> ai-call-originate  --(AMI/ARI)-->  FreePBX
                                                 |
                                    Asterisk Dialplan + AudioSocket
                                                 |
                                    ai-voice-bridge (WebSocket)
                                     <--> OpenAI Realtime API (ses)
                                                 |
                          Araç çağrıları (tool calls) -> Supabase
                                                 |
                             Aktarım: *1<dahili>  -> Uzman telefonu
```

Konuşma bitince `call-postprocess` sonucu işler: danışan notu, statü, client_referrals kaydı.

## Yapılacaklar

### 1. Veritabanı
- `ai_call_sessions`: her arama denemesi (lead_id, hat 80/81, başlangıç/bitiş, sonuç, transkript, aktarılan uzman, hata).
- `ai_call_queue`: sıradaki aramalar (lead_id, planlanan saat, deneme sayısı, öncelik, durum).
- `ai_call_settings`: **tek satırlık kontrol paneli** — `enabled` (varsayılan `false`), çalışma saatleri (10:00–19:00 İstanbul), açmayanlar penceresi (10:00–12:00), yeni gelenler (12:00 sonrası), günlük maksimum 2 deneme, tekrar arama aralığı (2–3 saat), hat rotasyonu ayarları.
- `danisan_basvurulari` üzerine: `next_call_at`, `preferred_call_time`, `daily_call_count`, `last_call_date`.

### 2. Uzman seçim motoru (mevcut `auto-call-router` mantığı üretime alınır)
- Danışan takvimindeki sıralama birebir korunur: önce **Acil Yönlendirme Gerekli** (hiç yönlendirme yapılmayan en üstte), sonra son yönlendirmeden bu yana en çok gün geçen, sonra en az yönlendirme alan.
- Online başvuru: tüm uzmanlar aday, sırayla.
- Yüz yüze: önce aynı şehirdeki uygun uzman; şehirde uzman yoksa yapay zekâ online danışmanlığın avantajlarını anlatıp ikna eder, kabul ederse online sıradaki uzmana aktarır.
- Kategori eşleşmesi: Bireysel → Psikolog/Psikolojik Danışman/Klinik Psikolog, Aile/Çift/Çocuk → Aile Danışmanı.

### 3. Arama zamanlaması (İstanbul saati)
- 10:00–12:00 → "Açmayanlar" listesi sırayla.
- 12:00–19:00 → "Yeni Gelenler" + zamanı gelen tekrar aramalar.
- 19:00 sonrası ve 10:00 öncesi arama yok.
- "Daha Sonra Ara" diyen danışan bir saat belirtirse o saatte aranır.
- Bir danışan günde en fazla 2 kez aranır; açmazsa ertesi gün yine 2 kez, aktarılana kadar.

### 4. Hat yönetimi (80 / 81 prefix)
- Varsayılan hat 80. Aktarım başarılı olup danışan uzmanla görüşmeye başladığında 80 meşgul sayılır, sıradaki arama 81'den yapılır.
- 81'den de başarılı aktarım olursa 2–3 dakika bekleyip 80'den devam edilir.
- Danışan açmadıysa / istemediyse çağrı biter, aynı hattan devam edilir.
- Hat durumu `ai_call_settings` + `ai_call_sessions` üzerinden takip edilir.

### 5. Yapay zekâ konuşma akışı
- Ses: OpenAI Realtime API, doğal Türkçe kadın sesi, araya girilebilir (barge-in), robotik kalıplar yok.
- Açılış: Instagram/Facebook üzerinden başvuru yaptığını, hangi hizmeti (bireysel/çift/aile/çocuk terapisi) talep ettiğini hatırlatır.
- Senaryolar:
  - **Kabul** → uygun uzmana `*1<dahili>` ile aktarım.
  - **Yüz yüze / şehirde uzman yok** → online ikna, kabul ederse aktarım.
  - **İstemiyorum / yanlış başvuru** → hizmet hatırlatması, ısrar etmeden kapanış → *Yanlış Ulaşanlar*.
  - **Şu an müsait değilim** → "Gün içinde saat kaçta arayalım?" → o saate randevulu tekrar arama.
  - **Açmadı** → *Açmayanlar*, 2–3 saat sonra tekrar.

### 6. Arama sonrası otomatik işlemler
- Danışan notuna zaman damgalı kayıt: "14:20 arandı — Uzm. Psk. X'e aktarıldı" / "11:05 arandı, açılmadı" / "istemiyor, yanlış ulaşan".
- Statü otomatik güncellenir (Aktarıldı / Açmayanlar / Yanlış Ulaşanlar / Daha Sonra Ara).
- Başarılı aktarımda `client_referrals` kaydı oluşturulur: uzman, danışan adı-soyadı, iletişim, danışmanlık tipi (online / yüz yüze) — sayaç artar, Danışan Takvimi otomatik güncellenir.

### 7. Yönetim arayüzü (Danışan Yönlendirme Sistemi sayfası)
- **"Yapay Zekâ Arama Sistemi" paneli**: Açık/Kapalı ana şalter (kapalı gelir), çalışma saatleri, hat durumları (80/81), sıradaki aramalar, bugünkü istatistik.
- **Tek danışan test araması** butonu (siz onaylayana kadar sistemin tek kullanım yolu).
- Canlı arama kayıtları + transkript görüntüleme.

### 8. FreePBX sunucu tarafı (SSH ile uygulanacak, adım adım doküman verilecek)
- `res_audiosocket` / `app_audiosocket` modülünün etkinleştirilmesi.
- AI köprüsüne bağlanan özel dialplan context'i ve aktarım için `*1<dahili>` çağrısı.
- AMI kullanıcısı (originate için) + güvenlik ayarları.
- 80/81 prefix'li giden hat yönlendirmeleri.

## Teknik detaylar

- Yeni edge fonksiyonları: `ai-call-scheduler`, `ai-call-originate`, `ai-voice-bridge` (WebSocket, OpenAI Realtime ↔ AudioSocket PCM 8k/16k dönüşümü), `ai-call-postprocess`, `ai-call-control` (panel için).
- Gerekli secret: `OPENAI_API_KEY` (Realtime API erişimi olan hesap), `FREEPBX_AMI_*` bilgileri. Bunları kurulum sırasında sizden isteyeceğim.
- pg_cron görevi eklenecek fakat `ai_call_settings.enabled = false` olduğu sürece scheduler hiçbir arama üretmeyecek.
- Verimor'a bağlı hiçbir yeni kod yazılmaz; mevcut `verimor-auto-call` fonksiyonuna dokunulmaz.

## Kapsam dışı (şimdilik)
- Otomatik başlatma yapılmayacak; sistem hazır ama kapalı teslim edilecek.
- WhatsApp bilgilendirme akışları mevcut haliyle kalacak.
