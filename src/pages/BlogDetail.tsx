
import { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Clock, User, Share2, Facebook, Twitter, Linkedin, MessageCircle, List } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { HorizontalNavigation } from "@/components/HorizontalNavigation";
import Footer from "@/components/Footer";
import BlogSpecialistCard from "@/components/BlogSpecialistCard";
import { Helmet } from "react-helmet-async";
import { SafeHtmlContent } from "@/components/SafeHtmlContent";
import { Capacitor } from "@capacitor/core";

const isNativeApp = Capacitor.isNativePlatform();

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
  seo_title: string | null;
  seo_description: string | null;
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

interface TocItem {
  id: string;
  text: string;
  level: number;
}

// Extract headings from HTML content for TOC
const extractHeadings = (html: string): TocItem[] => {
  const headingRegex = /<h([2-3])[^>]*>(.*?)<\/h[2-3]>/gi;
  const headings: TocItem[] = [];
  let match;
  while ((match = headingRegex.exec(html)) !== null) {
    const text = match[2].replace(/<[^>]*>/g, '').trim();
    if (text) {
      const id = text
        .toLowerCase()
        .replace(/[^a-z0-9\u00e7\u011f\u0131\u00f6\u015f\u00fc\s-]/g, '')
        .replace(/\s+/g, '-')
        .slice(0, 60);
      headings.push({ id, text, level: parseInt(match[1]) });
    }
  }
  return headings;
};

// Extract FAQ pairs from content (H2/H3 followed by paragraph)
const extractFaqFromContent = (html: string): { question: string; answer: string }[] => {
  const faqRegex = /<h[2-3][^>]*>(.*?)<\/h[2-3]>\s*(?:<[^h][^>]*>)*([\s\S]*?)(?=<h[2-3]|$)/gi;
  const faqs: { question: string; answer: string }[] = [];
  let match;
  while ((match = faqRegex.exec(html)) !== null) {
    const question = match[1].replace(/<[^>]*>/g, '').trim();
    const answer = match[2].replace(/<[^>]*>/g, '').trim();
    if (question && answer && answer.length > 20 && question.length < 200) {
      faqs.push({ question, answer: answer.slice(0, 500) });
    }
  }
  return faqs.slice(0, 10); // Max 10 FAQ items
};

// Add IDs to headings in HTML for anchor links
const addHeadingIds = (html: string): string => {
  return html.replace(/<h([2-3])([^>]*)>(.*?)<\/h[2-3]>/gi, (match, level, attrs, content) => {
    const text = content.replace(/<[^>]*>/g, '').trim();
    const id = text
      .toLowerCase()
      .replace(/[^a-z0-9\u00e7\u011f\u0131\u00f6\u015f\u00fc\s-]/g, '')
      .replace(/\s+/g, '-')
      .slice(0, 60);
    return `<h${level}${attrs} id="${id}">${content}</h${level}>`;
  });
};

