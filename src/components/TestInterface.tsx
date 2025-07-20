
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Play, FileText, User } from 'lucide-react';

interface Test {
  id: string;
  title: string;
  description: string;
  category: string;
  content: string;
}

interface Specialist {
  id: string;
  name: string;
  specialty: string;
  profile_picture: string;
}

const TestInterface = () => {
  const { testId, specialistId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [test, setTest] = useState<Test | null>(null);
  const [specialist, setSpecialist] = useState<Specialist | null>(null);
  const [questionCount, setQuestionCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (testId) {
      fetchData();
    }
  }, [testId, specialistId]);

  const fetchData = async () => {
    try {
      // Test bilgisini al
      const { data: testData, error: testError } = await supabase
        .from('tests')
        .select('*')
        .eq('id', testId)
        .eq('is_active', true)
        .single();

      if (testError) throw testError;

      // Soru sayısını al
      const { count } = await supabase
        .from('test_questions')
        .select('*', { count: 'exact' })
        .eq('test_id', testId);

      setTest(testData);
      setQuestionCount(count || 0);

      // Eğer specialist ID'si varsa uzman bilgisini al
      if (specialistId) {
        const { data: specialistData, error: specialistError } = await supabase
          .from('specialists')
          .select('*')
          .eq('id', specialistId)
          .eq('is_active', true)
          .single();

        if (!specialistError && specialistData) {
          setSpecialist(specialistData);
        }
      }
    } catch (error) {
      console.error('Veri alınırken hata:', error);
      toast({
        title: "Hata",
        description: "Test bilgileri alınırken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartTest = () => {
    if (specialistId) {
      navigate(`/test-al/${testId}/${specialistId}`);
    } else {
      // Specialist olmadan test alınması durumu
      // İlk uzmanı seç veya genel test sayfasına yönlendir
      navigate(`/test-al/${testId}/genel`);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Test bulunamadı.</p>
            <Button
              onClick={() => navigate('/')}
              className="mt-4"
            >
              Ana Sayfaya Dön
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Button
        onClick={() => navigate(-1)}
        variant="ghost"
        className="mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Geri Dön
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Test Bilgileri */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl mb-2">{test.title}</CardTitle>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="secondary">
                      <FileText className="w-3 h-3 mr-1" />
                      {test.category}
                    </Badge>
                    <Badge variant="outline">
                      {questionCount} Soru
                    </Badge>
                  </div>
                </div>
              </div>
              <CardDescription className="text-base">
                {test.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {test.content && (
                <div className="prose max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: test.content }} />
                </div>
              )}

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">Test Hakkında:</h4>
                <ul className="text-blue-700 text-sm space-y-1">
                  <li>• Bu test {questionCount} sorudan oluşmaktadır</li>
                  <li>• Testi tamamlamak yaklaşık 10-15 dakika sürer</li>
                  <li>• Tüm sorular zorunludur</li>
                  <li>• Sonuçlarınız size e-posta ile gönderilecektir</li>
                  <li>• Test sonuçları sadece bilgilendirme amaçlıdır</li>
                </ul>
              </div>

              <div className="mt-6 p-4 bg-amber-50 rounded-lg">
                <h4 className="font-semibold text-amber-800 mb-2">Önemli Uyarı:</h4>
                <p className="text-amber-700 text-sm">
                  Bu test sonuçları profesyonel bir tanı yerine geçmez. Herhangi bir sağlık 
                  endişeniz varsa, lütfen bir sağlık profesyoneli ile görüşün.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Uzman Bilgisi ve Başlat Butonu */}
        <div className="space-y-6">
          {specialist && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Test Uzmanı
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  {specialist.profile_picture && (
                    <img
                      src={specialist.profile_picture}
                      alt={specialist.name}
                      className="w-20 h-20 rounded-full mx-auto mb-3 object-cover"
                    />
                  )}
                  <h3 className="font-semibold text-lg">{specialist.name}</h3>
                  <p className="text-muted-foreground">{specialist.specialty}</p>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="pt-6">
              <Button
                onClick={handleStartTest}
                size="lg"
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <Play className="w-5 h-5 mr-2" />
                Teste Başla
              </Button>
              
              <div className="mt-4 text-center text-sm text-muted-foreground">
                <p>Teste başladığınızda bilgilerinizi girmeniz istenecektir.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TestInterface;
