
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";

interface DoctorRegistrationFormProps {
  isOpen: boolean;
  onClose: () => void;
}

const DoctorRegistrationForm = ({ isOpen, onClose }: DoctorRegistrationFormProps) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    specialty: '',
    city: '',
    experience: '',
    education: '',
    bio: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Insert into specialists table instead of doctor_registrations
      const { data, error } = await supabase
        .from('specialists')
        .insert([
          {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            specialty: formData.specialty,
            city: formData.city,
            experience: parseInt(formData.experience) || 0,
            education: formData.education,
            bio: formData.bio,
            is_active: false // Set as inactive until approved by admin
          }
        ])
        .select();

      if (error) throw error;

      toast.success("Başvurunuz başarıyla gönderildi! En kısa sürede size dönüş yapacağız.");
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        specialty: '',
        city: '',
        experience: '',
        education: '',
        bio: ''
      });

      // Close dialog
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error("Başvuru gönderilirken bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Doktor Kayıt Formu
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="name">Ad Soyad *</Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
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
              required
            />
          </div>

          <div>
            <Label htmlFor="specialty">Uzmanlık Alanı *</Label>
            <Select onValueChange={(value) => handleInputChange('specialty', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Uzmanlık alanınızı seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Kadın Doğum">Kadın Doğum</SelectItem>
                <SelectItem value="Göz Hastalıkları">Göz Hastalıkları</SelectItem>
                <SelectItem value="Diyetisyen">Diyetisyen</SelectItem>
                <SelectItem value="Psikolog">Psikolog</SelectItem>
                <SelectItem value="Dahiliye">Dahiliye</SelectItem>
                <SelectItem value="Kardiyoloji">Kardiyoloji</SelectItem>
                <SelectItem value="Üroloji">Üroloji</SelectItem>
                <SelectItem value="Ortopedi">Ortopedi</SelectItem>
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
              required
            />
          </div>

          <div>
            <Label htmlFor="experience">Deneyim (Yıl)</Label>
            <Input
              id="experience"
              type="number"
              value={formData.experience}
              onChange={(e) => handleInputChange('experience', e.target.value)}
              min="0"
            />
          </div>

          <div>
            <Label htmlFor="education">Eğitim Bilgileri</Label>
            <Textarea
              id="education"
              value={formData.education}
              onChange={(e) => handleInputChange('education', e.target.value)}
              placeholder="Mezun olduğunuz üniversite ve bölüm bilgileri"
            />
          </div>

          <div>
            <Label htmlFor="bio">Hakkınızda</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              placeholder="Kendiniz hakkında kısa bilgi"
            />
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Gönderiliyor...' : 'Başvuruyu Gönder'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DoctorRegistrationForm;
