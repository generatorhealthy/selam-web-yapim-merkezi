-- Create blogs table
CREATE TABLE public.blogs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  excerpt TEXT,
  featured_image TEXT,
  author_name TEXT DEFAULT 'Doktorum Ol',
  tags TEXT[],
  status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  meta_title TEXT,
  meta_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;

-- Create policies for blogs (public read access)
CREATE POLICY "Blogs are publicly readable" 
ON public.blogs 
FOR SELECT 
USING (status = 'published');

-- Create policy for authenticated users to manage blogs
CREATE POLICY "Authenticated users can manage blogs" 
ON public.blogs 
FOR ALL 
USING (auth.role() = 'authenticated');

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_blogs_updated_at
BEFORE UPDATE ON public.blogs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert the allergy test article
INSERT INTO public.blogs (
  title,
  slug,
  content,
  excerpt,
  tags,
  meta_title,
  meta_description
) VALUES (
  'Alerji Testinin Yüksek Çıkması Nedir?',
  'alerji-testinin-yuksek-cikmasi-nedir',
  '<h2>Alerji Testi Nedir?</h2>
<p>Alerji testleri, vücudumuzun belirli maddelere karşı gösterdiği alerjik reaksiyonları tespit etmek için yapılan tıbbi testlerdir. Bu testler sayesinde hangi maddelerin alerjik reaksiyona neden olduğunu öğrenebilir ve ona göre tedavi planlaması yapılabilir.</p>

<h2>Alerji Testinin Yüksek Çıkması Ne Anlama Gelir?</h2>
<p>Alerji test sonuçlarının yüksek çıkması, vücudunuzun test edilen maddeye karşı güçlü bir alerjik reaksiyon gösterdiği anlamına gelir. Bu durum:</p>
<ul>
<li>IgE seviyelerinin normalden yüksek olması</li>
<li>Deri testlerinde büyük reaksiyon alanları oluşması</li>
<li>Kan testlerinde yüksek antikor seviyeleri</li>
</ul>
<p>şeklinde kendini gösterebilir.</p>

<h2>Yüksek Alerji Test Sonuçlarının Nedenleri</h2>
<h3>1. Genetik Faktörler</h3>
<p>Aile geçmişinde alerji olan kişilerde, alerji testlerinin yüksek çıkma ihtimali daha fazladır. Genetik yatkınlık, alerjik reaksiyonların şiddetini etkileyebilir.</p>

<h3>2. Çevresel Faktörler</h3>
<p>Yaşadığımız çevredeki alerjenlerle sık temas, vücudun bu maddelere karşı daha güçlü antikor üretmesine neden olabilir:</p>
<ul>
<li>Polen yoğunluğu</li>
<li>Ev tozu akarları</li>
<li>Evcil hayvan tüyleri</li>
<li>Küf sporları</li>
</ul>

<h3>3. Yaşam Tarzı Faktörleri</h3>
<p>Bazı yaşam tarzı faktörleri alerji test sonuçlarını etkileyebilir:</p>
<ul>
<li>Stres seviyesi</li>
<li>Beslenme alışkanlıkları</li>
<li>Sigara kullanımı</li>
<li>Uyku düzeni</li>
</ul>

<h2>Yüksek Alerji Test Sonuçları Nasıl Değerlendirilir?</h2>
<p>Alerji test sonuçları mutlaka uzman doktor tarafından değerlendirilmelidir. Yüksek sonuçlar her zaman ciddi semptomlar anlamına gelmez. Değerlendirmede şunlar dikkate alınır:</p>
<ul>
<li>Test değerlerinin seviyesi</li>
<li>Hastanın semptom geçmişi</li>
<li>Maruz kalma durumu</li>
<li>Diğer sağlık durumları</li>
</ul>

<h2>Tedavi Seçenekleri</h2>
<h3>Kaçınma Stratejileri</h3>
<p>En etkili tedavi yöntemi, alerjiye neden olan maddeyi mümkün olduğunca kaçınmaktır:</p>
<ul>
<li>Ev temizliği düzenlemeleri</li>
<li>Diyet değişiklikleri</li>
<li>Çevresel kontroller</li>
</ul>

<h3>İlaç Tedavisi</h3>
<p>Doktor tavsiyesi ile kullanılabilecek ilaçlar:</p>
<ul>
<li>Antihistaminikler</li>
<li>Kortikosteroidler</li>
<li>Dekongestanlar</li>
<li>İmmünoterapiler</li>
</ul>

<h3>İmmünoterapi (Alerji Aşısı)</h3>
<p>Ciddi alerji durumlarında, vücudun alerjiye karşı toleransını artırmak için immünoterapi uygulanabilir.</p>

<h2>Yaşam Kalitesini Artırma Önerileri</h2>
<p>Yüksek alerji test sonuçları olan kişiler şu önerileri uygulayabilir:</p>
<ul>
<li>Düzenli temizlik yapın</li>
<li>Hava filtreleri kullanın</li>
<li>Polen takvimini takip edin</li>
<li>Stres yönetimi teknikleri uygulayın</li>
<li>Doktor kontrollerinizi aksatmayın</li>
</ul>

<h2>Ne Zaman Doktora Başvurmalısınız?</h2>
<p>Şu durumlar yaşanıyorsa mutlaka uzman doktora başvurun:</p>
<ul>
<li>Nefes darlığı</li>
<li>Yaygın cilt döküntüleri</li>
<li>Şiddetli kaşıntı</li>
<li>Mide-bağırsak sorunları</li>
<li>Anafilaksi belirtileri</li>
</ul>

<h2>Sonuç</h2>
<p>Alerji testinin yüksek çıkması endişe verici olabilir, ancak doğru yaklaşım ve tedavi ile yaşam kalitesi korunabilir. Önemli olan, test sonuçlarını uzman doktorla birlikte değerlendirmek ve kişiselleştirilmiş bir tedavi planı oluşturmaktır.</p>

<p><strong>Unutmayın:</strong> Bu makale genel bilgi amaçlıdır. Kişisel sağlık durumunuz için mutlaka uzman doktor görüşü alın.</p>',
  'Alerji testinin yüksek çıkması ne anlama gelir? Nedenleri, değerlendirme yöntemleri ve tedavi seçenekleri hakkında kapsamlı bilgi alın.',
  ARRAY['alerji', 'alerji testi', 'sağlık', 'tanı', 'tedavi'],
  'Alerji Testinin Yüksek Çıkması Nedir? | Doktorum Ol',
  'Alerji test sonuçlarının yüksek çıkma nedenleri, değerlendirme yöntemleri ve tedavi seçenekleri hakkında uzman görüşleri.'
);