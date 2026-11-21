# Toplu otomatik arama: FreePBX üzerinden

## Ne değişecek
Paneldeki pencere, düğmeler ve kartlar aynı kalıyor (Dinle, Beni ara, İlk 5 kişiyle dene, Hepsini ara, Durdur; 1'i ve 2'yi tuşlayanlar kartları). Sadece aramaları yapan taraf Bulutsantralim yerine sizin FreePBX santraliniz oluyor.

## Arama nasıl işleyecek
1. Kampanyayı başlattığınızda site, ElevenLabs kadın sesiyle hazırlanmış kayıtları bir kez santrale yükler.
2. Site, santrale "bu numarayı ara, şu alanın kaydını çal" komutunu tek tek gönderir. Aynı anda en fazla 2 arama yapılır, yalnız 09:30–20:00 arası aranır, son 24 saatte aranan kişi tekrar aranmaz.
3. Danışan açınca kayıt çalar. 1'e veya 2'ye basınca kısa bir teşekkür kaydı çalar ve santral sonucu siteye bildirir.
4. Site danışanı ilgili karta taşır. Açmayan, meşgul olan ya da tuşlamayan kişiler Açmayanlar'da kalır.
5. **Durdur**'a basınca bekleyen aramalar iptal edilir.

## Sizden gerekenler
- Aramaların hangi hattan çıkacağı. Varsayılan olarak 81 hattını (0531 789 38 80) kullanacağım, çünkü Verimor hattı şu an aramayı reddediyor.
- Santrale bir defalık yeni bir yardımcı dosya yüklenmesi. Daha önce dahili ve hat ayarları için yüklediğiniz dosyalar gibi; kurulumu adım adım tarif edeceğim.

## Bilinen sınırlar
- 81 hattında çağrılar yaklaşık 19 saniyede kendiliğinden kapanıyor. Bu çözülmezse bazı danışanlar mesajı sonuna kadar dinleyemez.
- Ses kaydı saklanmaz. Sadece tuşlama sonucu ve arama saatleri tutulur.

## Teknik detaylar
- Santrale yeni bir `freepbx-ivr.php` yüklenecek; mevcut `FREEPBX_BULK_SECRET` ile korunacak. Görevleri: ses dosyalarını `sounds/custom/doktorumol/` altına yazmak, `[doktorumol-ivr]` diyalplan bağlamını `extensions_custom.conf` içine eklemek (Playback → Read 1 hane, 2 deneme → teşekkür kaydı → CURL ile `lead-ivr-webhook`), aramaları Asterisk call file ya da AMI Originate ile `Local/81<numara>@from-internal` üzerinden başlatmak ve aktif kanal sayısını raporlamak.
- `lead-ivr-campaign` Verimor API yerine bu dosyayı kullanacak. Sıradaki aramalar dakikalık bir zamanlayıcıyla, aynı anda en fazla 2 arama olacak şekilde gönderilecek.
- `lead-ivr-webhook` hash'li kampanya anahtarı ve çağrı kimliğiyle sonucu kaydetmeye devam edecek. Danışan yalnız `no_answer` durumundan taşınır.
- Mevcut tablolar korunacak; yalnız santral tarafındaki çağrı kimliği için bir sütun eklenecek.
