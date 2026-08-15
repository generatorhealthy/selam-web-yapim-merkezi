# WhatsApp Yönlendirme Botu (Otomatik Arama Yerine)

Otomatik telefon aramasını tamamen devre dışı bırakıyoruz ve yerine WhatsApp üzerinden butonlu (interaktif) bir yönlendirme akışı kuruyoruz. Sistem **test modunda** başlar; onay verilene kadar kimseye mesaj gitmez.

## 1. Otomatik aramayı kapatma

- `ai_call_settings.enabled = false` yapılır ve panelden açılamaz hale getirilir (AI arama paneli "devre dışı" bilgisi gösterir).
- Danışan Takvimi / Danışan Yönlendirme ekranlarındaki otomatik arama tetikleyicileri (AI arama başlat, otomatik router çağrısı) kaldırılır. Manuel "Ara" butonu kalır — sadece personel isterse arar.
- `auto-call-router`, `ai-call-scheduler` fonksiyonlarındaki arama başlatma yolu kapatılır; router'ın **uzman seçim mantığı** korunur çünkü WhatsApp botu aynı mantığı kullanacak (`_shared/specialistPicker.ts`).
- Aramaya bağlı aktif cron yok, ek temizlik gerekmiyor.

## 2. Bot akışı (danışan tarafı)

Danışan başvurusu geldiğinde (`danisan_basvurulari` → yeni kayıt):

1. **Karşılama + onay mesajı** (mevcut hoş geldin mesajının devamı):
   - Başvurduğu konu (Bireysel Terapi / Çift Terapisi / Aile Danışmanlığı / Çocuk Terapisi / İlişki Danışmanlığı) ve talep tipi (online / yüz yüze) yazılır.
   - Görüşmelerin **ücretli** olduğu net şekilde belirtilir.
   - Butonlar: **Evet, uzmana aktarın** / **Şu an istemiyorum**
2. **Eksik bilgi varsa butonla sorulur**:
   - Görüşme şekli: **Online** / **Yüz yüze**
   - Yüz yüze seçildiyse şehir sorulur (metin cevabı).
3. **Yüz yüze + o şehirde uygun uzman yoksa**: kibar bilgilendirme + **Online görüşmeye geçelim** / **Vazgeçtim** butonları.
4. **Onay geldiğinde** uzman seçilir, danışan bilgilendirilir ("Uzmanımız X, gün içinde sizinle iletişime geçecek"), uzmana WhatsApp bilgilendirmesi gider ve `client_referrals` kaydı oluşur (mevcut yönlendirme akışıyla aynı).
5. **Ret / vazgeçme** durumunda başvuru "ilgilenmiyor" olarak işaretlenir, tekrar mesaj gönderilmez.

## 3. Uzman seçim kuralları (mevcut Danışan Takvimi mantığı)

- Branş filtresi:
  - **Bireysel Terapi, Çocuk Terapisi, Ergen Terapisi, İlişki Danışmanlığı** → Psikolog / Psikolojik Danışman / Klinik Psikolog
  - **Aile Danışmanlığı, Aile Terapisi, Çift Terapisi** → Aile Danışmanı
- Görüşme şekli filtresi: online talep → `online_consultation`, yüz yüze talep → `face_to_face_consultation` + şehir eşleşmesi.
- Sıralama: önce **acil yönlendirme gerekli** liste (hiç yönlendirme yapılmamış → en uzun süredir yapılmamış, 20+ gün), sonra **o dönem en az yönlendirme yapılmış** uzman.
- Danışan takviminde gizlenen uzmanlar (ör. dahili 1155) ve pasif uzmanlar hariç tutulur.

## 4. Teknik plan

**Veritabanı**
- `whatsapp_bot_sessions` tablosu: `lead_id`, `phone`, `state` (awaiting_consent / awaiting_mode / awaiting_city / awaiting_online_fallback / completed / declined), `context` (jsonb: therapy, mode, city, önerilen uzman), `last_message_at`, zaman damgaları. RLS: sadece admin/staff okur, service_role tam yetki.
- `danisan_basvurulari` üzerinde bot durumu için `bot_state` yerine yukarıdaki tablo kullanılır; sadece `status` güncellenir ("bot_bekliyor", "onayladi", "ilgilenmiyor").
- `whatsapp_bot_settings` tek satır: `enabled` (varsayılan **false** = test modu), `dry_run` (varsayılan **true**), mesaj şablonları.

**Edge Functions**
- `wa-bot-engine` (yeni): durum makinesi. Girdi = gelen mesaj/buton yanıtı veya "başlat" tetiği. Uzman seçimi için `_shared/specialistPicker.ts` kullanır. `dry_run` iken mesaj göndermez, sadece ne göndereceğini döner.
- `waha-webhook` (güncelleme): gelen mesajları arşivlemeye devam eder; ayrıca gönderen numara aktif bir bot oturumuna aitse `wa-bot-engine`'e iletir.
- `send-lead-welcome-whatsapp` (güncelleme): karşılama mesajından sonra bot oturumunu açar ve butonlu onay mesajını gönderir.
- Butonlar WAHA'nın interaktif mesaj desteği ile gönderilir; desteklenmeyen cihaz/sürüm için numaralı seçenek (1 / 2) fallback'i ve serbest metin eşleştirme (evet, hayır, online, yüz yüze) eklenir.

**Panel (admin)**
- Danışan Yönlendirme sayfasına "WhatsApp Bot" bölümü: bot açık/kapalı ve test modu anahtarı, oturum listesi (danışan, durum, son mesaj, seçilen uzman), "Simüle et" butonu (dry-run çıktısını gösterir).

## 5. Test ve devreye alma

- Kurulum sonrası bot `enabled = false`, `dry_run = true` ile durur.
- Panelden tek bir test numarasıyla deneme yapılır; akış doğrulanınca `dry_run` kapatılıp `enabled` açılır.
