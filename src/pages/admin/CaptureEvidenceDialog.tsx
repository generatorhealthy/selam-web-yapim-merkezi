import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Camera, Check, Loader2, ExternalLink, AlertCircle, User } from "lucide-react";

interface CaptureEvidenceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  userEmail: string;
  specialistId?: string;
  profileUrl?: string;
}

interface SpecialistData {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialty: string;
  bio: string;
  education: string;
  experience: number;
  hospital: string;
  city: string;
  profile_picture: string;
  created_at: string;
  is_active: boolean;
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
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'capturing' | 'uploading' | 'saving' | 'done' | 'error'>('idle');
  const [capturedUrls, setCapturedUrls] = useState<string[]>([]);
  const [specialistData, setSpecialistData] = useState<SpecialistData | null>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Fetch specialist data when dialog opens
  useEffect(() => {
    if (isOpen && specialistId) {
      fetchSpecialistData();
    }
  }, [isOpen, specialistId]);

  const fetchSpecialistData = async () => {
    if (!specialistId) return;
    
    setStatus('loading');
    try {
      const { data, error } = await supabase
        .from('specialists')
        .select('*')
        .eq('id', specialistId)
        .single();

      if (error) throw error;
      setSpecialistData(data);
      setStatus('ready');
    } catch (error) {
      console.error('Error fetching specialist:', error);
      setStatus('error');
      toast({
        title: "Hata",
        description: "Uzman bilgileri yüklenemedi.",
        variant: "destructive"
      });
    }
  };

  const captureScreenshot = async () => {
    if (!profileRef.current || !specialistData) {
      toast({
        title: "Hata",
        description: "Profil önizlemesi bulunamadı.",
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
      
      setProgress(30);

      // Capture the profile preview element
      const canvas = await html2canvas(profileRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      setProgress(50);

      const screenshotBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Canvas to blob failed'));
        }, 'image/png');
      });

      setProgress(60);
      setStatus('uploading');

      // Upload to Supabase Storage
      const timestamp = Date.now();
      const fileName = `evidence/${userId}/${timestamp}_profile.png`;
      
      const { error: uploadError } = await supabase.storage
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

      // Check if there's already a legal_evidence record for this specialist
      const { data: existingEvidence } = await supabase
        .from('legal_evidence')
        .select('id, screenshot_urls')
        .eq('specialist_id', specialistId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

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
        const profileDataJson = {
          captured_profile_url: profileUrl || '',
          specialist_name: specialistData.name,
          specialist_email: specialistData.email,
          specialist_phone: specialistData.phone,
          specialist_specialty: specialistData.specialty,
          specialist_hospital: specialistData.hospital,
          specialist_city: specialistData.city,
          specialist_experience: specialistData.experience,
          specialist_education: specialistData.education,
          specialist_bio: specialistData.bio,
          specialist_created_at: specialistData.created_at,
          specialist_is_active: specialistData.is_active
        };

        const { error: insertError } = await supabase
          .from('legal_evidence')
          .insert([{
            specialist_id: specialistId || null,
            specialist_name: userName,
            specialist_email: userEmail,
            profile_data: profileDataJson,
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

  const handleManualCapture = () => {
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
    setSpecialistData(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        resetDialog();
        onClose();
      }
    }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-blue-600" />
            Kanıt Topla - {userName}
          </DialogTitle>
          <DialogDescription>
            Silmeden önce uzmanın profil bilgilerinin ekran görüntüsünü alın.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {profileUrl && (
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
          )}

          {!specialistId && (
            <div className="p-3 bg-yellow-50 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-yellow-700 font-medium">Uzman profili bulunamadı</p>
                <p className="text-xs text-yellow-600">Bu kullanıcının aktif bir uzman profili yok.</p>
              </div>
            </div>
          )}

          {status === 'loading' && (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-2">Uzman bilgileri yükleniyor...</span>
            </div>
          )}

          {/* Profile Preview - This will be captured */}
          {(status === 'ready' || status === 'capturing' || status === 'uploading' || status === 'saving') && specialistData && (
            <div 
              ref={profileRef} 
              className="border rounded-lg p-6 bg-white"
              style={{ minWidth: '500px' }}
            >
              <div className="text-xs text-gray-500 mb-4 border-b pb-2">
                Ekran Görüntüsü Tarihi: {new Date().toLocaleString('tr-TR')} | URL: {profileUrl}
              </div>
              
              <div className="flex items-start gap-4">
                {specialistData.profile_picture ? (
                  <img 
                    src={specialistData.profile_picture} 
                    alt={specialistData.name}
                    className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                    crossOrigin="anonymous"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900">{specialistData.name}</h3>
                  <p className="text-blue-600 font-medium">{specialistData.specialty}</p>
                  <p className="text-gray-600 text-sm">{specialistData.hospital}</p>
                  <p className="text-gray-500 text-sm">{specialistData.city}</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">E-posta:</span>
                  <span className="ml-2 font-medium">{specialistData.email}</span>
                </div>
                <div>
                  <span className="text-gray-500">Telefon:</span>
                  <span className="ml-2 font-medium">{specialistData.phone || 'Belirtilmemiş'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Deneyim:</span>
                  <span className="ml-2 font-medium">{specialistData.experience} yıl</span>
                </div>
                <div>
                  <span className="text-gray-500">Kayıt Tarihi:</span>
                  <span className="ml-2 font-medium">
                    {new Date(specialistData.created_at).toLocaleDateString('tr-TR')}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Durum:</span>
                  <Badge variant={specialistData.is_active ? "default" : "secondary"} className="ml-2">
                    {specialistData.is_active ? 'Aktif' : 'Pasif'}
                  </Badge>
                </div>
              </div>

              {specialistData.education && (
                <div className="mt-4">
                  <span className="text-gray-500 text-sm">Eğitim:</span>
                  <p className="text-sm mt-1">{specialistData.education}</p>
                </div>
              )}

              {specialistData.bio && (
                <div className="mt-4">
                  <span className="text-gray-500 text-sm">Hakkında:</span>
                  <p className="text-sm mt-1 text-gray-700">{specialistData.bio}</p>
                </div>
              )}
            </div>
          )}

          {(status === 'capturing' || status === 'uploading' || status === 'saving') && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>
                  {status === 'capturing' && 'Ekran görüntüsü alınıyor...'}
                  {status === 'uploading' && 'Yükleniyor...'}
                  {status === 'saving' && 'Kaydediliyor...'}
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
                Ekran görüntüsü alınamadı. Lütfen tekrar deneyin veya manuel olarak ekleyin.
              </p>
            </div>
          )}

          <div className="flex gap-2">
            {status === 'ready' && specialistData && (
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
                      Kanıt Olarak Kaydet
                    </>
                  )}
                </Button>
                {profileUrl && (
                  <Button 
                    variant="outline" 
                    onClick={handleManualCapture}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Profili Aç
                  </Button>
                )}
              </>
            )}

            {(status === 'done' || status === 'error' || !specialistId) && (
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
