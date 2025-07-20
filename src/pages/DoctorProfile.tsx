import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Calendar, Star, Phone, MessageCircle, GraduationCap, CheckCircle, Award, FileText } from "lucide-react";
import { createDoctorSlug, createSpecialtySlug } from "@/utils/doctorUtils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ReviewForm from "@/components/ReviewForm";
import { HorizontalNavigation } from "@/components/HorizontalNavigation";
import Footer from "@/components/Footer";
import GoogleMap from "@/components/GoogleMap";
import SpecialistTests from "@/components/SpecialistTests";

interface Specialist {
  id: string;
  name: string;
  specialty: string;
  hospital?: string;
  city: string;
  experience?: number;
  rating?: number;
  reviews_count?: number;
  bio?: string;
  education?: string;
  university?: string;
  certifications?: string;
  profile_picture?: string;
  consultation_type?: string;
  working_hours_start?: string;
  working_hours_end?: string;
  available_days?: string[];
  address?: string;
  phone?: string;
  email?: string;
  online_consultation?: boolean;
  face_to_face_consultation?: boolean;
  faq?: string;
}

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  published_at: string;
  featured_image?: string;
  slug: string;
  seo_title?: string;
  seo_description?: string;
  keywords?: string;
  word_count?: number;
  author_name?: string;
  author_id?: string;
}

