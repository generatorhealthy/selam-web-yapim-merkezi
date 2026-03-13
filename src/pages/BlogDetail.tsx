
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Clock, User, Share2, Facebook, Twitter, Linkedin } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { HorizontalNavigation } from "@/components/HorizontalNavigation";
import Footer from "@/components/Footer";
import BlogSpecialistCard from "@/components/BlogSpecialistCard";
import { Helmet } from "react-helmet-async";
import { SafeHtmlContent } from "@/components/SafeHtmlContent";

interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  featured_image: string | null;
  slug: string;
  author_name: string;
  author_type: string;
  published_at: string;
  updated_at: string;
  word_count: number | null;
  specialist_id: string | null;
  keywords: string | null;
  specialists?: {
    specialty: string;
  } | null;
}

interface RelatedPost {
  id: string;
  title: string;
  slug: string;
  featured_image: string | null;
  excerpt: string | null;
  published_at: string;
}

interface Specialist {
  id: string;
  name: string;
  specialty: string;
  city: string;
  experience: number;
  bio: string;
  profile_picture: string | null;
  online_consultation: boolean;
  face_to_face_consultation: boolean;
}

const BlogDetail = () => {
  const { slug } = useParams();
  const { toast } = useToast();
  const [blog, setBlog] = useState<BlogPost | null>(null);
  const [specialist, setSpecialist] = useState<Specialist | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<RelatedPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      fetchBlog();
    }
  }, [slug]);

  const fetchBlog = async () => {
    try {
      setLoading(true);

      const [blogPostRes, legacyBlogRes] = await Promise.all([
        supabase
          .from('blog_posts')
          .select('*')
          .eq('slug', slug)
          .eq('status', 'published')
          .maybeSingle(),
        supabase
          .from('blogs')
          .select('*')
          .eq('slug', slug)
          .eq('status', 'published')
          .maybeSingle()
      ]);

      const blogPostError = blogPostRes.error && blogPostRes.error.code !== 'PGRST116' ? blogPostRes.error : null;
      const legacyBlogError = legacyBlogRes.error && legacyBlogRes.error.code !== 'PGRST116' ? legacyBlogRes.error : null;

      if (blogPostError && legacyBlogError) {
        console.error('Blog yazısı çekilirken hata:', { blogPostError, legacyBlogError });
        toast({
          title: "Hata",
          description: "Blog yazısı yüklenirken bir hata oluştu.",
          variant: "destructive"
        });
        return;
      }

      const blogPostData = blogPostRes.data as any;
      const legacyBlogData = legacyBlogRes.data as any;

      if (!blogPostData && !legacyBlogData) {
        setBlog(null);
        return;
      }

      const normalizedBlog: BlogPost = blogPostData
        ? {
            id: blogPostData.id,
            title: blogPostData.title,
            content: blogPostData.content,
            excerpt: blogPostData.excerpt,
            featured_image: blogPostData.featured_image,
            slug: blogPostData.slug,
            author_name: blogPostData.author_name,
            author_type: blogPostData.author_type || 'editor',
            published_at: blogPostData.published_at || blogPostData.created_at,
            updated_at: blogPostData.updated_at || blogPostData.published_at || blogPostData.created_at,
            word_count: blogPostData.word_count,
            specialist_id: blogPostData.specialist_id,
            keywords: blogPostData.keywords || null,
            specialists: null,
          }
        : {
            id: legacyBlogData.id,
            title: legacyBlogData.title,
            content: legacyBlogData.content,
            excerpt: legacyBlogData.excerpt,
            featured_image: legacyBlogData.featured_image,
            slug: legacyBlogData.slug,
            author_name: legacyBlogData.author_name || 'Editör',
            author_type: (legacyBlogData.author_name === 'Admin' || legacyBlogData.author_name === 'admin') ? 'admin' : 'editor',
            published_at: legacyBlogData.updated_at || legacyBlogData.created_at,
            updated_at: legacyBlogData.updated_at || legacyBlogData.created_at,
            word_count: legacyBlogData.content ? String(legacyBlogData.content).split(/\s+/).filter(Boolean).length : null,
            specialist_id: null,
            keywords: legacyBlogData.tags ? (Array.isArray(legacyBlogData.tags) ? legacyBlogData.tags.join(', ') : legacyBlogData.tags) : null,
            specialists: null,
          };

      // Uzman tarafından yazılmış bloglarda uzmanlık bilgisini tamamla
      if (blogPostData?.author_type === 'specialist' && blogPostData.author_id) {
        const { data: specialistData } = await supabase
          .from('specialists')
          .select('specialty')
          .eq('user_id', blogPostData.author_id)
          .maybeSingle();

        normalizedBlog.specialists = specialistData ? { specialty: specialistData.specialty } : null;
      }

      setBlog(normalizedBlog);

      // Fetch related posts (same table, random 3 posts excluding current)
      const { data: relatedData } = await supabase
        .from('blog_posts')
        .select('id, title, slug, featured_image, excerpt, published_at')
        .eq('status', 'published')
        .neq('slug', slug)
        .order('published_at', { ascending: false })
        .limit(6);

      if (relatedData && relatedData.length > 0) {
        // Shuffle and pick 3
        const shuffled = relatedData.sort(() => 0.5 - Math.random());
        setRelatedPosts(shuffled.slice(0, 3).map((p: any) => ({
          id: p.id,
          title: p.title,
          slug: p.slug,
          featured_image: p.featured_image,
          excerpt: p.excerpt,
          published_at: p.published_at,
        })));
      }

      // specialist_id varsa uzman kartını göster
      if (normalizedBlog.specialist_id) {
        const { data: specialistData } = await supabase
          .from('specialists')
          .select('id, name, specialty, city, experience, bio, profile_picture, online_consultation, face_to_face_consultation')
          .eq('id', normalizedBlog.specialist_id)
          .maybeSingle();

        if (specialistData) {
          setSpecialist(specialistData);
        }
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

  const getReadTime = (wordCount: number | null) => {
    if (!wordCount) return "5 dakika";
    const minutes = Math.ceil(wordCount / 200);
    return `${minutes} dakika`;
  };

  const shareUrl = window.location.href;
  const shareTitle = blog?.title || "";
  const shareDescription = blog?.excerpt || "";

  const handleShare = (platform: string) => {
    let url = "";
    
    switch (platform) {
      case "facebook":
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
      case "twitter":
        url = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`;
        break;
      case "linkedin":
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
        break;
      default:
        return;
    }
    
    window.open(url, '_blank', 'width=600,height=400');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <HorizontalNavigation />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Blog yazısı yükleniyor...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen bg-gray-50">
        <HorizontalNavigation />
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="text-center py-20">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Blog Yazısı Bulunamadı</h1>
            <p className="text-gray-600 mb-6">Aradığınız blog yazısı bulunamadı veya yayından kaldırılmış olabilir.</p>
            <Button asChild>
              <Link to="/blog">Blog Sayfasına Dön</Link>
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

const ogImage = blog.featured_image || 'https://doktorumol.com.tr/logo.png';
  const ogDescription = blog.excerpt || blog.title;

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>{blog.title} | Doktorum Ol Blog</title>
        <meta name="description" content={ogDescription} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`https://doktorumol.com.tr/blog/${blog.slug}`} />
        <meta property="og:title" content={blog.title} />
        <meta property="og:description" content={ogDescription} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:site_name" content="Doktorum Ol" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@Doktorum_Ol" />
        <meta name="twitter:title" content={blog.title} />
        <meta name="twitter:description" content={ogDescription} />
        <meta name="twitter:image" content={ogImage} />
        
        {/* Article specific */}
        <meta property="article:published_time" content={blog.published_at} />
        <meta property="article:author" content={blog.author_name} />
        
        {/* Canonical URL */}
        <link rel="canonical" href={`https://doktorumol.com.tr/blog/${blog.slug}`} />
        
        {/* Preload LCP image */}
        {blog.featured_image && (
          <link rel="preload" as="image" href={blog.featured_image} />
        )}
        
        {/* JSON-LD Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": blog.title,
            "description": ogDescription,
            "image": ogImage,
            "datePublished": blog.published_at,
            "author": {
              "@type": "Person",
              "name": blog.author_name
            },
            "publisher": {
              "@type": "Organization",
              "name": "Doktorum Ol",
              "logo": {
                "@type": "ImageObject",
                "url": "https://doktorumol.com.tr/logo.png"
              }
            },
            "mainEntityOfPage": {
              "@type": "WebPage",
              "@id": `https://doktorumol.com.tr/blog/${blog.slug}`
            }
          })}
        </script>
      </Helmet>
      
      <HorizontalNavigation />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back Button */}
        <div className="mb-6">
          <Button variant="outline" asChild>
            <Link to="/blog">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Blog Sayfasına Dön
            </Link>
          </Button>
        </div>

        {/* Blog Header */}
        <Card className="mb-8">
          <CardContent className="p-0">
            {blog.featured_image && (
              <img
                src={blog.featured_image}
                alt={blog.title}
                className="w-full h-64 md:h-80 object-cover rounded-t-lg"
                fetchPriority="high"
                loading="eager"
                decoding="async"
                width={800}
                height={320}
              />
            )}
            <div className="p-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">
                    {blog.author_name === 'Admin' || blog.author_name === 'admin' 
                      ? 'İçerik'
                      : blog.author_type === 'admin' || blog.author_type === 'staff' || blog.author_type === 'editor' 
                        ? 'Editör' 
                        : blog.author_type === 'specialist' && blog.specialists?.specialty
                          ? blog.specialists.specialty
                          : blog.author_name}
                  </span>
                </div>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {blog.title}
              </h1>

              {blog.excerpt && (
                <p className="text-lg text-gray-600 mb-6">
                  {blog.excerpt}
                </p>
              )}

              <div className="flex items-center gap-6 text-sm text-gray-500 border-t pt-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(blog.published_at).toLocaleDateString('tr-TR')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{getReadTime(blog.word_count)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Blog Content */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <SafeHtmlContent 
              content={blog.content.replace(/\n/g, '<br>')}
              className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-blue-600 prose-strong:text-gray-900"
            />
            
            {/* Specialist Card - Show when blog has associated specialist */}
            {specialist && (
              <BlogSpecialistCard specialist={specialist} />
            )}
          </CardContent>
        </Card>

        {/* Author & Share Section */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              {/* Author Info */}
              <div>
                <h3 className="font-semibold text-lg mb-2">
                  {blog.author_name === 'Admin' || blog.author_name === 'admin' 
                    ? 'İçerik'
                    : blog.author_type === 'specialist' 
                      ? blog.author_name
                      : (blog.author_type === 'admin' || blog.author_type === 'staff' || blog.author_type === 'editor' 
                        ? 'Editör' 
                        : blog.author_name)}
                </h3>
              </div>
              
              {/* Share Buttons */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Share2 className="w-4 h-4" />
                  Sosyal Medyada Paylaş:
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShare('facebook')}
                    className="text-blue-600 hover:bg-blue-50"
                  >
                    <Facebook className="w-4 h-4 mr-1" />
                    Facebook
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShare('twitter')}
                    className="text-blue-400 hover:bg-blue-50"
                  >
                    <Twitter className="w-4 h-4 mr-1" />
                    Twitter
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShare('linkedin')}
                    className="text-blue-700 hover:bg-blue-50"
                  >
                    <Linkedin className="w-4 h-4 mr-1" />
                    LinkedIn
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
};

export default BlogDetail;
