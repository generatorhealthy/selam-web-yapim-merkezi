import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Scale, Search, Eye, Download, Upload, Trash2, FileText, Users, Mail, ShoppingCart, Image, Calendar, Phone, User } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import AdminBackButton from "@/components/AdminBackButton";

interface LegalEvidence {
  id: string;
  specialist_id: string | null;
  specialist_name: string;
  specialist_email: string | null;
  specialist_phone: string | null;
  specialist_tc_no: string | null;
  profile_data: Record<string, any>;
  referrals_data: any[];
  email_logs: any[];
  orders_data: any[];
  screenshot_urls: string[];
  notes: string | null;
  deleted_at: string;
  deleted_by: string | null;
  created_at: string;
}

const LegalEvidenceManagement = () => {
  const { toast } = useToast();
  const [evidences, setEvidences] = useState<LegalEvidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEvidence, setSelectedEvidence] = useState<LegalEvidence | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false);

  useEffect(() => {
    fetchEvidences();
  }, []);

  const fetchEvidences = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('legal_evidence')
        .select('*')
        .order('deleted_at', { ascending: false });

      if (error) {
        console.error('Error fetching legal evidences:', error);
        toast({
          title: "Hata",
          description: "Hukuki kanıtlar yüklenirken hata oluştu.",
          variant: "destructive"
        });
        return;
      }

      // Cast the data properly to handle Json type
      const typedData: LegalEvidence[] = (data || []).map((item: any) => ({
        ...item,
        profile_data: item.profile_data || {},
        referrals_data: Array.isArray(item.referrals_data) ? item.referrals_data : [],
        email_logs: Array.isArray(item.email_logs) ? item.email_logs : [],
        orders_data: Array.isArray(item.orders_data) ? item.orders_data : [],
        screenshot_urls: Array.isArray(item.screenshot_urls) ? item.screenshot_urls : [],
      }));

      setEvidences(typedData);
    } catch (error) {
      console.error('Unexpected error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (evidence: LegalEvidence) => {
    setSelectedEvidence(evidence);
    setNotes(evidence.notes || "");
    setIsDetailDialogOpen(true);
  };

  const handleSaveNotes = async () => {
    if (!selectedEvidence) return;
    
    setIsSavingNotes(true);
    try {
      const { error } = await supabase
        .from('legal_evidence')
        .update({ notes })
        .eq('id', selectedEvidence.id);

      if (error) throw error;

      setSelectedEvidence({ ...selectedEvidence, notes });
      setEvidences(evidences.map(e => 
        e.id === selectedEvidence.id ? { ...e, notes } : e
      ));
      
      toast({
        title: "Başarılı",
        description: "Notlar kaydedildi."
      });
    } catch (error) {
      console.error('Error saving notes:', error);
      toast({
        title: "Hata",
        description: "Notlar kaydedilemedi.",
        variant: "destructive"
      });
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedEvidence || !e.target.files || e.target.files.length === 0) return;

    setUploadingScreenshot(true);
    try {
      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${selectedEvidence.id}/${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('legal-evidence')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('legal-evidence')
        .getPublicUrl(fileName);

      const newUrls = [...(selectedEvidence.screenshot_urls || []), publicUrl];
      
      const { error: updateError } = await supabase
        .from('legal_evidence')
        .update({ screenshot_urls: newUrls })
        .eq('id', selectedEvidence.id);

      if (updateError) throw updateError;

      setSelectedEvidence({ ...selectedEvidence, screenshot_urls: newUrls });
      setEvidences(evidences.map(e => 
        e.id === selectedEvidence.id ? { ...e, screenshot_urls: newUrls } : e
      ));

      toast({
        title: "Başarılı",
        description: "Ekran görüntüsü yüklendi."
      });
    } catch (error) {
      console.error('Error uploading screenshot:', error);
      toast({
        title: "Hata",
        description: "Ekran görüntüsü yüklenemedi.",
        variant: "destructive"
      });
    } finally {
      setUploadingScreenshot(false);
    }
  };

  const handleDeleteEvidence = async (evidenceId: string) => {
    if (!confirm("Bu hukuki kanıt kaydını silmek istediğinizden emin misiniz?")) return;

    try {
      const { error } = await supabase
        .from('legal_evidence')
        .delete()
        .eq('id', evidenceId);

      if (error) throw error;

      setEvidences(evidences.filter(e => e.id !== evidenceId));
      toast({
        title: "Başarılı",
        description: "Hukuki kanıt kaydı silindi."
      });
    } catch (error) {
      console.error('Error deleting evidence:', error);
      toast({
        title: "Hata",
        description: "Kayıt silinemedi.",
        variant: "destructive"
      });
    }
  };

  const filteredEvidences = evidences.filter(e =>
    e.specialist_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.specialist_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.specialist_phone?.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="container mx-auto max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <AdminBackButton />
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Scale className="w-8 h-8 text-rose-600" />
                Hukuki Kanıtlar
              </h1>
              <p className="text-gray-600 mt-1">Silinen uzmanların hukuki delilleri</p>
            </div>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-2">
            {evidences.length} Kayıt
          </Badge>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="İsim, e-posta veya telefon ile ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Silinen Uzman Kanıtları</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredEvidences.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Scale className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg">Henüz hukuki kanıt kaydı bulunmuyor.</p>
                <p className="text-sm mt-2">Uzman silindiğinde otomatik olarak kanıtlar burada görünecektir.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Uzman</TableHead>
                    <TableHead>E-posta</TableHead>
                    <TableHead>Telefon</TableHead>
                    <TableHead>TC No</TableHead>
                    <TableHead>Silinme Tarihi</TableHead>
                    <TableHead>Yönlendirme</TableHead>
                    <TableHead>Sipariş</TableHead>
                    <TableHead>İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEvidences.map((evidence) => (
                    <TableRow key={evidence.id}>
                      <TableCell className="font-medium">{evidence.specialist_name}</TableCell>
                      <TableCell className="text-sm">{evidence.specialist_email || '-'}</TableCell>
                      <TableCell className="text-sm">{evidence.specialist_phone || '-'}</TableCell>
                      <TableCell className="text-sm font-mono">{evidence.specialist_tc_no || '-'}</TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(evidence.deleted_at), 'dd MMM yyyy HH:mm', { locale: tr })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-blue-50">
                          {(evidence.referrals_data || []).length} kişi
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-green-50">
                          {(evidence.orders_data || []).length} sipariş
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(evidence)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Detay
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteEvidence(evidence.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Detail Dialog */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <Scale className="w-6 h-6 text-rose-600" />
                {selectedEvidence?.specialist_name} - Hukuki Kanıtlar
              </DialogTitle>
              <DialogDescription>
                Silinen uzmanın tüm verileri ve kanıtları
              </DialogDescription>
            </DialogHeader>

            {selectedEvidence && (
              <Tabs defaultValue="profile" className="w-full">
                <TabsList className="grid grid-cols-6 w-full">
                  <TabsTrigger value="profile" className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    Profil
                  </TabsTrigger>
                  <TabsTrigger value="referrals" className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    Yönlendirmeler
                  </TabsTrigger>
                  <TabsTrigger value="orders" className="flex items-center gap-1">
                    <ShoppingCart className="w-4 h-4" />
                    Siparişler
                  </TabsTrigger>
                  <TabsTrigger value="emails" className="flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    E-postalar
                  </TabsTrigger>
                  <TabsTrigger value="screenshots" className="flex items-center gap-1">
                    <Image className="w-4 h-4" />
                    Ekran Görüntüleri
                  </TabsTrigger>
                  <TabsTrigger value="notes" className="flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    Notlar
                  </TabsTrigger>
                </TabsList>

                <ScrollArea className="h-[60vh] mt-4">
                  <TabsContent value="profile" className="mt-0">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Uzman Profil Bilgileri</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-gray-500">Ad Soyad</Label>
                            <p className="font-medium">{selectedEvidence.specialist_name}</p>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-gray-500">E-posta</Label>
                            <p className="font-medium">{selectedEvidence.specialist_email || '-'}</p>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-gray-500">Telefon</Label>
                            <p className="font-medium">{selectedEvidence.specialist_phone || '-'}</p>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-gray-500">TC Kimlik No</Label>
                            <p className="font-medium font-mono">{selectedEvidence.specialist_tc_no || '-'}</p>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-gray-500">Silinme Tarihi</Label>
                            <p className="font-medium">
                              {format(new Date(selectedEvidence.deleted_at), 'dd MMMM yyyy HH:mm', { locale: tr })}
                            </p>
                          </div>
                        </div>

                        {selectedEvidence.profile_data && Object.keys(selectedEvidence.profile_data).length > 0 && (
                          <div className="mt-6">
                            <Label className="text-gray-500 block mb-2">Ek Profil Verileri</Label>
                            <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-auto max-h-64">
                              {JSON.stringify(selectedEvidence.profile_data, null, 2)}
                            </pre>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="referrals" className="mt-0">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">
                          Yönlendirilen Danışanlar ({(selectedEvidence.referrals_data || []).length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {(selectedEvidence.referrals_data || []).length === 0 ? (
                          <p className="text-gray-500 text-center py-8">Yönlendirme kaydı bulunamadı.</p>
                        ) : (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Danışan Adı</TableHead>
                                <TableHead>İletişim</TableHead>
                                <TableHead>Tarih</TableHead>
                                <TableHead>Notlar</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {(selectedEvidence.referrals_data || []).map((referral: any, index: number) => (
                                <TableRow key={index}>
                                  <TableCell className="font-medium">
                                    {referral.client_name} {referral.client_surname}
                                  </TableCell>
                                  <TableCell>{referral.client_contact || '-'}</TableCell>
                                  <TableCell>
                                    {referral.referred_at ? format(new Date(referral.referred_at), 'dd/MM/yyyy', { locale: tr }) : '-'}
                                  </TableCell>
                                  <TableCell className="max-w-xs truncate">{referral.notes || '-'}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="orders" className="mt-0">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">
                          Sipariş Kayıtları ({(selectedEvidence.orders_data || []).length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {(selectedEvidence.orders_data || []).length === 0 ? (
                          <p className="text-gray-500 text-center py-8">Sipariş kaydı bulunamadı.</p>
                        ) : (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Paket</TableHead>
                                <TableHead>Tutar</TableHead>
                                <TableHead>Durum</TableHead>
                                <TableHead>Tarih</TableHead>
                                <TableHead>Fatura</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {(selectedEvidence.orders_data || []).map((order: any, index: number) => (
                                <TableRow key={index}>
                                  <TableCell className="font-medium">{order.package_name}</TableCell>
                                  <TableCell>{order.amount}₺</TableCell>
                                  <TableCell>
                                    <Badge variant="outline">{order.status}</Badge>
                                  </TableCell>
                                  <TableCell>
                                    {order.created_at ? format(new Date(order.created_at), 'dd/MM/yyyy', { locale: tr }) : '-'}
                                  </TableCell>
                                  <TableCell>
                                    {order.invoice_sent ? 
                                      <Badge className="bg-green-100 text-green-800">Gönderildi</Badge> : 
                                      <Badge className="bg-yellow-100 text-yellow-800">Bekliyor</Badge>
                                    }
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="emails" className="mt-0">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">
                          E-posta Gönderim Logları ({(selectedEvidence.email_logs || []).length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {(selectedEvidence.email_logs || []).length === 0 ? (
                          <p className="text-gray-500 text-center py-8">E-posta log kaydı bulunamadı.</p>
                        ) : (
                          <div className="space-y-4">
                            {(selectedEvidence.email_logs || []).map((log: any, index: number) => (
                              <Card key={index} className="bg-gray-50">
                                <CardContent className="pt-4">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <p className="font-medium">{log.subject || 'E-posta'}</p>
                                      <p className="text-sm text-gray-500">{log.recipient}</p>
                                    </div>
                                    <div className="text-right">
                                      <Badge className={log.success ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                                        {log.success ? 'Başarılı' : 'Başarısız'}
                                      </Badge>
                                      <p className="text-xs text-gray-500 mt-1">
                                        {log.sent_at ? format(new Date(log.sent_at), 'dd/MM/yyyy HH:mm', { locale: tr }) : '-'}
                                      </p>
                                    </div>
                                  </div>
                                  {log.attachments && (
                                    <div className="mt-2 text-sm text-gray-600">
                                      <span className="font-medium">Ekler:</span> {log.attachments.join(', ')}
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="screenshots" className="mt-0">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center justify-between">
                          <span>Ekran Görüntüleri ({(selectedEvidence.screenshot_urls || []).length})</span>
                          <div className="flex gap-2">
                            <input
                              type="file"
                              id="screenshot-upload"
                              accept="image/*"
                              className="hidden"
                              onChange={handleScreenshotUpload}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => document.getElementById('screenshot-upload')?.click()}
                              disabled={uploadingScreenshot}
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              {uploadingScreenshot ? 'Yükleniyor...' : 'Ekran Görüntüsü Ekle'}
                            </Button>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {(selectedEvidence.screenshot_urls || []).length === 0 ? (
                          <div className="text-center py-8">
                            <Image className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                            <p className="text-gray-500">Henüz ekran görüntüsü eklenmedi.</p>
                            <p className="text-sm text-gray-400 mt-1">Profil sayfası, panel ekranları vb. görüntüleri yükleyebilirsiniz.</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-4">
                            {(selectedEvidence.screenshot_urls || []).map((url: string, index: number) => (
                              <div key={index} className="relative group">
                                <img 
                                  src={url} 
                                  alt={`Ekran görüntüsü ${index + 1}`}
                                  className="w-full h-48 object-cover rounded-lg border"
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                  <a 
                                    href={url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-white hover:underline"
                                  >
                                    <Download className="w-8 h-8" />
                                  </a>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="notes" className="mt-0">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Avukat Notları</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label htmlFor="notes">Hukuki süreç notları</Label>
                          <Textarea
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Hukuki süreç ile ilgili notlarınızı buraya ekleyin..."
                            rows={10}
                            className="mt-2"
                          />
                        </div>
                        <Button onClick={handleSaveNotes} disabled={isSavingNotes}>
                          {isSavingNotes ? 'Kaydediliyor...' : 'Notları Kaydet'}
                        </Button>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </ScrollArea>
              </Tabs>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default LegalEvidenceManagement;
