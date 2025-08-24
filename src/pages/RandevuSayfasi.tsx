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
import { CalendarIcon, Clock, User, Mail, Phone, MapPin, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface Specialist {
  id: string;
  name: string;
  specialty: string;
  city: string;
  hospital: string;
  consultation_fee: number;
  online_consultation: boolean;
  face_to_face_consultation: boolean;
  working_hours_start: string;
  working_hours_end: string;
  available_days: string[];
}

// Specialty topics mapping
const specialtyTopics: Record<string, string[]> = {
  'Aile Danışmanı': ['Aile Danışmanı', 'Kadın Doğum', 'Psikolog', 'Uzm. Psikolog', 'Psikolojik Danışmanlık', 'Çiftlik', 'Dil ve Konuşma Terapisti', 'İlişki Danışmanı', 'Eğitim Danışmanlığı', 'Sosyolog'],
  'Psikolog': ['Psikolog', 'Uzm. Psikolog', 'Klinik Psikolog', 'Çocuk Psikoloğu', 'Psikolojik Danışmanlık'],
  'Doktor': ['Genel Tıp', 'Dahiliye', 'Kardiyoloji', 'Nöroloji', 'Psikiyatri'],
  'Diyetisyen': ['Beslenme Danışmanlığı', 'Spor Diyetisyeni', 'Klinik Beslenme'],
  'Fizyoterapist': ['Ortopedik Fizyoterapi', 'Nörolojik Fizyoterapi', 'Spor Fizyoterapisi']
};

const RandevuSayfasi = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
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

  // Fetch specialists and specialties
  useEffect(() => {
    fetchSpecialists();
  }, []);

  const fetchSpecialists = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('specialists')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;

      setSpecialists(data || []);
      
      // Extract unique specialties
      const uniqueSpecialties = [...new Set(data?.map(s => s.specialty) || [])];
      setSpecialties(uniqueSpecialties);
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

  const filteredSpecialists = specialists.filter(s => 
    selectedTopic ? s.specialty === selectedTopic : (selectedSpecialty ? s.specialty === selectedSpecialty : true)
  );

  const canGoNext = (step: number) => {
    switch (step) {
      case 1: return selectedSpecialty;
      case 2: return selectedTopic;
      case 3: return selectedSpecialist;
      case 4: return appointmentType;
      case 5: return selectedDate && selectedTime;
      default: return false;
    }
  };

  const nextStep = () => {
    if (currentStep < 6 && canGoNext(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const resetForm = () => {
    setCurrentStep(1);
    setSelectedSpecialty('');
    setSelectedTopic('');
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

  // Generate time slots based on working hours
  const generateTimeSlots = () => {
    if (!selectedSpecialistData) return [];
    
    const slots = [];
    const startHour = parseInt(selectedSpecialistData.working_hours_start?.split(':')[0] || '9');
    const endHour = parseInt(selectedSpecialistData.working_hours_end?.split(':')[0] || '17');
    
    for (let hour = startHour; hour < endHour; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    
    return slots;
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
      const { error } = await supabase
        .from('appointments')
        .insert({
          specialist_id: selectedSpecialist,
          appointment_date: format(selectedDate, 'yyyy-MM-dd'),
          appointment_time: selectedTime,
          patient_name: formData.patientName,
          patient_email: formData.patientEmail,
          patient_phone: formData.patientPhone,
          appointment_type: appointmentType,
          notes: formData.notes,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Başarılı",
        description: "Randevunuz başarıyla oluşturuldu. En kısa sürede size dönüş yapılacaktır.",
      });

      // Reset form
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
          <Card className="w-full max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                <User className="h-6 w-6 text-primary" />
                Uzmanlık Alanı Seçimi
              </CardTitle>
              <CardDescription className="text-base">
                Hangi alanda uzman arıyorsunuz?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
                <SelectTrigger className="h-12 text-base">
                  <SelectValue placeholder="Uzmanlık alanı seçin" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(specialtyTopics).map((specialty) => (
                    <SelectItem key={specialty} value={specialty} className="text-base py-3">
                      {specialty}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card className="w-full max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                <User className="h-6 w-6 text-primary" />
                Konu Seçimi
              </CardTitle>
              <CardDescription className="text-base">
                {selectedSpecialty} alanında hangi konuda destek almak istiyorsunuz?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                {specialtyTopics[selectedSpecialty]?.map((topic) => (
                  <div
                    key={topic}
                    className={cn(
                      "p-4 border-2 rounded-lg cursor-pointer transition-all hover:scale-[1.02]",
                      selectedTopic === topic
                        ? "border-primary bg-primary/5 shadow-md"
                        : "border-border hover:border-primary/50"
                    )}
                    onClick={() => setSelectedTopic(topic)}
                  >
                    <span className="font-medium">{topic}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card className="w-full max-w-3xl mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                <User className="h-6 w-6 text-primary" />
                Uzman Seçimi
              </CardTitle>
              <CardDescription className="text-base">
                {selectedTopic} konusunda çalışan uzmanlarımız
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {filteredSpecialists.map((specialist) => (
                  <div
                    key={specialist.id}
                    className={cn(
                      "p-4 border-2 rounded-lg cursor-pointer transition-all hover:scale-[1.01]",
                      selectedSpecialist === specialist.id
                        ? "border-primary bg-primary/5 shadow-md"
                        : "border-border hover:border-primary/50"
                    )}
                    onClick={() => setSelectedSpecialist(specialist.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{specialist.name}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {specialist.city}
                          </span>
                          {specialist.hospital && (
                            <span>{specialist.hospital}</span>
                          )}
                        </div>
                        <div className="flex gap-2 mt-3">
                          {specialist.face_to_face_consultation && (
                            <span className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full">
                              Yüz yüze
                            </span>
                          )}
                          {specialist.online_consultation && (
                            <span className="px-3 py-1 bg-secondary/10 text-secondary-foreground text-sm rounded-full">
                              Online
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

      case 4:
        return (
          <Card className="w-full max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                <User className="h-6 w-6 text-primary" />
                Randevu Türü
              </CardTitle>
              <CardDescription className="text-base">
                Randevu türünü seçin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup value={appointmentType} onValueChange={setAppointmentType} className="space-y-4">
                {availableAppointmentTypes.map((type) => (
                  <div key={type} className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted/50">
                    <RadioGroupItem value={type} id={type} className="h-5 w-5" />
                    <Label htmlFor={type} className="text-base font-medium cursor-pointer flex-1">{type}</Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>
        );

      case 5:
        return (
          <Card className="w-full max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                <CalendarIcon className="h-6 w-6 text-primary" />
                Tarih ve Saat Seçimi
              </CardTitle>
              <CardDescription className="text-base">
                Size uygun tarih ve saati seçin
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-base font-medium">Randevu Tarihi</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal h-12 text-base mt-2",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-5 w-5" />
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
                      onSelect={setSelectedDate}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {selectedDate && (
                <div>
                  <Label className="text-base font-medium">Randevu Saati</Label>
                  <Select value={selectedTime} onValueChange={setSelectedTime}>
                    <SelectTrigger className="h-12 text-base mt-2">
                      <SelectValue placeholder="Saat seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {generateTimeSlots().map((time) => (
                        <SelectItem key={time} value={time} className="text-base py-3">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
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

      case 6:
        return (
          <Card className="w-full max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                <User className="h-6 w-6 text-primary" />
                Kişisel Bilgiler
              </CardTitle>
              <CardDescription className="text-base">
                Randevu için gerekli bilgilerinizi girin
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="patientName" className="text-base font-medium">Ad Soyad *</Label>
                  <Input
                    id="patientName"
                    value={formData.patientName}
                    onChange={(e) => handleInputChange('patientName', e.target.value)}
                    placeholder="Adınızı ve soyadınızı girin"
                    className="h-12 text-base mt-2"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="patientPhone" className="text-base font-medium">Telefon *</Label>
                  <Input
                    id="patientPhone"
                    value={formData.patientPhone}
                    onChange={(e) => handleInputChange('patientPhone', e.target.value)}
                    placeholder="Telefon numaranızı girin"
                    className="h-12 text-base mt-2"
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="patientEmail" className="flex items-center gap-2 text-base font-medium">
                  <Mail className="h-4 w-4" />
                  E-posta *
                </Label>
                <Input
                  id="patientEmail"
                  type="email"
                  value={formData.patientEmail}
                  onChange={(e) => handleInputChange('patientEmail', e.target.value)}
                  placeholder="E-posta adresinizi girin"
                  className="h-12 text-base mt-2"
                  required
                />
              </div>
              <div>
                <Label htmlFor="notes" className="text-base font-medium">Notlar (Opsiyonel)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Randevunuzla ilgili özel notlarınız varsa yazabilirsiniz"
                  rows={3}
                  className="text-base mt-2"
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
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-4">Randevu Al</h1>
            <p className="text-muted-foreground text-lg">
              Uzmanlarımızdan kolayca randevu alabilir, size en uygun tarih ve saati seçebilirsiniz.
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-4">
              {[1, 2, 3, 4, 5, 6].map((step) => (
                <div key={step} className="flex items-center">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-medium",
                      step < currentStep
                        ? "bg-primary text-primary-foreground border-primary"
                        : step === currentStep
                        ? "border-primary text-primary bg-primary/10"
                        : "border-muted-foreground/30 text-muted-foreground"
                    )}
                  >
                    {step < currentStep ? <CheckCircle className="h-5 w-5" /> : step}
                  </div>
                  {step < 6 && (
                    <div
                      className={cn(
                        "w-8 h-0.5 mx-2",
                        step < currentStep ? "bg-primary" : "bg-muted-foreground/30"
                      )}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step Content */}
          <div className="mb-8">
            {renderStep()}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center max-w-2xl mx-auto">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Geri
            </Button>

            <div className="text-sm text-muted-foreground">
              {currentStep} / 6
            </div>

            {currentStep < 6 ? (
              <Button
                onClick={nextStep}
                disabled={!canGoNext(currentStep)}
                className="flex items-center gap-2"
              >
                İleri
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={submitting || !formData.patientName || !formData.patientEmail || !formData.patientPhone}
                className="flex items-center gap-2"
              >
                {submitting ? "Randevu Oluşturuluyor..." : "Randevu Al"}
                <CheckCircle className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RandevuSayfasi;