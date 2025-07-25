import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Clock, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { HorizontalNavigation } from "@/components/HorizontalNavigation";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";

const Contact = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.message) {
      toast({
        title: "Eksik Bilgi",
        description: "Lütfen zorunlu alanları doldurun.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    console.log('Form data being sent:', formData);

    try {
      // Supabase Edge Function ile e-posta gönder
      const { data, error } = await supabase.functions.invoke('send-contact-email', {
        body: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          subject: formData.subject || "İletişim Formu Mesajı",
          message: formData.message
        }
      });

      if (error) {
        console.error('Supabase Function Error:', error);
        throw new Error(error.message || 'E-posta gönderim hatası');
      }

      console.log('Email sent successfully:', data);

      toast({
        title: "Mesaj Gönderildi",
        description: "Mesajınız başarıyla gönderildi. En kısa sürede size dönüş yapacağız.",
      });

      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: ""
      });
    } catch (error: any) {
      console.error('Contact form error:', error);
      
      toast({
        title: "Hata",
        description: `Mesaj gönderilirken bir hata oluştu: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <HorizontalNavigation />
      
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 py-20">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="relative container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 animate-fade-in">
            İletişim
          </h1>
          <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto animate-fade-in">
            Sizlere yardımcı olmak için buradayız. Herhangi bir sorunuz varsa bizimle iletişime geçin
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16 -mt-10 relative">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* İletişim Formu */}
            <Card className="relative overflow-hidden border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5"></div>
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
              
              <CardHeader className="relative">
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                    <Send className="w-6 h-6" />
                  </div>
                  Bize Yazın
                </CardTitle>
              </CardHeader>
              
              <CardContent className="relative">
                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-gray-700 font-semibold">Ad Soyad *</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Adınızı ve soyadınızı girin"
                        required
                        className="border-2 border-gray-200 focus:border-blue-500 transition-colors h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-gray-700 font-semibold">E-posta *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="E-posta adresinizi girin"
                        required
                        className="border-2 border-gray-200 focus:border-blue-500 transition-colors h-12"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-gray-700 font-semibold">Telefon Numarası</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="Telefon numaranızı girin"
                        className="border-2 border-gray-200 focus:border-blue-500 transition-colors h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject" className="text-gray-700 font-semibold">Konu</Label>
                      <Input
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        placeholder="Mesaj konusunu girin"
                        className="border-2 border-gray-200 focus:border-blue-500 transition-colors h-12"
                      />
                    </div>
                  </div>


                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-gray-700 font-semibold">Mesaj *</Label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Mesajınızı yazın..."
                      rows={6}
                      required
                      className="border-2 border-gray-200 focus:border-blue-500 transition-colors resize-none"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Gönderiliyor...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Send className="w-5 h-5" />
                        Mesaj Gönder
                      </div>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* İletişim Bilgileri */}
            <div className="space-y-8">
              <Card className="relative overflow-hidden border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-blue-500/5 to-purple-500/5"></div>
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 via-blue-500 to-purple-500"></div>
                
                <CardHeader className="relative">
                  <CardTitle className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                    İletişim Bilgileri
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="relative space-y-8">
                  <div className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 transition-colors">
                    <div className="p-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                      <Mail className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 text-lg">E-posta</h4>
                      <p className="text-gray-600">info@doktorumol.com.tr</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-r from-green-50 to-blue-50 hover:from-green-100 hover:to-blue-100 transition-colors">
                    <div className="p-3 rounded-full bg-gradient-to-r from-green-500 to-blue-500 text-white">
                      <Clock className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 text-lg">Çalışma Saatleri</h4>
                      <div className="text-gray-600 space-y-1">
                        <p>Pazartesi - Cuma: 09:00 - 18:00</p>
                        <p>Cumartesi: 09:00 - 18:00</p>
                        <p>Pazar: Kapalı</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Sık Sorulan Sorular */}
              <Card className="relative overflow-hidden border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-pink-500/5 to-orange-500/5"></div>
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500"></div>
                
                <CardHeader className="relative">
                  <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Sık Sorulan Sorular
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="relative">
                  <div className="space-y-6">
                    <div className="p-4 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 transition-colors">
                      <h4 className="font-semibold text-gray-900 text-lg mb-2">
                        Uzman olarak websitenizde nasıl yer alabilirim?
                      </h4>
                      <p className="text-gray-600">
                        "Bize Yazın" formu üzerinden bizimle iletişim sağlayabilirsiniz. Size en kısa süre içinde ulaşacağız.
                      </p>
                    </div>
                    
                    <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 transition-colors">
                      <h4 className="font-semibold text-gray-900 text-lg mb-2">
                        Randevu ücretleri ne kadar?
                      </h4>
                      <p className="text-gray-600">
                        Ücretler uzmana ve muayene türüne göre değişkenlik gösterebilir. Detayları uzmana ulaşarak öğrenebilirsiniz.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Contact;
