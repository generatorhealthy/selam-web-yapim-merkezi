# KVKK Metinleri – Uyum Kontrolü ve Yayın Planı (12.11.2026)
Durum: Üç metin taslak olarak hazır, yayında değil. Mevcut /aydinlatma-metni ve /acik-riza sayfaları, sözleşme kutuları, ödeme ve geçmiş onaylar değişmedi.

## Hazırlananlar
- Taslak önizleme (yalnız editör önizlemesinde açılır, canlı sitede "bulunamadı" gösterir, arama motorlarına kapalı): /kvkk-taslak/aydinlatma-metni, /kvkk-taslak/cagri-merkezi, /kvkk-taslak/acik-riza
- Metinler sizin gönderdiğiniz sürümlerle birebir aynı; SHA-256 özetleriyle sürüm kaydı tutuldu.
- Yayındaki eski metinlerin birebir kopyaları tarih ve SHA-256 ile arşivlendi.

## Metinlerle gerçek sistem arasındaki uyuşmazlıklar (öncelik sırasıyla)
1. KRİTİK – Yapay zekâ telefon asistanı kendini gizliyor. Asistan talimatında "Asla yapay zekâyım deme, bot olduğun anlaşılmamalı" yazıyor. Çağrı merkezi metni ise görüşme başında yapay zekâ bilgilendirmesi yapıldığını söylüyor. Asistan şu an kapalı (ayarlarda devre dışı). Açılmadan önce talimat düzeltilmeli. Görüşme başında KVKK anonsu da şu an okunmuyor.
2. KRİTİK – Klasik çağrılarda ses kaydı tutulmadığı doğrulanamadı. Santral yönetim aracında tüm çağrıları kalıcı ses dosyası olarak kaydeden (sunucuda /var/spool/asterisk/monitor) bir özellik ve kayıt dosyası indirme işlevi var; yönetim panelindeki çağrı istatistikleri de kayıt dosyası alanını okuyor. Kaydın şu an açık olup olmadığı ve sunucuda dosya bulunup bulunmadığı santral sunucusunda kontrol edilmeli. Bu doğrulanmadan "kalıcı ses kaydı tutulmuyor" yazılmamalı (taslak metin bunu kesin olarak yazmıyor, doğru).
3. YÜKSEK – Sağlık verisi toplanan formlarda hiç onay mekanizması yok. Psikolojik test ekranı (test cevapları), randevu formu (danışmanlık konusu, not) ve randevu sayfasında aydınlatma bağlantısı ve ayrı açık rıza kutusu bulunmuyor. Bu akışlar şu an KVKK m.6 şartı belgelenmeden sağlık verisi topluyor.
4. YÜKSEK – Onay kayıtları yalnız mobil uygulama kaydında tutuluyor (57 kayıt; tür, sürüm, belge özeti, IP, tarih). Web uzman kaydı, randevu ve test akışları onay kaydı yazmıyor. Eski kayıtlar için geriye dönük onay oluşturulmamalı.
5. YÜKSEK – Yurt dışı aktarım mekanizması belgelenmemiş. Supabase (Frankfurt), Brevo, OpenAI (ses → metin ve yanıt), Meta (WhatsApp, reklam), Google (Analytics, Ads), Railway, ScrapingBee (SMS aracı). Metin bunu doğru biçimde "hukuki inceleme bekliyor" çerçevesinde anlatıyor.
6. ORTA – Otomatik silme yok. Randevu, test sonucu, yapay zekâ görüşme dökümü (34 görüşme, Temmuz 2026'dan beri), WhatsApp bot dökümleri ve sistem kayıtları için zamanlanmış silme işi bulunmuyor; yalnız veritabanı yedekleri 3 günde bir dönüyor. Metin süre vermediği için şu an yanıltıcı değil.
7. ORTA – Yapay zekâ ses işleme: canlı konuşma OpenAI'ye anlık gönderiliyor ve metne çevriliyor; döküm veritabanında saklanıyor. Bizim tarafımızda ses dosyası saklanmıyor. OpenAI tarafındaki saklama ayarı doğrulanamadı.
8. DÜŞÜK – Site altbilgisinde Aydınlatma ve Açık Rıza bağlantıları yok (çerez bandında var). Açık Rıza metnindeki "çerez yönetim mekanizması" ifadesi doğru (çerez bandı mevcut).
9. DOĞRU – Randevu bildirimlerinde sağlık açıklaması gönderilmiyor (Aşama 4) ve sistem kayıtlarında kişisel veri maskeleniyor (Aşama 5); metindeki ilgili ifadeler gerçekle uyumlu.

## Eksik hukuki işlemler (sizin/avukatın)
- Supabase, Brevo, OpenAI, Meta, Google, Railway için m.9 mekanizması (standart sözleşme ve Kurum'a bildirim)
- Sağlık verisi için faaliyet bazında m.6 şartı (test, randevu notu, AI görüşmesi)
- VERBİS kayıt yükümlülüğü ve KEP adresi
- Veri kategorisi bazlı saklama ve imha takvimi
- Klasik çağrı ses kaydının fiilî durumu (santral)
- Çağrı başı sesli bilgilendirme metninin onayı

## Önerilen sesli bilgilendirme (telefon akışı değiştirilmedi)
"Merhaba, Doktorum Ol'dan arıyoruz. Bu görüşme yapay zekâ destekli bir asistanla yapılmaktadır ve görüşmenin yazılı dökümü kayıt altına alınabilir. Kişisel verilerinize ilişkin aydınlatma metnine doktorumol.com.tr/aydinlatma-metni adresinden ulaşabilirsiniz. Lütfen sağlık durumunuza ilişkin ayrıntı paylaşmayınız."

## Yayın planı (her adım ayrı onayla)
1. Hukuki onay → taslak metinler /aydinlatma-metni, /acik-riza ve çağrı merkezi bölümüne alınır; eski sürüm arşivde kalır, sürüm numarası ve tarih sayfada görünür.
2. Altbilgiye üç bağlantı eklenir.
3. Test, randevu ve kayıt ekranlarına aydınlatma bağlantısı + işaretlenmemiş, ayrı açık rıza kutuları eklenir; onay, metin sürümü ve belge özetiyle mevcut onay kayıt tablosuna yazılır. Rıza verilmezse: randevu genel bilgilerle alınır, sağlık açıklaması alanı ve test gönderimi kapalı kalır. Sözleşme kutuları ve ödeme değişmez.
4. Yapay zekâ asistanı talimatı ve sesli bilgilendirme düzeltilir (asistan açılmadan önce).
5. Saklama takvimi onaylanınca otomatik silme işleri ayrı onayla kurulur.
