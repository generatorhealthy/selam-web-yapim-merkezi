
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
  word_count: number | null;
  specialists?: {
    specialty: string;
  } | null;
}

const BlogDetail = () => {
  const { slug } = useParams();
  const { toast } = useToast();
  const [blog, setBlog] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      fetchBlog();
    }
  }, [slug]);

  const fetchBlog = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .single();

      if (error) {
        console.error('Blog yazısı çekilirken hata:', error);
        if (error.code === 'PGRST116') {
          // Blog not found
          setBlog(null);
        } else {
          toast({
            title: "Hata",
            description: "Blog yazısı yüklenirken bir hata oluştu.",
            variant: "destructive"
          });
        }
        return;
      }

      // Eğer specialist yazarsa, uzmanlık bilgisini al
      let blogWithSpecialist = data as any;
      if (data.author_type === 'specialist' && data.author_id) {
        const { data: specialistData } = await supabase
          .from('specialists')
          .select('specialty')
          .eq('user_id', data.author_id)
          .single();
        
        blogWithSpecialist = {
          ...data,
          specialists: specialistData ? { specialty: specialistData.specialty } : null
        };
      }

      setBlog(blogWithSpecialist);
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

  return (
    <div className="min-h-screen bg-gray-50">
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
              />
            )}
            <div className="p-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">
                    {blog.author_type === 'admin' || blog.author_type === 'staff' || blog.author_type === 'editor' 
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
            <div 
              className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-blue-600 prose-strong:text-gray-900"
              dangerouslySetInnerHTML={{ __html: blog.content.replace(/\n/g, '<br>') }}
            />
          </CardContent>
        </Card>

        {/* Author & Share Section */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              {/* Author Info */}
              <div>
                <h3 className="font-semibold text-lg mb-2">
                  {blog.author_type === 'admin' || blog.author_type === 'staff' || blog.author_type === 'editor' 
                    ? 'Editör' 
                    : blog.author_type === 'specialist' && blog.specialists?.specialty
                      ? blog.specialists.specialty
                      : blog.author_name}
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
