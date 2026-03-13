import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CalendarIcon, Clock, User, Mail, Phone, MapPin, ChevronLeft, ChevronRight, CheckCircle, Star } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Specialist {
  id: string;
  name: string;
  specialty: string;
  city: string;
  hospital: string;
  online_consultation: boolean;
  face_to_face_consultation: boolean;
  working_hours_start: string;
  working_hours_end: string;
  available_days: string[];
  available_time_slots?: any;
  profile_picture?: string;
  bio?: string;
}

// Consultation types mapping with images and descriptions
const consultationTypes: Record<string, { 
  name: string; 
  description: string; 
  icon: string; 
  specialties: string[];
  gradient: string;
}> = {
  'travma-terapisi': {
    name: 'Travma Terapisi',
    description: 'Geçmiş travmatik deneyimlerin işlenmesi ve iyileştirilmesi için profesyonel destek',
    icon: '🧠',
    specialties: ['Psikolog', 'Uzm. Psikolog', 'Klinik Psikolog', 'Psikiyatri'],
    gradient: 'from-blue-500 to-purple-600'
  },
  'bosanma-terapisi': {
    name: 'Boşanma Terapisi',
    description: 'Boşanma sürecinde duygusal destek ve yeni yaşam düzenine adaptasyon',
    icon: '💔',
    specialties: ['Aile Danışmanı', 'Psikolog', 'İlişki Danışmanı'],
    gradient: 'from-rose-400 to-pink-600'
  },
  'cift-terapisi': {
    name: 'Çift Terapisi',
    description: 'İlişkilerde iletişim sorunları ve uyum problemlerinin çözümü',
    icon: '💕',
    specialties: ['Aile Danışmanı', 'İlişki Danışmanı', 'Psikolog'],
    gradient: 'from-red-400 to-rose-600'
  },
  'anksiyete-terapisi': {
    name: 'Anksiyete Terapisi',
    description: 'Kaygı bozuklukları, panik atak ve stres yönetimi için uzman desteği',
    icon: '😰',
    specialties: ['Psikolog', 'Uzm. Psikolog', 'Klinik Psikolog', 'Psikiyatri'],
    gradient: 'from-yellow-400 to-orange-600'
  },
  'depresyon-terapisi': {
    name: 'Depresyon Terapisi',
    description: 'Depresif belirtiler ve ruh hali bozukluklarında psikolojik destek',
    icon: '😔',
    specialties: ['Psikolog', 'Uzm. Psikolog', 'Klinik Psikolog', 'Psikiyatri'],
    gradient: 'from-indigo-400 to-blue-600'
  },
  'cocuk-gelisimi': {
    name: 'Çocuk Gelişimi',
    description: 'Çocuklarda davranış problemleri ve gelişimsel süreçlerde rehberlik',
    icon: '👶',
    specialties: ['Çocuk Psikoloğu', 'Dil ve Konuşma Terapisti', 'Eğitim Danışmanlığı'],
    gradient: 'from-green-400 to-emerald-600'
  },
  'beslenme-danismanligi': {
    name: 'Beslenme Danışmanlığı',
    description: 'Sağlıklı beslenme alışkanlıkları ve kişiselleştirilmiş diyet programları',
    icon: '🍎',
    specialties: ['Diyetisyen', 'Beslenme Danışmanlığı', 'Spor Diyetisyeni'],
    gradient: 'from-lime-400 to-green-600'
  },
  'fizik-tedavi': {
    name: 'Fizik Tedavi',
    description: 'Kas-iskelet sistemi problemleri ve fiziksel rehabilitasyon',
    icon: '🏃‍♂️',
    specialties: ['Fizyoterapist', 'Ortopedik Fizyoterapi', 'Spor Fizyoterapisi'],
    gradient: 'from-cyan-400 to-teal-600'
  },
  'genel-saglik': {
    name: 'Genel Sağlık Danışmanlığı',
    description: 'Genel sağlık kontrolü, önleyici tıp ve sağlık rehberliği',
    icon: '🩺',
    specialties: ['Genel Tıp', 'Dahiliye'],
    gradient: 'from-teal-400 to-cyan-600'
  },
  'egitim-danismanligi': {
    name: 'Eğitim Danışmanlığı',
    description: 'Öğrenme güçlükleri ve akademik başarı için özel destek programları',
    icon: '📚',
    specialties: ['Eğitim Danışmanlığı', 'Psikolog'],
    gradient: 'from-violet-400 to-purple-600'
  }
};

