
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Eye, Calendar, User, FileText } from "lucide-react";

interface TestResult {
  id: string;
  test_id: string;
  patient_name: string;
  patient_email: string;
  answers: any;
  results: any;
  status: string;
  created_at: string;
  test: {
    title: string;
  };
}

interface TestResultsProps {
  specialistId: string;
}

const TestResults = ({ specialistId }: TestResultsProps) => {
  const { toast } = useToast();
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTestResults();
  }, [specialistId]);

  const fetchTestResults = async () => {
    try {
      setLoading(true);
      
      const { data: resultsData, error } = await supabase
        .from('test_results')
        .select(`
          *,
          tests:test_id (
            title
          )
        `)
        .eq('specialist_id', specialistId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Test sonuçları yüklenirken hata:', error);
        toast({
          title: "Hata",
          description: "Test sonuçları yüklenirken bir hata oluştu.",
          variant: "destructive"
        });
        return;
      }

      const formattedResults = resultsData?.map(result => ({
        ...result,
        test: {
          title: result.tests?.title || 'Bilinmeyen Test'
        }
      })) || [];

      setResults(formattedResults);
    } catch (error) {
      console.error('Beklenmeyen hata:', error);
      toast({
        title: "Hata",
        description: "Beklenmeyen bir hata oluştu.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Test sonuçları yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Test Sonuçları</CardTitle>
      </CardHeader>
      <CardContent>
        {results.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Henüz test sonucu bulunmamaktadır.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {results.map((result) => (
              <Card key={result.id} className="border">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {result.test.title}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-2" />
                          <span><strong>Hasta:</strong> {result.patient_name}</span>
                        </div>
                        <div className="flex items-center">
                          <span><strong>E-posta:</strong> {result.patient_email}</span>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2" />
                          <span><strong>Tarih:</strong> {new Date(result.created_at).toLocaleDateString('tr-TR')}</span>
                        </div>
                        <div className="flex items-center">
                          <Badge variant={result.status === 'completed' ? 'default' : 'secondary'}>
                            {result.status === 'completed' ? 'Tamamlandı' : result.status}
                          </Badge>
                        </div>
                      </div>
                      
                      {result.answers && Object.keys(result.answers).length > 0 && (
                        <div className="mt-4">
                          <h4 className="font-medium mb-2">Cevaplar:</h4>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <pre className="text-sm whitespace-pre-wrap">
                              {JSON.stringify(result.answers, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}
                      
                      {result.results && Object.keys(result.results).length > 0 && (
                        <div className="mt-4">
                          <h4 className="font-medium mb-2">Sonuçlar:</h4>
                          <div className="bg-blue-50 p-3 rounded-lg">
                            <pre className="text-sm whitespace-pre-wrap">
                              {JSON.stringify(result.results, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TestResults;
