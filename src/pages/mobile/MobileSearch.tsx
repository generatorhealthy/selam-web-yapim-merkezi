import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Star, Video, Users } from "lucide-react";
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-6">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-10">
        <div className="p-4 space-y-3">
          <h1 className="text-xl font-bold text-foreground">Uzman Ara</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="İsim, uzmanlık veya şehir ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="px-4 pt-4 space-y-3">
        {filteredSpecialists.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Uzman bulunamadı</p>
          </div>
        ) : (
          filteredSpecialists.map((specialist) => (
            <Card
              key={specialist.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/mobile/specialist/${specialist.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex gap-4">
                  {/* Profile Picture */}
                  <div className="flex-shrink-0">
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-muted">
                      {specialist.profile_picture ? (
                        <img
                          src={specialist.profile_picture}
                          alt={specialist.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl font-semibold text-muted-foreground">
                          {specialist.name.charAt(0)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div>
                      <h3 className="font-semibold text-foreground truncate">
                        {specialist.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {specialist.specialty}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        <span>{specialist.city}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span>{specialist.rating}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {specialist.online_consultation && (
                        <Badge variant="secondary" className="text-xs">
                          <Video className="w-3 h-3 mr-1" />
                          Online
                        </Badge>
                      )}
                      {specialist.face_to_face_consultation && (
                        <Badge variant="secondary" className="text-xs">
                          <Users className="w-3 h-3 mr-1" />
                          Yüz Yüze
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
