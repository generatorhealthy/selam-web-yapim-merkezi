import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft, ChevronRight, Send } from "lucide-react";

interface Question {
  id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'text' | 'scale';
  options: string[];
  step_number: number;
  is_required: boolean;
}

interface TestTakerProps {
  testId: string;
  specialistId: string;
  onComplete: () => void;
}

const TestTaker = ({ testId, specialistId, onComplete }: TestTakerProps) => {
  const { toast } = useToast();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<{ [key: string]: any }>({});
  const [patientInfo, setPatientInfo] = useState({ name: '', phone: '' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [testTitle, setTestTitle] = useState('');

  useEffect(() => {
    fetchTestQuestions();
  }, [testId]);

  const fetchTestQuestions = async () => {
    try {
      setLoading(true);
      
      // Test bilgilerini al
      const { data: testData, error: testError } = await supabase
        .from('tests')
        .select('title')
        .eq('id', testId)
        .single();

      if (testError) throw testError;
      setTestTitle(testData.title);

      // Test sorularını al
      const { data: questionsData, error } = await supabase
        .from('test_questions')
        .select('*')
        .eq('test_id', testId)
        .order('step_number', { ascending: true });

      if (error) throw error;

      const formattedQuestions = questionsData?.map(q => ({
        id: q.id,
        question_text: q.question_text,
        question_type: q.question_type as 'multiple_choice' | 'text' | 'scale',
        options: Array.isArray(q.options) ? q.options.map(opt => String(opt)) : [],
        step_number: q.step_number,
        is_required: q.is_required
      })) || [];

      setQuestions(formattedQuestions);
    } catch (error) {
      console.error('Test soruları yüklenirken hata:', error);
      toast({
        title: "Hata",
        description: "Test soruları yüklenirken bir hata oluştu.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (questionId: string, answer: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!patientInfo.name.trim() || !patientInfo.phone.trim()) {
      toast({
        title: "Hata",
        description: "Lütfen ad soyad ve telefon numarası bilgilerini doldurun.",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    try {
      // Test sonucunu kaydet
      const { data: resultData, error: resultError } = await supabase
        .from('test_results')
        .insert({
          test_id: testId,
          specialist_id: specialistId,
          patient_name: patientInfo.name,
          patient_email: patientInfo.phone, // Telefon numarasını e-posta alanına kaydet
          answers: answers,
          results: {}, // Sonuçlar daha sonra hesaplanabilir
          status: 'completed'
        })
        .select()
        .single();

      if (resultError) throw resultError;

      // Uzman bilgilerini al
      const { data: specialistData, error: specialistError } = await supabase
        .from('specialists')
        .select('email')
        .eq('id', specialistId)
        .single();

      if (specialistError) throw specialistError;

      // E-posta gönder
      if (specialistData.email) {
        try {
          const { error: emailError } = await supabase.functions.invoke('send-test-results-email', {
            body: {
              testResultId: resultData.id,
              specialistEmail: specialistData.email,
              patientName: patientInfo.name,
              patientPhone: patientInfo.phone,
              testTitle: testTitle,
              answers: answers,
              results: {}
            }
          });

          if (emailError) {
            console.error('E-posta gönderim hatası:', emailError);
          }
        } catch (emailError) {
          console.error('E-posta gönderiminde beklenmeyen hata:', emailError);
        }
      }

      toast({
        title: "Başarılı",
        description: "Test başarıyla tamamlandı. Sonuçlar uzmanınıza gönderildi.",
      });

      onComplete();
    } catch (error) {
      console.error('Test sonucu kaydedilirken hata:', error);
      toast({
        title: "Hata",
        description: "Test sonucu kaydedilirken bir hata oluştu.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Test yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <Card>
        <CardContent className="text-center p-8">
          <p className="text-gray-600">Bu test için soru bulunamadı.</p>
        </CardContent>
      </Card>
    );
  }

  const currentQuestion = questions[currentStep];
  const isLastStep = currentStep === questions.length - 1;
  const canProceed = currentQuestion ? answers[currentQuestion.id] !== undefined : false;

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-center">
          {testTitle}
        </CardTitle>
        <div className="text-center text-sm text-gray-500">
          Adım {currentStep + 1} / {questions.length}
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
          ></div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {currentStep === 0 && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="patient-name">Ad Soyad *</Label>
              <Input
                id="patient-name"
                value={patientInfo.name}
                onChange={(e) => setPatientInfo(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Adınızı ve soyadınızı girin"
              />
            </div>
            <div>
              <Label htmlFor="patient-phone">Telefon Numarası *</Label>
              <Input
                id="patient-phone"
                type="tel"
                value={patientInfo.phone}
                onChange={(e) => setPatientInfo(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Telefon numaranızı girin"
              />
            </div>
          </div>
        )}

        {currentQuestion && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">
              {currentQuestion.question_text}
            </h3>

            {currentQuestion.question_type === 'multiple_choice' && (
              <RadioGroup
                value={answers[currentQuestion.id] || ''}
                onValueChange={(value) => handleAnswer(currentQuestion.id, value)}
              >
                {currentQuestion.options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <RadioGroupItem value={option} id={`option-${index}`} />
                    <Label htmlFor={`option-${index}`}>{option}</Label>
                  </div>
                ))}
              </RadioGroup>
            )}

            {currentQuestion.question_type === 'text' && (
              <Textarea
                value={answers[currentQuestion.id] || ''}
                onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
                placeholder="Cevabınızı yazın..."
                rows={4}
              />
            )}

            {currentQuestion.question_type === 'scale' && (
              <div className="space-y-4">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>1 (En düşük)</span>
                  <span>10 (En yüksek)</span>
                </div>
                <Slider
                  value={[answers[currentQuestion.id] || 5]}
                  onValueChange={(values) => handleAnswer(currentQuestion.id, values[0])}
                  max={10}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="text-center text-lg font-semibold">
                  {answers[currentQuestion.id] || 5}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-between">
          <Button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            variant="outline"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Önceki
          </Button>

          {isLastStep ? (
            <Button
              onClick={handleSubmit}
              disabled={!canProceed || submitting || !patientInfo.name.trim() || !patientInfo.phone.trim()}
            >
              <Send className="w-4 h-4 mr-2" />
              {submitting ? "Gönderiliyor..." : "Testi Tamamla"}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={!canProceed || (currentStep === 0 && (!patientInfo.name.trim() || !patientInfo.phone.trim()))}
            >
              Sonraki
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TestTaker;
