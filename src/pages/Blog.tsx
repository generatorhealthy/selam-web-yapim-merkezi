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
  created_at: string;
  updated_at: string;
  status: string;
  meta_title: string | null;
  meta_description: string | null;
  tags: string[] | null;
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

      // Yayınlanan blogları blogs ve blog_posts tablolarından paralel çek
      const [blogsRes, blogPostsRes] = await Promise.all([
        supabase
          .from('blogs')
          .select('id,title,content,excerpt,featured_image,slug,author_name,created_at,updated_at,status,meta_title,meta_description,tags')
          .eq('status', 'published')
          .order('created_at', { ascending: false })
          .range(from, to),
        supabase
          .from('blog_posts')
          .select('id,title,content,excerpt,featured_image,slug,author_name,published_at,created_at,status,seo_title,seo_description,keywords')
          .eq('status', 'published')
          .order('published_at', { ascending: false })
          .range(from, to)
      ]);

      if (blogsRes.error || blogPostsRes.error) {
        console.error('Blog yazıları çekilirken hata:', blogsRes.error || blogPostsRes.error);
        toast({
          title: "Hata",
          description: "Blog yazıları yüklenirken bir hata oluştu.",
          variant: "destructive"
        });
        return;
      }

      const blogsData = (blogsRes.data as BlogPost[]) || [];

      // blog_posts kayıtlarını BlogPost şekline map'le (özellikle staff yazıları için)
      const mappedFromBlogPosts: BlogPost[] = (blogPostsRes.data || []).map((p: any) => ({
        id: p.id,
        title: p.title,
        content: p.content,
        excerpt: p.excerpt ?? null,
        featured_image: p.featured_image ?? null,
        slug: p.slug,
        author_name: p.author_name,
        created_at: p.published_at || p.created_at,
        updated_at: p.published_at || p.created_at,
        status: p.status,
        meta_title: p.seo_title ?? null,
        meta_description: p.seo_description ?? null,
        tags: p.keywords ? String(p.keywords).split(',').map((t: string) => t.trim()) : null,
      }));

      // Önce birleşik listeyi oluştur, sonra slug bazında tekilleştir ve eksik görseli blog_posts'dan doldur
      const combinedRaw = [...blogsData, ...mappedFromBlogPosts];
      const bySlug = new Map<string, BlogPost>();
      combinedRaw.forEach((item) => {
        const existing = bySlug.get(item.slug);
        if (!existing) {
          bySlug.set(item.slug, item);
        } else {
          bySlug.set(item.slug, {
            ...existing,
            featured_image: existing.featured_image || item.featured_image || null,
            excerpt: existing.excerpt ?? item.excerpt ?? null,
            meta_title: existing.meta_title ?? item.meta_title ?? null,
            meta_description: existing.meta_description ?? item.meta_description ?? null,
            tags: existing.tags ?? item.tags ?? null,
            created_at: existing.created_at || item.created_at,
          });
        }
      });

      const mergedList = Array.from(bySlug.values()).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setBlogs((prev) => {
        const base = isInitial ? [] : prev;
        const nextCombined = [...base, ...mergedList];
        const uniqueBySlug = new Map<string, BlogPost>();
        nextCombined.forEach((b) => {
          const exist = uniqueBySlug.get(b.slug);
          if (!exist) uniqueBySlug.set(b.slug, b);
        });
        return Array.from(uniqueBySlug.values());
      });

      // En az bir kaynaktan tam sayfa geldiyse devam var kabul edelim
      const hasMoreFromEither = ((blogsData.length || 0) === POSTS_PER_PAGE) || ((mappedFromBlogPosts.length || 0) === POSTS_PER_PAGE);
      setHasMore(hasMoreFromEither);

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
    // Check if it's admin content
    if (blog.author_name === 'Admin' || blog.author_name === 'admin') {
      return "İçerik";
    }
    
    // If the author_name is not a standard editor name, it's likely a specialist
    if (blog.author_name && !['Editör', 'Staff Editörü', 'Doktorum Ol', 'Admin', 'admin'].includes(blog.author_name)) {
      return blog.author_name;
    }
    return "Editör";
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20">
      <HorizontalNavigation />
      
      {/* Modern Header Section */}
      <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/10"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/10"></div>
        <div className="container mx-auto px-4 py-20 text-center max-w-4xl relative z-10">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 animate-fade-in">
            Blog
          </h1>
          <p className="text-white/90 text-lg md:text-xl max-w-2xl mx-auto">
            Psikoloji ve danışmanlık dünyasından güncel içerikler, uzman görüşleri ve faydalı bilgiler
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-7xl">
        {/* Enhanced Search Section */}
        <div className="mb-12 -mt-8">
          <div className="max-w-2xl mx-auto">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
              <div className="relative bg-white rounded-2xl shadow-xl border border-gray-100">
                <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Blog yazılarında ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-14 pr-6 py-6 border-0 rounded-2xl text-lg focus:ring-2 focus:ring-blue-500 bg-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Blog Content */}
        {filteredBlogs.length === 0 ? (
          <div className="text-center py-20">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                <Search className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                {searchTerm ? "Sonuç Bulunamadı" : "Blog Yazısı Bulunamadı"}
              </h3>
              <p className="text-gray-600 text-lg">
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
                <div className="flex items-center gap-3 mb-8">
                  <div className="h-1 w-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"></div>
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Son Yazı
                  </h2>
                </div>
                <Card className="overflow-hidden border-0 shadow-2xl hover:shadow-3xl transition-all duration-500 group bg-white">
                  <div className="md:flex">
                    {filteredBlogs[0].featured_image && (
                      <div className="md:w-1/2 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10"></div>
                        <img
                          src={filteredBlogs[0].featured_image}
                          alt={filteredBlogs[0].title}
                          className="w-full h-80 md:h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                        />
                      </div>
                    )}
                    <div className={`${filteredBlogs[0].featured_image ? 'md:w-1/2' : 'w-full'} p-10`}>
                      <div className="flex items-center gap-3 mb-6">
                        <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 px-4 py-1 text-sm font-semibold">
                          {getAuthorTypeText(filteredBlogs[0])}
                        </Badge>
                        <span className="text-sm text-gray-600 font-medium">
                          {filteredBlogs[0].author_name}
                        </span>
                      </div>
                      
                      <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight group-hover:text-blue-600 transition-colors">
                        {filteredBlogs[0].title}
                      </h3>
                      
                      {filteredBlogs[0].excerpt && (
                        <p className="text-gray-600 mb-8 leading-relaxed text-lg">
                          {filteredBlogs[0].excerpt}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-6 text-sm text-gray-500 mb-8">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-blue-50 rounded-lg">
                            <Calendar className="w-4 h-4 text-blue-600" />
                          </div>
                          <span className="font-medium">{new Date(filteredBlogs[0].created_at).toLocaleDateString('tr-TR')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-purple-50 rounded-lg">
                            <Clock className="w-4 h-4 text-purple-600" />
                          </div>
                          <span className="font-medium">5 dakika</span>
                        </div>
                      </div>
                      
                      <Button asChild className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all">
                        <Link to={`/blog/${filteredBlogs[0].slug}`}>
                          Devamını Oku →
                        </Link>
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* Other Posts - Enhanced Grid Layout */}
            <div>
              <div className="flex items-center gap-3 mb-8">
                <div className="h-1 w-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full"></div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {searchTerm ? 'Arama Sonuçları' : 'Diğer Yazılar'}
                </h2>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {(searchTerm ? filteredBlogs : filteredBlogs.slice(1)).map((blog) => (
                  <Card key={blog.id} className="overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 group bg-white transform hover:-translate-y-2">
                    <CardContent className="p-0">
                      {blog.featured_image ? (
                        <div className="relative overflow-hidden h-56">
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10"></div>
                          <img
                            src={blog.featured_image}
                            alt={blog.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          />
                        </div>
                      ) : (
                        <div className="h-56 bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 flex items-center justify-center">
                          <div className="text-6xl opacity-20">📝</div>
                        </div>
                      )}
                      
                      <div className="p-6">
                        <div className="flex items-center gap-2 mb-4">
                          <Badge variant="outline" className="border-blue-200 text-blue-700 font-semibold">
                            {getAuthorTypeText(blog)}
                          </Badge>
                        </div>

                        <h3 className="font-bold text-xl mb-4 line-clamp-2 text-gray-900 group-hover:text-blue-600 transition-colors leading-tight">
                          {blog.title}
                        </h3>
                        
                        {blog.excerpt && (
                          <p className="text-gray-600 text-sm mb-5 line-clamp-3 leading-relaxed">
                            {blog.excerpt}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-5 pb-5 border-b border-gray-100">
                          <div className="flex items-center gap-1.5 font-medium">
                            <User className="w-3.5 h-3.5" />
                            <span>{blog.author_name}</span>
                          </div>
                          <div className="flex items-center gap-1.5 font-medium">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{new Date(blog.created_at).toLocaleDateString('tr-TR')}</span>
                          </div>
                        </div>
                        
                        <Button asChild variant="ghost" className="w-full bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 text-blue-700 font-semibold rounded-xl h-12 group-hover:shadow-md transition-all">
                          <Link to={`/blog/${blog.slug}`} className="flex items-center justify-center gap-2">
                            Devamını Oku 
                            <span className="group-hover:translate-x-1 transition-transform">→</span>
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

        {/* Enhanced Loading More Posts Indicator */}
        {loadingMore && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 text-base font-medium">Daha fazla blog yazısı yükleniyor...</p>
            </div>
          </div>
        )}
        
        {/* No More Posts Indicator */}
        {!hasMore && filteredBlogs.length > 0 && !searchTerm && (
          <div className="text-center py-12">
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-full">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
              <p className="text-gray-700 font-medium">Tüm blog yazıları gösteriliyor</p>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Blog;
