import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Download, RefreshCw, Globe, Info } from "lucide-react";
import { AdminTopBar } from "@/components/AdminTopBar";
import { useUserRole } from "@/hooks/useUserRole";
import { generateSitemap, downloadSitemap } from "@/services/sitemapService";
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
            Sitenin sitemap.xml dosyasını oluşturun ve yönetin.
          </p>
        </div>

        <div className="space-y-6">
          {/* SEO Bilgilendirme */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>SEO İpucu:</strong> Sitemap dosyası, arama motorlarının sitenizi daha iyi indekslemesine yardımcı olur. 
              Yeni blog yazıları ve uzman profilleri eklendiğinde sitemap'i güncelleyin.
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
              <div className="flex flex-wrap gap-3">
                <Button 
                  onClick={handleGenerateSitemap} 
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  {loading ? 'Oluşturuluyor...' : 'Sitemap Oluştur'}
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

          {/* Kullanım Talimatları */}
          <Card>
            <CardHeader>
              <CardTitle>Sitemap Kurulumu</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-gray-600 space-y-2">
                <p><strong>1. Dosyayı indirin:</strong> "İndir" butonuna tıklayarak sitemap.xml dosyasını bilgisayarınıza indirin.</p>
                <p><strong>2. Sunucuya yükleyin:</strong> İndirilen dosyayı sitenizin kök dizinine (public klasörüne) yükleyin.</p>
                <p><strong>3. Google Search Console:</strong> Google Search Console'da sitemap URL'sini ekleyin: 
                  <code className="bg-gray-100 px-2 py-1 rounded ml-1">https://doktorumol.com.tr/sitemap.xml</code>
                </p>
                <p><strong>4. Güncelleyin:</strong> Yeni içerik eklendiğinde sitemap'i yeniden oluşturun ve sunucuya yükleyin.</p>
              </div>
              
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  <strong>Önemli:</strong> Sitemap, şu anda yalnızca yayında olan blog yazıları ve aktif uzman profillerini içerir. 
                  Taslak durumundaki içerikler dahil edilmez.
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