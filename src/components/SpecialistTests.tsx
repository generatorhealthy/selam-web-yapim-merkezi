
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Play } from "lucide-react";
import { Link } from "react-router-dom";

interface Test {
  id: string;
  title: string;
  description: string;
  category: string;
  specialty_area: string;
  is_active: boolean;
  created_at: string;
  image_url: string | null;
}

interface SpecialistTestsProps {
  specialistId: string;
  specialistName: string;
  specialistSpecialty: string;
}

const SpecialistTests = ({ specialistId, specialistName, specialistSpecialty }: SpecialistTestsProps) => {
  const { toast } = useToast();
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSpecialistTests();
  }, [specialistId, specialistSpecialty]);

  const fetchSpecialistTests = async () => {
    try {
      setLoading(true);
      
      // Fetch tests that belong to this specific specialist
      const { data: testsData, error } = await supabase
        .from('tests')
        .select('*')
        .eq('is_active', true)
        .eq('status', 'approved')
        .eq('specialist_id', specialistId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Testler yüklenirken hata:', error);
        return;
      }

      setTests(testsData || []);
    } catch (error) {
      console.error('Beklenmeyen hata:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Testler yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tests.length === 0 ? (
        <div className="text-center py-8">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">
            {specialistSpecialty} uzmanlık alanında henüz test bulunmamaktadır.
          </p>
        </div>
      ) : (
        tests.map((test) => (
          <Card key={test.id} className="border hover:shadow-md transition-shadow">
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col md:flex-row md:justify-between md:items-start space-y-4 md:space-y-0">
                {test.image_url && (
                  <div className="w-full md:w-48 md:mr-4">
                    <img 
                      src={test.image_url} 
                      alt={test.title}
                      className="w-full h-32 md:h-40 object-cover rounded-lg"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <div className="flex-1 md:mr-4">
                  <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">
                    {test.title}
                  </h3>
                  {test.description && (
                    <p className="text-gray-600 mb-3 leading-relaxed text-sm md:text-base">
                      {test.description}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 text-xs">
                      {test.specialty_area}
                    </Badge>
                    {test.category && (
                      <Badge variant="outline" className="text-xs">
                        {test.category}
                      </Badge>
                    )}
                    <Badge variant="default" className="bg-green-50 text-green-700 text-xs">
                      Aktif
                    </Badge>
                  </div>
                  <p className="text-xs md:text-sm text-gray-500">
                    {specialistName} tarafından hazırlanmıştır
                  </p>
                </div>
                <div className="w-full md:w-auto">
                  <Button 
                    asChild
                    className="bg-blue-600 hover:bg-blue-700 text-white w-full md:w-auto"
                  >
                    <Link to={`/test/${test.id}/${specialistId}`}>
                      <Play className="w-4 h-4 mr-2" />
                      Teste Başla
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};

export default SpecialistTests;
