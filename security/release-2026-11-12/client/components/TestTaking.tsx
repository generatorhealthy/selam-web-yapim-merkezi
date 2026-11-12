// RELEASE DRAFT — not loaded by the running application.
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, ArrowRight, Send } from 'lucide-react';

interface Test {
  id: string;
  title: string;
  description: string;
  category: string;
}

import { submitTest, type Operation } from '@/lib/testSubmission';
import TestStartGate from '@/components/TestStartGate';

interface Question {
  id: string;
  question_text: string;
  options: string[];
  step_number: number;
  is_required: boolean;
}

interface TestResult {
  test_id: string;
  specialist_id: string;
  patient_name: string;
  patient_email: string;
  answers: Record<string, string>;
  results: Record<string, any>;
}

const TestTaking = () => {
  const { testId, specialistId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [test, setTest] = useState<Test | null>(null);
  const operationRef = useRef<Operation | null>(null);
  const submitLock = useRef(false);
  const [started, setStarted] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [patientInfo, setPatientInfo] = useState({
    name: '',
    phone: ''
  });
  const [showPatientForm, setShowPatientForm] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (testId && started) {
      fetchTestData();
    }
  }, [testId, started]);

  const fetchTestData = async () => {
    try {
      // Fetch test details
      const { data: testData, error: testError } = await supabase
        .from('tests')
        .select('*')
        .eq('id', testId)
        .eq('is_active', true)
        .maybeSingle();

      if (testError || !testData) throw testError || new Error('Test bulunamadı');

      // Fetch test questions
      const { data: questionsData, error: questionsError } = await supabase
        .from('test_questions')
        .select('*')
        .eq('test_id', testId)
        .order('step_number');

      if (questionsError) throw questionsError;

      setTest(testData);

      // Transform the questions data to match our interface
      const transformedQuestions = questionsData?.map(q => ({
        id: q.id,
        question_text: q.question_text,
        options: Array.isArray(q.options)
          ? q.options.map((opt: any) =>
              typeof opt === 'string' ? opt : opt.text || opt.value || String(opt)
            )
          : [],
        step_number: q.step_number,
        is_required: q.is_required
      })) || [];

      setQuestions(transformedQuestions);
    } catch (error) {
      console.error('Test verisi alınırken hata:', error);
      toast({
        title: "Hata",
        description: "Test verisi alınırken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePatientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientInfo.name.trim() || !patientInfo.phone.trim()) {
      toast({
        title: "Uyarı",
        description: "Lütfen ad soyad ve telefon numarası bilgilerinizi girin.",
        variant: "destructive",
      });
      return;
    }
    setShowPatientForm(false);
  };

  const handleAnswerChange = (value: string) => {
    const currentQuestion = questions[currentQuestionIndex];
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: value
    }));
  };

  const handleNext = () => {
    const currentQuestion = questions[currentQuestionIndex];

    if (currentQuestion.is_required && !answers[currentQuestion.id]) {
      toast({
        title: "Uyarı",
        description: "Bu soruyu cevaplamanız zorunludur.",
        variant: "destructive",
      });
      return;
    }

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (submitLock.current) return;
    if (!operationRef.current) {
      toast({title: 'Sağlık verisi izni gerekli', variant: 'destructive'});
      return;
    }

    // Son soruyu da kontrol et
    const currentQuestion = questions[currentQuestionIndex];
    if (currentQuestion.is_required && !answers[currentQuestion.id]) {
      toast({
        title: "Uyarı",
        description: "Bu soruyu cevaplamanız zorunludur.",
        variant: "destructive",
      });
      return;
    }

    submitLock.current = true;
    setIsSubmitting(true);

    try {


      if (!testId) throw new Error('Test bulunamadı');
      const operation = operationRef.current;
      if (!operation) throw new Error('Test işlemi başlatılmadı');
      const committed = await submitTest(operation, patientInfo.name, patientInfo.phone, answers);
      const results = committed.results;
      const finalSpecialistId = committed.specialistId;

      toast({
        title: "Başarılı",
        description: "Test sonuçlarınız kaydedildi.",
      });

      // Test sonuçları sayfasına yönlendir
      navigate(`/test-sonuc/${testId}/${finalSpecialistId}`);

    } catch (error: any) {
      console.error('Test gönderilirken hata:', error);
      const errorMessage = error?.message || error?.toString() || "Test gönderilirken bir hata oluştu.";
      toast({
        title: "Hata",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      submitLock.current = false;
      setIsSubmitting(false);
    }
  };

  if (!started) {
    if (!testId) return <p>Test bulunamadı.</p>;
    return <TestStartGate testId={testId} specialistId={specialistId && specialistId !== 'genel' ? specialistId : null} onReady={op => { operationRef.current = op; setStarted(true); }} />;
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Test yükleniyor...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!test || questions.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Test bulunamadı veya sorular yüklenemedi.</p>
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

  if (showPatientForm) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>{test.title}</CardTitle>
            <CardDescription>
              Teste başlamak için bilgilerinizi girin
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePatientSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Ad Soyad *</Label>
                <input
                  id="name"
                  type="text"
                  value={patientInfo.name}
                  onChange={(e) => setPatientInfo(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-input rounded-md"
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Telefon Numarası *</Label>
                <input
                  id="phone"
                  type="tel"
                  value={patientInfo.phone}
                  onChange={(e) => setPatientInfo(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-input rounded-md"
                  required
                />
              </div>

              <Button type="submit" className="w-full">
                Teste Başla
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold">{test.title}</h1>
          <span className="text-sm text-muted-foreground">
            {currentQuestionIndex + 1} / {questions.length}
          </span>
        </div>
        <Progress value={progress} className="w-full" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Soru {currentQuestion.step_number}
          </CardTitle>
          <CardDescription>
            {currentQuestion.question_text}
            {currentQuestion.is_required && <span className="text-red-500 ml-1">*</span>}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={answers[currentQuestion.id] || ''}
            onValueChange={handleAnswerChange}
          >
            {currentQuestion.options.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`option-${index}`} />
                <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      <div className="flex justify-between mt-6">
        <Button
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
          variant="outline"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Önceki
        </Button>

        {isLastQuestion ? (
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-green-600 hover:bg-green-700"
          >
            {isSubmitting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            Testi Tamamla
          </Button>
        ) : (
          <Button onClick={handleNext}>
            Sonraki
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default TestTaking;
