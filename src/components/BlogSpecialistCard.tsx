import { MapPin, Clock, Globe, UserCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createDoctorSlug } from "@/utils/doctorUtils";

interface Specialist {
  id: string;
  name: string;
  specialty: string;
  city: string;
  experience: number;
  bio: string;
  profile_picture: string | null;
  online_consultation: boolean;
  face_to_face_consultation: boolean;
}

interface BlogSpecialistCardProps {
  specialist: Specialist;
}

const BlogSpecialistCard = ({ specialist }: BlogSpecialistCardProps) => {
  const doctorSlug = createDoctorSlug(specialist.name);

  return (
    <Card className="my-8 border-l-4 border-l-primary bg-gradient-to-r from-blue-50 to-white">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Profile Picture */}
          <div className="flex-shrink-0">
            <img
              src={specialist.profile_picture || '/placeholder-doctor.jpg'}
              alt={specialist.name}
              className="w-32 h-32 rounded-lg object-cover border-2 border-primary/20"
              onError={(e) => {
                e.currentTarget.src = '/placeholder-doctor.jpg';
              }}
            />
          </div>

          {/* Specialist Info */}
          <div className="flex-1">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  {specialist.name}
                </h3>
                <Badge variant="secondary" className="mb-3">
                  {specialist.specialty}
                </Badge>
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{specialist.city}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{specialist.experience} yıl deneyim</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <UserCheck className="w-4 h-4 text-green-600" />
                    <span className="text-green-600">Onaylı Profil</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bio */}
            {specialist.bio && (
              <p className="text-gray-700 mb-4 line-clamp-3">
                {specialist.bio}
              </p>
            )}

            {/* Consultation Types */}
            <div className="flex flex-wrap gap-2 mb-4">
              {specialist.online_consultation && (
                <Badge variant="outline" className="text-green-600 border-green-600">
                  <Globe className="w-3 h-3 mr-1" />
                  Online
                </Badge>
              )}
              {specialist.face_to_face_consultation && (
                <Badge variant="outline" className="text-blue-600 border-blue-600">
                  <UserCheck className="w-3 h-3 mr-1" />
                  Yüz Yüze
                </Badge>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <Button asChild className="bg-primary hover:bg-primary/90">
                <Link to={`/uzman/${doctorSlug}`}>
                  Profili İncele
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to={`/uzman/${doctorSlug}#randevu`}>
                  🗓 Randevu Al
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BlogSpecialistCard;