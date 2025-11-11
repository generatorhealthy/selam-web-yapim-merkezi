
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const POPULAR_SPECIALTIES = [
  { name: "Psikolog", slug: "psikolog" },
  { name: "Psikolojik Danışmanlık", slug: "psikolojik-danismanlik" },
  { name: "Aile Danışmanı", slug: "aile-danismani" },
  { name: "Psikiyatri", slug: "psikiyatri" },
  { name: "Kadın Hastalıkları ve Doğum", slug: "kadin-hastaliklari-ve-dogum" },
  { name: "Diyetisyen", slug: "diyetisyen" },
  { name: "Klinik Psikolog", slug: "klinik-psikolog" },
  { name: "Romatoloji", slug: "romatoloji" },
  { name: "Genel Cerrahi", slug: "genel-cerrahi" },
  { name: "Tıbbi Onkoloji", slug: "tibbi-onkoloji" },
  { name: "Dahiliye - İç Hastalıkları", slug: "dahiliye" }
];

const PopularSpecialties = () => {
  const navigate = useNavigate();
  const [specialtyCounts, setSpecialtyCounts] = useState<{[key: string]: number}>({});

  useEffect(() => {
    fetchSpecialtyCounts();
  }, []);

  const fetchSpecialtyCounts = async () => {
    try {
      const { data, error } = await supabase
        .from('specialists')
        .select('specialty')
        .eq('is_active', true);

      if (error) {
        console.error('Uzman sayıları çekilirken hata:', error);
        return;
      }

      // Count specialists by specialty
      const counts: {[key: string]: number} = {};
      data?.forEach(specialist => {
        counts[specialist.specialty] = (counts[specialist.specialty] || 0) + 1;
      });

      setSpecialtyCounts(counts);
    } catch (error) {
      console.error('Beklenmeyen hata:', error);
    }
  };

  const handleSpecialtyClick = (specialty: { name: string; slug: string }) => {
    console.log('Specialty clicked:', specialty);
    navigate(`/uzmanlik/${specialty.slug}`);
  };

  return (
    <div className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Popüler Branşlar
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            En çok tercih edilen uzmanlık alanlarından uzmanlarımızla hemen iletişime geçin
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {POPULAR_SPECIALTIES.map((specialty) => (
            <Card 
              key={specialty.slug}
              className="hover:shadow-lg transition-shadow cursor-pointer group"
              onClick={() => handleSpecialtyClick(specialty)}
            >
              <CardContent className="p-4 text-center">
                <h3 className="font-semibold text-sm mb-2 group-hover:text-blue-600 transition-colors">
                  {specialty.name}
                </h3>
                <Badge variant="outline" className="text-xs">
                  {specialtyCounts[specialty.name] || 0} Uzman
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-8">
          <button
            onClick={() => navigate('/uzmanlar')}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Tüm Branşları Görüntüle →
          </button>
        </div>
      </div>
    </div>
  );
};

export default PopularSpecialties;
