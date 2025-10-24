import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Star, Video, Users, Filter, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Specialist {
  id: string;
  name: string;
  specialty: string;
  city: string;
  experience: number;
  rating: number;
  profile_picture: string;
  bio: string;
  online_consultation: boolean;
  face_to_face_consultation: boolean;
}

export default function MobileSearch() {
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [filteredSpecialists, setFilteredSpecialists] = useState<Specialist[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchSpecialists();
  }, []);

  useEffect(() => {
    const specialty = searchParams.get('specialty');
    if (specialty) {
      setSearchTerm(specialty);
    }
  }, [searchParams]);

  useEffect(() => {
    filterSpecialists();
  }, [searchTerm, specialists]);

  const fetchSpecialists = async () => {
    try {
      const { data, error } = await supabase.rpc('get_public_specialists');
      
      if (error) throw error;
      
      setSpecialists(data || []);
      setFilteredSpecialists(data || []);
    } catch (error) {
      console.error('Error fetching specialists:', error);
      toast({
        title: "Hata",
        description: "Uzmanlar yüklenirken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterSpecialists = () => {
    if (!searchTerm.trim()) {
      setFilteredSpecialists(specialists);
      return;
    }

    const filtered = specialists.filter(
      (specialist) =>
        specialist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        specialist.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
        specialist.city.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setFilteredSpecialists(filtered);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-muted-foreground">Uzmanlar yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      {/* Search Header with Gradient */}
      <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 rounded-b-[2rem] mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Uzman Ara</h1>
          <Button variant="ghost" size="icon" className="rounded-full">
            <Filter className="w-5 h-5" />
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <Input
            type="text"
            placeholder="İsim, uzmanlık veya şehir ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 h-12 rounded-2xl border-0 shadow-md bg-background"
          />
        </div>
      </div>

      <div className="px-4 pb-20">
        {/* Results Count */}
        {!loading && (
          <p className="text-sm text-muted-foreground mb-4">
            {filteredSpecialists.length} uzman bulundu
          </p>
        )}

        {/* Specialists List */}
        <div className="space-y-4">
          {filteredSpecialists.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-10 h-10 text-muted-foreground" />
              </div>
              <p className="text-lg font-semibold mb-2">Uzman bulunamadı</p>
              <p className="text-sm text-muted-foreground">
                Farklı bir arama terimi deneyin
              </p>
            </div>
          ) : (
            filteredSpecialists.map((specialist) => (
              <Card
                key={specialist.id}
                className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-0 shadow-md overflow-hidden"
                onClick={() => navigate(`/mobile/specialist/${specialist.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {/* Avatar with Gradient Border */}
                    <div className="relative flex-shrink-0">
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/60 p-[2px]">
                        <div className="w-full h-full rounded-2xl bg-background overflow-hidden flex items-center justify-center">
                          {specialist.profile_picture ? (
                            <img 
                              src={specialist.profile_picture} 
                              alt={specialist.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-2xl font-bold text-primary">
                              {specialist.name.charAt(0)}
                            </span>
                          )}
                        </div>
                      </div>
                      {/* Online Status Indicator */}
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-background" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <div>
                        <h3 className="font-bold text-lg truncate">
                          {specialist.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {specialist.specialty}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <div className="p-1 bg-yellow-100 rounded-lg">
                            <Star className="w-3 h-3 text-yellow-600 fill-current" />
                          </div>
                          <span className="text-sm font-semibold">{specialist.rating}</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          {specialist.city}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {specialist.online_consultation && (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-0">
                            <Video className="w-3 h-3 mr-1" />
                            Online
                          </Badge>
                        )}
                        {specialist.face_to_face_consultation && (
                          <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100 border-0">
                            <Users className="w-3 h-3 mr-1" />
                            Yüz Yüze
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Arrow */}
                    <div className="flex items-center">
                      <div className="p-2 bg-primary/10 rounded-full">
                        <ArrowRight className="w-5 h-5 text-primary" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}