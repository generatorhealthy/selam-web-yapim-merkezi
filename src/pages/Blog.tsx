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
    (blog.excerpt && blog.excerpt.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (blog.content && blog.content.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (blog.tags && blog.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
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
    <div className="min-h-screen bg-gray-50">
      <HorizontalNavigation />
      
      {/* Clean Simple Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-16 text-center max-w-4xl">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">
            Blog
          </h1>
          <p className="text-gray-600 text-lg md:text-xl max-w-2xl mx-auto">
            Psikoloji ve danışmanlık dünyasından güncel içerikler, uzman görüşleri ve faydalı bilgiler
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-7xl">
        {/* Clean Search Section */}
        <div className="mb-12">
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Blog yazılarında ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-6 py-6 border-gray-300 rounded-xl text-base shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Blog Content */}
        {filteredBlogs.length === 0 ? (
          <div className="text-center py-20">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                <Search className="w-10 h-10 text-gray-400" />
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
        ) : searchTerm ? (
          // Search Results Grid
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Arama Sonuçları</h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBlogs.map((blog) => (
                <Link key={blog.id} to={`/blog/${blog.slug}`} className="group">
                  <Card className="overflow-hidden border border-gray-200 hover:shadow-lg transition-all duration-300 bg-white rounded-xl h-full">
                    <CardContent className="p-0">
                      {blog.featured_image ? (
                        <div className="relative overflow-hidden h-48">
                          <img
                            src={blog.featured_image}
                            alt={blog.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                      ) : (
                        <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                          <div className="text-5xl opacity-20">📝</div>
                        </div>
                      )}
                      
                      <div className="p-5">
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                          <span className="font-medium">{blog.author_name}</span>
                          <span>•</span>
                          <span>5 dakika okuma</span>
                        </div>

                        <h3 className="font-bold text-lg mb-3 line-clamp-2 text-gray-900 group-hover:text-blue-600 transition-colors">
                          {blog.title}
                        </h3>
                        
                        {blog.excerpt && (
                          <p className="text-gray-600 text-sm line-clamp-2 mb-4">
                            {blog.excerpt}
                          </p>
                        )}

                        <div className="flex items-center text-xs text-gray-500">
                          <Calendar className="w-3.5 h-3.5 mr-1" />
                          <span>{new Date(blog.created_at).toLocaleDateString('tr-TR')}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          // Two Column Layout: Featured + Recent Posts
          <div className="grid lg:grid-cols-12 gap-12">
            {/* FEATURED - Left Column */}
            <div className="lg:col-span-7">
              <div className="mb-6">
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">FEATURED</h2>
              </div>
              
              {filteredBlogs.length > 0 && (
                <Link to={`/blog/${filteredBlogs[0].slug}`} className="group block">
                  <Card className="overflow-hidden border border-gray-200 hover:shadow-xl transition-all duration-300 bg-white rounded-2xl">
                    <CardContent className="p-0">
                      {filteredBlogs[0].featured_image && (
                        <div className="relative overflow-hidden aspect-video">
                          <img
                            src={filteredBlogs[0].featured_image}
                            alt={filteredBlogs[0].title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                      )}
                      
                      <div className="p-8">
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                          <span className="font-medium">{filteredBlogs[0].author_name}</span>
                          <span>•</span>
                          <span>5 min read</span>
                        </div>
                        
                        <h3 className="text-3xl font-bold text-gray-900 mb-4 leading-tight group-hover:text-blue-600 transition-colors">
                          {filteredBlogs[0].title}
                        </h3>
                        
                        {filteredBlogs[0].excerpt && (
                          <p className="text-gray-600 text-base mb-6 leading-relaxed line-clamp-3">
                            {filteredBlogs[0].excerpt}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-4">
                          <Badge className="bg-blue-600 text-white border-0 px-3 py-1 rounded-md">
                            {getAuthorTypeText(filteredBlogs[0])}
                          </Badge>
                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="w-4 h-4 mr-1.5" />
                            <span>{new Date(filteredBlogs[0].created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )}
            </div>

            {/* RECENT POSTS - Right Column */}
            <div className="lg:col-span-5">
              <div className="mb-6">
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">RECENT POSTS</h2>
              </div>
              
              <div className="space-y-6">
                {filteredBlogs.slice(1, 4).map((blog) => (
                  <Link key={blog.id} to={`/blog/${blog.slug}`} className="group block">
                    <Card className="overflow-hidden border border-gray-200 hover:shadow-lg transition-all duration-300 bg-white rounded-xl">
                      <CardContent className="p-0">
                        <div className="flex gap-4 p-4">
                          {blog.featured_image && (
                            <div className="flex-shrink-0 w-32 h-32 relative overflow-hidden rounded-lg">
                              <img
                                src={blog.featured_image}
                                alt={blog.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            </div>
                          )}
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                              <span className="font-medium">{blog.author_name}</span>
                              <span>•</span>
                              <span>5 min read</span>
                            </div>
                            
                            <h3 className="font-bold text-base mb-2 line-clamp-2 text-gray-900 group-hover:text-blue-600 transition-colors leading-snug">
                              {blog.title}
                            </h3>
                            
                            {blog.excerpt && (
                              <p className="text-gray-600 text-sm line-clamp-2 mb-3 leading-relaxed">
                                {blog.excerpt}
                              </p>
                            )}
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center text-xs text-gray-500">
                                <Calendar className="w-3.5 h-3.5 mr-1" />
                                <span>{new Date(blog.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                              </div>
                              <div className="text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                →
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* All Other Posts Grid */}
        {!searchTerm && filteredBlogs.length > 4 && (
          <div className="mt-16">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Tüm Yazılar</h2>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBlogs.slice(4).map((blog) => (
                <Link key={blog.id} to={`/blog/${blog.slug}`} className="group">
                  <Card className="overflow-hidden border border-gray-200 hover:shadow-lg transition-all duration-300 bg-white rounded-xl h-full">
                    <CardContent className="p-0">
                      {blog.featured_image ? (
                        <div className="relative overflow-hidden h-48">
                          <img
                            src={blog.featured_image}
                            alt={blog.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                      ) : (
                        <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                          <div className="text-5xl opacity-20">📝</div>
                        </div>
                      )}
                      
                      <div className="p-5">
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                          <span className="font-medium">{blog.author_name}</span>
                          <span>•</span>
                          <span>5 min read</span>
                        </div>

                        <h3 className="font-bold text-lg mb-3 line-clamp-2 text-gray-900 group-hover:text-blue-600 transition-colors">
                          {blog.title}
                        </h3>
                        
                        {blog.excerpt && (
                          <p className="text-gray-600 text-sm line-clamp-2 mb-4">
                            {blog.excerpt}
                          </p>
                        )}

                        <div className="flex items-center text-xs text-gray-500">
                          <Calendar className="w-3.5 h-3.5 mr-1" />
                          <span>{new Date(blog.created_at).toLocaleDateString('tr-TR')}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Loading Indicator */}
        {loadingMore && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 text-base font-medium">Daha fazla blog yazısı yükleniyor...</p>
            </div>
          </div>
        )}
        
        {/* No More Posts */}
        {!hasMore && filteredBlogs.length > 0 && !searchTerm && (
          <div className="text-center py-12">
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 rounded-full">
              <p className="text-gray-600 font-medium">Tüm blog yazıları gösteriliyor</p>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Blog;
