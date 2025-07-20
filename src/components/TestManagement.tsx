
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Edit, Trash2, Eye, FileText, Clock, CheckCircle, XCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TestCreator from "./TestCreator";
import TestResults from "./TestResults";

interface Test {
  id: string;
  title: string;
  description: string;
  category: string;
  specialty_area: string;
  is_active: boolean;
  status: string;
  created_at: string;
}

interface TestManagementProps {
  specialistId: string;
}

const TestManagement = ({ specialistId }: TestManagementProps) => {
  const { toast } = useToast();
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("my-tests");
  const [editingTest, setEditingTest] = useState<Test | null>(null);

  useEffect(() => {
    fetchTests();
  }, [specialistId]);

  const fetchTests = async () => {
    try {
      setLoading(true);
      
      // Fetch tests created by this specialist
      const { data: testsData, error } = await supabase
        .from('tests')
        .select('*')
        .eq('specialist_id', specialistId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Testler yüklenirken hata:', error);
        toast({
          title: "Hata",
          description: "Testler yüklenirken bir hata oluştu.",
          variant: "destructive"
        });
        return;
      }

      setTests(testsData || []);
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

  const handleTestCreated = () => {
    setEditingTest(null);
    setActiveTab("my-tests");
    fetchTests();
    toast({
      title: "Başarılı",
      description: editingTest ? "Test başarıyla güncellendi." : "Test başarıyla oluşturuldu ve admin onayına gönderildi.",
    });
  };

  const handleEditTest = (test: Test) => {
    // Only allow editing if test is not approved yet
    if (test.status === 'approved') {
      toast({
        title: "Uyarı",
        description: "Onaylanmış testler düzenlenemez.",
        variant: "destructive"
      });
      return;
    }
    
    setEditingTest(test);
    setActiveTab("create-test");
  };

  const handleDeleteTest = async (testId: string) => {
    const test = tests.find(t => t.id === testId);
    if (test?.status === 'approved') {
      toast({
        title: "Uyarı",
        description: "Onaylanmış testler silinemez.",
        variant: "destructive"
      });
      return;
    }

    if (!confirm("Bu testi silmek istediğinizden emin misiniz?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from('tests')
        .update({ is_active: false })
        .eq('id', testId);

      if (error) throw error;

      toast({
        title: "Başarılı",
        description: "Test başarıyla silindi.",
      });

      fetchTests();
    } catch (error) {
      console.error('Test silinirken hata:', error);
      toast({
        title: "Hata",
        description: "Test silinirken bir hata oluştu.",
        variant: "destructive"
      });
    }
  };

  const cancelEditing = () => {
    setEditingTest(null);
    setActiveTab("my-tests");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
          <Clock className="w-3 h-3 mr-1" />
          Admin Onayı Bekleniyor
        </Badge>;
      case 'approved':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Onaylandı
        </Badge>;
      case 'rejected':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">
          <XCircle className="w-3 h-3 mr-1" />
          Reddedildi
        </Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
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
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="my-tests">
            <FileText className="w-4 h-4 mr-2" />
            Testlerim
          </TabsTrigger>
          <TabsTrigger value="create-test">
            <Plus className="w-4 h-4 mr-2" />
            {editingTest ? "Testi Düzenle" : "Yeni Test"}
          </TabsTrigger>
          <TabsTrigger value="results">
            <Eye className="w-4 h-4 mr-2" />
            Sonuçlar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-tests">
          <Card>
            <CardHeader>
              <CardTitle>Testlerim</CardTitle>
            </CardHeader>
            <CardContent>
              {tests.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Henüz test bulunmamaktadır.</p>
                  <Button 
                    onClick={() => setActiveTab("create-test")}
                    className="mt-4"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    İlk Testi Oluştur
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {tests.map((test) => (
                    <Card key={test.id} className="border">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                              {test.title}
                            </h3>
                            {test.description && (
                              <p className="text-gray-600 mb-2">{test.description}</p>
                            )}
                            <div className="flex items-center space-x-2 mb-2">
                              {getStatusBadge(test.status)}
                              {test.specialty_area && (
                                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                  {test.specialty_area}
                                </Badge>
                              )}
                              {test.category && (
                                <Badge variant="secondary">{test.category}</Badge>
                              )}
                              <Badge variant={test.is_active ? "default" : "destructive"}>
                                {test.is_active ? "Aktif" : "Pasif"}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-500">
                              Oluşturulma: {new Date(test.created_at).toLocaleDateString('tr-TR')}
                            </p>
                            
                            {test.status === 'rejected' && (
                              <p className="text-sm text-red-600 mt-2">
                                Bu test admin tarafından reddedildi. Düzenleyip tekrar gönderebilirsiniz.
                              </p>
                            )}
                            {test.status === 'pending' && (
                              <p className="text-sm text-yellow-600 mt-2">
                                Bu test admin onayı bekliyor. Onaylandıktan sonra aktif olacaktır.
                              </p>
                            )}
                          </div>
                          <div className="flex space-x-2">
                            {test.status !== 'approved' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditTest(test)}
                                title="Testi Düzenle"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            )}
                            {test.status !== 'approved' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteTest(test.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                title="Testi Sil"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
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
        </TabsContent>

        <TabsContent value="create-test">
          <TestCreator 
            specialistId={specialistId}
            onTestCreated={handleTestCreated}
            editingTest={editingTest}
            onCancel={cancelEditing}
          />
        </TabsContent>

        <TabsContent value="results">
          <TestResults specialistId={specialistId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TestManagement;
