import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Download, RefreshCw, Globe, Info } from "lucide-react";
import { AdminTopBar } from "@/components/AdminTopBar";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
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
      // Call the edge function to generate sitemap
      const { data, error } = await supabase.functions.invoke('generate-sitemap', {
        body: { trigger: 'manual' }
      });

      if (error) {
        console.error('Error calling edge function:', error);
        throw error;
      }

      // Get the generated sitemap for preview
      const sitemap = await generateSitemap();
      setSitemapContent(sitemap);
      setLastGenerated(new Date());
      
      toast({
        title: "Başarılı",
        description: `Sitemap başarıyla oluşturuldu ve yüklendi. ${data.stats?.totalUrls || 0} URL dahil edildi.`,
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

          {/* Otomatikleştirme Durumu */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5" />
                Otomatik Güncelleme
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                <div>
                  <h4 className="font-medium text-green-800">Otomatik Sitemap Aktif</h4>
                  <p className="text-sm text-green-600">
                    Sitemap aşağıdaki durumlarda otomatik güncellenir:
                  </p>
                  <ul className="text-sm text-green-600 mt-2 ml-4">
                    <li>• Her gün saat 03:00'da</li>
                    <li>• Yeni blog yazısı yayınlandığında</li>
                    <li>• Yeni uzman profili eklendiğinde</li>
                  </ul>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Aktif
                </Badge>
              </div>
              
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Sistem değişiklikleri algıladığında 5 dakika sonra otomatik olarak sitemap'i günceller. 
                  Google Search Console'a da otomatik bildirim gönderilir.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Kullanım Talimatları */}
          <Card>
            <CardHeader>
              <CardTitle>Sitemap Erişimi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-gray-600 space-y-2">
                <p><strong>Sitemap URL'si:</strong></p>
                <code className="bg-gray-100 px-2 py-1 rounded block">
                  https://doktorumol.com.tr/sitemap.xml
                </code>
                
                <p className="mt-4"><strong>Google Search Console'a ekleme:</strong></p>
                <ol className="list-decimal list-inside space-y-1 ml-4">
                  <li>Google Search Console'a giriş yapın</li>
                  <li>Sitemaps bölümüne gidin</li>
                  <li>Sitemap URL'sini ekleyin: <code>sitemap.xml</code></li>
                  <li>Gönder butonuna tıklayın</li>
                </ol>
              </div>
              
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  <strong>Önemli:</strong> Sitemap artık otomatik olarak yönetiliyor. Manuel müdahale gerekmez. 
                  Sistem yeni içerik eklendiğinde Google'a otomatik bildirim gönderir.
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