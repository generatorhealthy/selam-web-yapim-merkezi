import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Download, RefreshCw, Globe, Info, Zap, Clock } from "lucide-react";
import { AdminTopBar } from "@/components/AdminTopBar";
import { generateSitemap, downloadSitemap } from "@/services/sitemapService";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

const SitemapManagement = () => {
  const { toast } = useToast();
  const { userProfile } = useUserRole();
  const [sitemapContent, setSitemapContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastGenerated, setLastGenerated] = useState<Date | null>(null);

  const handleGenerateSitemap = async () => {
    setLoading(true);
    try {
      const sitemap = await generateSitemap();
      setSitemapContent(sitemap);
      setLastGenerated(new Date());
      
      toast({
        title: "Başarılı",
        description: "Sitemap başarıyla oluşturuldu.",
      });
    } catch (error) {
      console.error('Error generating sitemap:', error);
      toast({
        title: "Hata",
        description: "Sitemap oluşturulurken bir hata oluştu.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerAutoGeneration = async () => {
    setLoading(true);
    try {
      // Call the edge function directly
      const { data, error } = await supabase.functions.invoke('generate-sitemap', {
        body: { trigger: 'manual' }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Başarılı",
        description: `Otomatik sitemap oluşturuldu! ${data?.stats?.totalUrls || 0} URL eklendi.`,
      });

      // Also fetch the content for preview
      await handleGenerateSitemap();
    } catch (error) {
      console.error('Error triggering auto generation:', error);
      toast({
        title: "Hata",
        description: "Otomatik sitemap oluşturulurken bir hata oluştu.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadSitemap = async () => {
    try {
      if (!sitemapContent) {
        await handleGenerateSitemap();
        return;
      }
      
      await downloadSitemap();
      
      toast({
        title: "Başarılı",
        description: "Sitemap indirildi.",
      });
    } catch (error) {
      console.error('Error downloading sitemap:', error);
      toast({
        title: "Hata",
        description: "Sitemap indirilirken bir hata oluştu.",
        variant: "destructive"
      });
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(sitemapContent);
      toast({
        title: "Başarılı",
        description: "Sitemap panoya kopyalandı.",
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: "Panoya kopyalanırken bir hata oluştu.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminTopBar userRole={userProfile?.role || 'user'} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Sitemap Yönetimi</h1>
          <p className="text-gray-600">
            Sitenin sitemap.xml dosyasını oluşturun ve otomatik güncellemeleri yönetin.
          </p>
        </div>

        <div className="space-y-6">
          {/* SEO Bilgilendirme */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>SEO İpucu:</strong> Sitemap dosyası, arama motorlarının sitenizi daha iyi indekslemesine yardımcı olur. 
              Sistem artık otomatik olarak güncellenecek!
            </AlertDescription>
          </Alert>

          {/* Ana Kontroller */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Sitemap İşlemleri
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Manuel İşlemler */}
                <div className="space-y-3">
                  <h3 className="font-medium text-sm text-gray-700">Manuel İşlemler</h3>
                  <div className="flex flex-col gap-2">
                    <Button 
                      onClick={handleGenerateSitemap} 
                      disabled={loading}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                      {loading ? 'Oluşturuluyor...' : 'Manuel Sitemap Oluştur'}
                    </Button>
                    
                    <Button 
                      onClick={handleDownloadSitemap}
                      variant="outline"
                      className="flex items-center gap-2"
                      disabled={!sitemapContent && !loading}
                    >
                      <Download className="w-4 h-4" />
                      İndir
                    </Button>

                    {sitemapContent && (
                      <Button 
                        onClick={copyToClipboard}
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <Globe className="w-4 h-4" />
                        Panoya Kopyala
                      </Button>
                    )}
                  </div>
                </div>

                {/* Otomatik İşlemler */}
                <div className="space-y-3">
                  <h3 className="font-medium text-sm text-gray-700">Otomatik İşlemler</h3>
                  <div className="flex flex-col gap-2">
                    <Button 
                      onClick={handleTriggerAutoGeneration} 
                      disabled={loading}
                      className="flex items-center gap-2"
                    >
                      <Zap className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                      {loading ? 'Oluşturuluyor...' : 'Hemen Otomatik Güncelle'}
                    </Button>
                    
                    <div className="text-xs text-gray-500 space-y-1">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Günlük: Her gün 03:00'da</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        <span>Otomatik: Yeni içerik yayınlandığında</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {lastGenerated && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    Son oluşturulma: {lastGenerated.toLocaleString('tr-TR')}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sitemap Önizleme */}
          {sitemapContent && (
            <Card>
              <CardHeader>
                <CardTitle>Sitemap Önizleme</CardTitle>
                <p className="text-sm text-gray-600">
                  Oluşturulan sitemap.xml dosyasının içeriği:
                </p>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={sitemapContent}
                  readOnly
                  className="min-h-[400px] font-mono text-sm"
                  placeholder="Sitemap oluşturmak için yukarıdaki butona tıklayın..."
                />
              </CardContent>
            </Card>
          )}

          {/* Otomatik Sistem Bilgileri */}
          <Card>
            <CardHeader>
              <CardTitle>Otomatik Sitemap Sistemi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-sm mb-2">🕐 Zamanlanan Güncelleme</h4>
                  <p className="text-sm text-gray-600 mb-2">Her gün saat 03:00'da otomatik olarak sitemap güncellenir.</p>
                  <Badge variant="secondary">Aktif</Badge>
                </div>
                
                <div>
                  <h4 className="font-medium text-sm mb-2">⚡ Anlık Güncelleme</h4>
                  <p className="text-sm text-gray-600 mb-2">Yeni blog yazısı veya uzman eklendiğinde otomatik güncellenir.</p>
                  <Badge variant="secondary">Aktif</Badge>
                </div>
              </div>
              
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  <strong>Otomatik Sistem:</strong> Artık yeni blog yazıları yayınlandığında veya uzman profilleri eklendiğinde 
                  sitemap otomatik olarak güncellenecek. Manuel müdahale gerekmez!
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Kurulum Talimatları */}
          <Card>
            <CardHeader>
              <CardTitle>Sitemap Kurulumu</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-gray-600 space-y-2">
                <p><strong>1. Otomatik dosya:</strong> Sistem otomatik olarak sitemap'i oluşturur ve güncelleştirir.</p>
                <p><strong>2. Manuel kontrol:</strong> Yukarıdaki "Hemen Otomatik Güncelle" butonu ile istediğiniz zaman güncelleyebilirsiniz.</p>
                <p><strong>3. Google Search Console:</strong> Sitemap URL'sini Google'a ekleyin: 
                  <code className="bg-gray-100 px-2 py-1 rounded ml-1">https://doktorumol.com.tr/sitemap.xml</code>
                </p>
                <p><strong>4. Otomatik ping:</strong> Sistem Google'a sitemap güncellemelerini otomatik olarak bildirir.</p>
              </div>
              
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  <strong>Yeni Özellik:</strong> Sistem artık tamamen otomatikleşti! Her yeni blog yazısı yayınlandığında veya 
                  uzman eklendiğinde 5 dakika içinde sitemap otomatik güncellenir ve Google'a bildirilir.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SitemapManagement;