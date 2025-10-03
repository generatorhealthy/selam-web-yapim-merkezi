import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { convertToWebP } from '@/utils/imageConversion';
import { Loader2, Image, CheckCircle2, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface ConversionResult {
  original: string;
  status: 'success' | 'error' | 'skipped';
  message: string;
  originalSize?: number;
  newSize?: number;
}

const ImageConverter = () => {
  const [converting, setConverting] = useState(false);
  const [results, setResults] = useState<ConversionResult[]>([]);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const convertExistingImages = async () => {
    setConverting(true);
    setResults([]);
    setProgress(0);

    try {
      // List all files in profile-pictures bucket
      const { data: files, error: listError } = await supabase.storage
        .from('profile-pictures')
        .list();

      if (listError) throw listError;

      if (!files || files.length === 0) {
        toast({
          title: "Bilgi",
          description: "Dönüştürülecek görsel bulunamadı.",
        });
        setConverting(false);
        return;
      }

      // Filter only image files that are not already WebP
      const imageFiles = files.filter(file => {
        const ext = file.name.split('.').pop()?.toLowerCase();
        return ['jpg', 'jpeg', 'png', 'gif'].includes(ext || '');
      });

      if (imageFiles.length === 0) {
        toast({
          title: "Bilgi",
          description: "Dönüştürülecek PNG/JPG görseli bulunamadı. Tüm görseller zaten WebP formatında.",
        });
        setConverting(false);
        return;
      }

      const conversionResults: ConversionResult[] = [];
      const total = imageFiles.length;

      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        setProgress(Math.round(((i + 1) / total) * 100));

        try {
          // Download the file
          const { data: fileData, error: downloadError } = await supabase.storage
            .from('profile-pictures')
            .download(file.name);

          if (downloadError) throw downloadError;

          // Convert to WebP
          const originalSize = fileData.size;
          const webpFile = await convertToWebP(new File([fileData], file.name, { type: fileData.type }), 0.85);

          // Upload WebP version with new name
          const webpFileName = file.name.replace(/\.(jpg|jpeg|png|gif)$/i, '.webp');
          const { error: uploadError } = await supabase.storage
            .from('profile-pictures')
            .upload(webpFileName, webpFile, { upsert: true });

          if (uploadError) throw uploadError;

          conversionResults.push({
            original: file.name,
            status: 'success',
            message: `${webpFileName} oluşturuldu`,
            originalSize,
            newSize: webpFile.size,
          });

          console.log(`✓ ${file.name} -> ${webpFileName} (${Math.round((1 - webpFile.size/originalSize) * 100)}% küçültme)`);

        } catch (error) {
          console.error(`✗ ${file.name} dönüştürme hatası:`, error);
          conversionResults.push({
            original: file.name,
            status: 'error',
            message: error instanceof Error ? error.message : 'Bilinmeyen hata',
          });
        }
      }

      setResults(conversionResults);

      const successCount = conversionResults.filter(r => r.status === 'success').length;
      toast({
        title: "Dönüştürme Tamamlandı",
        description: `${successCount}/${total} görsel başarıyla WebP formatına dönüştürüldü.`,
      });

    } catch (error) {
      console.error('Toplu dönüştürme hatası:', error);
      toast({
        title: "Hata",
        description: "Görseller dönüştürülürken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setConverting(false);
      setProgress(0);
    }
  };

  const totalSaved = results
    .filter(r => r.status === 'success' && r.originalSize && r.newSize)
    .reduce((acc, r) => acc + (r.originalSize! - r.newSize!), 0);

  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-6 w-6" />
            WebP Görsel Dönüştürücü
          </CardTitle>
          <CardDescription>
            Mevcut PNG/JPG görsellerinizi WebP formatına dönüştürün. 
            Bu işlem orijinal dosyaları silmez, yeni WebP versiyonları oluşturur.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col gap-4">
            <Button 
              onClick={convertExistingImages}
              disabled={converting}
              size="lg"
            >
              {converting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Dönüştürülüyor... {progress}%
                </>
              ) : (
                <>
                  <Image className="mr-2 h-4 w-4" />
                  Mevcut Görselleri WebP'ye Dönüştür
                </>
              )}
            </Button>

            {converting && (
              <Progress value={progress} className="w-full" />
            )}
          </div>

          {results.length > 0 && (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                  Dönüştürme Özeti
                </h3>
                <div className="text-sm text-green-800 dark:text-green-200">
                  <p>Toplam: {results.length} dosya</p>
                  <p>Başarılı: {results.filter(r => r.status === 'success').length}</p>
                  <p>Hatalı: {results.filter(r => r.status === 'error').length}</p>
                  {totalSaved > 0 && (
                    <p className="font-semibold mt-2">
                      Toplam {(totalSaved / 1024).toFixed(2)} KB tasarruf edildi!
                    </p>
                  )}
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto space-y-2">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg flex items-start gap-2 ${
                      result.status === 'success'
                        ? 'bg-green-50 dark:bg-green-900/20'
                        : 'bg-red-50 dark:bg-red-900/20'
                    }`}
                  >
                    {result.status === 'success' ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{result.original}</p>
                      <p className="text-xs text-muted-foreground">{result.message}</p>
                      {result.originalSize && result.newSize && (
                        <p className="text-xs text-muted-foreground">
                          {(result.originalSize / 1024).toFixed(2)} KB → {(result.newSize / 1024).toFixed(2)} KB
                          ({Math.round((1 - result.newSize/result.originalSize) * 100)}% küçültme)
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              ℹ️ Önemli Bilgiler
            </h3>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
              <li>Bu işlem orijinal dosyaları silmez, sadece WebP versiyonları oluşturur</li>
              <li>Yeni yüklenen tüm görseller otomatik olarak WebP'ye dönüştürülecek</li>
              <li>WebP formatı %25-35 daha küçük dosya boyutu sağlar</li>
              <li>Tüm modern tarayıcılar WebP formatını destekler</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ImageConverter;