const RandevuSayfasi = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [selectedConsultationType, setSelectedConsultationType] = useState('');
  const [selectedSpecialist, setSelectedSpecialist] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState('');
  const [appointmentType, setAppointmentType] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    patientName: '',
    patientEmail: '',
    patientPhone: '',
    notes: ''
  });

  // Fetch specialists
  useEffect(() => {
    fetchSpecialists();
  }, []);

  const fetchSpecialists = async () => {
    setLoading(true);
    try {
      // SECURITY: Use secure function to get specialists without personal contact info
      const { data, error } = await supabase
        .rpc('get_public_specialists');

      if (error) throw error;
      
      // Shuffle the specialists array to show different order each time
      const shuffledSpecialists = (data || []).sort(() => Math.random() - 0.5);
      setSpecialists(shuffledSpecialists);
    } catch (error) {
      console.error('Error fetching specialists:', error);
      toast({
        title: "Hata",
        description: "Uzmanlar yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter specialists based on selected consultation type
  const filteredSpecialists = specialists.filter(s => {
    if (!selectedConsultationType) return true;
    const consultationType = consultationTypes[selectedConsultationType];
    return consultationType?.specialties.includes(s.specialty);
  });

  const canGoNext = (step: number) => {
    switch (step) {
      case 1: return selectedConsultationType;
      case 2: return selectedSpecialist;
      case 3: return appointmentType;
      case 4: return selectedDate && selectedTime;
      default: return false;
    }
  };

  const nextStep = () => {
    if (currentStep < 5 && canGoNext(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  // Auto-advance functions
  const handleConsultationTypeSelect = (type: string) => {
    setSelectedConsultationType(type);
    setTimeout(() => {
      setCurrentStep(2);
    }, 300);
  };

  const handleSpecialistSelect = (specialistId: string) => {
    setSelectedSpecialist(specialistId);
    setTimeout(() => {
      setCurrentStep(3);
    }, 300);
  };

  const handleAppointmentTypeSelect = (type: string) => {
    setAppointmentType(type);
    setTimeout(() => {
      setCurrentStep(4);
    }, 300);
  };

  const handleDateTimeComplete = () => {
    if (selectedDate && selectedTime) {
      setTimeout(() => {
        setCurrentStep(5);
      }, 500);
    }
  };

  const handleTimeSelection = (time: string) => {
    setSelectedTime(time);
    if (selectedDate && time) {
      setTimeout(() => {
        setCurrentStep(5);
      }, 500);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const resetForm = () => {
    setCurrentStep(1);
    setSelectedConsultationType('');
    setSelectedSpecialist('');
    setSelectedDate(undefined);
    setSelectedTime('');
    setAppointmentType('');
    setFormData({
      patientName: '',
      patientEmail: '',
      patientPhone: '',
      notes: ''
    });
  };

  const selectedSpecialistData = specialists.find(s => s.id === selectedSpecialist);

  const availableAppointmentTypes = selectedSpecialistData ? [
    ...(selectedSpecialistData.face_to_face_consultation ? ['Yüz yüze'] : []),
    ...(selectedSpecialistData.online_consultation ? ['Online'] : [])
  ] : [];

  // Generate time slots based on specialist's availability
  const generateTimeSlots = () => {
    if (!selectedSpecialistData) return [];
    
    // Use specialist's custom time slots if available, otherwise use default
    if (selectedSpecialistData.available_time_slots && selectedSpecialistData.available_time_slots.length > 0) {
      return selectedSpecialistData.available_time_slots;
    }
    
    // Default time slots from 09:30 to 21:00 in 30-minute intervals
    return [
      "09:30", "10:00", "10:30", "11:00", "11:30", "12:00",
      "12:30", "13:00", "13:30", "14:00", "14:30", "15:00",
      "15:30", "16:00", "16:30", "17:00", "17:30", "18:00",
      "18:30", "19:00", "19:30", "20:00", "20:30", "21:00"
    ];
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedSpecialist || !selectedDate || !selectedTime || !appointmentType) {
      toast({
        title: "Eksik Bilgi",
        description: "Lütfen tüm gerekli alanları doldurun.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.patientName || !formData.patientEmail || !formData.patientPhone) {
      toast({
        title: "Eksik Bilgi",
        description: "Lütfen kişisel bilgilerinizi eksiksiz doldurun.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    
    try {
      // Convert Turkish appointment type labels to database constraint values
      const dbAppointmentType = appointmentType === 'Online' ? 'online' : 'face-to-face';
      
      const { error } = await supabase
        .from('appointments')
        .insert({
          specialist_id: selectedSpecialist,
          appointment_date: format(selectedDate, 'yyyy-MM-dd'),
          appointment_time: selectedTime,
          patient_name: formData.patientName,
          patient_email: formData.patientEmail,
          patient_phone: formData.patientPhone,
          appointment_type: dbAppointmentType,
          notes: formData.notes,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Başarılı",
        description: "Randevunuz başarıyla oluşturuldu. En kısa sürede size dönüş yapılacaktır.",
      });

      resetForm();

    } catch (error) {
      console.error('Error creating appointment:', error);
      toast({
        title: "Hata",
        description: "Randevu oluşturulurken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card className="w-full max-w-4xl mx-auto shadow-lg">
            <CardHeader className="text-center pb-6">
              <CardTitle className="flex items-center justify-center gap-3 text-3xl font-bold">
                <User className="h-8 w-8 text-primary" />
                Danışmanlık Türü Seçimi
              </CardTitle>
              <CardDescription className="text-lg mt-2">
                Size uygun danışmanlık türünü seçin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(consultationTypes).map(([key, type]) => (
                  <div
                    key={key}
                    className={cn(
                      "relative p-6 rounded-xl cursor-pointer transition-all duration-300 hover:scale-105 border-2",
                      selectedConsultationType === key
                        ? "border-primary bg-primary/10 shadow-lg scale-105"
                        : "border-border hover:border-primary/50 hover:shadow-md"
                    )}
                    onClick={() => handleConsultationTypeSelect(key)}
                  >
                    <div className={cn(
                      "absolute inset-0 rounded-xl opacity-5 bg-gradient-to-br",
                      type.gradient
                    )} />
                    <div className="relative z-10">
                      <div className="text-4xl mb-4 text-center">{type.icon}</div>
                      <h3 className="font-bold text-lg text-center mb-3">{type.name}</h3>
                      <p className="text-sm text-muted-foreground text-center leading-relaxed">
                        {type.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card className="w-full max-w-4xl mx-auto shadow-lg">
            <CardHeader className="text-center pb-6">
              <CardTitle className="flex items-center justify-center gap-3 text-3xl font-bold">
                <User className="h-8 w-8 text-primary" />
                Uzman Seçimi
              </CardTitle>
              <CardDescription className="text-lg mt-2">
                {consultationTypes[selectedConsultationType]?.name} konusunda uzmanlarımız
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                {filteredSpecialists.map((specialist) => (
                  <div
                    key={specialist.id}
                    className={cn(
                      "p-6 border-2 rounded-xl cursor-pointer transition-all duration-300 hover:scale-[1.02]",
                      selectedSpecialist === specialist.id
                        ? "border-primary bg-primary/5 shadow-lg"
                        : "border-border hover:border-primary/50 hover:shadow-md"
                    )}
                    onClick={() => handleSpecialistSelect(specialist.id)}
                  >
                    <div className="flex gap-6 items-start">
                      <Avatar className="h-20 w-20 border-2 border-primary/20 avatar-container">
                        <AvatarImage 
                          src={specialist.profile_picture} 
                          alt={specialist.name}
                          className="avatar-image"
                          loading="lazy"
                        />
                        <AvatarFallback className="text-lg font-semibold bg-primary/10">
                          {specialist.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <h3 className="font-bold text-xl mb-2">{specialist.name}</h3>
                        <p className="text-primary font-medium mb-3">{specialist.specialty}</p>
                        
                        <div className="flex items-center gap-6 text-sm text-muted-foreground mb-4">
                          <span className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            {specialist.city}
                          </span>
                          {specialist.hospital && (
                            <span className="flex items-center gap-2">
                              <span>🏥</span>
                              {specialist.hospital}
                            </span>
                          )}
                        </div>
                        
                        {specialist.bio && (
                          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                            {specialist.bio}
                          </p>
                        )}
                        
                        <div className="flex gap-3">
                          {specialist.face_to_face_consultation && (
                            <span className="px-4 py-2 bg-primary/10 text-primary text-sm rounded-full font-medium">
                              👥 Yüz yüze
                            </span>
                          )}
                          {specialist.online_consultation && (
                            <span className="px-4 py-2 bg-secondary/10 text-secondary-foreground text-sm rounded-full font-medium">
                              💻 Online
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card className="w-full max-w-2xl mx-auto shadow-lg">
            <CardHeader className="text-center pb-6">
              <CardTitle className="flex items-center justify-center gap-3 text-3xl font-bold">
                <User className="h-8 w-8 text-primary" />
                Randevu Türü
              </CardTitle>
              <CardDescription className="text-lg mt-2">
                Randevu türünü seçin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup value={appointmentType} onValueChange={handleAppointmentTypeSelect} className="space-y-4">
                {availableAppointmentTypes.map((type) => (
                  <div key={type} className="flex items-center space-x-4 p-6 border-2 rounded-xl hover:bg-muted/30 transition-colors">
                    <RadioGroupItem value={type} id={type} className="h-6 w-6" />
                    <Label htmlFor={type} className="text-lg font-medium cursor-pointer flex-1 flex items-center gap-3">
                      {type === 'Yüz yüze' ? '👥' : '💻'}
                      {type}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>
        );

      case 4:
        return (
          <Card className="w-full max-w-2xl mx-auto shadow-lg">
            <CardHeader className="text-center pb-6">
              <CardTitle className="flex items-center justify-center gap-3 text-3xl font-bold">
                <CalendarIcon className="h-8 w-8 text-primary" />
                Tarih ve Saat Seçimi
              </CardTitle>
              <CardDescription className="text-lg mt-2">
                Size uygun tarih ve saati seçin
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div>
                <Label className="text-lg font-semibold mb-3 block">Randevu Tarihi</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal h-14 text-lg",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-3 h-6 w-6" />
                      {selectedDate ? (
                        format(selectedDate, "dd MMMM yyyy", { locale: tr })
                      ) : (
                        "Tarih seçin"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        setSelectedDate(date);
                        if (date && selectedTime) {
                          handleDateTimeComplete();
                        }
                      }}
                      disabled={(date) => date < new Date()}
                      locale={tr}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {selectedDate && (
                <div>
                  <Label className="text-lg font-semibold mb-3 block">Randevu Saati</Label>
                  <Select value={selectedTime} onValueChange={handleTimeSelection}>
                    <SelectTrigger className="h-14 text-lg">
                      <SelectValue placeholder="Saat seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {generateTimeSlots().map((time) => (
                        <SelectItem key={time} value={time} className="text-lg py-4">
                          <div className="flex items-center gap-3">
                            <Clock className="h-5 w-5" />
                            {time}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 5:
        return (
          <Card className="w-full max-w-2xl mx-auto shadow-lg">
            <CardHeader className="text-center pb-6">
              <CardTitle className="flex items-center justify-center gap-3 text-3xl font-bold">
                <User className="h-8 w-8 text-primary" />
                Kişisel Bilgiler
              </CardTitle>
              <CardDescription className="text-lg mt-2">
                Randevu için gerekli bilgilerinizi girin
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="patientName" className="text-lg font-semibold mb-2 block">Ad Soyad *</Label>
                  <Input
                    id="patientName"
                    value={formData.patientName}
                    onChange={(e) => handleInputChange('patientName', e.target.value)}
                    placeholder="Adınızı ve soyadınızı girin"
                    className="h-14 text-lg"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="patientPhone" className="text-lg font-semibold mb-2 block">Telefon *</Label>
                  <Input
                    id="patientPhone"
                    value={formData.patientPhone}
                    onChange={(e) => handleInputChange('patientPhone', e.target.value)}
                    placeholder="Telefon numaranızı girin"
                    className="h-14 text-lg"
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="patientEmail" className="flex items-center gap-2 text-lg font-semibold mb-2">
                  <Mail className="h-5 w-5" />
                  E-posta *
                </Label>
                <Input
                  id="patientEmail"
                  type="email"
                  value={formData.patientEmail}
                  onChange={(e) => handleInputChange('patientEmail', e.target.value)}
                  placeholder="E-posta adresinizi girin"
                  className="h-14 text-lg"
                  required
                />
              </div>
              <div>
                <Label htmlFor="notes" className="text-lg font-semibold mb-2 block">Notlar (Opsiyonel)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Randevunuzla ilgili özel notlarınız varsa yazabilirsiniz"
                  rows={4}
                  className="text-lg resize-none"
                />
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-foreground mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Randevu Al
            </h1>
            <p className="text-muted-foreground text-xl max-w-2xl mx-auto leading-relaxed">
              Uzmanlarımızdan kolayca randevu alabilir, size en uygun tarih ve saati seçebilirsiniz.
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-12 overflow-x-auto px-4">
            <div className="flex items-center space-x-2 sm:space-x-4 md:space-x-6 min-w-max">
              {[1, 2, 3, 4, 5].map((step) => (
                <div key={step} className="flex items-center">
                  <div
                    className={cn(
                      "w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full border-2 flex items-center justify-center text-xs sm:text-sm font-semibold transition-all duration-300",
                      step < currentStep
                        ? "bg-primary text-primary-foreground border-primary shadow-lg"
                        : step === currentStep
                        ? "border-primary text-primary bg-primary/10 shadow-md scale-110"
                        : "border-muted-foreground/30 text-muted-foreground"
                    )}
                  >
                    {step < currentStep ? <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 md:h-6 md:w-6" /> : step}
                  </div>
                  {step < 5 && (
                    <div
                      className={cn(
                        "w-6 sm:w-8 md:w-12 h-0.5 sm:h-1 mx-1 sm:mx-2 md:mx-3 rounded-full transition-all duration-300",
                        step < currentStep ? "bg-primary shadow-sm" : "bg-muted-foreground/30"
                      )}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step Content */}
          <div className="mb-12">
            {renderStep()}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center max-w-2xl mx-auto">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="flex items-center gap-2 h-12 px-6 text-lg"
            >
              <ChevronLeft className="h-5 w-5" />
              Geri
            </Button>

            <div className="text-lg text-muted-foreground font-medium">
              {currentStep} / 5
            </div>

            {currentStep === 5 ? (
              <Button
                onClick={handleSubmit}
                disabled={submitting || !formData.patientName || !formData.patientEmail || !formData.patientPhone}
                className="flex items-center gap-2 h-12 px-6 text-lg"
              >
                {submitting ? "Randevu Oluşturuluyor..." : "Randevu Al"}
                <CheckCircle className="h-5 w-5" />
              </Button>
            ) : (
              <div className="w-32" /> // Placeholder to maintain layout
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RandevuSayfasi;