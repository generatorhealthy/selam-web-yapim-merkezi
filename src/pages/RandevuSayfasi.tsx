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
import { CalendarIcon, Clock, User, Mail, Phone, MapPin } from 'lucide-react';
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

const RandevuSayfasi = () => {
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
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
    selectedSpecialty ? s.specialty === selectedSpecialty : true
  );

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
      setSelectedSpecialty('');
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-4">Randevu Al</h1>
            <p className="text-muted-foreground">
              Uzmanlarımızdan kolayca randevu alabilir, size en uygun tarih ve saati seçebilirsiniz.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Specialty Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Uzmanlık Alanı Seçimi
                </CardTitle>
                <CardDescription>
                  Hangi alanda uzman arıyorsunuz?
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
                  <SelectTrigger>
                    <SelectValue placeholder="Uzmanlık alanı seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {specialties.map((specialty) => (
                      <SelectItem key={specialty} value={specialty}>
                        {specialty}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Specialist Selection */}
            {selectedSpecialty && (
              <Card>
                <CardHeader>
                  <CardTitle>Uzman Seçimi</CardTitle>
                  <CardDescription>
                    {selectedSpecialty} alanında çalışan uzmanlarımız
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {filteredSpecialists.map((specialist) => (
                      <div
                        key={specialist.id}
                        className={cn(
                          "p-4 border rounded-lg cursor-pointer transition-colors",
                          selectedSpecialist === specialist.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        )}
                        onClick={() => setSelectedSpecialist(specialist.id)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold">{specialist.name}</h3>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                              <span className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {specialist.city}
                              </span>
                              {specialist.hospital && (
                                <span>{specialist.hospital}</span>
                              )}
                            </div>
                            <div className="flex gap-2 mt-2">
                              {specialist.face_to_face_consultation && (
                                <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">
                                  Yüz yüze
                                </span>
                              )}
                              {specialist.online_consultation && (
                                <span className="px-2 py-1 bg-secondary/10 text-secondary-foreground text-xs rounded">
                                  Online
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-semibold">{specialist.consultation_fee}₺</span>
                            <div className="text-xs text-muted-foreground">Konsültasyon</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Appointment Type Selection */}
            {selectedSpecialist && (
              <Card>
                <CardHeader>
                  <CardTitle>Randevu Türü</CardTitle>
                  <CardDescription>
                    Randevu türünü seçin
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RadioGroup value={appointmentType} onValueChange={setAppointmentType}>
                    {availableAppointmentTypes.map((type) => (
                      <div key={type} className="flex items-center space-x-2">
                        <RadioGroupItem value={type} id={type} />
                        <Label htmlFor={type}>{type}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </CardContent>
              </Card>
            )}

            {/* Date and Time Selection */}
            {appointmentType && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5" />
                    Tarih ve Saat Seçimi
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Randevu Tarihi</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !selectedDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
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
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {selectedDate && (
                    <div>
                      <Label>Randevu Saati</Label>
                      <Select value={selectedTime} onValueChange={setSelectedTime}>
                        <SelectTrigger>
                          <SelectValue placeholder="Saat seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          {generateTimeSlots().map((time) => (
                            <SelectItem key={time} value={time}>
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
            )}

            {/* Patient Information */}
            {selectedTime && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Kişisel Bilgiler
                  </CardTitle>
                  <CardDescription>
                    Randevu için gerekli bilgilerinizi girin
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="patientName">Ad Soyad *</Label>
                      <Input
                        id="patientName"
                        value={formData.patientName}
                        onChange={(e) => handleInputChange('patientName', e.target.value)}
                        placeholder="Adınızı ve soyadınızı girin"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="patientPhone">Telefon *</Label>
                      <Input
                        id="patientPhone"
                        value={formData.patientPhone}
                        onChange={(e) => handleInputChange('patientPhone', e.target.value)}
                        placeholder="Telefon numaranızı girin"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="patientEmail" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      E-posta *
                    </Label>
                    <Input
                      id="patientEmail"
                      type="email"
                      value={formData.patientEmail}
                      onChange={(e) => handleInputChange('patientEmail', e.target.value)}
                      placeholder="E-posta adresinizi girin"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="notes">Notlar (Opsiyonel)</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      placeholder="Randevunuzla ilgili özel notlarınız varsa yazabilirsiniz"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Submit Button */}
            {formData.patientName && formData.patientEmail && formData.patientPhone && (
              <div className="flex justify-center">
                <Button
                  type="submit"
                  size="lg"
                  disabled={submitting}
                  className="w-full md:w-auto"
                >
                  {submitting ? "Randevu Oluşturuluyor..." : "Randevu Al"}
                </Button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default RandevuSayfasi;