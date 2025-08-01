import { useState } from "react";
import { X, ChevronDown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DoctorRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DoctorRegistrationModal = ({ isOpen, onClose }: DoctorRegistrationModalProps) => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    specialty: "",
    city: "",
    experience: "",
    education: "",
    about: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // WhatsApp mesajını oluştur
    const message = `
Doktor Kayıt Formu
-------------------
Ad Soyad: ${formData.fullName}
E-posta: ${formData.email}
Telefon: ${formData.phone}
Uzmanlık Alanı: ${formData.specialty}
Şehir: ${formData.city}
Deneyim (Yıl): ${formData.experience}
Eğitim Bilgileri: ${formData.education}
Hakkınızda: ${formData.about}
    `.trim();

    const whatsappUrl = `https://wa.me/902162350650?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
    onClose();
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between p-0">
          <h2 className="text-xl font-semibold text-center flex-1">Doktor Kayıt Formu</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X size={16} />
          </Button>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-sm font-medium">
              Ad Soyad *
            </Label>
            <Input
              id="fullName"
              value={formData.fullName}
              onChange={(e) => handleInputChange("fullName", e.target.value)}
              placeholder=""
              required
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              E-posta *
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              placeholder=""
              required
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-medium">
              Telefon *
            </Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
              placeholder=""
              required
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="specialty" className="text-sm font-medium">
              Uzmanlık Alanı *
            </Label>
            <Select value={formData.specialty} onValueChange={(value) => handleInputChange("specialty", value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Uzmanlık alanınızı seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="psikolog">Psikolog</SelectItem>
                <SelectItem value="psikiyatrist">Psikiyatrist</SelectItem>
                <SelectItem value="diyetisyen">Diyetisyen</SelectItem>
                <SelectItem value="fizyoterapist">Fizyoterapist</SelectItem>
                <SelectItem value="aile-danismani">Aile Danışmanı</SelectItem>
                <SelectItem value="cocuk-gelisim">Çocuk Gelişim Uzmanı</SelectItem>
                <SelectItem value="diger">Diğer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="city" className="text-sm font-medium">
              Şehir *
            </Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => handleInputChange("city", e.target.value)}
              placeholder=""
              required
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="experience" className="text-sm font-medium">
              Deneyim (Yıl)
            </Label>
            <Input
              id="experience"
              type="number"
              value={formData.experience}
              onChange={(e) => handleInputChange("experience", e.target.value)}
              placeholder=""
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="education" className="text-sm font-medium">
              Eğitim Bilgileri
            </Label>
            <Textarea
              id="education"
              value={formData.education}
              onChange={(e) => handleInputChange("education", e.target.value)}
              placeholder="Mezun olduğunuz üniversite ve bölüm bilgileri"
              className="w-full min-h-[80px] resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="about" className="text-sm font-medium">
              Hakkınızda
            </Label>
            <Textarea
              id="about"
              value={formData.about}
              onChange={(e) => handleInputChange("about", e.target.value)}
              placeholder="Kendiniz hakkında kısa bilgi"
              className="w-full min-h-[80px] resize-none"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-slate-800 hover:bg-slate-700 text-white py-3 text-base font-medium"
          >
            Başvuruyu Gönder
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DoctorRegistrationModal;