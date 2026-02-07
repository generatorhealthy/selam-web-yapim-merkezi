import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Camera, Check, Loader2, ExternalLink, AlertCircle } from "lucide-react";

interface CaptureEvidenceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  userEmail: string;
  specialistId?: string;
  profileUrl?: string;
}

const CaptureEvidenceDialog = ({
  isOpen,
  onClose,
  userId,
  userName,
  userEmail,
  specialistId,
  profileUrl
}: CaptureEvidenceDialogProps) => {
  const { toast } = useToast();
  const [capturing, setCapturing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'capturing' | 'uploading' | 'saving' | 'done' | 'error'>('idle');
  const [capturedUrls, setCapturedUrls] = useState<string[]>([]);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const captureScreenshot = async () => {
    if (!profileUrl) {
      toast({
        title: "Hata",
        description: "Bu kullanıcının uzman profili bulunamadı.",
        variant: "destructive"
      });
      return;
    }

    setCapturing(true);
    setStatus('capturing');
    setProgress(10);

    try {
      // Import html2canvas dynamically
      const html2canvas = (await import('html2canvas')).default;
      
      // Open the profile page in a new window
      const profileWindow = window.open(profileUrl, '_blank', 'width=1920,height=1080');
      
      if (!profileWindow) {
        throw new Error('Popup engelleyici aktif olabilir. Lütfen izin verin.');
      }

      setProgress(20);
      setStatus('capturing');

      // Wait for the page to load
      await new Promise((resolve) => {
        const checkLoaded = setInterval(() => {
          try {
            if (profileWindow.document.readyState === 'complete') {
              clearInterval(checkLoaded);
              setTimeout(resolve, 2000); // Wait extra 2s for dynamic content
            }
          } catch (e) {
            // Cross-origin error - page is loaded
            clearInterval(checkLoaded);
            setTimeout(resolve, 3000);
          }
        }, 500);
        
        // Timeout after 15 seconds
        setTimeout(() => {
          clearInterval(checkLoaded);
          resolve(null);
        }, 15000);
      });

      setProgress(40);

      // Try to capture the screenshot
      let screenshotBlob: Blob | null = null;
      
      try {
        // Try to capture from the opened window
        const canvas = await html2canvas(profileWindow.document.body, {
          width: 1920,
          height: profileWindow.document.body.scrollHeight,
          windowWidth: 1920,
          logging: false,
          useCORS: true,
          allowTaint: true,
        });
        
        screenshotBlob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Canvas to blob failed'));
          }, 'image/png');
        });
      } catch (e) {
        console.log('Direct capture failed, using alternative method');
        // If direct capture fails (cross-origin), we'll use the server-side approach
        profileWindow.close();
        throw new Error('Doğrudan ekran görüntüsü alınamadı. Profil sayfasını manuel olarak açıp ekran görüntüsü alın.');
      }

      profileWindow.close();
      setProgress(60);
      setStatus('uploading');

      // Upload to Supabase Storage
      const timestamp = Date.now();
      const fileName = `evidence/${userId}/${timestamp}_profile.png`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('legal-evidence')
        .upload(fileName, screenshotBlob, {
          contentType: 'image/png',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error('Ekran görüntüsü yüklenemedi: ' + uploadError.message);
      }

      setProgress(80);
      setStatus('saving');

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('legal-evidence')
        .getPublicUrl(fileName);

      // Check if there's already a legal_evidence record for this user
      const { data: existingEvidence } = await supabase
        .from('legal_evidence')
        .select('id, screenshot_urls')
        .or(`specialist_id.eq.${specialistId || 'null'},specialist_email.eq.${userEmail}`)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();


      if (existingEvidence) {
        // Update existing record
        const existingUrls = existingEvidence.screenshot_urls || [];
        const newUrls = [...existingUrls, publicUrl];

        const { error: updateError } = await supabase
          .from('legal_evidence')
          .update({ 
            screenshot_urls: newUrls,
            notes: `Profil ekran görüntüsü otomatik eklendi: ${new Date().toLocaleString('tr-TR')}`
          })
          .eq('id', existingEvidence.id);

        if (updateError) throw updateError;
        setCapturedUrls([publicUrl]);
      } else {
        // Create new legal_evidence record
        const { error: insertError } = await supabase
          .from('legal_evidence')
          .insert([{
            specialist_id: specialistId || null,
            specialist_name: userName,
            specialist_email: userEmail,
            profile_data: { captured_profile_url: profileUrl },
            screenshot_urls: [publicUrl],
            notes: `Profil ekran görüntüsü silme öncesi otomatik eklendi: ${new Date().toLocaleString('tr-TR')}`
          }]);

        if (insertError) throw insertError;
        setCapturedUrls([publicUrl]);
      }

      setProgress(100);
      setStatus('done');

      toast({
        title: "Başarılı",
        description: "Profil ekran görüntüsü kanıtlara eklendi."
      });

    } catch (error) {
      console.error('Capture error:', error);
      setStatus('error');
      toast({
        title: "Hata",
        description: error instanceof Error ? error.message : "Ekran görüntüsü alınamadı.",
        variant: "destructive"
      });
    } finally {
      setCapturing(false);
    }
  };

  const handleManualCapture = async () => {
    // Open profile in new tab for manual capture
    if (profileUrl) {
      window.open(profileUrl, '_blank');
      toast({
        title: "Bilgi",
        description: "Profil sayfası yeni sekmede açıldı. Ekran görüntüsü alıp Hukuki Kanıtlar sayfasından yükleyebilirsiniz.",
      });
    }
  };

  const resetDialog = () => {
    setStatus('idle');
    setProgress(0);
    setCapturedUrls([]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        resetDialog();
        onClose();
      }
    }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-blue-600" />
            Kanıt Topla - {userName}
          </DialogTitle>
          <DialogDescription>
            Silmeden önce uzmanın profil sayfasının ekran görüntüsünü alın.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {profileUrl ? (
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700 font-medium">Profil URL:</p>
              <a 
                href={profileUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline flex items-center gap-1"
              >
                {profileUrl}
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          ) : (
            <div className="p-3 bg-yellow-50 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-yellow-700 font-medium">Uzman profili bulunamadı</p>
                <p className="text-xs text-yellow-600">Bu kullanıcının aktif bir uzman profili yok.</p>
              </div>
            </div>
          )}

          {status !== 'idle' && status !== 'error' && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>
                  {status === 'capturing' && 'Ekran görüntüsü alınıyor...'}
                  {status === 'uploading' && 'Yükleniyor...'}
                  {status === 'saving' && 'Kaydediliyor...'}
                  {status === 'done' && 'Tamamlandı!'}
                </span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          {status === 'done' && capturedUrls.length > 0 && (
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 text-green-700 font-medium mb-2">
                <Check className="w-4 h-4" />
                Ekran görüntüsü başarıyla kaydedildi
              </div>
              <Badge variant="outline" className="bg-green-100">
                {capturedUrls.length} görüntü eklendi
              </Badge>
            </div>
          )}

          {status === 'error' && (
            <div className="p-3 bg-red-50 rounded-lg">
              <p className="text-sm text-red-700">
                Otomatik ekran görüntüsü alınamadı. Lütfen manuel olarak ekleyin.
              </p>
            </div>
          )}

          <div className="flex gap-2">
            {status === 'idle' && profileUrl && (
              <>
                <Button 
                  onClick={captureScreenshot} 
                  disabled={capturing}
                  className="flex-1"
                >
                  {capturing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Yakalanıyor...
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4 mr-2" />
                      Otomatik Yakala
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleManualCapture}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Manuel Aç
                </Button>
              </>
            )}

            {(status === 'done' || status === 'error' || !profileUrl) && (
              <Button variant="outline" onClick={onClose} className="w-full">
                Kapat
              </Button>
            )}
          </div>

          <p className="text-xs text-gray-500 text-center">
            Ekran görüntüleri Hukuki Kanıtlar sayfasından görüntülenebilir.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CaptureEvidenceDialog;