interface Review {
  id: string;
  reviewer_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

const DoctorProfile = () => {
  const { specialtySlug, doctorName } = useParams();
  const { toast } = useToast();
  const [specialist, setSpecialist] = useState<Specialist | null>(null);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [blogLoading, setBlogLoading] = useState(false);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  useEffect(() => {
    console.log('DoctorProfile mounted, specialtySlug:', specialtySlug, 'doctorName:', doctorName);
    if (specialtySlug && doctorName) {
      fetchSpecialist();
    }
  }, [specialtySlug, doctorName]);

  const fetchSpecialist = async () => {
    try {
      setLoading(true);
      console.log('Fetching specialist for:', doctorName, 'in specialty:', specialtySlug);
      
      // Get all specialists to find the right one
      const { data: allSpecialists, error: allError } = await supabase
        .from('specialists')
        .select('*')
        .eq('is_active', true);

      console.log('All specialists:', allSpecialists);

      if (allError) {
        console.error('Error fetching all specialists:', allError);
        throw allError;
      }

      // Find specialist by matching both doctor name slug and specialty slug
      let foundSpecialist = allSpecialists?.find(s => {
        const doctorSlugMatch = createDoctorSlug(s.name) === doctorName;
        const specialtySlugMatch = createSpecialtySlug(s.specialty) === specialtySlug;
        console.log(`Checking specialist ${s.name}:`);
        console.log(`  Doctor slug: ${createDoctorSlug(s.name)} === ${doctorName} ? ${doctorSlugMatch}`);
        console.log(`  Specialty slug: ${createSpecialtySlug(s.specialty)} === ${specialtySlug} ? ${specialtySlugMatch}`);
        return doctorSlugMatch && specialtySlugMatch;
      });

      console.log('Found specialist by slug match:', foundSpecialist);

      if (!foundSpecialist) {
        console.log('No specialist found with both matching doctor and specialty slugs');
        setSpecialist(null);
        return;
      }

      console.log('Setting specialist data:', foundSpecialist);
      setSpecialist(foundSpecialist);
      
      // Fetch blog posts and reviews for this specialist
      if (foundSpecialist?.id) {
        fetchBlogPosts(foundSpecialist.id, foundSpecialist.user_id, foundSpecialist.name);
        fetchReviews(foundSpecialist.id);
      }
      
    } catch (error) {
      console.error('Beklenmeyen hata:', error);
      toast({
        title: "Hata",
        description: "Beklenmeyen bir hata oluştu.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchBlogPosts = async (specialistId: string, userId?: string, specialistName?: string) => {
    try {
      setBlogLoading(true);
      console.log('Fetching blog posts for specialist:', specialistId);
      console.log('Specialist user_id:', userId);
      console.log('Specialist name:', specialistName);
      
      let blogData = null;
      
      // First approach: Try to match by author_id (user_id)
      if (userId) {
        console.log('Trying to fetch blogs by author_id:', userId);
        const { data: blogsByAuthorId, error: errorById } = await supabase
          .from('blog_posts')
          .select('*')
          .eq('author_id', userId)
          .in('status', ['published', 'approved'])
          .order('published_at', { ascending: false });

        if (!errorById && blogsByAuthorId && blogsByAuthorId.length > 0) {
          console.log('Found blogs by author_id:', blogsByAuthorId.length);
          blogData = blogsByAuthorId;
        } else {
          console.log('No blogs found by author_id, error:', errorById);
        }
      }

      // Second approach: If no results with user_id, try matching by exact author_name
      if ((!blogData || blogData.length === 0) && specialistName) {
        console.log('Trying to fetch blogs by exact author_name:', specialistName);
        const { data: blogsByAuthorName, error: errorByName } = await supabase
          .from('blog_posts')
          .select('*')
          .eq('author_name', specialistName)
          .in('status', ['published', 'approved'])
          .order('published_at', { ascending: false });

        if (!errorByName && blogsByAuthorName && blogsByAuthorName.length > 0) {
          console.log('Found blogs by exact author_name:', blogsByAuthorName.length);
          blogData = blogsByAuthorName;
        } else {
          console.log('No blogs found by exact author_name, error:', errorByName);
        }
      }

      // Third approach: Try case-insensitive matching by author_name
      if ((!blogData || blogData.length === 0) && specialistName) {
        console.log('Trying case-insensitive author_name search for:', specialistName);
        const { data: blogsByNameInsensitive, error: errorByNameInsensitive } = await supabase
          .from('blog_posts')
          .select('*')
          .ilike('author_name', specialistName)
          .in('status', ['published', 'approved'])
          .order('published_at', { ascending: false });

        if (!errorByNameInsensitive && blogsByNameInsensitive && blogsByNameInsensitive.length > 0) {
          console.log('Found blogs by case-insensitive author_name:', blogsByNameInsensitive.length);
          blogData = blogsByNameInsensitive;
        } else {
          console.log('No blogs found by case-insensitive author_name, error:', errorByNameInsensitive);
        }
      }

      console.log('Final blog posts result for specialist:', specialistName);
      console.log('Blog posts found:', blogData?.length || 0);
      console.log('Blog posts data:', blogData);
      
      setBlogPosts(blogData || []);
      
    } catch (error) {
      console.error('Blog yazıları yüklenirken hata:', error);
      setBlogPosts([]);
    } finally {
      setBlogLoading(false);
    }
  };

  const fetchReviews = async (specialistId: string) => {
    try {
      setReviewsLoading(true);
      console.log('Fetching reviews for specialist:', specialistId);
      
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('specialist_id', specialistId)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Değerlendirmeler çekilirken hata:', error);
        return;
      }

      console.log('Reviews fetched:', data);
      setReviews(data || []);
    } catch (error) {
      console.error('Değerlendirmeler yüklenirken hata:', error);
    } finally {
      setReviewsLoading(false);
    }
  };

  const handlePhoneCall = () => {
    if (specialist?.phone) {
      window.open(`tel:${specialist.phone}`, '_self');
    } else {
      window.open('tel:02162350650', '_self');
    }
  };

  const handleWhatsApp = () => {
    if (specialist) {
      const message = `${specialist.name} Uzmanından bilgi almak istiyorum`;
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/902162350650?text=${encodedMessage}`;
      window.open(whatsappUrl, '_blank');
    } else {
      window.open('https://wa.me/902162350650', '_blank');
    }
  };

  const getAppointmentTypes = () => {
    const types = [];
    if (specialist?.online_consultation) types.push('Online');
    if (specialist?.face_to_face_consultation !== false) types.push('Yüz Yüze');
    return types.length > 0 ? types : ['Yüz Yüze'];
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
        }`}
      />
    ));
  };

  const handleReviewSubmitted = () => {
    if (specialist?.id) {
      fetchReviews(specialist.id);
    }
  };

  const parseFAQ = (faqString?: string) => {
    if (!faqString) return [];
    try {
      const parsed = JSON.parse(faqString);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('FAQ parse error:', error);
      return [];
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#f0f2f5' }}>
        <HorizontalNavigation />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Profil yükleniyor...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!specialist) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#f0f2f5' }}>
        <HorizontalNavigation />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="text-center px-4">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Uzman Bulunamadı</h1>
            <p className="text-gray-600 mb-4">Aradığınız uzman profili bulunamadı.</p>
            <p className="text-sm text-gray-500 mb-4">
              Aranan: {specialtySlug}/{doctorName}
            </p>
            <Button asChild>
              <Link to="/uzmanlar">Uzmanlar Listesine Dön</Link>
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const numericRating = typeof specialist.rating === 'string' ? parseFloat(specialist.rating) : (specialist.rating || 4.8);
  const specialtySlugForLinks = createSpecialtySlug(specialist?.specialty || '');

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f0f2f5' }}>
      <HorizontalNavigation />
      
      <div className="container mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6">
            <div className="flex flex-col items-center text-center mb-6">
              <img
                src={specialist.profile_picture || "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=300&h=300&fit=crop&crop=face"}
                alt={specialist.name}
                className="w-32 h-32 md:w-40 md:h-40 rounded-2xl object-cover mb-4"
              />
              
              <div className="flex flex-col items-center gap-3 mb-4">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{specialist.name}</h1>
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-3 py-1">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-700 font-medium">Onaylı Profil</span>
                </div>
              </div>

              <div className="mb-4">
                <Badge className="text-sm px-4 py-2 rounded-xl font-semibold" style={{ backgroundColor: '#e3f2fd', color: '#1976d2' }}>
                  👤 {specialist.specialty}
                </Badge>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 text-base text-gray-600 mb-4">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  {specialist.city}
                </div>
                {specialist.experience && (
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    {specialist.experience} yıl deneyim
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1 mb-6">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span className="font-medium text-lg">{numericRating}</span>
                <span className="text-sm text-gray-600">({specialist.reviews_count || 0} değerlendirme)</span>
              </div>

              <div className="flex flex-wrap justify-center gap-3 mb-6">
                {getAppointmentTypes().map((type) => (
                  <Badge 
                    key={type} 
                    variant="outline" 
                    className={`text-sm px-4 py-2 rounded-xl font-semibold ${
                      type === 'Online' 
                        ? 'border-green-200 text-green-700 bg-green-50' 
                        : 'border-purple-200 text-purple-700 bg-purple-50'
                    }`}
                  >
                    {type === 'Online' ? '🌐 Online' : '👥 Yüz Yüze'}
                  </Badge>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
                <Button 
                  asChild 
                  className="h-12 px-6 text-base font-semibold rounded-xl text-white w-full" 
                  style={{ backgroundColor: '#4f7cff' }}
                >
                  <Link to={`/randevu-al/${specialtySlugForLinks}/${createDoctorSlug(specialist.name)}`}>
                    <Calendar className="w-4 h-4 mr-2" />
                    Randevu Al
                  </Link>
                </Button>
                
                <div className="flex gap-3">
                  <Button 
                    variant="outline"
                    onClick={handlePhoneCall}
                    className="h-12 px-4 text-base font-semibold rounded-xl border-2 flex-1"
                    style={{ borderColor: '#4f7cff', color: '#4f7cff' }}
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Ara
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={handleWhatsApp}
                    className="h-12 px-4 text-base font-semibold rounded-xl border-2 text-green-600 hover:text-green-700 flex-1"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    WhatsApp
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <Tabs defaultValue="about" className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <TabsList className="grid w-full grid-cols-4 md:grid-cols-8 h-auto p-1">
                <TabsTrigger value="about" className="text-xs md:text-sm py-3">Hakkında</TabsTrigger>
                <TabsTrigger value="university" className="text-xs md:text-sm py-3">Üniversite</TabsTrigger>
                <TabsTrigger value="faq" className="text-xs md:text-sm py-3">SSS</TabsTrigger>
                <TabsTrigger value="tests" className="text-xs md:text-sm py-3">Testler</TabsTrigger>
                <TabsTrigger value="certifications" className="text-xs md:text-sm py-3">Sertifikalar</TabsTrigger>
                <TabsTrigger value="address" className="text-xs md:text-sm py-3">Konum</TabsTrigger>
                <TabsTrigger value="reviews" className="text-xs md:text-sm py-3">Değerlendirmeler</TabsTrigger>
                <TabsTrigger value="blog" className="text-xs md:text-sm py-3">Blog</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="about">
              <Card className="bg-white rounded-2xl shadow-sm border-0">
                <CardHeader>
                  <CardTitle>Hakkında</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {specialist.bio ? (
                      <p className="text-gray-700 leading-relaxed">{specialist.bio}</p>
                    ) : (
                      <p className="text-gray-500 italic">Henüz biyografi bilgisi eklenmemiş.</p>
                    )}
                    
                    {specialist.education && (
                      <div className="border-t pt-4">
                        <h3 className="font-semibold mb-2 flex items-center gap-2">
                          <GraduationCap className="w-5 h-5" />
                          Eğitim
                        </h3>
                        <p className="text-gray-700">{specialist.education}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="university">
              <Card className="bg-white rounded-2xl shadow-sm border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="w-5 h-5" />
                    Üniversite
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {specialist.university ? (
                    <p className="text-gray-700">{specialist.university}</p>
                  ) : (
                    <p className="text-gray-500 italic">Henüz üniversite bilgisi eklenmemiş.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="faq">
              <Card className="bg-white rounded-2xl shadow-sm border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5" />
                    Sıkça Sorulan Sorular
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const faqData = parseFAQ(specialist.faq);
                    
                    if (faqData.length === 0) {
                      return (
                        <p className="text-gray-500 italic">Henüz sıkça sorulan soru eklenmemiş.</p>
                      );
                    }

                    return (
                      <div className="space-y-4">
                        {faqData.map((item: any, index: number) => (
                          <div key={index} className="border-b pb-4 last:border-b-0">
                            <h3 className="font-semibold text-gray-900 mb-2">
                              S: {item.question}
                            </h3>
                            <p className="text-gray-700 leading-relaxed">
                              C: {item.answer}
                            </p>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tests">
              <Card className="bg-white rounded-2xl shadow-sm border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Testler
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <SpecialistTests 
                    specialistId={specialist.id} 
                    specialistName={specialist.name}
                    specialistSpecialty={specialist.specialty}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="certifications">
              <Card className="bg-white rounded-2xl shadow-sm border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    Sertifikalar
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {specialist.certifications ? (
                    <div className="whitespace-pre-line text-gray-700">
                      {specialist.certifications}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">Henüz sertifika bilgisi eklenmemiş.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="address">
              <Card className="bg-white rounded-2xl shadow-sm border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Konum Bilgileri
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <GoogleMap 
                    address={specialist.address || ''} 
                    doctorName={specialist.name}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reviews">
              <div className="space-y-6">
                <ReviewForm 
                  doctorId={specialist?.id || ''} 
                  doctorName={specialist?.name || ''}
                  onReviewSubmitted={handleReviewSubmitted}
                />

                <Card className="bg-white rounded-2xl shadow-sm border-0">
                  <CardHeader>
                    <CardTitle>Değerlendirmeler ({reviews.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {reviewsLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Değerlendirmeler yükleniyor...</p>
                      </div>
                    ) : reviews.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-600">Henüz değerlendirme bulunmamaktadır.</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {reviews.map((review) => (
                          <div key={review.id} className="border-b pb-6 last:border-b-0">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-2">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{review.reviewer_name}</span>
                                <div className="flex items-center gap-1">
                                  {renderStars(review.rating)}
                                </div>
                              </div>
                              <span className="text-sm text-gray-500">
                                {new Date(review.created_at).toLocaleDateString('tr-TR')}
                              </span>
                            </div>
                            <p className="text-gray-700">{review.comment}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="blog">
              <div className="space-y-6">
                <Card className="bg-white rounded-2xl shadow-sm border-0">
                  <CardHeader>
                    <CardTitle>Blog Yazıları ({blogPosts.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {blogLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Blog yazıları yükleniyor...</p>
                      </div>
                    ) : blogPosts.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-600">Henüz blog yazısı bulunmamaktadır.</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {blogPosts.map((post) => (
                          <div key={post.id} className="border rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                            
                            {post.featured_image && (
                              <Link to={`/blog/${post.slug}`} className="block">
                                <div className="w-full h-48 md:h-64 overflow-hidden cursor-pointer hover:opacity-90 transition-opacity">
                                  <img
                                    src={post.featured_image}
                                    alt={post.title}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              </Link>
                            )}
                            
                            <div className="px-6 pt-6 pb-2">
                              <div className="flex items-center gap-3 mb-4">
                                <img
                                  src={specialist?.profile_picture || "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=40&h=40&fit=crop&crop=face"}
                                  alt={specialist?.name}
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium text-gray-900">{post.author_name}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="px-6 pb-6">
                              <div className="mb-4">
                                <Link to={`/blog/${post.slug}`} className="block hover:text-blue-600 transition-colors">
                                  <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2 cursor-pointer">{post.title}</h3>
                                </Link>
                                <div className="text-sm text-gray-500 mb-4">
                                  {new Date(post.published_at).toLocaleDateString('tr-TR', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}
                                </div>
                              </div>

                              {post.excerpt && (
                                <div className="mb-4">
                                  <p className="text-gray-600 leading-relaxed">{post.excerpt}</p>
                                </div>
                              )}

                              <div className="prose max-w-none">
                                <div className="text-gray-700 leading-relaxed whitespace-pre-wrap line-clamp-6">
                                  {post.content.length > 300 
                                    ? `${post.content.substring(0, 300)}...` 
                                    : post.content
                                  }
                                </div>
                              </div>

                              <div className="mt-4">
                                <Button asChild variant="outline" className="text-blue-600 hover:text-blue-700">
                                  <Link to={`/blog/${post.slug}`}>
                                    Devamını Oku
                                  </Link>
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default DoctorProfile;
