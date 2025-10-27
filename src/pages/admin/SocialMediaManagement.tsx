import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import AdminBackButton from "@/components/AdminBackButton";
import { AdminTopBar } from "@/components/AdminTopBar";
import { Helmet } from "react-helmet-async";
import { 
  Twitter, 
  Linkedin, 
  Pin as Pinterest,
  Ghost,
  ExternalLink,
  Share2,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  FileText
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  featured_image: string | null;
  keywords: string | null;
  created_at: string;
  status: string;
}

interface SocialShare {
  id: string;
  blog_post_id: string;
  platform: string;
  status: 'pending' | 'success' | 'failed';
  shared_at: string | null;
  error_message: string | null;
}

const SocialMediaManagement = () => {
  const { userProfile, loading: userLoading } = useUserRole();
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [shares, setShares] = useState<SocialShare[]>([]);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);

  const platforms = [
    { name: 'Twitter/X', icon: Twitter, key: 'twitter', color: 'text-blue-500' },
    { name: 'LinkedIn', icon: Linkedin, key: 'linkedin', color: 'text-blue-700' },
    { name: 'Pinterest', icon: Pinterest, key: 'pinterest', color: 'text-red-600' },
    { name: 'Ghost', icon: Ghost, key: 'ghost', color: 'text-gray-700' },
    { name: 'Kooplog', icon: ExternalLink, key: 'kooplog', color: 'text-green-600' },
    { name: 'Tumblr', icon: ExternalLink, key: 'tumblr', color: 'text-indigo-600' },
  ];

  useEffect(() => {
    fetchBlogs();
    fetchShares();
  }, []);

  const fetchBlogs = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBlogs(data || []);
    } catch (error) {
      console.error('Blog yüklenirken hata:', error);
      toast.error('Blog yazıları yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const fetchShares = async () => {
    try {
      // Social shares tablosu henüz oluşturulmadığı için boş array döndür
      // TODO: Supabase migration ile social_shares tablosu oluşturulacak
      setShares([]);
    } catch (error) {
      console.error('Paylaşımlar yüklenirken hata:', error);
    }
  };

  const handleShareSingle = async (blogId: string, platform: string) => {
    setSharing(true);
    try {
      const blog = blogs.find(b => b.id === blogId);
      if (!blog) return;

      const { data, error } = await supabase.functions.invoke('share-blog-to-social', {
        body: {
          blogId: blog.id,
          blogTitle: blog.title,
          blogSlug: blog.slug,
          blogContent: blog.content,
          featuredImage: blog.featured_image,
          keywords: blog.keywords,
          platform: platform
        }
      });

      if (error) throw error;

      toast.success(`${blog.title} ${platform} platformunda paylaşıldı`);
      fetchShares();
    } catch (error: any) {
      console.error('Paylaşım hatası:', error);
      toast.error('Paylaşım başarısız: ' + (error.message || 'Bilinmeyen hata'));
    } finally {
      setSharing(false);
    }
  };

  const handleShareAllBlogs = async () => {
    setSharing(true);
    try {
      let successCount = 0;
      let errorCount = 0;

      // Her blog için tüm platformlarda paylaş, 20 dakika aralıklarla
      for (let i = 0; i < blogs.length; i++) {
        const blog = blogs[i];
        
        for (const platform of platforms) {
          try {
            await handleShareSingle(blog.id, platform.key);
            successCount++;
            
            // 20 dakika bekle (geliştirme için 2 saniye)
            if (i < blogs.length - 1 || platform.key !== platforms[platforms.length - 1].key) {
              await new Promise(resolve => setTimeout(resolve, 2000)); // Geliştirme için 2 saniye
            }
          } catch (error) {
            errorCount++;
            console.error(`${blog.title} - ${platform.name} paylaşım hatası:`, error);
          }
        }
      }

      toast.success(`Toplu paylaşım tamamlandı. Başarılı: ${successCount}, Hatalı: ${errorCount}`);
      fetchShares();
    } catch (error) {
      console.error('Toplu paylaşım hatası:', error);
      toast.error('Toplu paylaşım başarısız');
    } finally {
      setSharing(false);
    }
  };

  const getShareStatus = (blogId: string, platform: string) => {
    const share = shares.find(s => s.blog_post_id === blogId && s.platform === platform);
    return share;
  };

  if (userLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!userProfile || !['admin', 'staff'].includes(userProfile.role)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-rose-50 flex items-center justify-center">
        <Card className="p-8">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-center mb-2">Erişim Reddedildi</h2>
          <p className="text-gray-600 text-center">Bu sayfaya erişim yetkiniz bulunmamaktadır.</p>
        </Card>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
        <title>Sosyal Medya Yönetimi - Divan Paneli</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <AdminTopBar userRole={userProfile.role} />
        
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <AdminBackButton to="/divan_paneli/dashboard" />

          <div className="mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-red-600 bg-clip-text text-transparent mb-2">
              Sosyal Medya Paylaşımları
            </h1>
            <p className="text-gray-600">Blog yazılarını sosyal medya platformlarında otomatik paylaşın</p>
          </div>

          {/* Platform Bilgilendirme */}
          <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="w-5 h-5" />
                Önemli Bilgi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 mb-4">
                Sosyal medya platformlarında otomatik paylaşım yapmak için her platformun API anahtarlarına ihtiyaç vardır.
                Modern platformlar güvenlik nedeniyle kullanıcı adı/şifre ile doğrudan API erişimini desteklememektedir.
              </p>
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Gerekli API Anahtarları:</h4>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>• <strong>Twitter/X:</strong> API Key, API Secret, Access Token, Access Token Secret</li>
                  <li>• <strong>LinkedIn:</strong> Client ID, Client Secret, Access Token</li>
                  <li>• <strong>Pinterest:</strong> App ID, App Secret, Access Token</li>
                  <li>• <strong>Ghost:</strong> Admin API Key, API URL</li>
                  <li>• <strong>Tumblr:</strong> OAuth Consumer Key, Consumer Secret, Token, Token Secret</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Toplu Paylaşım Butonu */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Toplu Paylaşım</CardTitle>
              <CardDescription>
                Tüm yayınlanmış blog yazılarını seçili platformlarda paylaşın (20 dakika aralıklarla)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleShareAllBlogs} 
                disabled={sharing || blogs.length === 0}
                className="w-full sm:w-auto"
              >
                {sharing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Paylaşılıyor...
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4 mr-2" />
                    Tüm Blogları Paylaş ({blogs.length} yazı)
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Blog Listesi ve Paylaşım Durumu */}
          <Card>
            <CardHeader>
              <CardTitle>Blog Yazıları ve Paylaşım Durumu</CardTitle>
              <CardDescription>
                Her blog yazısının sosyal medya platformlarındaki paylaşım durumunu görüntüleyin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-4">
                  {blogs.map((blog) => (
                    <Card key={blog.id} className="border-2">
                      <CardHeader>
                        <CardTitle className="text-lg">{blog.title}</CardTitle>
                        <CardDescription className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {new Date(blog.created_at).toLocaleDateString('tr-TR')}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                          {platforms.map((platform) => {
                            const Icon = platform.icon;
                            const shareStatus = getShareStatus(blog.id, platform.key);
                            
                            return (
                              <div key={platform.key} className="space-y-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleShareSingle(blog.id, platform.key)}
                                  disabled={sharing}
                                  className="w-full justify-start"
                                >
                                  <Icon className={`w-4 h-4 mr-2 ${platform.color}`} />
                                  <span className="text-xs">{platform.name}</span>
                                </Button>
                                {shareStatus && (
                                  <div className="flex items-center justify-center">
                                    {shareStatus.status === 'success' && (
                                      <Badge variant="default" className="bg-green-500 text-xs">
                                        <CheckCircle2 className="w-3 h-3 mr-1" />
                                        Paylaşıldı
                                      </Badge>
                                    )}
                                    {shareStatus.status === 'failed' && (
                                      <Badge variant="destructive" className="text-xs">
                                        <XCircle className="w-3 h-3 mr-1" />
                                        Hata
                                      </Badge>
                                    )}
                                    {shareStatus.status === 'pending' && (
                                      <Badge variant="secondary" className="text-xs">
                                        <Clock className="w-3 h-3 mr-1" />
                                        Bekliyor
                                      </Badge>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {blogs.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p>Henüz yayınlanmış blog yazısı bulunmuyor.</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default SocialMediaManagement;
