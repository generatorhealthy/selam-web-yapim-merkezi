import React, { useState } from 'react';
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { HorizontalNavigation } from "@/components/HorizontalNavigation";
import Footer from "@/components/Footer";

const DoctorRegistration = () => {
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
      // Validate required fields
      if (!formData.name || !formData.email || !formData.phone || !formData.specialty || !formData.city) {
        toast.error("Lütfen tüm zorunlu alanları doldurun.");
        return;
      }

      // Insert into specialists table instead of doctor_registrations
      const { data, error } = await supabase
        .from('specialists')
        .insert([
          {
            name: formData.name.trim(),
            email: formData.email.trim().toLowerCase(),
            phone: formData.phone.trim(),
            specialty: formData.specialty,
            city: formData.city.trim(),
            experience: formData.experience ? parseInt(formData.experience) : 0,
            education: formData.education?.trim() || null,
            bio: formData.bio?.trim() || null,
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

      // Navigate to home page after success
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error("Başvuru gönderilirken bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Doktor Kayıt Ol - Doktorum Ol</title>
        <meta name="description" content="Doktorum Ol platformuna katılın. Uzman doktor olarak başvurunuzu yapın ve hastalara online randevu hizmeti verin." />
        <meta name="keywords" content="doktor kayıt, uzman başvuru, online randevu, doktor ol" />
      </Helmet>
      
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
        <HorizontalNavigation />
        
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-center">
                  Doktor Kayıt Formu
                </CardTitle>
                <p className="text-center text-gray-600 mt-2">
                  Platformumuzda yer almak için başvuru formunu doldurun
                </p>
              </CardHeader>
              
              <CardContent>
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
                        <SelectItem value="Psikolog">Psikolog</SelectItem>
                        <SelectItem value="Psikolojik Danışman">Psikolojik Danışman</SelectItem>
                        <SelectItem value="Aile Danışmanı">Aile Danışmanı</SelectItem>
                        <SelectItem value="İlişki Danışmanı">İlişki Danışmanı</SelectItem>
                        <SelectItem value="Uzman">Uzman</SelectItem>
                        <SelectItem value="Doktor">Doktor</SelectItem>
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
              </CardContent>
            </Card>
          </div>
        </div>
        
        <Footer />
      </div>
    </>
  );
};

export default DoctorRegistration;