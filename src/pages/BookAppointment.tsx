
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, User, Phone, Mail, MessageSquare, ArrowLeft, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { sendAppointmentNotification, sendDoctorNotification } from "@/services/notificationService";
import { createDoctorSlug, createSpecialtySlug } from "@/utils/doctorUtils";

const BookAppointment = () => {
  const { specialtySlug, doctorName } = useParams();
  const navigate = useNavigate();
  const [specialist, setSpecialist] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    patientName: '',
    patientEmail: '',
    patientPhone: '',
    appointmentDate: '',
    appointmentTime: '',
    appointmentType: 'face-to-face',
    notes: ''
  });

  useEffect(() => {
    console.log('BookAppointment mounted, specialtySlug:', specialtySlug, 'doctorName:', doctorName);
    if (specialtySlug && doctorName) {
      fetchSpecialist();
    }
  }, [specialtySlug, doctorName]);

  const fetchSpecialist = async () => {
    try {
      setLoading(true);
      console.log('Fetching specialist for:', doctorName, 'in specialty:', specialtySlug);
      
      const { data: allSpecialists, error: allError } = await supabase
        .from('specialists')
        .select('*')
        .eq('is_active', true);

      console.log('All specialists:', allSpecialists);

      if (allError) {
        console.error('Error fetching all specialists:', allError);
        throw allError;
      }

      const foundSpecialist = allSpecialists?.find(s => {
        const doctorSlugMatch = createDoctorSlug(s.name) === doctorName;
        const specialtySlugMatch = createSpecialtySlug(s.specialty) === specialtySlug;
        console.log(`Checking specialist ${s.name}:`);
        console.log(`  Doctor slug: ${createDoctorSlug(s.name)} === ${doctorName} ? ${doctorSlugMatch}`);
        console.log(`  Specialty slug: ${createSpecialtySlug(s.specialty)} === ${specialtySlug} ? ${specialtySlugMatch}`);
        return doctorSlugMatch && specialtySlugMatch;
      });

      console.log('Found specialist by slug match:', foundSpecialist);

      if (!foundSpecialist) {
        console.log('No specialist found with both matching doctor and specialty slugs');
        setSpecialist(null);
        toast.error('Doktor bulunamadı');
        return;
      }

      console.log('Setting specialist data:', foundSpecialist);
      setSpecialist(foundSpecialist);
      
    } catch (error) {
      console.error('Doktor bilgileri yüklenirken hata:', error);
      toast.error('Doktor bilgileri yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Form validasyonu
    if (!formData.patientName.trim()) {
      toast.error('Ad Soyad alanı zorunludur');
      return;
    }
    
    if (!formData.patientEmail.trim()) {
      toast.error('E-posta alanı zorunludur');
      return;
    }
    
    if (!formData.patientPhone.trim()) {
      toast.error('Telefon alanı zorunludur');
      return;
    }
    
    if (!formData.appointmentDate) {
      toast.error('Randevu tarihi seçilmelidir');
      return;
    }
    
    if (!formData.appointmentTime) {
      toast.error('Randevu saati seçilmelidir');
      return;
    }

    if (!specialist?.id) {
      toast.error('Doktor bilgisi eksik. Lütfen sayfayı yenileyip tekrar deneyin.');
      return;
    }

    setSubmitting(true);

    try {
      const appointmentData = {
        specialist_id: specialist.id,
        patient_name: formData.patientName.trim(),
        patient_email: formData.patientEmail.trim(),
        patient_phone: formData.patientPhone.trim(),
        appointment_date: formData.appointmentDate,
        appointment_time: formData.appointmentTime,
        appointment_type: formData.appointmentType,
        notes: formData.notes.trim() || null,
        status: 'pending'
      };

      console.log('Submitting appointment with data:', appointmentData);

      const { data, error } = await supabase
        .from('appointments')
        .insert([appointmentData])
        .select();

      if (error) {
        console.error('Database error:', error);
        
        if (error.message.includes('row-level security policy')) {
          toast.error('Randevu oluşturulurken yetkilendirme hatası oluştu. Lütfen sayfayı yenileyip tekrar deneyin.');
        } else if (error.message.includes('appointments_appointment_type_check')) {
          toast.error('Randevu türü geçersiz. Lütfen geçerli bir randevu türü seçin.');
        } else if (error.message.includes('specialist_id')) {
          toast.error('Doktor bilgisi eksik. Lütfen sayfayı yenileyip tekrar deneyin.');
        } else {
          toast.error('Randevu oluşturulurken bir hata oluştu: ' + error.message);
        }
        return;
      }

      console.log('Appointment created successfully:', data);

      // Uzmana otomatik e-posta bildirimi gönder
      if (specialist.email) {
        try {
          console.log('Uzmana e-posta bildirimi gönderiliyor...');
          
          const { error: emailError } = await supabase.functions.invoke('send-appointment-notification', {
            body: {
              appointmentId: data[0].id,
              patientName: formData.patientName,
              patientEmail: formData.patientEmail,
              patientPhone: formData.patientPhone,
              specialistEmail: specialist.email,
              specialistName: specialist.name,
              appointmentDate: formData.appointmentDate,
              appointmentTime: formData.appointmentTime,
              appointmentType: formData.appointmentType,
              notes: formData.notes
            }
          });

          if (emailError) {
            console.error('E-posta bildirimi hatası (kritik değil):', emailError);
          } else {
            console.log('✅ Uzmana e-posta bildirimi başarıyla gönderildi');
          }
        } catch (emailError) {
          console.error('E-posta bildirimi gönderilirken hata (kritik değil):', emailError);
        }
      } else {
        console.warn('Uzman e-posta adresi bulunamadı, bildirim gönderilemedi');
      }

      // Hastaya bildirim gönder (mevcut sistem)
      try {
        await sendAppointmentNotification(
          formData.patientEmail,
          formData.patientPhone,
          {
            date: formData.appointmentDate,
            time: formData.appointmentTime,
            type: formData.appointmentType === 'face-to-face' ? 'Yüz Yüze' : 'Online',
            doctorName: specialist.name,
            doctorPhone: specialist.phone,
            doctorEmail: specialist.email
          }
        );
      } catch (notificationError) {
        console.error('Patient notification error (non-critical):', notificationError);
      }

      toast.success('Randevu talebiniz başarıyla gönderildi! Uzman e-posta ile bilgilendirildi.');
      
      // Form'u temizle
      setFormData({
        patientName: '',
        patientEmail: '',
        patientPhone: '',
        appointmentDate: '',
        appointmentTime: '',
        appointmentType: 'face-to-face',
        notes: ''
      });

      // 2 saniye sonra ana sayfaya yönlendir
      setTimeout(() => {
        navigate('/');
      }, 2000);

    } catch (error) {
      console.error('Error booking appointment:', error);
      toast.error('Randevu alınırken beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setSubmitting(false);
    }
  };

  const getAvailableAppointmentTypes = () => {
    const types = [];
    if (specialist?.face_to_face_consultation !== false) {
      types.push({ value: 'face-to-face', label: 'Yüz Yüze Danışmanlık' });
    }
    if (specialist?.online_consultation) {
      types.push({ value: 'online', label: 'Online Danışmanlık' });
    }
    
    if (types.length === 0) {
      types.push({ value: 'face-to-face', label: 'Yüz Yüze Danışmanlık' });
    }
    
    return types;
  };

  useEffect(() => {
    if (specialist) {
      const availableTypes = getAvailableAppointmentTypes();
      if (availableTypes.length > 0) {
        setFormData(prev => ({
          ...prev,
          appointmentType: availableTypes[0].value
        }));
      }
    }
  }, [specialist]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-6"></div>
            <p className="text-gray-600 text-lg">Yükleniyor...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!specialist) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-center px-4 max-w-md">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Doktor Bulunamadı</h1>
              <p className="text-gray-600 mb-6">Aradığınız doktor için randevu sayfası bulunamadı.</p>
              <Button 
                onClick={() => navigate('/uzmanlar')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Uzmanlar Listesine Dön
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <Helmet>
        <title>Randevu Al - {specialist.name}</title>
      </Helmet>
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="mb-8 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-10 h-10 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                {specialist.name}
              </CardTitle>
              <p className="text-blue-600 font-medium text-lg">{specialist.specialty}</p>
              <div className="flex items-center justify-center gap-2 mt-3 text-gray-600">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm">Randevu Al</span>
              </div>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
            <CardHeader className="pb-6">
              <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Randevu Bilgileri
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="patientName" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Ad Soyad *
                    </Label>
                    <Input
                      id="patientName"
                      type="text"
                      value={formData.patientName}
                      onChange={(e) => handleInputChange('patientName', e.target.value)}
                      required
                      placeholder="Adınızı ve soyadınızı girin"
                      className="h-12 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="patientEmail" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      E-posta *
                    </Label>
                    <Input
                      id="patientEmail"
                      type="email"
                      value={formData.patientEmail}
                      onChange={(e) => handleInputChange('patientEmail', e.target.value)}
                      required
                      placeholder="E-posta adresinizi girin"
                      className="h-12 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="patientPhone" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Telefon *
                    </Label>
                    <Input
                      id="patientPhone"
                      type="tel"
                      value={formData.patientPhone}
                      onChange={(e) => handleInputChange('patientPhone', e.target.value)}
                      required
                      placeholder="Telefon numaranızı girin"
                      className="h-12 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    Randevu Detayları
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="space-y-2">
                      <Label htmlFor="appointmentDate" className="text-sm font-medium text-gray-700">
                        Randevu Tarihi *
                      </Label>
                      <Input
                        id="appointmentDate"
                        type="date"
                        value={formData.appointmentDate}
                        onChange={(e) => handleInputChange('appointmentDate', e.target.value)}
                        required
                        min={new Date().toISOString().split('T')[0]}
                        className="h-12 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="appointmentTime" className="text-sm font-medium text-gray-700">
                        Randevu Saati *
                      </Label>
                      <Input
                        id="appointmentTime"
                        type="time"
                        value={formData.appointmentTime}
                        onChange={(e) => handleInputChange('appointmentTime', e.target.value)}
                        required
                        className="h-12 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 mb-6">
                    <Label htmlFor="appointmentType" className="text-sm font-medium text-gray-700">
                      Randevu Türü
                    </Label>
                    <Select
                      value={formData.appointmentType}
                      onValueChange={(value) => handleInputChange('appointmentType', value)}
                    >
                      <SelectTrigger className="h-12 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500">
                        <SelectValue placeholder="Randevu türü seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableAppointmentTypes().map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Notlar
                    </Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      placeholder="Özel notlarınız varsa yazabilirsiniz"
                      rows={4}
                      className="rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500 resize-none"
                    />
                  </div>
                </div>

                <div className="pt-6">
                  <Button 
                    type="submit" 
                    className="w-full h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 text-lg"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        Gönderiliyor...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        Randevu Talep Et
                      </div>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BookAppointment;
