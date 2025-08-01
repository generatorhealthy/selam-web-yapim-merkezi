import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, Clock, User, Search } from "lucide-react";
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

const Blog = () => {
  const { toast } = useToast();
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  const POSTS_PER_PAGE = 4;

  useEffect(() => {
    fetchBlogs(0, true);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (loadingMore || !hasMore || searchTerm) return;
      
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      
      // Sayfa sonundan 1000px önce yeni içerik yükle
      if (scrollTop + clientHeight >= scrollHeight - 1000) {
        loadMorePosts();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadingMore, hasMore, searchTerm, page]);

  const fetchBlogs = async (pageNum: number = 0, isInitial: boolean = false) => {
    try {
      if (isInitial) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const from = pageNum * POSTS_PER_PAGE;
      const to = from + POSTS_PER_PAGE - 1;

      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .range(from, to);

      if (error) {
        console.error('Blog yazıları çekilirken hata:', error);
        toast({
          title: "Hata",
          description: "Blog yazıları yüklenirken bir hata oluştu.",
          variant: "destructive"
        });
        return;
      }

      // Specialist blog yazıları için uzmanlık bilgilerini al
      const blogsWithSpecialistInfo = await Promise.all(
        (data || []).map(async (blog) => {
          if (blog.author_type === 'specialist' && blog.author_id) {
            const { data: specialistData } = await supabase
              .from('specialists')
              .select('specialty')
              .eq('user_id', blog.author_id)
              .single();
            
            return {
              ...blog,
              specialists: specialistData ? { specialty: specialistData.specialty } : null
            };
          }
          return blog;
        })
      );

      const newBlogs = blogsWithSpecialistInfo as BlogPost[] || [];
      
      if (isInitial) {
        setBlogs(newBlogs);
      } else {
        setBlogs(prev => [...prev, ...newBlogs]);
      }

      // Eğer dönen veri sayısı POSTS_PER_PAGE'den azsa, daha fazla veri yok demektir
      if (newBlogs.length < POSTS_PER_PAGE) {
        setHasMore(false);
      }

      setPage(pageNum);
    } catch (error) {
      console.error('Beklenmeyen hata:', error);
      toast({
        title: "Hata",
        description: "Beklenmeyen bir hata oluştu.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMorePosts = async () => {
    if (!hasMore || loadingMore) return;
    const nextPage = page + 1;
    await fetchBlogs(nextPage, false);
  };

  const filteredBlogs = blogs.filter(blog =>
    blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    blog.author_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (blog.excerpt && blog.excerpt.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getReadTime = (wordCount: number | null) => {
    if (!wordCount) return "5 dakika";
    const minutes = Math.ceil(wordCount / 200);
    return `${minutes} dakika`;
  };

  const getAuthorTypeText = (blog: BlogPost) => {
    if (blog.author_type === "specialist" && blog.specialists?.specialty) {
      return blog.specialists.specialty;
    }
    
    switch (blog.author_type) {
      case "admin": return "Editör";
      case "staff": return "Editör";
      case "editor": return "Editör";
      case "specialist": return "Uzman Doktor";
      default: return blog.author_type;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <HorizontalNavigation />
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Yükleniyor...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <HorizontalNavigation />
      
      {/* Clean Header Section */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="container mx-auto px-4 py-16 text-center max-w-4xl">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-4">
            Blog
          </h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Simple Search */}
        <div className="mb-12">
          <div className="max-w-md mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Blog yazılarında ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 py-3 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Blog Content */}
        {filteredBlogs.length === 0 ? (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {searchTerm ? "Sonuç Bulunamadı" : "Blog Yazısı Bulunamadı"}
              </h3>
              <p className="text-gray-600">
                {searchTerm 
                  ? "Arama kriterlerine uygun blog yazısı bulunamadı." 
                  : "Henüz yayınlanmış blog yazısı bulunmamaktadır."
                }
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Latest Post - Large Featured */}
            {!searchTerm && filteredBlogs.length > 0 && (
              <div className="mb-16">
                <div className="border-b border-gray-200 pb-4 mb-8">
                  <h2 className="text-2xl font-serif font-bold text-gray-900">Son Yazı</h2>
                </div>
                <Card className="overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="md:flex">
                    {filteredBlogs[0].featured_image && (
                      <div className="md:w-1/2">
                        <img
                          src={filteredBlogs[0].featured_image}
                          alt={filteredBlogs[0].title}
                          className="w-full h-64 md:h-full object-cover"
                        />
                      </div>
                    )}
                    <div className={`${filteredBlogs[0].featured_image ? 'md:w-1/2' : 'w-full'} p-8`}>
                      <div className="flex items-center gap-2 mb-4">
                        <Badge variant="secondary" className="text-xs font-medium">
                          {getAuthorTypeText(filteredBlogs[0])}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {filteredBlogs[0].author_type === 'admin' || filteredBlogs[0].author_type === 'staff' || filteredBlogs[0].author_type === 'editor' ? 'Editör' : filteredBlogs[0].author_name}
                        </span>
                      </div>
                      
                      <h3 className="text-2xl md:text-3xl font-serif font-bold text-gray-900 mb-4 leading-tight">
                        {filteredBlogs[0].title}
                      </h3>
                      
                      {filteredBlogs[0].excerpt && (
                        <p className="text-gray-600 mb-6 leading-relaxed text-lg">
                          {filteredBlogs[0].excerpt}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(filteredBlogs[0].published_at).toLocaleDateString('tr-TR')}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{getReadTime(filteredBlogs[0].word_count)}</span>
                        </div>
                      </div>
                      
                      <Button asChild variant="default" className="bg-gray-900 hover:bg-gray-800 text-white">
                        <Link to={`/blog/${filteredBlogs[0].slug}`}>
                          Devamını Oku
                        </Link>
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* Other Posts - Grid Layout */}
            <div>
              <div className="border-b border-gray-200 pb-4 mb-8">
                <h2 className="text-2xl font-serif font-bold text-gray-900">
                  {searchTerm ? 'Arama Sonuçları' : 'Diğer Yazılar'}
                </h2>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {(searchTerm ? filteredBlogs : filteredBlogs.slice(1)).map((blog) => (
                  <Card key={blog.id} className="overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-shadow group">
                    <CardContent className="p-0">
                      {blog.featured_image && (
                        <div className="relative overflow-hidden">
                          <img
                            src={blog.featured_image}
                            alt={blog.title}
                            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      )}
                      
                      <div className="p-6">
                        <div className="flex items-center gap-2 mb-3">
                          <Badge variant="outline" className="text-xs">
                            {getAuthorTypeText(blog)}
                          </Badge>
                        </div>

                        <h3 className="font-serif font-semibold text-lg mb-3 line-clamp-2 text-gray-900 group-hover:text-blue-600 transition-colors">
                          {blog.title}
                        </h3>
                        
                        {blog.excerpt && (
                          <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed">
                            {blog.excerpt}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                          <div className="flex items-center gap-1">
                            <span>
                              {blog.author_type === 'admin' || blog.author_type === 'staff' || blog.author_type === 'editor' ? 'Editör' : blog.author_name}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(blog.published_at).toLocaleDateString('tr-TR')}</span>
                          </div>
                        </div>
                        
                        <Button asChild variant="ghost" className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-medium p-0 h-auto py-2">
                          <Link to={`/blog/${blog.slug}`}>
                            Devamını Oku →
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Loading More Posts Indicator */}
        {loadingMore && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-gray-500 text-sm">Daha fazla blog yazısı yükleniyor...</p>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Blog;
