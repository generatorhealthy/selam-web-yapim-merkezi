import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, ArrowLeft, MessageCircle, Phone, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { createDoctorSlug, createSpecialtySlug } from "@/utils/doctorUtils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { HorizontalNavigation } from "@/components/HorizontalNavigation";
import Footer from "@/components/Footer";

interface Specialist {
  id: string;
  name: string;
  specialty: string;
  city: string;
  experience?: number;
  rating?: number;
  reviews_count?: number;
  bio?: string;
  profile_picture?: string;
  online_consultation?: boolean;
  face_to_face_consultation?: boolean;
  phone?: string;
}

const SpecialtyPage = () => {
  const { specialty: specialtySlug } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [loading, setLoading] = useState(true);
  const [specialtyName, setSpecialtyName] = useState("");

  // Slug'dan specialty adını çözümle
  const getSpecialtyFromSlug = (slug: string) => {
    const specialtyMap: { [key: string]: string } = {
      "psikoloji": "Psikoloji",
      "aile-danismani": "Aile Danışmanı", 
      "psikiyatri": "Psikiyatri",
      "psikolojik-danisman": "Psikolojik Danışman",
      "kadin-hastaliklari-ve-dogum": "Kadın Hastalıkları ve Doğum",
      "diyetisyen": "Diyetisyen",
      "klinik-psikolog": "Klinik Psikolog",
      "romatoloji": "Romatoloji",
      "genel-cerrahi": "Genel Cerrahi",
      "tibbi-onkoloji": "Tıbbi Onkoloji",
      "dahiliye": "Dahiliye - İç Hastalıkları",
      // Diğer branşlar için ek mappingler
      "acil-tip": "Acil Tıp",
      "aile-hekimligi": "Aile Hekimliği",
      "aile-ve-iliski-danismani": "Aile ve İlişki Danışmanı",
      "aile-ve-sosyal-yasam-danismanligi": "Aile ve Sosyal Yaşam Danışmanlığı",
      "akupunktur": "Akupunktur",
      "alerji-hastaliklari": "Alerji Hastalıkları",
      "alerji-ve-gogus-hastaliklari": "Alerji ve Göğüs Hastalıkları",
      "algoloji-fiziksel-tip": "Algoloji (Fiziksel Tıp ve Rehabilitasyon)",
      "algoloji-noroloji": "Algoloji (Noroloji)",
      "androloji": "Androloji",
      "anestezi-ve-reanimasyon": "Anestezi ve Reanimasyon",
      "kardiyoloji": "Kardiyoloji",
      "dermatoloji": "Dermatoloji",
      "ortopedi-ve-travmatoloji": "Ortopedi ve Travmatoloji",
      "goz-hastaliklari": "Göz Hastalıkları",
      "kbb": "Kulak Burun Boğaz hastalıkları – KBB",
      "plastik-cerrahi": "Plastik Cerrahi",
      "cocuk-sagligi": "Çocuk Sağlığı ve Hastalıkları",
      "endokrinoloji": "Endokrinoloji ve Metabolizma Hastalıkları",
      "noroloji": "Nöroloji (Beyin ve Sinir Hastalıkları)",
      "gastroenteroloji": "Gastroenteroloji",
      "uroloji": "Üroloji"
    };
    return specialtyMap[slug] || slug;
  };

  useEffect(() => {
    if (specialtySlug) {
      const specialty = getSpecialtyFromSlug(specialtySlug);
      setSpecialtyName(specialty);
      fetchSpecialists(specialty);
    }
  }, [specialtySlug]);

  const fetchSpecialists = async (specialty: string) => {
    try {
      setLoading(true);
      console.log('Fetching specialists for specialty:', specialty);
      
      // Tam eşleşme ara
      const { data: exactMatch, error: exactError } = await supabase
        .from('specialists')
        .select('*')
        .eq('specialty', specialty)
        .eq('is_active', true);

      if (exactError) {
        console.error('Exact match error:', exactError);
        throw exactError;
      }

      console.log('Exact match results:', exactMatch);

      // Eğer tam eşleşme yoksa, kısmi eşleşme dene
      if (!exactMatch || exactMatch.length === 0) {
        console.log('Trying partial match...');
        const { data: partialMatch, error: partialError } = await supabase
          .from('specialists')
          .select('*')
          .ilike('specialty', `%${specialty}%`)
          .eq('is_active', true);

        if (partialError) {
          console.error('Partial match error:', partialError);
          throw partialError;
        }

        console.log('Partial match results:', partialMatch);
        setSpecialists(partialMatch || []);
      } else {
        setSpecialists(exactMatch || []);
      }
      
    } catch (error) {
      console.error('Beklenmeyen hata:', error);
      toast({
        title: "Hata",
        description: "Uzmanlar yüklenirken bir hata oluştu.",
        variant: "destructive"
      });
      setSpecialists([]);
    } finally {
      setLoading(false);
    }
  };

  const getAppointmentTypes = (specialist: Specialist) => {
    const types = [];
    if (specialist.online_consultation) types.push('Online');
    if (specialist.face_to_face_consultation !== false) types.push('Yüz Yüze');
    return types.length > 0 ? types : ['Yüz Yüze'];
  };

  const handleWhatsAppClick = (specialist: Specialist) => {
    const message = `${specialist.name} Uzmanından bilgi almak istiyorum`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/902162350650?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleCallClick = (phone?: string) => {
    if (phone) {
      window.location.href = `tel:${phone}`;
    }
  };

  const handleProfileClick = (specialist: Specialist) => {
    const specialtySlugForLinks = createSpecialtySlug(specialist.specialty);
    const doctorSlug = createDoctorSlug(specialist.name);
    navigate(`/${specialtySlugForLinks}/${doctorSlug}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <HorizontalNavigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Uzmanlar yükleniyor...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <HorizontalNavigation />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Geri Dön
            </Button>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {specialtyName} Uzmanları
          </h1>
        </div>

        {specialists.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg mb-4">
              Bu branşta henüz uzman bulunmamaktadır.
            </p>
            <Button asChild>
              <Link to="/uzmanlar">Tüm Uzmanları Görüntüle</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {specialists.map((specialist) => {
              const specialtySlugForLinks = createSpecialtySlug(specialist.specialty);
              const doctorSlug = createDoctorSlug(specialist.name);
              
              return (
                <Card key={specialist.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <img
                        src={specialist.profile_picture || "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=300&h=300&fit=crop&crop=face"}
                        alt={specialist.name}
                        className="w-16 h-16 rounded-lg object-cover cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => handleProfileClick(specialist)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 
                            className="font-semibold text-lg cursor-pointer hover:text-blue-600 transition-colors"
                            onClick={() => handleProfileClick(specialist)}
                          >
                            {specialist.name}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-green-700 font-medium text-sm">Onaylı Profil</span>
                        </div>
                        <Badge variant="secondary" className="mb-2 text-xs">
                          {specialist.specialty}
                        </Badge>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="w-4 h-4" />
                          {specialist.city}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {specialist.experience && (
                        <span className="text-xs text-gray-600">
                          {specialist.experience} yıl deneyim
                        </span>
                      )}

                      <div className="flex gap-2">
                        {getAppointmentTypes(specialist).map((type) => (
                          <Badge key={type} variant="outline" className="text-xs">
                            {type}
                          </Badge>
                        ))}
                      </div>

                      {specialist.bio && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {specialist.bio}
                        </p>
                      )}

                      <div className="flex gap-2 pt-3">
                        <Button asChild className="flex-1">
                          <Link to={`/${specialtySlugForLinks}/${doctorSlug}`}>
                            Profili Görüntüle
                          </Link>
                        </Button>
                        <Button variant="outline" asChild>
                          <Link to={`/randevu-al/${specialtySlugForLinks}/${doctorSlug}`}>
                            <Calendar className="w-4 h-4 mr-2" />
                            Randevu
                          </Link>
                        </Button>
                      
                      {/* WhatsApp and Call Buttons */}
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleWhatsAppClick(specialist)}
                          className="border-green-200 text-green-700 hover:bg-green-50"
                          title="WhatsApp"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleCallClick(specialist.phone)}
                          className="border-blue-200 text-blue-700 hover:bg-blue-50"
                          title="Ara"
                        >
                          <Phone className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              );
            })}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default SpecialtyPage;
