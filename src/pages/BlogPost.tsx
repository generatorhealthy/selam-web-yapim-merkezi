import { useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Clock, User } from "lucide-react";
import { Link } from "react-router-dom";
import { findDoctorBySlug, createDoctorSlug } from "@/utils/doctorUtils";

const BlogPost = () => {
  const { doctorName, blogSlug } = useParams();

  // Mock data - gerçek uygulamada API'den gelecek
  const doctors = [
    {
      id: 1,
      name: "Dr. Mehmet Özkan",
      specialty: "Kardiyoloji",
      title: "Prof. Dr.",
      image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop&crop=face",
      blogs: [
        {
          id: 1,
          title: "Kalp Sağlığı İçin 10 Altın Kural",
          slug: "kalp-sagligi-icin-10-altin-kural",
          image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=400&fit=crop",
          content: `
            <p>Kalp sağlığı, yaşamımızın kalitesini doğrudan etkileyen en önemli faktörlerden biridir. Modern yaşamın getirdiği stres, sedanter yaşam tarzı ve beslenme alışkanlıkları kalp sağlığımızı olumsuz etkileyebilir.</p>
            
            <h3>1. Düzenli Egzersiz Yapın</h3>
            <p>Haftada en az 150 dakika orta şiddetli aerobik aktivite yapmanız kalp sağlığınız için kritik önem taşır. Yürüyüş, yüzme, bisiklet sürme gibi aktiviteler kalp kasınızı güçlendirir.</p>
            
            <h3>2. Sağlıklı Beslenin</h3>
            <p>Sebze, meyve, tam tahıl ürünleri ve omega-3 açısından zengin balıkları tercih edin. Doymuş yağ, trans yağ ve aşırı tuzu sınırlandırın.</p>
            
            <h3>3. Stresi Yönetin</h3>
            <p>Kronik stres kalp hastalığı riskini artırır. Meditasyon, yoga, nefes egzersizleri gibi tekniklerle stresle başa çıkmayı öğrenin.</p>
            
            <h3>4. Sigarayı Bırakın</h3>
            <p>Sigara içmek kalp hastalığı için en önemli risk faktörlerinden biridir. Sigarayı bıraktığınızda kalp hastalığı riskiniz hemen azalmaya başlar.</p>
            
            <h3>5. Düzenli Kontrol Yaptırın</h3>
            <p>Kan basıncı, kolesterol ve kan şekeri değerlerinizi düzenli olarak kontrol ettirin. Erken teşhis hayat kurtarır.</p>
          `,
          excerpt: "Kalp sağlığınızı korumak için uygulamanız gereken temel kurallar ve yaşam tarzı değişiklikleri hakkında kapsamlı rehber.",
          publishDate: "15 Ocak 2024",
          readTime: "5 dakika",
          status: "published"
        },
        {
          id: 2,
          title: "Stres ve Kalp Hastalıkları Arasındaki İlişki",
          slug: "stres-ve-kalp-hastaliklari-arasindaki-iliski",
          image: "https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=800&h=400&fit=crop",
          content: `
            <p>Stres, modern yaşamın kaçınılmaz bir parçası haline gelmiştir. Ancak kronik stresin kalp sağlığımız üzerindeki etkileri oldukça ciddidir ve bu konuda farkındalık sahibi olmamız gerekir.</p>
            
            <h3>Stresin Kalp Üzerindeki Etkileri</h3>
            <p>Stres durumunda vücudumuz adrenalin ve kortizol gibi hormonlar salgılar. Bu hormonlar kalp atış hızını artırır, kan basıncını yükseltir ve kan damarlarında daralmalara neden olabilir.</p>
            
            <h3>Kronik Stresin Riskleri</h3>
            <p>Uzun süreli stres altında kalmak kalp krizi, inme ve aritmi riskini önemli ölçüde artırır. Ayrıca stres, kötü yaşam tarzı seçimlerine de yol açabilir.</p>
            
            <h3>Stresle Başa Çıkma Yöntemleri</h3>
            <p>Düzenli egzersiz, meditasyon, derin nefes alma teknikleri ve sosyal destek almak stresle başa çıkmanın etkili yollarıdır.</p>
            
            <h3>Ne Zaman Doktora Başvurmalısınız</h3>
            <p>Göğüs ağrısı, nefes darlığı, çarpıntı gibi belirtiler yaşıyorsanız derhal bir kardiyoloji uzmanına başvurun.</p>
          `,
          excerpt: "Günlük stresimizin kalp sağlığımıza etkilerini ve bunlarla başa çıkma yöntemlerini inceleyen detaylı makale.",
          publishDate: "10 Ocak 2024",
          readTime: "7 dakika",
          status: "published"
        }
      ]
    }
  ];

  const doctor = findDoctorBySlug(doctors, doctorName || '');
  const blog = doctor?.blogs?.find(b => b.slug === blogSlug);

  if (!doctor || !blog) {
    return (
      <>
        <Helmet>
          <title>Blog Yazısı Bulunamadı - Doktorum Ol</title>
          <meta name="description" content="Aradığınız blog yazısı bulunamadı. Doktorum Ol blog sayfasına dönün." />
          <meta name="keywords" content="blog bulunamadı, doktor blogu, sağlık yazıları" />
        </Helmet>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Blog Yazısı Bulunamadı</h1>
            <p className="text-gray-600 mb-4">Aradığınız blog yazısı bulunamadı.</p>
            <Button asChild>
              <Link to="/doctors">Doktor Listesine Dön</Link>
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>{blog.title} - {doctor.title} {doctor.name}</title>
        <meta name="description" content={blog.excerpt?.substring(0, 135) || blog.title.substring(0, 135)} />
        <meta name="keywords" content={`${doctor.specialty.toLowerCase()}, ${doctor.name.toLowerCase()}, sağlık blog, doktor yazısı`} />
      </Helmet>
      
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Back Button */}
          <div className="mb-6">
            <Button variant="outline" asChild>
              <Link to={`/${createDoctorSlug(doctor.name)}`}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Doktor Profiline Dön
              </Link>
            </Button>
          </div>

          {/* Blog Header */}
          <Card className="mb-8">
            <CardContent className="p-0">
              <img
                src={blog.image}
                alt={blog.title}
                className="w-full h-64 md:h-80 object-cover rounded-t-lg"
              />
              <div className="p-8">
                <div className="flex items-center gap-4 mb-4">
                  <img
                    src={doctor.image}
                    alt={doctor.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">{doctor.title} {doctor.name}</span>
                    </div>
                    <Badge variant="secondary" className="mt-1">
                      {doctor.specialty}
                    </Badge>
                  </div>
                </div>

                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  {blog.title}
                </h1>

                <p className="text-lg text-gray-600 mb-6">
                  {blog.excerpt}
                </p>

                <div className="flex items-center gap-6 text-sm text-gray-500 border-t pt-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{blog.publishDate}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{blog.readTime}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Blog Content */}
          <Card>
            <CardContent className="p-8">
              <div 
                className="prose prose-lg max-w-none"
                dangerouslySetInnerHTML={{ __html: blog.content }}
              />
            </CardContent>
          </Card>

          {/* Author Info */}
          <Card className="mt-8">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <img
                  src={doctor.image}
                  alt={doctor.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{doctor.title} {doctor.name}</h3>
                  <p className="text-gray-600">{doctor.specialty}</p>
                  <Button asChild className="mt-3">
                    <Link to={`/${createDoctorSlug(doctor.name)}`}>
                      Profili Görüntüle
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default BlogPost;
