# Açmayan danışanlar için toplu otomatik arama (1 / 2 tuşlama)

## Nasıl çalışacak
1. Danışan Yönlendirme Sistemi'nde **Açmayanlar** kartının üstüne **"Toplu Otomatik Ara"** düğmesi gelir. Siz basmadan hiçbir arama başlamaz.
2. Basınca önce bir onay penceresi açılır: kaç kişi aranacak, hangi numaradan, tahmini süre. Onaylarsanız sıra başlar.
3. Aramalar **aynı anda değil, sırayla** yapılır (aynı anda en fazla 2 arama, aramalar arasında birkaç saniye ara) — hem hat dolmaz hem spam riskini azaltır.
4. Yalnız **09:30–20:00** arası arar; bu saat dışında sıra durur, ertesi gün devam eder. Bir danışan aynı kampanyada en fazla 1 kez aranır.
5. Danışan açarsa, başvurduğu alana göre şu konuşma çalınır:
   > "Merhaba, **Çift Terapisi** için Doktorum Ol'a başvurmuşsunuz. Sizi en kısa sürede tekrar arayıp uzmanımıza aktaracağız. Aranmak istiyorsanız 1'i, aranmak istemiyorsanız 2'yi tuşlayın."
   Alan adı her danışanın başvurusuna göre değişir: Bireysel Terapi, Çocuk Terapisi, Aile Danışmanlığı, İlişki Danışmanlığı, Çift Terapisi. Tuşlama gelmezse mesaj bir kez tekrarlanır.
6. Sonuçlar ekranda:
   - **1'i Tuşlayanlar** ve **2'yi Tuşlayanlar** adında iki yeni kart, "Tekrar Başvuru Sağlayanlar"ın yanına gelir. Danışan Açmayanlar'dan çıkıp tuşladığı karta geçer.
   - Yine açmayan veya tuşlamadan kapatanlar Açmayanlar'da kalır; kartında "Otomatik arandı – açmadı" ve saat görünür.
7. 1'i tuşlayanlarda kartta alana göre hangi uzman grubunun bakacağı da yazar:
   - Bireysel Terapi, Çocuk Terapisi → Psikolog, Psikolojik Danışman, Klinik Psikolog
   - Çift Terapisi, Aile Danışmanlığı → Aile Danışmanı
   - İlişki Danışmanlığı → (hangi gruba gideceğini sizden teyit edeceğim)

## Ses kalitesi — neden bu sefer iyi olacak
Önceki denemede yapay zeka canlı konuşmaya çalıştığı için ses bozuk ve kontrolsüzdü. Bu sefer **canlı sohbet yok**:
- Beş alan için beş mesaj, **ElevenLabs'in en doğal Türkçe sesiyle bir kez kaydedilir** (gerçek insan gibi, net). Size dinletirim, beğenmezseniz ses/tonu değiştiririz.
- Arama sırasında bu hazır kayıt çalınır, sadece tuş dinlenir. Böylece ses her aramada aynı kalitede olur, takılma/gecikme olmaz.

## Hangi numaradan arayacak
- **0216 706 06 11 (Verimor sabit hattı)**. Otomatik arama ve tuş algılama Verimor'un kendi otomatik arama hizmetiyle yapılır; sistemde bunun için hazır bir bağlantı zaten var.
- 80/81 FCT cep hatları (0533 582 22 75, 0531 789 38 80) bu iş için uygun değil: dışarıdan otomatik tuş algılamayı desteklemiyorlar ve 19 saniyede kapanma sorunu sürüyor.
- **Dikkat:** Bugün Verimor bu hattaki giden aramaları reddediyordu (IP izni istediler). Bu çözülmeden toplu arama başlayamaz; önce tek bir deneme aramasıyla kontrol edeceğim.

## Hukuki not (KVKK / ticari arama)
- Mesaj sadece kişinin kendi başvurusuna dönüş yapıyor, satış/reklam içermiyor. Yine de 2'yi tuşlayan kişi bir daha **otomatik aranmaz**.
- Mesajda sağlık detayı yok, sadece başvurulan hizmet adı geçiyor. Tuş sonucu ve arama saati dışında ses kaydı tutulmaz.

## Sizden lazım olanlar
- ElevenLabs bağlantısı (bağlantı kartı açacağım, anahtarı sohbete yazmayın).
- Verimor'un IP iznini tamamlaması.
- İlişki Danışmanlığı'nın hangi uzman grubuna gideceği.
- Kadın mı erkek mi ses istediğiniz (dinletip seçtireceğim).

## Uygulama sırası
1. Beş mesajı ElevenLabs ile üretip size dinletmek.
2. Yeni kartlar, Toplu Otomatik Ara düğmesi ve onay penceresi.
3. Sıralı arama motoru (saat sınırı, tek arama kuralı, durdurma düğmesi).
4. Verimor'dan tuş sonucunu alıp danışanı doğru karta taşımak.
5. Önce sizin numaranıza 1 deneme araması; sonra 5 kişilik küçük deneme; ardından tüm 318 kişi.

## Teknik detay
- `danisan_basvurulari` için yeni durumlar: `ivr_pressed_1`, `ivr_pressed_2`; yeni tablo `lead_ivr_campaigns` + `lead_ivr_calls` (lead_id+campaign unique, sonuç, tuş, zaman) — tek arama garantisi ve tekrar çalıştırmada atlama.
- Ses dosyaları ElevenLabs TTS (eleven_multilingual_v2) ile bir kez üretilip Verimor'a anons olarak yüklenir; canlı TTS yok.
- `verimor-auto-call` genişletilir: kampanya kilidi (lease), parti başına sınır, 402/403/hata durumunda kampanyayı duraklatma; Verimor DTMF callback'i ayrı bir Edge Function'a düşer ve imza/parametre doğrular.
- Mevcut `ai-call-control` "yeni arama yok" kuralı sağlık içerikli yapay zeka görüşmeleri içindir; bu akış görüşme içeriği toplamadığı için ayrı tutulur ve ona dokunulmaz.
