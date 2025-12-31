import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Upload, FileText, Trash2, Download, ChevronRight, Folder, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface AccountingDocument {
  id: string;
  year: number;
  month: number;
  file_name: string;
  file_url: string;
  file_size: number | null;
  notes: string | null;
  created_at: string;
}

const months = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
];

const years = Array.from({ length: 10 }, (_, i) => 2026 + i);

const AccountingDocuments = () => {
  const navigate = useNavigate();
  const { userProfile, loading } = useUserRole();
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [documents, setDocuments] = useState<AccountingDocument[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [documentCounts, setDocumentCounts] = useState<Record<string, number>>({});

  const isAuthorized = userProfile?.role === 'admin' || userProfile?.role === 'muhasebe';

  useEffect(() => {
    if (!loading && !isAuthorized) {
      toast.error("Bu sayfaya erişim yetkiniz bulunmamaktadır.");
      navigate("/divan_paneli/dashboard");
    }
  }, [loading, isAuthorized, navigate]);

  useEffect(() => {
    if (selectedYear && selectedMonth) {
      fetchDocuments();
    }
  }, [selectedYear, selectedMonth]);

  useEffect(() => {
    fetchDocumentCounts();
  }, []);

  const fetchDocumentCounts = async () => {
    try {
      const { data, error } = await supabase
        .from('accounting_documents')
        .select('year, month');

      if (error) throw error;

      const counts: Record<string, number> = {};
      data?.forEach(doc => {
        const key = `${doc.year}-${doc.month}`;
        counts[key] = (counts[key] || 0) + 1;
      });
      setDocumentCounts(counts);
    } catch (error) {
      console.error('Belge sayıları alınırken hata:', error);
    }
  };

  const fetchDocuments = async () => {
    if (!selectedYear || !selectedMonth) return;

    try {
      const { data, error } = await supabase
        .from('accounting_documents')
        .select('*')
        .eq('year', selectedYear)
        .eq('month', selectedMonth)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Belgeler alınırken hata:', error);
      toast.error("Belgeler yüklenirken bir hata oluştu.");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedYear || !selectedMonth) return;

    setIsUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${selectedYear}/${selectedMonth}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('accounting-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: signedUrlData } = await supabase.storage
        .from('accounting-documents')
        .createSignedUrl(fileName, 60 * 60 * 24 * 365 * 10); // 10 years

      const { data: { user } } = await supabase.auth.getUser();

      const { error: dbError } = await supabase
        .from('accounting_documents')
        .insert({
          year: selectedYear,
          month: selectedMonth,
          file_name: file.name,
          file_url: signedUrlData?.signedUrl || fileName,
          file_size: file.size,
          notes: notes || null,
          uploaded_by: user?.id
        });

      if (dbError) throw dbError;

      toast.success("Belge başarıyla yüklendi!");
      setNotes("");
      setUploadDialogOpen(false);
      fetchDocuments();
      fetchDocumentCounts();
    } catch (error: any) {
      console.error('Yükleme hatası:', error);
      toast.error("Belge yüklenirken hata oluştu: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDocument = async (doc: AccountingDocument) => {
    try {
      // Delete from storage
      const storagePath = doc.file_url.includes('accounting-documents/') 
        ? doc.file_url.split('accounting-documents/')[1]?.split('?')[0]
        : `${doc.year}/${doc.month}/${doc.file_name}`;

      await supabase.storage
        .from('accounting-documents')
        .remove([storagePath]);

      // Delete from database
      const { error } = await supabase
        .from('accounting_documents')
        .delete()
        .eq('id', doc.id);

      if (error) throw error;

      toast.success("Belge başarıyla silindi!");
      fetchDocuments();
      fetchDocumentCounts();
    } catch (error: any) {
      console.error('Silme hatası:', error);
      toast.error("Belge silinirken hata oluştu: " + error.message);
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "Bilinmiyor";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getMonthDocCount = (year: number, month: number) => {
    return documentCounts[`${year}-${month}`] || 0;
  };

  const getYearDocCount = (year: number) => {
    let count = 0;
    for (let month = 1; month <= 12; month++) {
      count += getMonthDocCount(year, month);
    }
    return count;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Erişim Reddedildi</h2>
          <p className="text-gray-600">Bu sayfaya erişim yetkiniz bulunmamaktadır.</p>
        </Card>
      </div>
    );
  }

  // Year selection view
  if (!selectedYear) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/50 to-purple-50/30 p-6">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="outline" size="sm" asChild>
              <Link to="/divan_paneli/dashboard">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Geri Dön
              </Link>
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">Muhasebe Birimi</h1>
          </div>

          <Card className="bg-white/80 backdrop-blur-xl border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Yıl Seçin (2026-2035)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {years.map(year => {
                  const docCount = getYearDocCount(year);
                  return (
                    <Button
                      key={year}
                      variant="outline"
                      className="h-24 text-lg font-semibold relative hover:bg-indigo-50 hover:border-indigo-300 transition-all"
                      onClick={() => setSelectedYear(year)}
                    >
                      <div className="flex flex-col items-center">
                        <Folder className="w-6 h-6 mb-2 text-indigo-500" />
                        {year}
                        {docCount > 0 && (
                          <span className="absolute top-2 right-2 bg-indigo-500 text-white text-xs rounded-full px-2 py-0.5">
                            {docCount}
                          </span>
                        )}
                      </div>
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Month selection view
  if (!selectedMonth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/50 to-purple-50/30 p-6">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="outline" size="sm" onClick={() => setSelectedYear(null)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Yıllara Dön
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">{selectedYear} - Ay Seçin</h1>
          </div>

          <Card className="bg-white/80 backdrop-blur-xl border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                {selectedYear} Yılı Ayları
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {months.map((month, index) => {
                  const docCount = getMonthDocCount(selectedYear, index + 1);
                  return (
                    <Button
                      key={month}
                      variant="outline"
                      className="h-20 text-sm font-medium relative hover:bg-indigo-50 hover:border-indigo-300 transition-all flex flex-col items-center justify-center"
                      onClick={() => setSelectedMonth(index + 1)}
                    >
                      <span>{month}</span>
                      {docCount > 0 && (
                        <span className="absolute top-1 right-1 bg-indigo-500 text-white text-xs rounded-full px-2 py-0.5">
                          {docCount}
                        </span>
                      )}
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Documents view
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/50 to-purple-50/30 p-6">
      <div className="container mx-auto max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => setSelectedMonth(null)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Aylara Dön
            </Button>
            <div className="flex items-center gap-2 text-gray-500">
              <span className="cursor-pointer hover:text-indigo-600" onClick={() => {setSelectedYear(null); setSelectedMonth(null)}}>
                Muhasebe
              </span>
              <ChevronRight className="w-4 h-4" />
              <span className="cursor-pointer hover:text-indigo-600" onClick={() => setSelectedMonth(null)}>
                {selectedYear}
              </span>
              <ChevronRight className="w-4 h-4" />
              <span className="font-semibold text-gray-900">{months[selectedMonth - 1]}</span>
            </div>
          </div>

          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700">
                <Upload className="w-4 h-4 mr-2" />
                Belge Yükle
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Gider Faturası Yükle</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>Not (İsteğe bağlı)</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Belge hakkında not ekleyin..."
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Dosya Seç</Label>
                  <Input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG veya WebP formatları desteklenir</p>
                </div>
                {isUploading && (
                  <div className="flex items-center gap-2 text-indigo-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-600 border-t-transparent"></div>
                    <span>Yükleniyor...</span>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="bg-white/80 backdrop-blur-xl border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {months[selectedMonth - 1]} {selectedYear} - Gider Faturaları
            </CardTitle>
          </CardHeader>
          <CardContent>
            {documents.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Bu ay için henüz belge yüklenmemiş.</p>
                <Button 
                  className="mt-4 bg-indigo-600 hover:bg-indigo-700"
                  onClick={() => setUploadDialogOpen(true)}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  İlk Belgeyi Yükle
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{doc.file_name}</p>
                        <p className="text-sm text-gray-500">
                          {formatFileSize(doc.file_size)} • {new Date(doc.created_at).toLocaleDateString('tr-TR')}
                        </p>
                        {doc.notes && (
                          <p className="text-sm text-gray-600 mt-1">{doc.notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(doc.file_url, '_blank')}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        İndir
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Belgeyi Sil</AlertDialogTitle>
                            <AlertDialogDescription>
                              "{doc.file_name}" belgesini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>İptal</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-red-600 hover:bg-red-700"
                              onClick={() => handleDeleteDocument(doc)}
                            >
                              Sil
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AccountingDocuments;
