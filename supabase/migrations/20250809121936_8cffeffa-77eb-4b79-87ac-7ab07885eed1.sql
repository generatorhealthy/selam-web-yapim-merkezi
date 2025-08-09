-- Create remaining blog posts that don't exist yet
INSERT INTO public.blog_posts (
  title, content, slug, seo_title, seo_description, 
  author_name, author_type, status, created_at
) VALUES 
(
  'Cilt Muayenesi Nasıl Yapılır?',
  '<h2>Cilt Muayenesi: Adım Adım Rehber</h2>

<p>Cilt muayenesi, cilt kanseri erken teşhisi ve genel cilt sağlığı açısından hayati önem taşır. Doğru muayene teknikleri ve dikkat edilmesi gereken noktalar hakkında bilgi sahibi olmak önemlidir.</p>

<h3>Muayene Öncesi Hazırlık</h3>
<p>Cilt muayenesi öncesi makyaj temizlenmeli, takılar çıkarılmalı ve vücut tamamen incelenebilecek şekilde hazırlanmalıdır. İyi aydınlatma altında ve uygun dermatoskop ile muayene yapılmalıdır.</p>

<h3>Sistematik İnceleme</h3>
<p>Muayene saç derisi, yüz, boyun, gövde, kollar, bacaklar ve ayaklar dahil tüm vücut yüzeyini kapsamalıdır. Her bölge dikkatli bir şekilde incelenmeli ve şüpheli lezyonlar not edilmelidir.</p>

<h3>ABCDE Kuralı</h3>
<p>Benler için ABCDE kuralı uygulanır: Asimetri, Bordür düzensizliği, Color (renk değişikliği), Diameter (çap 6mm üzeri), Evolving (değişim). Bu kriterlere uyan benler şüpheli kabul edilir.</p>

<h3>Dermatoskopi İncelemesi</h3>
<p>Dermatoskop ile lezyonların detaylı yapısı incelenir. Pigment ağları, noktalar, çizgiler ve renksel özellikler değerlendirilir. Bu inceleme tanı doğruluğunu artırır.</p>

<h3>Fotoğraflama ve Dokümantasyon</h3>
<p>Şüpheli lezyonlar fotoğraflanmalı ve harita üzerinde işaretlenmelidir. Bu kayıtlar takip muayenelerinde karşılaştırma imkanı sağlar ve değişimlerin tespitini kolaylaştırır.</p>

<h3>Risk Faktörlerinin Değerlendirilmesi</h3>
<p>Aile öyküsü, güneş maruziyeti, cilt tipi, immunsupresyon ve önceki cilt kanseri öyküsü risk faktörleri olarak değerlendirilir. Yüksek riskli hastalar daha sık takip edilir.</p>

<h3>Biyopsi Kararı</h3>
<p>Şüpheli lezyonlar için biyopsi planlanır. Eksisyonel veya insisyonel biyopsi seçimi lezyonun büyüklüğü ve lokalizasyonuna göre belirlenir. Güvenlik sınırları dikkate alınır.</p>

<h3>Hasta Eğitimi</h3>
<p>Hastaya kendi cilt kontrolü yapma konusunda eğitim verilir. Değişen benler, yeni çıkan lezyonlar ve dikkat edilmesi gereken belirtiler anlatılır.</p>

<h3>Takip Programı</h3>
<p>Risk faktörlerine göre 3-12 aylık takip programları düzenlenir. Yüksek riskli hastalar daha sık, düşük riskli hastalar daha uzun aralıklarla kontrol edilir.</p>

<p>Cilt muayenesi sistemli yaklaşım gerektirir. Erken teşhis hayat kurtarıcıdır ve düzenli kontroller cilt sağlığını korumak için şarttır.</p>',
  'cilt-muayenesi-nasil-yapilir',
  'Cilt Muayenesi Nasıl Yapılır? | Dermatoloji Rehberi',
  'Cilt muayenesi teknikleri, ABCDE kuralı, dermatoskopi incelemesi ve erken tanı yöntemleri. Cilt kanseri taraması için uzman rehberi.',
  'Dr. Uzman', 'specialist', 'published', NOW()
),
(
  'Vajinal Ultrason Aleti Kaç Cm?',
  '<h2>Vajinal Ultrason Probu: Teknik Özellikler ve Uygulama</h2>

<p>Vajinal ultrason muayenesi, jinekolojik tanı ve takiplerde sıklıkla kullanılan güvenli bir görüntüleme yöntemidir. Kullanılan probun özellikleri ve uygulama detayları hakkında bilgi sahibi olmak önemlidir.</p>

<h3>Vajinal Prob Özellikleri</h3>
<p>Vajinal ultrason probu genellikle 2-3 cm çapında ve 15-20 cm uzunluğundadır. Prob ucu anatomik yapıya uygun olarak tasarlanmış ve yumuşak malzemeden yapılmıştır. Steril kılıf ile korunarak hijyen sağlanır.</p>

<h3>Uygulama Tekniği</h3>
<p>Prob yaklaşık 5-8 cm derinliğe yerleştirilir. Bu derinlik çoğu hasta için konforlu ve güvenlidir. Uygulama sırasında hasta rahat pozisyonda olmalı ve gerektiğinde pozisyon ayarlamaları yapılmalıdır.</p>

<h3>Güvenlik Önlemleri</h3>
<p>Her hasta için yeni steril kılıf kullanılır. Prob yüzeyi düzgün ve keskin kenarları olmayacak şekilde tasarlanmıştır. Uygulama öncesi hasta bilgilendirilir ve rızası alınır.</p>

<h3>Hangi Durumlar İçin Kullanılır?</h3>
<p>Rahim ve yumurtalık değerlendirmesi, gebelik takibi, kist ve miyom tanısı, endometrium kalınlığı ölçümü gibi durumlarda tercih edilir. Abdominal ultrasona göre daha net görüntü sağlar.</p>

<h3>Hasta Konforu</h3>
<p>Modern vajinal problar hasta konforunu maksimize edecek şekilde tasarlanmıştır. Uygun jel kullanımı ve nazik uygulama ile rahatsızlık minimize edilir. İşlem genellikle ağrısızdır.</p>

<h3>Muayene Süresi</h3>
<p>Vajinal ultrason muayenesi genellikle 10-15 dakika sürer. Bu süre incelenen organ ve bulguların karmaşıklığına göre değişebilir. Acele edilmeden detaylı inceleme yapılır.</p>

<h3>Yaş ve Durum Kısıtlamaları</h3>
<p>Vajinal ultrason genellikle cinsel olarak aktif kadınlarda uygulanır. Bekaret zarı bütünlüğünün korunması gereken durumlarda abdominal ultrason tercih edilir.</p>

<h3>Uygulama Sonrası</h3>
<p>İşlem sonrası herhangi bir özel bakım gerekmez. Hastalar normal aktivitelerine devam edebilir. Nadir de olsa hafif kanama veya rahatsızlık olabilir.</p>

<h3>Teknolojik Gelişmeler</h3>
<p>Yeni nesil problar daha ince ve ergonomik tasarımla hasta konforunu artırır. 3D ve 4D görüntüleme teknolojileri de vajinal proplarda kullanılmaktadır.</p>

<p>Vajinal ultrason güvenli ve etkili bir tanı yöntemidir. Modern ekipmanlar hasta konforunu önceleyerek doğru tanı koymaya odaklanır.</p>',
  'vajinal-ultrason-aleti-kac-cm',
  'Vajinal Ultrason Aleti Kaç Cm? | Jinekoloji',
  'Vajinal ultrason probu özellikleri, boyutları ve uygulama tekniği. Güvenlik önlemleri ve hasta konforu hakkında uzman bilgisi.',
  'Dr. Uzman', 'specialist', 'published', NOW()
),
(
  'Hangi Benler Lazerle Alınmaz?',
  '<h2>Lazer İle Ben Alımında Kontrendikasyonlar</h2>

<p>Lazer ile ben alımı popüler bir yöntem olmasına rağmen, her ben lazer ile alınamaz. Hangi durumların lazer için uygun olmadığını bilmek hem güvenlik hem de etkinlik açısından kritiktir.</p>

<h3>Şüpheli ve Atipik Benler</h3>
<p>Malignite şüphesi olan benler lazerle alınmamalıdır. ABCDE kriterlerine uyan, asimetrik, düzensiz kenarlı, renk değişikliği gösteren benler cerrahi eksizyon gerektirir. Patolojik inceleme için doku korunmalıdır.</p>

<h3>Büyük Boyutlu Benler</h3>
<p>6-8 mm''den büyük benler lazer için uygun değildir. Büyük benler genellikle derinde köklü olduğundan, lazer yeterli derinliğe ulaşamayabilir. Bu durumda cerrahi eksizyon tercih edilir.</p>

<h3>Derin Kökli Benler</h3>
<p>Dermis derinliklerine uzanan benler lazer ile tam olarak çıkarılamaz. Bu tip benler için dermatoskopik değerlendirme önemlidir. Yüzeysel benler lazer için uygundur.</p>

<h3>Melanom Öyküsü Olan Hastalar</h3>
<p>Kişisel veya aile melanom öyküsü olan hastalarda tüm benler patolojik inceleme için cerrahi olarak alınmalıdır. Bu hastalar yüksek risk grubunda kabul edilir.</p>

<h3>İmmünsuprese Hastalar</h3>
<p>Bağışıklık sistemi baskılanmış hastalarda cilt kanseri riski yüksektir. Bu hastalarda lazer yerine cerrahi eksizyon ve patolojik inceleme tercih edilmelidir.</p>

<h3>Lokalizasyon Kısıtlamaları</h3>
<p>Göz kapakları, dudak kenarı, genital bölge gibi hassas alanlardaki benler lazer için uygun olmayabilir. Bu bölgelerde daha kontrollü yöntemler tercih edilir.</p>

<h3>Pigmentli Benler</h3>
<p>Yoğun pigmente benler lazer enerji absorpsiyonu nedeniyle daha fazla hasar riski taşır. Bu durumda daha düşük enerji seviyelerinde veya alternatif yöntemler kullanılır.</p>

<h3>Konjenital Nevüsler</h3>
<p>Doğuştan büyük nevüsler (>20 cm) malignite riski taşır ve lazer ile alınmamalıdır. Bu lezyonlar cerrahi planlamayla greft veya flep tekniklerle tedavi edilir.</p>

<h3>Dysplastik Nevüsler</h3>
<p>Displastik özellik gösteren benler potansiyel malignite riski taşır. Bu benler mutlaka histopatolojik inceleme gerektirir ve cerrahi eksizyon tercih edilir.</p>

<p>Lazer ben alımı için uygun seçim kritik öneme sahiptir. Şüpheli durumlarda mutlaka patolojik inceleme yapılmalı ve hasta güvenliği öncelenmelidir.</p>',
  'hangi-benler-lazerle-alinmaz',
  'Hangi Benler Lazerle Alınmaz? | Dermatoloji',
  'Lazer ben alımı kontrendikasyonları, şüpheli benler ve cerrahi eksizyon gerektiren durumlar. Güvenli ben alımı için uzman rehberi.',
  'Dr. Uzman', 'specialist', 'published', NOW()
),
(
  'Böbrek Taşı Düşürme Egzersizleri ve Etkili Yöntemleri',
  '<h2>Böbrek Taşı Düşürme: Doğal Yöntemler ve Egzersizler</h2>

<p>Böbrek taşları üriner sistemde oluşan kristal birikimlerdir. Küçük taşlar doğal yöntemler ve egzersizlerle düşürülebilir. Ancak büyük taşlar için mutlaka tıbbi müdahale gereklidir.</p>

<h3>Su Tüketimini Artırma</h3>
<p>Günlük 2-3 litre su içmek böbrek taşı düşürmenin en etkili yöntemidir. Bol su idrarda taşı seyrelterek hareket ettirir. Özellikle citrus meyve suları (limon, greyfurt) etkilidir.</p>

<h3>Sıçrama Egzersizleri</h3>
<p>Hafif sıçrama hareketleri böbrekteki taşın hareket etmesini sağlar. Günde 3-4 defa 2-3 dakika sıçrama yapılabilir. Ancak ağrı varsa bu egzersiz yapılmamalıdır.</p>

<h3>Yürüyüş ve Hafif Koşu</h3>
<p>Düzenli yürüyüş böbrek ve üreter kaslarının çalışmasını destekler. Günde 30-45 dakika yürüyüş taş düşürme sürecini hızlandırabilir. Şiddetli egzersizden kaçınılmalıdır.</p>

<h3>Isıtma Uygulamaları</h3>
<p>Sıcak banyo veya sıcak su torbası üreter kaslarını gevşetir. Bu sayede taşın geçişi kolaylaşır. Günde 2-3 defa 15-20 dakika ısı uygulaması yararlıdır.</p>

<h3>Beslenme Değişiklikleri</h3>
<p>Oksalat içeren gıdalardan (ıspanak, fındık, çikolata) kaçınılmalıdır. Kalsiyum alımı normal seviyede tutulmalı, aşırı protein tüketiminden uzak durulmalıdır.</p>

<h3>Alfa Bloker İlaçlar</h3>
<p>Doktor önerisiyle alfa bloker ilaçlar üreter kaslarını gevşeterek taş geçişini kolaylaştırır. Bu ilaçlar özellikle alt üreter taşlarında etkilidir.</p>

<h3>Pozisyon Değişiklikleri</h3>
<p>Taş lokalizasyonuna göre belirli pozisyonlar alabiliriz. Sağ böbrek taşında sağ yan yatış, sol böbrek taşında sol yan yatış pozisyonu taş hareketini destekleyebilir.</p>

<h3>Masaj Teknikleri</h3>
<p>Böbrek bölgesine hafif masaj uygulanabilir. Ağrılı bölgelere sert basınç uygulamaktan kaçınılmalı, nazik dairesel hareketler tercih edilmelidir.</p>

<h3>Ağrı Yönetimi</h3>
<p>Ağrı kesici ilaçlar doktor kontrolünde kullanılmalıdır. Şiddetli ağrı durumunda derhal hastaneye başvurulmalıdır. Ateş ve bulantı varlığında acil müdahale gerekir.</p>

<p>Böbrek taşı düşürme yöntemleri küçük taşlar için etkilidir. 5mm''den büyük taşlar ve şiddetli semptomlar varlığında mutlaka doktor kontrolü gereklidir.</p>',
  'bobrek-tasi-dusurme-egzersizleri-ve-etkili-yontemleri',
  'Böbrek Taşı Düşürme Egzersizleri ve Etkili Yöntemleri',
  'Böbrek taşı düşürme için doğal yöntemler, egzersizler ve beslenme önerileri. Taş düşürme sürecini destekleyici uygulamalar.',
  'Dr. Uzman', 'specialist', 'published', NOW()
),
(
  'Stres Alerjiye Sebep Olur Mu?',
  '<h2>Stres ve Alerji İlişkisi: Bilimsel Yaklaşım</h2>

<p>Stres ve alerji arasındaki ilişki bilimsel olarak kanıtlanmış kompleks bir konudur. Psikolojik stres bağışıklık sistemini etkileyerek alerjik reaksiyonları tetikleyebilir veya şiddetlendirebilir.</p>

<h3>Stres-Bağışıklık Sistemi İlişkisi</h3>
<p>Kronik stres kortizol hormon seviyelerini artırır. Bu durum bağışıklık sisteminin dengesini bozarak alerjik reaksiyonlara yatkınlığı artırır. Stres altında histamin salınımı da artar.</p>

<h3>Alerji Türleri ve Stres</h3>
<p>Cilt alerjileri (egzama, ürtiker), astım ve gıda alerjileri stresden en çok etkilenen alerji türleridir. Özellikle atopik dermatit stresle doğrudan ilişkilidir.</p>

<h3>Stres Hormontları</h3>
<p>Kortizol, adrenalin ve noradrenalin gibi stres hormonları mast hücrelerini aktive eder. Bu aktivasyon histamin, lökotrienler ve diğer alerjik medyatörlerin salınımını tetikler.</p>

<h3>Nörojen İnflamasyon</h3>
<p>Stres sinir sistemini etkileyerek nörojen inflamasyona neden olur. Bu süreç cilt alerjilerini tetikler ve mevcut alerjik reaksiyonları şiddetlendirir.</p>

<h3>Psikoneuroimmunoloji</h3>
<p>Beyin-bağışıklık sistemi etkileşimi stres-alerji ilişkisini açıklar. Psikolojik faktörler fizyolojik yanıtları direkt etkileyerek alerjik semptomları modüle eder.</p>

<h3>Kısır Döngü Etkisi</h3>
<p>Alerjik semptomlar kişide strese neden olur, stres de alerjik reaksiyonları şiddetlendirir. Bu kısır döngü tedaviyi zorlaştırır ve semptomları kronikleştirir.</p>

<h3>Stres Yönetimi Teknikleri</h3>
<p>Meditasyon, nefes egzersizleri, yoga ve düzenli egzersiz stres seviyelerini azaltır. Bu teknikler alerjik semptomların şiddetini ve sıklığını azaltabilir.</p>

<h3>Yaşam Tarzı Faktörleri</h3>
<p>Düzenli uyku, sağlıklı beslenme ve sosyal destek stres yönetimine katkıda bulunur. Bu faktörler alerjik reaksiyonları kontrol altında tutmaya yardımcı olur.</p>

<h3>Tedavi Yaklaşımları</h3>
<p>Alerji tedavisinde stres yönetimi de dahil edilmelidir. Antihistaminikler ve kortikosteroidlerle birlikte stres azaltıcı yaklaşımlar kullanılabilir.</p>

<p>Stres alerjiye hem sebep olabilir hem de mevcut alerjileri şiddetlendirebilir. Bütüncül tedavi yaklaşımı hem alerjik semptomları hem de stresi kontrol altına almalıdır.</p>',
  'stres-alerjiye-sebep-olur-mu',
  'Stres Alerjiye Sebep Olur Mu? | İmmünoloji',
  'Stres ve alerji arasındaki bilimsel ilişki, bağışıklık sistemi üzerindeki etkileri ve stres yönetimi teknikleri hakkında uzman görüşleri.',
  'Dr. Uzman', 'specialist', 'published', NOW()
)