const BlogDetail = () => {
  const { slug } = useParams();
  const { toast } = useToast();
  const [blog, setBlog] = useState<BlogPost | null>(null);
  const [specialist, setSpecialist] = useState<Specialist | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<RelatedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [tocOpen, setTocOpen] = useState(false);

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

  // Memoized TOC and FAQ extraction
  const tocItems = useMemo(() => blog ? extractHeadings(blog.content) : [], [blog]);
  const faqItems = useMemo(() => blog ? extractFaqFromContent(blog.content) : [], [blog]);
  const processedContent = useMemo(() => blog ? addHeadingIds(blog.content.replace(/\n/g, '<br>')) : '', [blog]);

  const shareUrl = typeof window !== 'undefined' ? `https://doktorumol.com.tr/blog/${blog?.slug || ''}` : '';
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
      case "whatsapp":
        url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareTitle + ' ' + shareUrl)}`;
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
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="bg-white rounded-lg p-0 mb-8">
            <div style={{ height: '320px', background: '#f0f0f0', borderRadius: '8px 8px 0 0' }}></div>
            <div style={{ padding: '2rem' }}>
              <div style={{ height: '2rem', background: '#f0f0f0', borderRadius: '4px', marginBottom: '1rem', width: '60%' }}></div>
              <div style={{ height: '1rem', background: '#f0f0f0', borderRadius: '4px', marginBottom: '0.5rem' }}></div>
              <div style={{ height: '1rem', background: '#f0f0f0', borderRadius: '4px', width: '80%' }}></div>
            </div>
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
        <meta property="article:modified_time" content={blog.updated_at} />
        <meta property="article:author" content={blog.author_name} />
        {blog.keywords && <meta name="keywords" content={blog.keywords} />}
        
        {/* Canonical URL */}
        <link rel="canonical" href={`https://doktorumol.com.tr/blog/${blog.slug}`} />
        
        {/* Preload LCP image */}
        {blog.featured_image && (
          <link rel="preload" as="image" href={blog.featured_image} />
        )}
        
        {/* JSON-LD Article Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": blog.title,
            "description": ogDescription,
            "image": ogImage,
            "datePublished": blog.published_at,
            "dateModified": blog.updated_at,
            "wordCount": blog.word_count || undefined,
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
        
        {/* JSON-LD BreadcrumbList */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Ana Sayfa", "item": "https://doktorumol.com.tr/" },
              { "@type": "ListItem", "position": 2, "name": "Blog", "item": "https://doktorumol.com.tr/blog" },
              { "@type": "ListItem", "position": 3, "name": blog.title, "item": `https://doktorumol.com.tr/blog/${blog.slug}` }
            ]
          })}
        </script>

        {/* JSON-LD FAQPage - extracted from content headings */}
        {faqItems.length >= 2 && (
          <script type="application/ld+json">
            {JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": faqItems.map(faq => ({
                "@type": "Question",
                "name": faq.question,
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": faq.answer
                }
              }))
            })}
          </script>
        )}
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
                  <span>{getReadTime(blog.word_count)} okuma</span>
                </div>
                {blog.word_count && (
                  <div className="text-muted-foreground">
                    {blog.word_count.toLocaleString('tr-TR')} kelime
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table of Contents */}
        {tocItems.length >= 3 && (
          <Card className="mb-8 border-blue-100 bg-blue-50/30">
            <CardContent className="p-6">
              <button 
                onClick={() => setTocOpen(!tocOpen)}
                className="flex items-center gap-2 w-full text-left font-semibold text-gray-900 text-lg"
              >
                <List className="w-5 h-5 text-blue-600" />
                İçindekiler
                <span className="ml-auto text-sm text-gray-500">{tocOpen ? '▲' : '▼'}</span>
              </button>
              {tocOpen && (
                <nav className="mt-4 space-y-1" aria-label="İçindekiler">
                  {tocItems.map((item, index) => (
                    <a
                      key={index}
                      href={`#${item.id}`}
                      className={`block text-blue-700 hover:text-blue-900 hover:underline transition-colors ${
                        item.level === 3 ? 'pl-4 text-sm' : 'text-base font-medium'
                      }`}
                      onClick={(e) => {
                        e.preventDefault();
                        const el = document.getElementById(item.id);
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }}
                    >
                      {item.text}
                    </a>
                  ))}
                </nav>
              )}
            </CardContent>
          </Card>
        )}

        {/* Blog Content */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <SafeHtmlContent 
              content={processedContent}
              className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-blue-600 prose-strong:text-gray-900 prose-headings:scroll-mt-20"
            />
            
            {specialist && (
              <BlogSpecialistCard specialist={specialist} />
            )}

            {/* Tıbbi Disclaimer (Apple guideline 1.4.1) - sadece native app'de göster */}
            {isNativeApp && (<>
            <div className="mt-8 p-4 rounded-lg bg-amber-50 border border-amber-200">
              <p className="text-sm text-amber-900 leading-relaxed">
                <strong>⚕️ Tıbbi Uyarı:</strong> Bu yazıdaki bilgiler genel bilgilendirme amaçlıdır ve profesyonel tıbbi tavsiye,
                tanı veya tedavi yerine geçmez. Sağlığınızla ilgili herhangi bir karar almadan önce mutlaka uzman bir hekime
                danışın. Acil durumlarda 112'yi arayın.
              </p>
            </div>

            {/* Kaynaklar (Apple guideline 1.4.1 - citations) */}
            <div className="mt-6 p-5 rounded-lg bg-blue-50 border border-blue-100">
              <h3 className="font-semibold text-gray-900 mb-3 text-base">📚 Kaynaklar ve Referanslar</h3>
              <ul className="text-sm text-gray-700 space-y-2 list-disc list-inside">
                <li>
                  T.C. Sağlık Bakanlığı —{" "}
                  <a href="https://www.saglik.gov.tr" target="_blank" rel="noopener noreferrer nofollow" className="text-blue-700 underline">
                    saglik.gov.tr
                  </a>
                </li>
                <li>
                  Dünya Sağlık Örgütü (WHO) —{" "}
                  <a href="https://www.who.int" target="_blank" rel="noopener noreferrer nofollow" className="text-blue-700 underline">
                    who.int
                  </a>
                </li>
                <li>
                  PubMed / National Library of Medicine —{" "}
                  <a href="https://pubmed.ncbi.nlm.nih.gov" target="_blank" rel="noopener noreferrer nofollow" className="text-blue-700 underline">
                    pubmed.ncbi.nlm.nih.gov
                  </a>
                </li>
                <li>
                  Türkiye Psikiyatri Derneği —{" "}
                  <a href="https://www.psikiyatri.org.tr" target="_blank" rel="noopener noreferrer nofollow" className="text-blue-700 underline">
                    psikiyatri.org.tr
                  </a>
                </li>
                <li>İçerik, ilgili branştaki uzman görüşleri ve güncel literatür taraması ile hazırlanmıştır.</li>
              </ul>
            </div>
            </>)}
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
                  Paylaş:
                </span>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShare('whatsapp')}
                    className="text-green-700 border-green-700 hover:bg-green-50"
                  >
                    <MessageCircle className="w-4 h-4 mr-1" />
                    WhatsApp
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShare('facebook')}
                    className="text-blue-700 border-blue-700 hover:bg-blue-50"
                  >
                    <Facebook className="w-4 h-4 mr-1" />
                    Facebook
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShare('twitter')}
                    className="text-gray-800 border-gray-800 hover:bg-gray-50"
                  >
                    <Twitter className="w-4 h-4 mr-1" />
                    Twitter
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShare('linkedin')}
                    className="text-blue-800 border-blue-800 hover:bg-blue-50"
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

      {/* İlgili Yazılar / Related Posts */}
      {relatedPosts.length > 0 && (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">İlgili Yazılar</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {relatedPosts.map((post) => (
              <Link key={post.id} to={`/blog/${post.slug}`} className="group">
                <Card className="overflow-hidden border border-gray-200 hover:shadow-lg transition-all duration-300 bg-white rounded-xl h-full">
                  <CardContent className="p-0">
                    {post.featured_image ? (
                      <div className="relative overflow-hidden h-40">
                        <img
                          src={post.featured_image}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      </div>
                    ) : (
                      <div className="h-40 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <div className="text-4xl opacity-20">📝</div>
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="font-bold text-sm mb-2 line-clamp-2 text-gray-900 group-hover:text-blue-600 transition-colors">
                        {post.title}
                      </h3>
                      {post.excerpt && (
                        <p className="text-gray-600 text-xs line-clamp-2">{post.excerpt}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default BlogDetail;
