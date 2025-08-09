-- Continue creating remaining blog posts
INSERT INTO public.blog_posts (
  title, content, slug, seo_title, seo_description, 
  author_name, author_type, status, created_at
) VALUES 
(
  'Psikiyatriste Her Şey Anlatılır Mı?',
  '<h2>Psikiyatri Seanslarında Açık İletişim ve Gizlilik</h2>

<p>Psikiyatri tedavisinin başarısı büyük ölçüde hasta-doktor arasındaki güven ilişkisine ve açık iletişime bağlıdır. Peki psikiyatriste her şey anlatılmalı mı? Bu konu hakkında detaylı bilgiye ihtiyaç vardır.</p>

<h3>Tıbbi Gizlilik Prensibi</h3>
<p>Psikiyatri seanslarında konuşulan her şey tıbbi gizlilik kapsamında korunur. Doktor-hasta mahremiyeti yasalarla güvence altındadır. Hasta rızası olmadan hiçbir bilgi üçüncü kişilerle paylaşılamaz.</p>

<h3>Tedavi Etkinliği</h3>
<p>Açık ve dürüst iletişim tedavi başarısını doğrudan etkiler. Saklanan önemli bilgiler yanlış tanı ve tedaviye neden olabilir. Psikiyatrist hastanın tüm hikayesini bilirse daha etkili tedavi planı yapabilir.</p>

<h3>Paylaşım Zorluklarının Nedenleri</h3>
<p>Utanma, yargılanma korkusu, toplumsal önyargılar ve aile baskısı gibi faktörler açık konuşmayı engelleyebilir. Bu duygular normal karşılanmalı ve tedavi sürecinin bir parçası olarak değerlendirilmelidir.</p>

<h3>Aşamalı Açılma Süreci</h3>
<p>Her şeyi ilk seansta anlatmak zorunda değilsiniz. Güven ilişkisi geliştikçe daha kişisel konuları paylaşabilirsiniz. Psikiyatrist sabırlı yaklaşım sergileyerek bu süreci destekler.</p>

<h3>Hangi Konular Önemli?</h3>
<p>Ruh hali değişiklikleri, uyku düzeni, iştah, kişilerarası ilişkiler, travmatik deneyimler, madde kullanımı ve intihar düşünceleri mutlaka paylaşılmalıdır. Bu bilgiler tedavi için kritiktir.</p>

<h3>Yasal İstisna Durumları</h3>
<p>Kendine veya başkalarına zarar verme riski, çocuk istismarı şüphesi gibi durumlarda psikiyatrist yasal yükümlülükleri nedeniyle ilgili makamlara bildirimde bulunabilir.</p>

<h3>Aile ve Yakın Bilgilendirmesi</h3>
<p>Hasta 18 yaş üzerindeyse aile bilgilendirmesi ancak hasta onayıyla yapılır. Reşit olmayan hastalarda veli bilgilendirmesi zorunludur ancak hasta mahremiyeti gözetilir.</p>

<h3>İletişimi Kolaylaştıran Faktörler</h3>
<p>Empatik yaklaşım, yargısız dinleme, açık uçlu sorular ve güvenli ortam oluşturma açık iletişimi destekler. Psikiyatrist bu atmosferi yaratmaktan sorumludur.</p>

<h3>Tedavi Sürecinin Devamlılığı</h3>
<p>Düzenli seanslar ve sürekli iletişim tedavi başarısını artırır. Bir kerelik açıklama yeterli değildir, sürekli güncelleme ve paylaşım gereklidir.</p>

<p>Psikiyatriste açık olma tedavi başarısının anahtarıdır. Gizlilik güvence altındadır ve açık iletişim iyileşme sürecini hızlandırır. Güven ilişkisi geliştikçe paylaşım da kolaylaşır.</p>',
  'psikiyatriste-hersey-anlatilir-mi',
  'Psikiyatriste Her Şey Anlatılır Mı? | Ruh Sağlığı',
  'Psikiyatri seanslarında açık iletişim, gizlilik ilkeleri ve tedavi etkinliği. Hasta-doktor güven ilişkisi ve paylaşım konusunda uzman rehberi.',
  'Dr. Uzman', 'specialist', 'published', NOW()
),
(
  'Basur Nedir? Basur Belirtileri ve Basur Ağrısına Ne İyi Gelir?',
  '<h2>Basur (Hemoroid): Tanı, Belirtiler ve Tedavi Yöntemleri</h2>

<p>Basur veya hemoroid, anal kanalın içinde ve dışında bulunan damarların şişmesi sonucu oluşan sağlık problemidir. Toplumda oldukça yaygın olan bu rahatsızlık doğru tedavi yaklaşımlarıyla başarıyla tedavi edilebilir.</p>

<h3>Basur Nedir?</h3>
<p>Basur, rektum ve anal kanal çevresindeki venlerin (toplardamarların) anormal şişmesi ve genişlemesidir. İç basur (anal kanal içinde) ve dış basur (anal açıklık dışında) olmak üzere iki türü vardır.</p>

<h3>Basur Belirtileri</h3>
<p>Anal bölgede ağrı, kaşıntı, yanma hissi en yaygın belirtilerdir. Dışkılama sırasında kanama, anal bölgede şişlik, oturma sırasında rahatsızlık ve mukus akıntısı diğer belirtiler arasındadır.</p>

<h3>Basur Nedenleri</h3>
<p>Kronik kabızlık, uzun süre tuvalette oturma, fazla kilolu olma, gebelik, yaşlılık ve genetik yatkınlık başlıca risk faktörleridir. Ağır kaldırma ve uzun süre ayakta durma da risk artırır.</p>

<h3>Ağrı Giderici Doğal Yöntemler</h3>
<p>Sıcak oturma banyosu (sitz bath) günde 2-3 kez 15 dakika uygulanabilir. Buz kompres ağrı ve şişliği azaltır. Temiz ve kuru tutmak enfeksiyon riskini azaltır.</p>

<h3>Beslenme Önerileri</h3>
<p>Lifli gıdalar (tam tahıl, sebze, meyve) kabızlığı önler. Günde 8-10 bardak su içmek dışkıyı yumuşatır. Baharatlı, alkollü ve kafeinli içeceklerden kaçınılmalıdır.</p>

<h3>Medikal Tedavi Seçenekleri</h3>
<p>Hemoroid pomadları ve fitil ilaçlar ağrı ve inflamasyonu azaltır. Ağrı kesici ve venotonik ilaçlar doktor kontrolünde kullanılabilir. Lokal anestezikli preparatlar geçici rahatlama sağlar.</p>

<h3>Yaşam Tarzı Değişiklikleri</h3>
<p>Düzenli egzersiz, sağlıklı kilo, tuvalette fazla zaman geçirmeme ve dışkılama isteğini ertelememe önemlidir. Yumuşak tuvalet kağıdı kullanımı irritasyonu azaltır.</p>

<h3>Cerrahi Tedavi</h3>
<p>Konservatif tedaviye yanıt vermeyen vakalarda lazer, skleroterapi, lastik bağlama veya cerrahi eksizyon uygulanabilir. Bu yöntemler uzman tarafından değerlendirilmelidir.</p>

<h3>Komplikasyonlar</h3>
<p>Tedavi edilmeyen basur tromboz, anemi, prolaps ve enfeksiyon gibi komplikasyonlara neden olabilir. Şiddetli ağrı ve kanama durumunda derhal doktora başvurulmalıdır.</p>

<p>Basur erken teşhis ve uygun tedaviyle başarıyla yönetilebilir. Yaşam tarzı değişiklikleri ve doğru tedavi yaklaşımları semptomları kontrol altına alır ve yaşam kalitesini artırır.</p>',
  'basur-nedir-basur-belirtileri-ve-basur-agrisina-ne-iyi-gelir',
  'Basur Nedir? Basur Belirtileri ve Ağrı Tedavisi | Gastroenteroloji',
  'Basur (hemoroid) belirtileri, nedenleri ve tedavi yöntemleri. Doğal ağrı giderici yöntemler ve önleme stratejileri hakkında uzman rehberi.',
  'Dr. Uzman', 'specialist', 'published', NOW()
),
(
  'Hangi Vitamin Eksikliği Alerji Yapar?',
  '<h2>Vitamin Eksiklikleri ve Alerji İlişkisi</h2>

<p>Vitamin eksiklikleri bağışıklık sistemini zayıflatarak alerjik reaksiyonlara yatkınlığı artırabilir. Özellikle bazı vitaminlerin eksikliği alerji gelişimi ve şiddetlenmesinde önemli rol oynar.</p>

<h3>D Vitamini Eksikliği</h3>
<p>D vitamini eksikliği en yaygın alerji nedeni olan vitamin eksikliğidir. D vitamini bağışıklık sistemini düzenler ve alerjik reaksiyonları kontrol eder. Eksikliği astım, egzama ve gıda alerjilerini artırır.</p>

<h3>C Vitamini Eksikliği</h3>
<p>C vitamini doğal antihistaminik etkisi gösterir. Eksikliği histamin seviyelerinin artmasına neden olarak alerjik reaksiyonları şiddetlendirir. Özellikle solunum yolu alerjilerinde etkilidir.</p>

<h3>E Vitamini Eksikliği</h3>
<p>E vitamini güçlü bir antioksidandır ve alerjik inflamasyonu azaltır. Eksikliği cilt alerjilerini ve astım semptomlarını artırabilir. IgE antikor seviyelerinin yükselmesine neden olur.</p>

<h3>A Vitamini Eksikliği</h3>
<p>A vitamini mukoza bariyerlerini güçlendirir. Eksikliği solunum yolu ve sindirim sistemi mukozalarını zayıflatarak alerjenlere karşı savunmasızlığı artırır.</p>

<h3>B Kompleks Vitaminleri</h3>
<p>B6, B12 ve folik asit eksiklikleri bağışıklık sisteminin dengesini bozar. Özellikle B6 eksikliği histamin metabolizmasını etkileyerek alerjik reaksiyonları artırır.</p>

<h3>Omega-3 Yağ Asitleri</h3>
<p>Teknik olarak vitamin olmasa da omega-3 eksikliği alerjik inflamasyonu artırır. EPA ve DHA antiinflamatuar etkiler göstererek alerji kontrolünü destekler.</p>

<h3>Beslenme Önerileri</h3>
<p>Güneş ışığı, balık, yumurta (D vitamini), turunçgiller (C vitamini), fındık, tohum (E vitamini) ve yeşil yapraklı sebzeler (A vitamini) tüketilmelidir.</p>

<h3>Takviye Kullanımı</h3>
<p>Vitamin takviyeleri doktor kontrolünde alınmalıdır. Aşırı doz bazı vitaminlerde toksisiteye neden olabilir. Kan seviyesi kontrolleri ile takip yapılmalıdır.</p>

<h3>Çocuklarda Vitamin Eksikliği</h3>
<p>Çocukluk çağındaki vitamin eksiklikleri alerjik hastalıkların gelişimini kolaylaştırır. Anne sütü ve dengeli beslenme alerjik hastalıkları önlemede kritiktir.</p>

<p>Vitamin eksiklikleri alerji gelişimi ve şiddetlenmesinde önemli rol oynar. Dengeli beslenme ve gerektiğinde kontrollü takviye kullanımı alerjik hastalıkları önlemede etkilidir.</p>',
  'hangi-vitamin-eksikligi-alerji-yapar',
  'Hangi Vitamin Eksikliği Alerji Yapar? | İmmünoloji',
  'Vitamin eksiklikleri ve alerji ilişkisi, D vitamini eksikliği ve bağışıklık sistemi. Alerji önlemede beslenme önerileri ve vitamin takviyeleri.',
  'Dr. Uzman', 'specialist', 'published', NOW()
),
(
  'Alerji İçin Acilde Ne Yapılır?',
  '<h2>Acil Serviste Alerji Tedavisi ve Müdahale Protokolü</h2>

<p>Şiddetli alerjik reaksiyonlar hayatı tehdit edebilir ve acil müdahale gerektirir. Anafilaksi ve diğer ciddi alerjik durumlar için acil servisteki tedavi protokolleri hakkında bilgi sahibi olmak önemlidir.</p>

<h3>Anafilaksi Acil Müdahalesi</h3>
<p>Anafilaksi en ciddi alerji türüdür. Acil serviste adrenalin (epinefrin) enjeksiyonu ilk tercih edilen tedavidir. İntravenöz sıvı, oksijen desteği ve yaşamsal bulguların yakın takibi yapılır.</p>

<h3>Başvuru Belirtileri</h3>
<p>Nefes darlığı, yutma güçlüğü, yaygın ürtiker, şiddetli karın ağrısı, kusma, bayılma hissi ve nabız düşüklüğü acil başvuru gerektiren belirtilerdir.</p>

<h3>İlk Değerlendirme</h3>
<p>Hastanın yaşamsal bulgularının kontrolü, alerjen maruziyetinin belirlenmesi ve reaksiyon şiddetinin değerlendirilmesi acil serviste ilk yapılan işlemlerdir.</p>

<h3>İlaç Tedavileri</h3>
<p>Adrenalin, kortikosteroidler, antihistaminikler (H1 ve H2 reseptör blokerleri) ve bronkodilatatörler anafilaksi tedavisinde kullanılan temel ilaçlardır.</p>

<h3>Solunum Desteği</h3>
<p>Larinks ödemi veya bronkospazm durumunda oksijen, nebulizör tedavisi veya gerektiğinde entübasyon uygulanabilir. Mekanik ventilasyon desteği verilebilir.</p>

<h3>Kardiyovasküler Destek</h3>
<p>Hipotansiyon ve şok durumunda intravenöz sıvı resüsitasyonu, vazopresör ilaçlar ve kardiyak monitorizasyon uygulanır. Kalp ritmi yakından takip edilir.</p>

<h3>Gözlem Süresi</h3>
<p>Anafilaksi geçiren hastalar en az 4-6 saat gözlem altında tutulur. Bifazik reaksiyon riski nedeniyle erken taburcu edilmez. Şiddetli vakalarda hospitalizasyon gerekir.</p>

<h3>Taburculuk Önerileri</h3>
<p>EpiPen (otomatik adrenalin enjektörü) reçete edilir. Alerjen kaçınma eğitimi verilir ve allerji uzmanına yönlendirme yapılır. Acil durum planı hazırlanır.</p>

<h3>Yakın Takip</h3>
<p>Taburculuk sonrası 24-48 saat içinde allerji uzmanı kontrolü önerilir. Tetikleyici faktörlerin belirlenmesi ve uzun dönem tedavi planlaması yapılır.</p>

<p>Acil serviste alerji tedavisi hızlı ve etkili müdahale gerektirir. Erken tanı ve uygun tedavi hayat kurtarıcıdır. Taburculuk sonrası uzman takibi şarttır.</p>',
  'alerji-icin-acilde-ne-yapilir',
  'Alerji İçin Acilde Ne Yapılır? | Acil Tıp',
  'Acil serviste alerji tedavisi, anafilaksi müdahalesi ve tedavi protokolleri. Acil durum yönetimi ve taburculuk önerileri hakkında uzman rehberi.',
  'Dr. Uzman', 'specialist', 'published', NOW()
),
(
  'Beyin Tümörü Tomografide Görülür Mü?',
  '<h2>Beyin Tümörü Teşhisinde Tomografi ve Görüntüleme</h2>

<p>Beyin tümörü teşhisinde görüntüleme yöntemleri kritik rol oynar. Bilgisayarlı tomografi (BT) ve manyetik rezonans (MR) görüntüleme beyin tümörlerinin tespitinde kullanılan başlıca yöntemlerdir.</p>

<h3>BT Tomografide Beyin Tümörü</h3>
<p>Bilgisayarlı tomografi beyin tümörlerinin çoğunu tespit edebilir. Özellikle kalsifikasyon içeren tümörler, kanama ve akut durumlar BT''de net görülür. Kontrast madde kullanımı tanı doğruluğunu artırır.</p>

<h3>MR Görüntüleme</h3>
<p>MR, BT''ye göre daha üstün çözünürlük sağlar ve küçük tümörlerin tespitinde daha etkilidir. Beyin sapı, posterior fossa ve yakın komşu yapılar MR''de daha net görülür.</p>

<h3>Kontrastlı Çekimler</h3>
<p>Kontrast madde kullanılan çekimler tümör sınırlarını belirginleştirir. Gadolinyum (MR için) ve iyot bazlı kontrastlar (BT için) tümör vaskularizasyonunu gösterir.</p>

<h3>Tanı Doğruluğu</h3>
<p>Modern görüntüleme teknikleri beyin tümörlerinin %95''inden fazlasını tespit edebilir. Çok küçük tümörler (<5mm) bazen gözden kaçabilir, bu nedenle takip çekimleri önemlidir.</p>

<h3>Tümör Karakterizasyonu</h3>
<p>Görüntüleme sadece tümörü göstermez, aynı zamanda türü, yayılımı ve agresifliği hakkında da bilgi verir. Bu bilgiler tedavi planlaması için kritiktir.</p>

<h3>İleri Görüntüleme Teknikleri</h3>
<p>PET-BT, fMRI, MR spektroskopi ve perfüzyon görüntüleme gibi ileri teknikler tümörün metabolik aktivitesi ve kan akımı hakkında detaylı bilgi sağlar.</p>

<h3>Takip Görüntülemeleri</h3>
<p>Tedavi sonrası düzenli görüntüleme takipleri yapılır. Nüks, tedavi yanıtı ve komplikasyonların değerlendirilmesi için 3-6 aylık kontroller önerilir.</p>

<h3>Sınırlamalar</h3>
<p>Çok erken evre küçük tümörler, bazı düşük gradeli tümörler ve inflamatuar lezyonlar bazen görüntülemede net ayrım yapılamayabilir.</p>

<h3>Acil Durumlar</h3>
<p>Ani başlayan şiddetli baş ağrısı, bilinç değişikliği ve nörolojik defisitlerde acil BT çekimi yapılır. Kanama ve hernisyon riski değerlendirilir.</p>

<p>Beyin tümörleri modern görüntüleme yöntemleriyle yüksek doğrulukla tespit edilir. Erken tanı tedavi başarısını artırır ve yaşam kalitesini korur.</p>',
  'beyin-tumoru-tomografide-gorulur-mu',
  'Beyin Tümörü Tomografide Görülür Mü? | Nöroradyoloji',
  'Beyin tümörü teşhisinde BT ve MR görüntüleme, kontrastlı çekimler ve tanı doğruluğu. Görüntüleme teknikleri hakkında uzman bilgisi.',
  'Dr. Uzman', 'specialist', 'published', NOW()
)