import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Plus, Trash2, Save } from "lucide-react";
import { Json } from "@/integrations/supabase/types";

interface TestCreatorProps {
  specialistId: string;
  onTestCreated: () => void;
  editingTest?: any;
  onCancel?: () => void;
}

interface Question {
  id: string;
  question_text: string;
  question_type: string;
  options: { text: string; value: number }[];
  is_required: boolean;
  step_number: number;
}

const TestCreator = ({ specialistId, onTestCreated, editingTest, onCancel }: TestCreatorProps) => {
  const { toast } = useToast();
  const [testTitle, setTestTitle] = useState(editingTest?.title || "");
  const [testDescription, setTestDescription] = useState(editingTest?.description || "");
  const [testContent, setTestContent] = useState(editingTest?.content || "");
  const [testCategory, setTestCategory] = useState(editingTest?.category || "");
  const [specialtyArea, setSpecialtyArea] = useState(editingTest?.specialty_area || "");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);

  const specialtyOptions = [
    "Psikolog",
    "Psikolojik Danışman", 
    "Diyetisyen",
    "Fizyoterapist",
    "Aile Danışmanı"
  ];

  useEffect(() => {
    if (editingTest) {
      fetchTestQuestions();
    } else {
      // Add initial question for new test
      addNewQuestion();
    }
  }, [editingTest]);

  const fetchTestQuestions = async () => {
    if (!editingTest?.id) return;

    try {
      const { data: questionsData, error } = await supabase
        .from('test_questions')
        .select('*')
        .eq('test_id', editingTest.id)
        .order('step_number');

      if (error) throw error;

      // Transform the data to match our Question interface
      const transformedQuestions: Question[] = (questionsData || []).map(q => ({
        id: q.id,
        question_text: q.question_text,
        question_type: q.question_type,
        options: Array.isArray(q.options) ? q.options as { text: string; value: number }[] : [
          { text: "Hiçbir zaman", value: 0 },
          { text: "Nadiren", value: 1 },
          { text: "Bazen", value: 2 },
          { text: "Sık sık", value: 3 },
          { text: "Her zaman", value: 4 }
        ],
        is_required: q.is_required,
        step_number: q.step_number
      }));

      setQuestions(transformedQuestions);
    } catch (error) {
      console.error('Sorular yüklenirken hata:', error);
    }
  };

  const addNewQuestion = () => {
    const newQuestion: Question = {
      id: `temp-${Date.now()}`,
      question_text: "",
      question_type: "multiple_choice",
      options: [
        { text: "Hiçbir zaman", value: 0 },
        { text: "Nadiren", value: 1 },
        { text: "Bazen", value: 2 },
        { text: "Sık sık", value: 3 },
        { text: "Her zaman", value: 4 }
      ],
      is_required: true,
      step_number: questions.length + 1
    };

    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
    setQuestions(updatedQuestions);
  };

  const removeQuestion = (index: number) => {
    const updatedQuestions = questions.filter((_, i) => i !== index);
    // Update step numbers
    updatedQuestions.forEach((q, i) => {
      q.step_number = i + 1;
    });
    setQuestions(updatedQuestions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!testTitle.trim()) {
      toast({
        title: "Hata",
        description: "Test başlığı zorunludur.",
        variant: "destructive"
      });
      return;
    }

    if (!specialtyArea) {
      toast({
        title: "Hata",
        description: "Uzmanlık alanı seçimi zorunludur.",
        variant: "destructive"
      });
      return;
    }

    if (questions.length === 0) {
      toast({
        title: "Hata",
        description: "En az bir soru eklemelisiniz.",
        variant: "destructive"
      });
      return;
    }

    // Validate questions
    const invalidQuestions = questions.filter(q => !q.question_text.trim());
    if (invalidQuestions.length > 0) {
      toast({
        title: "Hata",
        description: "Tüm sorular doldurulmalıdır.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      let testId = editingTest?.id;
      
      if (editingTest) {
        // Update existing test
        const { error: updateError } = await supabase
          .from('tests')
          .update({
            title: testTitle,
            description: testDescription,
            content: testContent,
            category: testCategory,
            specialty_area: specialtyArea,
            status: 'pending'
          })
          .eq('id', editingTest.id);

        if (updateError) throw updateError;

        // Delete existing questions
        const { error: deleteError } = await supabase
          .from('test_questions')
          .delete()
          .eq('test_id', editingTest.id);

        if (deleteError) throw deleteError;
      } else {
        // Create new test
        const { data: testData, error: testError } = await supabase
          .from('tests')
          .insert({
            title: testTitle,
            description: testDescription,
            content: testContent,
            category: testCategory,
            specialty_area: specialtyArea,
            specialist_id: specialistId,
            status: 'pending',
            is_active: false
          })
          .select()
          .single();

        if (testError) throw testError;
        testId = testData.id;
      }

      // Insert questions
      const questionsToInsert = questions.map(q => ({
        test_id: testId,
        question_text: q.question_text,
        question_type: q.question_type,
        options: q.options,
        is_required: q.is_required,
        step_number: q.step_number
      }));

      const { error: questionsError } = await supabase
        .from('test_questions')
        .insert(questionsToInsert);

      if (questionsError) throw questionsError;

      toast({
        title: "Başarılı",
        description: editingTest ? "Test başarıyla güncellendi." : "Test başarıyla oluşturuldu.",
      });

      onTestCreated();
    } catch (error: any) {
      console.error('Test kaydedilirken hata:', error);
      toast({
        title: "Hata",
        description: error?.message || "Test kaydedilirken bir hata oluştu.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-white rounded-2xl shadow-sm border-0">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl">
          {editingTest ? "Testi Düzenle" : "Yeni Test Oluştur"}
        </CardTitle>
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Geri
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="testTitle">Test Başlığı *</Label>
              <Input
                id="testTitle"
                value={testTitle}
                onChange={(e) => setTestTitle(e.target.value)}
                placeholder="Test başlığını girin"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="specialtyArea">Uzmanlık Alanı *</Label>
              <Select value={specialtyArea} onValueChange={setSpecialtyArea}>
                <SelectTrigger>
                  <SelectValue placeholder="Uzmanlık alanı seçin" />
                </SelectTrigger>
                <SelectContent>
                  {specialtyOptions.map((specialty) => (
                    <SelectItem key={specialty} value={specialty}>
                      {specialty}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="testDescription">Test Açıklaması</Label>
            <Textarea
              id="testDescription"
              value={testDescription}
              onChange={(e) => setTestDescription(e.target.value)}
              placeholder="Test hakkında kısa bir açıklama yazın"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="testContent">Test İçeriği</Label>
            <Textarea
              id="testContent"
              value={testContent}
              onChange={(e) => setTestContent(e.target.value)}
              placeholder="Detaylı test içeriği, yönergeler ve açıklamalar..."
              rows={4}
            />
          </div>

          <div>
            <Label htmlFor="testCategory">Kategori</Label>
            <Input
              id="testCategory"
              value={testCategory}
              onChange={(e) => setTestCategory(e.target.value)}
              placeholder="Test kategorisi (opsiyonel)"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <Label className="text-lg font-semibold">Sorular</Label>
              <Button type="button" onClick={addNewQuestion} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Soru Ekle
              </Button>
            </div>

            <div className="space-y-6">
              {questions.map((question, index) => (
                <Card key={question.id} className="border">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <Label className="font-medium">Soru {index + 1}</Label>
                      {questions.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeQuestion(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label htmlFor={`question-${index}`}>Soru Metni *</Label>
                        <Textarea
                          id={`question-${index}`}
                          value={question.question_text}
                          onChange={(e) => updateQuestion(index, 'question_text', e.target.value)}
                          placeholder="Soru metnini girin"
                          rows={2}
                          required
                        />
                      </div>

                      <div>
                        <Label>Seçenekler</Label>
                        <div className="grid grid-cols-1 gap-2 mt-2">
                          {question.options.map((option, optionIndex) => (
                            <div key={optionIndex} className="flex items-center space-x-2">
                              <span className="text-sm font-medium w-8">{option.value}</span>
                              <Input
                                value={option.text}
                                onChange={(e) => {
                                  const newOptions = [...question.options];
                                  newOptions[optionIndex].text = e.target.value;
                                  updateQuestion(index, 'options', newOptions);
                                }}
                                placeholder={`Seçenek ${optionIndex + 1}`}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                İptal
              </Button>
            )}
            <Button type="submit" disabled={loading}>
              <Save className="w-4 h-4 mr-2" />
              {loading ? "Kaydediliyor..." : (editingTest ? "Güncelle" : "Kaydet")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default TestCreator;
