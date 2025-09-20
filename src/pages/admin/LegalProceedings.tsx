
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { HorizontalNavigation } from "@/components/HorizontalNavigation";
import AdminBackButton from "@/components/AdminBackButton";
import { Plus, Gavel, Edit, Trash2, Check, FileText, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import FileUpload from "@/components/FileUpload";

interface LegalProceeding {
  id: string;
  customer_name: string;
  proceeding_amount: number;
  status: string;
  is_paid: boolean;
  created_at: string;
  notes?: string;
  contract_pdf_url?: string;
  invoice_pdf_url?: string;
}

const LegalProceedings = () => {
  const { userProfile } = useUserRole();
  const { toast } = useToast();
  const [proceedings, setProceedings] = useState<LegalProceeding[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProceeding, setEditingProceeding] = useState<LegalProceeding | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [formData, setFormData] = useState({
    customer_name: "",
    proceeding_amount: "",
    status: "YENİ_İCRA_TALEBİ",
    notes: "",
    contract_pdf_url: "",
    invoice_pdf_url: ""
  });

  const statusOptions = [
    { value: "YENİ_İCRA_TALEBİ", label: "YENİ İCRA TALEBİ", color: "bg-gray-100 text-gray-800" },
    { value: "İCRA_AÇILDI", label: "İCRA AÇILDI", color: "bg-red-100 text-red-800" },
    { value: "İTİRAZ_ETTİ", label: "İTİRAZ ETTİ", color: "bg-yellow-100 text-yellow-800" },
    { value: "İTİRAZ_DAVASI_AÇILDI", label: "İTİRAZ DAVASI AÇILDI", color: "bg-orange-100 text-orange-800" },
    { value: "DAVA_AÇILDI", label: "DAVA AÇILDI", color: "bg-blue-100 text-blue-800" },
    { value: "ARABULUCULUK_SÜRECİNDE", label: "ARABULUCULUK SÜRECİNDE", color: "bg-amber-100 text-amber-800" },
    { value: "HACİZ_YAPILDI", label: "HACİZ YAPILDI", color: "bg-purple-100 text-purple-800" },
    { value: "ÖDEME_BEKLENİYOR", label: "ÖDEME BEKLENİYOR", color: "bg-indigo-100 text-indigo-800" },
    { value: "TAHSİLAT", label: "TAHSİLAT", color: "bg-cyan-100 text-cyan-800" },
    { value: "KESİNLEŞTİ", label: "KESİNLEŞTİ", color: "bg-teal-100 text-teal-800" },
    { value: "İCRA_TAMAMLANDI", label: "İCRA TAMAMLANDI", color: "bg-green-100 text-green-800" }
  ];

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const parseCurrency = (value: string) => {
    if (!value) return 0;
    const cleaned = value.replace(/\./g, '').replace(',', '.');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  };

  const handleAmountChange = (value: string) => {
    const filtered = value.replace(/[^\d.,]/g, '');
    setFormData({ ...formData, proceeding_amount: filtered });
  };

  useEffect(() => {
    fetchProceedings();
  }, []);

  const fetchProceedings = async () => {
    try {
      const { data, error } = await supabase
        .from("legal_proceedings")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProceedings(data || []);
    } catch (error) {
      console.error("İcralıklar yüklenirken hata:", error);
      toast({
        title: "Hata",
        description: "İcralıklar yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const proceedingAmount = parseCurrency(formData.proceeding_amount);

      if (proceedingAmount <= 0) {
        toast({
          title: "Hata",
          description: "Geçerli bir tutar giriniz.",
          variant: "destructive",
        });
        return;
      }

      // Belgeler artık zorunlu değil - isteğe bağlı

      const commonData = {
        customer_name: formData.customer_name.trim(),
        proceeding_amount: proceedingAmount,
        status: formData.status,
        notes: formData.notes.trim() || null,
        contract_pdf_url: formData.contract_pdf_url || null,
        invoice_pdf_url: formData.invoice_pdf_url || null,
      } as const;

      console.log("Submitting data (common):", commonData);

      if (editingProceeding) {
        const { error } = await supabase
          .from("legal_proceedings")
          .update(commonData)
          .eq("id", editingProceeding.id);

        if (error) throw error;
        toast({
          title: "Başarılı",
          description: "İcralık güncellendi.",
        });
      } else {
        const insertData = {
          ...commonData,
          unpaid_months: 1, // Yeni icra talebi için varsayılan değer
          total_months: 1, // Yeni icra talebi için varsayılan değer
        };

        const { data, error } = await supabase
          .from("legal_proceedings")
          .insert([insertData])
          .select()
          .single();

        if (error) throw error;

        // Yeni icralık için e-posta bildirimi
        try {
          const { error: emailError } = await supabase.functions.invoke(
            "send-legal-proceeding-notification",
            {
              body: {
                customerName: insertData.customer_name,
                proceedingAmount: insertData.proceeding_amount,
                status: insertData.status,
                notes: insertData.notes,
                createdAt: new Date().toISOString(),
              },
            }
          );

          if (emailError) {
            console.error("Email notification error:", emailError);
            // Ana işlemi başarısız saymayalım
          }
        } catch (emailError) {
          console.error("Failed to send notification email:", emailError);
          // Ana işlemi başarısız saymayalım
        }

        toast({
          title: "Başarılı",
          description: "İcralık eklendi ve bildirim e-postası gönderildi.",
        });
      }

      setDialogOpen(false);
      setEditingProceeding(null);
      setFormData({
        customer_name: "",
        proceeding_amount: "",
        status: "YENİ_İCRA_TALEBİ",
        notes: "",
        contract_pdf_url: "",
        invoice_pdf_url: "",
      });
      fetchProceedings();
    } catch (error) {
      console.error("İcralık kaydedilirken hata:", error);
      const message = (error as any)?.message || (error as any)?.error_description || "İcralık kaydedilirken bir hata oluştu.";
      toast({
        title: "Hata",
        description: message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu icralığı silmek istediğinizden emin misiniz?")) return;

    try {
      const { error } = await supabase
        .from("legal_proceedings")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      toast({
        title: "Başarılı",
        description: "İcralık silindi.",
      });
      fetchProceedings();
    } catch (error) {
      console.error("İcralık silinirken hata:", error);
      toast({
        title: "Hata",
        description: "İcralık silinirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const handlePaymentToggle = async (id: string, isPaid: boolean) => {
    try {
      const { error } = await supabase
        .from("legal_proceedings")
        .update({ is_paid: isPaid })
        .eq("id", id);

      if (error) throw error;
      
      toast({
        title: "Başarılı",
        description: isPaid ? "Ödeme alındı olarak işaretlendi." : "Ödeme alınmadı olarak işaretlendi.",
      });
      fetchProceedings();
    } catch (error) {
      console.error("Ödeme durumu güncellenirken hata:", error);
      toast({
        title: "Hata",
        description: "Ödeme durumu güncellenirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (proceeding: LegalProceeding) => {
    setEditingProceeding(proceeding);
    setFormData({
      customer_name: proceeding.customer_name,
      proceeding_amount: formatCurrency(proceeding.proceeding_amount),
      status: proceeding.status,
      notes: proceeding.notes || "",
      contract_pdf_url: proceeding.contract_pdf_url || "",
      invoice_pdf_url: proceeding.invoice_pdf_url || ""
    });
    setDialogOpen(true);
  };

  const getTotalAmount = () => {
    return proceedings.reduce((sum, proc) => sum + proc.proceeding_amount, 0);
  };

  const getPaidAmount = () => {
    return proceedings
      .filter(proc => proc.status === "İCRA_TAMAMLANDI")
      .reduce((sum, proc) => sum + proc.proceeding_amount, 0);
  };

  const getUnpaidAmount = () => {
    return proceedings
      .filter(proc => proc.status !== "İCRA_TAMAMLANDI")
      .reduce((sum, proc) => sum + proc.proceeding_amount, 0);
  };

  const getStatusBadgeColor = (status: string) => {
    const option = statusOptions.find(opt => opt.value === status);
    return option?.color || "bg-gray-100 text-gray-800";
  };

  const isProcessCompleted = (status: string) => {
    return status === "İCRA_TAMAMLANDI";
  };

  // Filter proceedings based on status
  const filteredProceedings = statusFilter === "all" 
    ? proceedings 
    : proceedings.filter(proc => proc.status === statusFilter);

  const downloadPDF = async (url: string, filename: string) => {
    try {
      // Extract file path from URL and create a new signed URL for download
      const urlPath = new URL(url);
      const pathSegments = urlPath.pathname.split('/');
      const filePath = pathSegments[pathSegments.length - 1].split('?')[0]; // Remove query params if any
      
      // Create a new signed URL with longer expiry for download
      const { data: signedData, error: signedError } = await supabase.storage
        .from('legal-documents')
        .createSignedUrl(filePath, 300); // 5 minutes should be enough for download

      if (signedError) throw signedError;

      const response = await fetch(signedData.signedUrl);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('PDF indirilirken hata:', error);
      toast({
        title: "Hata",
        description: "PDF indirilemedi.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">Yükleniyor...</div>
      </div>
    );
  }

  // Only admins and legal users can see this page
  if (userProfile?.role !== "admin" && userProfile?.role !== "legal") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Yetkisiz Erişim</h2>
          <p className="text-gray-600">Bu sayfaya erişim yetkiniz bulunmamaktadır.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <HorizontalNavigation />
      <div className="p-4">
        <div className="container mx-auto">
          <div className="mb-6">
            <AdminBackButton />
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Gavel className="w-8 h-8" />
              İcralıklar
            </h1>
            <p className="text-gray-600">Hukuki süreçleri yönetin</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-600">Toplam İcra</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{proceedings.length}</div>
                <p className="text-xs text-gray-500">Toplam icra sayısı</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-600">Toplam Tutar</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₺{formatCurrency(getTotalAmount())}</div>
                <p className="text-xs text-gray-500">Toplam icra tutarı</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-600">Ödenen</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">₺{formatCurrency(getPaidAmount())}</div>
                <p className="text-xs text-gray-500">Ödeme alınan tutar</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-600">Ödenmemiş</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">₺{formatCurrency(getUnpaidAmount())}</div>
                <p className="text-xs text-gray-500">Ödenmemiş tutar</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center mb-4">
                <CardTitle>İcralıklar</CardTitle>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Yeni İcralık
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>
                        {editingProceeding ? "İcralık Düzenle" : "Yeni İcralık Ekle"}
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="customer_name">Müşteri Adı</Label>
                        <Input
                          id="customer_name"
                          value={formData.customer_name}
                          onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="proceeding_amount">İcra Tutarı (₺)</Label>
                        <Input
                          id="proceeding_amount"
                          type="text"
                          value={formData.proceeding_amount}
                          onChange={(e) => handleAmountChange(e.target.value)}
                          placeholder="22.491,00"
                          required
                        />
                        <p className="text-xs text-gray-500 mt-1">Örnek: 22.491,00</p>
                      </div>
                      <div>
                        <Label htmlFor="status">Durum</Label>
                        <Select
                          value={formData.status}
                          onValueChange={(value) => setFormData({ ...formData, status: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {statusOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="notes">Açıklama</Label>
                        <Textarea
                          id="notes"
                          value={formData.notes}
                          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                          placeholder="İcralık hakkında açıklama veya notlar..."
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label>Sözleşme PDF</Label>
                        <FileUpload
                          onUpload={(url) => setFormData({ ...formData, contract_pdf_url: url })}
                          currentImage={formData.contract_pdf_url}
                          accept=".pdf"
                          maxSize={10 * 1024 * 1024} // 10MB
                        />
                      </div>
                      <div>
                        <Label>Fatura PDF</Label>
                        <FileUpload
                          onUpload={(url) => setFormData({ ...formData, invoice_pdf_url: url })}
                          currentImage={formData.invoice_pdf_url}
                          accept=".pdf"
                          maxSize={10 * 1024 * 1024} // 10MB
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                          İptal
                        </Button>
                        <Button type="submit">
                          {editingProceeding ? "Güncelle" : "Ekle"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
              
              {/* Status Filter */}
              <div className="flex items-center gap-4">
                <Label htmlFor="statusFilter" className="text-sm font-medium">Durum Filtresi:</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Durum seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tümü</SelectItem>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-sm text-gray-500">
                  {filteredProceedings.length} / {proceedings.length} kayıt gösteriliyor
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Müşteri</TableHead>
                    <TableHead>İcra Tutarı</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>Ödeme Durumu</TableHead>
                    <TableHead>Belgeler</TableHead>
                    <TableHead>Açıklama</TableHead>
                    <TableHead>Tarih</TableHead>
                    <TableHead>İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProceedings.map((proceeding) => (
                    <TableRow key={proceeding.id}>
                      <TableCell className="font-medium">
                        {proceeding.customer_name}
                      </TableCell>
                      <TableCell>
                        ₺{formatCurrency(proceeding.proceeding_amount)}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={getStatusBadgeColor(proceeding.status)}
                        >
                          {statusOptions.find(opt => opt.value === proceeding.status)?.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {isProcessCompleted(proceeding.status) ? (
                            <div className="flex items-center text-green-600 font-medium">
                              <Check className="w-4 h-4 mr-1" />
                              Ödenen - ₺{formatCurrency(proceeding.proceeding_amount)}
                            </div>
                          ) : (
                            <div className="flex items-center text-red-600 font-medium">
                              Ödenmemiş - ₺{formatCurrency(proceeding.proceeding_amount)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {proceeding.contract_pdf_url && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => downloadPDF(proceeding.contract_pdf_url!, `${proceeding.customer_name}_sozlesme.pdf`)}
                              title="Sözleşme İndir"
                            >
                              <FileText className="w-4 h-4 mr-1" />
                              Sözleşme
                            </Button>
                          )}
                          {proceeding.invoice_pdf_url && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => downloadPDF(proceeding.invoice_pdf_url!, `${proceeding.customer_name}_fatura.pdf`)}
                              title="Fatura İndir"
                            >
                              <Download className="w-4 h-4 mr-1" />
                              Fatura
                            </Button>
                          )}
                          {!proceeding.contract_pdf_url && !proceeding.invoice_pdf_url && (
                            <span className="text-sm text-gray-400">Belge yok</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          {proceeding.notes ? (
                            <span className="text-sm text-gray-600" title={proceeding.notes}>
                              {proceeding.notes.length > 50 
                                ? proceeding.notes.substring(0, 50) + "..." 
                                : proceeding.notes}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(proceeding.created_at).toLocaleDateString('tr-TR')}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(proceeding)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(proceeding.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LegalProceedings;
