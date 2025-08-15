import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { X } from "lucide-react";

interface RegistrationFormProps {
  isOpen: boolean;
  onClose: () => void;
}

const RegistrationForm = ({ isOpen, onClose }: RegistrationFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    specialty: '',
    city: '',
    experience: '',
    education: '',
    about: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Form validasyonu
      if (!formData.name || !formData.email || !formData.phone || !formData.specialty || !formData.city) {
        toast.error("Lütfen zorunlu alanları doldurun.");
        setIsLoading(false);
        return;
      }

      // E-posta validasyonu
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        toast.error("Geçerli bir e-posta adresi girin.");
        setIsLoading(false);
        return;
      }

      // Edge function'a e-posta gönderimi
      const response = await fetch('https://irnfwewabogveofwemvg.supabase.co/functions/v1/send-registration-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          specialty: formData.specialty,
          city: formData.city,
          experience: formData.experience || '',
          education: formData.education || '',
          about: formData.about || '',
          type: 'doctor_registration'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'E-posta gönderilirken hata oluştu');
      }

      const result = await response.json();
      console.log('E-posta gönderim sonucu:', result);

      toast.success("Başvurunuz başarıyla gönderildi! En kısa sürede size dönüş yapacağız.");
      
      // Paketler sayfasına yönlendir
      navigate('/paketler');
      
      // Formu temizle ve kapat
      setFormData({
        name: '',
        email: '',
        phone: '',
        specialty: '',
        city: '',
        experience: '',
        education: '',
        about: ''
      });
      onClose();

    } catch (error: any) {
      console.error('Kayıt hatası:', error);
      toast.error("Başvuru gönderilirken bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold text-gray-900">
              Doktor Kayıt Formu
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Ad Soyad *</Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Adınızı ve soyadınızı girin"
              required
            />
          </div>

          <div>
            <Label htmlFor="email">E-posta *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="E-posta adresinizi girin"
              required
            />
          </div>

          <div>
            <Label htmlFor="phone">Telefon *</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="Telefon numaranızı girin"
              required
            />
          </div>

          <div>
            <Label htmlFor="specialty">Uzmanlık Alanı *</Label>
            <Select value={formData.specialty} onValueChange={(value) => handleInputChange('specialty', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Uzmanlık alanınızı seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Psikolog">Psikolog</SelectItem>
                <SelectItem value="Psikolojik Danışmanlık">Psikolojik Danışmanlık</SelectItem>
                <SelectItem value="Aile Danışmanı">Aile Danışmanı</SelectItem>
                <SelectItem value="Klinik Psikolog">Klinik Psikolog</SelectItem>
                <SelectItem value="Psikiyatri">Psikiyatri</SelectItem>
                <SelectItem value="Kadın Hastalıkları">Kadın Hastalıkları</SelectItem>
                <SelectItem value="Diyetisyen">Diyetisyen</SelectItem>
                <SelectItem value="Genel Cerrahi">Genel Cerrahi</SelectItem>
                <SelectItem value="Romatoloji">Romatoloji</SelectItem>
                <SelectItem value="Tıbbi Onkoloji">Tıbbi Onkoloji</SelectItem>
                <SelectItem value="Tümünü Göster">Tümünü Göster</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="city">Şehir *</Label>
            <Input
              id="city"
              type="text"
              value={formData.city}
              onChange={(e) => handleInputChange('city', e.target.value)}
              placeholder="Hangi şehirde çalışıyorsunuz"
              required
            />
          </div>

          <div>
            <Label htmlFor="experience">Deneyim (Yıl)</Label>
            <Input
              id="experience"
              type="number"
              min="0"
              max="50"
              value={formData.experience}
              onChange={(e) => handleInputChange('experience', e.target.value)}
              placeholder="Kaç yıldır bu alanda çalışıyorsunuz"
            />
          </div>

          <div>
            <Label htmlFor="education">Eğitim Bilgileri</Label>
            <Textarea
              id="education"
              value={formData.education}
              onChange={(e) => handleInputChange('education', e.target.value)}
              placeholder="Eğitim geçmişinizi kısaca belirtin"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="about">Hakkınızda</Label>
            <Textarea
              id="about"
              value={formData.about}
              onChange={(e) => handleInputChange('about', e.target.value)}
              placeholder="Kendinizi ve çalışma alanınızı kısaca tanıtın"
              rows={3}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            disabled={isLoading}
          >
            {isLoading ? "Gönderiliyor..." : "Başvuruyu Gönder"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RegistrationForm;