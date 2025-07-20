import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  ClipboardCheck, 
  Eye, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle,
  Clock,
  User,
  Calendar,
  Plus
} from "lucide-react";
import { HorizontalNavigation } from "@/components/HorizontalNavigation";
import Footer from "@/components/Footer";
import { useUserRole } from "@/hooks/useUserRole";
import { Helmet } from "react-helmet-async";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdminBackButton from "@/components/AdminBackButton";
import TestCreator from "@/components/TestCreator";

interface Test {
  id: string;
  title: string;
  description: string;
  category: string;
  specialty_area: string;
  status: string;
  is_active: boolean;
  created_at: string;
  specialist_id: string;
  specialists?: {
    name: string;
    specialty: string;
  };
}

const TestManagement = () => {
  const { toast } = useToast();
  const { userProfile, loading: userLoading } = useUserRole();
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [createTestOpen, setCreateTestOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    category: '',
    specialty_area: ''
  });

  const specialtyOptions = [
    "Psikolog",
    "Psikolojik Danışman",
    "Diyetisyen",
    "Fizyoterapist",
    "Aile Danışmanı"
  ];

  useEffect(() => {
    if (!userLoading && userProfile?.role === 'admin') {
      fetchTests();
    }
  }, [userLoading, userProfile]);

  const fetchTests = async () => {
    try {
      setLoading(true);
      
      const { data: testsData, error } = await supabase
        .from('tests')
        .select(`
          *,
          specialists:specialist_id (
            name,
            specialty
          )
        `)
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
    setCreateTestOpen(false);
    fetchTests();
    toast({
      title: "Başarılı",
      description: "Test başarıyla oluşturuldu.",
    });
  };

  const handleApproveTest = async (testId: string) => {
    try {
      const { error } = await supabase
        .from('tests')
        .update({ 
          status: 'approved',
          is_active: true 
        })
        .eq('id', testId);

      if (error) throw error;

      toast({
        title: "Başarılı",
        description: "Test başarıyla onaylandı.",
      });

      fetchTests();
    } catch (error) {
      console.error('Test onaylanırken hata:', error);
      toast({
        title: "Hata",
        description: "Test onaylanırken bir hata oluştu.",
        variant: "destructive"
      });
    }
  };

  const handleRejectTest = async (testId: string) => {
    try {
      const { error } = await supabase
        .from('tests')
        .update({ 
          status: 'rejected',
          is_active: false 
        })
        .eq('id', testId);

      if (error) throw error;

      toast({
        title: "Başarılı",
        description: "Test reddedildi.",
      });

      fetchTests();
    } catch (error) {
      console.error('Test reddedilirken hata:', error);
      toast({
        title: "Hata",
        description: "Test reddedilirken bir hata oluştu.",
        variant: "destructive"
      });
    }
  };

  const handleEditTest = (test: Test) => {
    setSelectedTest(test);
    setEditForm({
      title: test.title,
      description: test.description || '',
      category: test.category || '',
      specialty_area: test.specialty_area || ''
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedTest) return;

    try {
      const { error } = await supabase
        .from('tests')
        .update({
          title: editForm.title,
          description: editForm.description,
          category: editForm.category,
          specialty_area: editForm.specialty_area
        })
        .eq('id', selectedTest.id);

      if (error) throw error;

      toast({
        title: "Başarılı",
        description: "Test başarıyla güncellendi.",
      });

      setEditDialogOpen(false);
      fetchTests();
    } catch (error) {
      console.error('Test güncellenirken hata:', error);
      toast({
        title: "Hata",
        description: "Test güncellenirken bir hata oluştu.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteTest = async () => {
    if (!selectedTest) return;

    try {
      const { error } = await supabase
        .from('tests')
        .update({ is_active: false })
        .eq('id', selectedTest.id);

      if (error) throw error;

      toast({
        title: "Başarılı",
        description: "Test başarıyla silindi.",
      });

      setDeleteDialogOpen(false);
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
          <Clock className="w-3 h-3 mr-1" />
          Beklemede
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

  if (userLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!userProfile || userProfile.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-rose-50 flex items-center justify-center">
        <div className="bg-white/95 backdrop-blur-lg p-10 rounded-3xl shadow-2xl text-center border border-red-100/50">
          <h2 className="text-3xl font-bold text-red-600 mb-4">Erişim Reddedildi</h2>
          <p className="text-gray-600 text-lg">Bu sayfaya erişim yetkiniz bulunmamaktadır.</p>
        </div>
      </div>
    );
  }

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
    <>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="googlebot" content="noindex, nofollow" />
        <title>Test Yönetimi - Divan Paneli</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <HorizontalNavigation />
        
        <div className="container mx-auto px-4 py-8">
          <AdminBackButton />
          
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Test Yönetimi</h1>
              <p className="text-gray-600">Uzmanların oluşturduğu testleri onaylayın, düzenleyin veya silin.</p>
            </div>
            <Button 
              onClick={() => setCreateTestOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Yeni Test Ekle
            </Button>
          </div>

          <div className="grid gap-6">
            {tests.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <ClipboardCheck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Henüz test bulunmuyor</h3>
                  <p className="text-gray-600">Uzmanlar test oluşturduğunda burada görünecektir.</p>
                </CardContent>
              </Card>
            ) : (
              tests.map((test) => (
                <Card key={test.id} className="border border-gray-200 hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl text-gray-900 mb-2">{test.title}</CardTitle>
                        {test.description && (
                          <p className="text-gray-600 mb-3">{test.description}</p>
                        )}
                        
                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            <span>{test.specialists?.name} - {test.specialists?.specialty}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(test.created_at).toLocaleDateString('tr-TR')}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {getStatusBadge(test.status)}
                          {test.specialty_area && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700">
                              {test.specialty_area}
                            </Badge>
                          )}
                          {test.category && (
                            <Badge variant="outline">{test.category}</Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2 ml-4">
                        {test.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleApproveTest(test.id)}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Onayla
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRejectTest(test.id)}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Reddet
                            </Button>
                          </>
                        )}
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditTest(test)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Düzenle
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedTest(test);
                            setDeleteDialogOpen(true);
                          }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Sil
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Create Test Dialog */}
        <Dialog open={createTestOpen} onOpenChange={setCreateTestOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Yeni Test Oluştur</DialogTitle>
              <DialogDescription>
                Sistem için yeni bir test oluşturun.
              </DialogDescription>
            </DialogHeader>
            
            <TestCreator 
              specialistId="admin"
              onTestCreated={handleTestCreated}
              onCancel={() => setCreateTestOpen(false)}
            />
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Testi Düzenle</DialogTitle>
              <DialogDescription>
                Test bilgilerini güncelleyin.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Test Başlığı</Label>
                <Input
                  id="title"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="description">Açıklama</Label>
                <Textarea
                  id="description"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="category">Kategori</Label>
                <Input
                  id="category"
                  value={editForm.category}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="specialty_area">Uzmanlık Alanı</Label>
                <Select
                  value={editForm.specialty_area}
                  onValueChange={(value) => setEditForm({ ...editForm, specialty_area: value })}
                >
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

            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                İptal
              </Button>
              <Button onClick={handleSaveEdit}>
                Kaydet
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Testi Sil</DialogTitle>
              <DialogDescription>
                Bu testi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                İptal
              </Button>
              <Button variant="destructive" onClick={handleDeleteTest}>
                Sil
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Footer />
      </div>
    </>
  );
};

export default TestManagement;
