import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, AlertCircle, Info, Home, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface TestResults {
  totalScore: number;
  scorePercentage: number;
  completionRate: number;
  riskLevel: string;
  recommendations: string;
  answeredQuestions: number;
  totalQuestions: number;
}

interface PatientInfo {
  name: string;
  phone: string;
}

const TestResult = () => {
  const { testId, specialistId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [testTitle, setTestTitle] = useState('');
  const [specialistName, setSpecialistName] = useState('');
  const [loading, setLoading] = useState(true);

  const results: TestResults = location.state?.results;
  const patientInfo: PatientInfo = location.state?.patientInfo;

  useEffect(() => {
    if (testId && specialistId) {
      fetchTestAndSpecialistInfo();
    }
  }, [testId, specialistId]);

  const fetchTestAndSpecialistInfo = async () => {
    try {
      // Test bilgisini al
      const { data: testData } = await supabase
        .from('tests')
        .select('title')
        .eq('id', testId)
        .single();

      // Uzman bilgisini al
      const { data: specialistData } = await supabase
        .from('specialists')
        .select('name')
        .eq('id', specialistId)
        .single();

      if (testData) setTestTitle(testData.title);
      if (specialistData) setSpecialistName(specialistData.name);
    } catch (error) {
      console.error('Bilgi alınırken hata:', error);
    } finally {
      setLoading(false);
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

  if (!results || !patientInfo) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Sonuç Bulunamadı</h2>
            <p className="text-muted-foreground mb-4">
              Test sonuçları bulunamadı. Lütfen testi tekrar yapın.
            </p>
            <Button onClick={() => navigate('/')}>
              <Home className="w-4 h-4 mr-2" />
              Ana Sayfaya Dön
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'Düşük':
        return 'bg-green-100 text-green-800';
      case 'Orta':
        return 'bg-yellow-100 text-yellow-800';
      case 'Yüksek':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'Düşük':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'Orta':
        return <Info className="w-5 h-5 text-yellow-600" />;
      case 'Yüksek':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Info className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Test Sonuçlarınız</h1>
        <p className="text-muted-foreground">
          {testTitle} testi tamamlandı
        </p>
      </div>

      {/* Test Bilgileri */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Test Bilgileri
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Katılımcı</p>
              <p className="font-medium">{patientInfo.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Telefon</p>
              <p className="font-medium">{patientInfo.phone}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Test</p>
              <p className="font-medium">{testTitle}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Uzman</p>
              <p className="font-medium">{specialistName}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ana Sonuçlar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tamamlama Oranı</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>{results.answeredQuestions} / {results.totalQuestions} soru</span>
                <span className="font-bold">{results.completionRate}%</span>
              </div>
              <Progress value={results.completionRate} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Risk Seviyesi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-3">
              {getRiskIcon(results.riskLevel)}
              <Badge className={getRiskColor(results.riskLevel)}>
                {results.riskLevel} Risk
              </Badge>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold">{results.scorePercentage}%</span>
              <p className="text-sm text-muted-foreground">
                {results.totalScore} / {results.totalQuestions * 4} puan
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Öneriler */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Değerlendirme ve Öneriler</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground leading-relaxed">
            {results.recommendations}
          </p>
          
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">Önemli Not:</h4>
            <p className="text-blue-700 text-sm">
              Bu test sonuçları sadece bilgilendirme amaçlıdır ve profesyonel bir tanı yerine geçmez. 
              Herhangi bir endişeniz varsa, lütfen bir sağlık profesyoneli ile görüşün.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Ana Sayfa Butonu */}
      <div className="flex justify-center">
        <Button
          onClick={() => navigate('/')}
          variant="outline"
        >
          <Home className="w-4 h-4 mr-2" />
          Ana Sayfaya Dön
        </Button>
      </div>

      <div className="text-center mt-8 text-sm text-muted-foreground">
        <p>Test sonuçlarınız uzmanınıza gönderilmiştir.</p>
        <p>Test tarihi: {new Date().toLocaleDateString('tr-TR')}</p>
      </div>
    </div>
  );
};

export default TestResult;
