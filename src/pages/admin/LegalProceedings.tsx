
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { sendSms } from "@/services/smsService";
import { useUserRole } from "@/hooks/useUserRole";
import { HorizontalNavigation } from "@/components/HorizontalNavigation";
import AdminBackButton from "@/components/AdminBackButton";
import { Plus, Gavel, Edit, Trash2, Check, FileText, Download, Search, X, TrendingUp, TrendingDown, Scale, CircleDollarSign, ShieldCheck, AlertTriangle, Handshake } from "lucide-react";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    customer_name: "",
    proceeding_amount: "",
    status: "YENİ_İCRA_TALEBİ",
    notes: "",
    contract_pdf_url: "",
    invoice_pdf_url: ""
  });

  const statusOptions = [
    { value: "YENİ_İCRA_TALEBİ", label: "Yeni İcra Talebi", color: "bg-slate-100 text-slate-700 border-slate-200" },
    { value: "İCRA_AÇILDI", label: "İcra Açıldı", color: "bg-red-50 text-red-700 border-red-200" },
    { value: "İTİRAZ_ETTİ", label: "İtiraz Etti", color: "bg-amber-50 text-amber-700 border-amber-200" },
    { value: "İTİRAZ_DAVASI_AÇILDI", label: "İtiraz Davası Açıldı", color: "bg-orange-50 text-orange-700 border-orange-200" },
    { value: "DAVA_AÇILDI", label: "Dava Açıldı", color: "bg-blue-50 text-blue-700 border-blue-200" },
    { value: "ARABULUCULUK_SÜRECİNDE", label: "Arabuluculuk Sürecinde", color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
    { value: "HACİZ_YAPILDI", label: "Haciz Yapıldı", color: "bg-purple-50 text-purple-700 border-purple-200" },
    { value: "ÖDEME_BEKLENİYOR", label: "Ödeme Bekleniyor", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
    { value: "TAHSİLAT", label: "Tahsilat", color: "bg-cyan-50 text-cyan-700 border-cyan-200" },
    { value: "KESİNLEŞTİ", label: "Kesinleşti", color: "bg-teal-50 text-teal-700 border-teal-200" },
    { value: "İCRA_TAMAMLANDI", label: "İcra Tamamlandı", color: "bg-emerald-50 text-emerald-700 border-emerald-200" }
  ];

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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

  useEffect(() => { fetchProceedings(); }, []);

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
      toast({ title: "Hata", description: "İcralıklar yüklenirken bir hata oluştu.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const proceedingAmount = parseCurrency(formData.proceeding_amount);
      if (proceedingAmount <= 0) {
        toast({ title: "Hata", description: "Geçerli bir tutar giriniz.", variant: "destructive" });
        return;
      }
      const commonData = {
        customer_name: formData.customer_name.trim(),
        proceeding_amount: proceedingAmount,
        status: formData.status,
        notes: formData.notes.trim() || null,
        contract_pdf_url: formData.contract_pdf_url || null,
        invoice_pdf_url: formData.invoice_pdf_url || null,
      } as const;

      if (editingProceeding) {
        const oldStatus = editingProceeding.status;
        const { error } = await supabase.from("legal_proceedings").update(commonData).eq("id", editingProceeding.id);
        if (error) throw error;
        if (oldStatus !== formData.status) {
          const newLabel = statusOptions.find(opt => opt.value === formData.status)?.label || formData.status;
          const oldLabel = statusOptions.find(opt => opt.value === oldStatus)?.label || oldStatus;
          const smsMsg = `ICRA DURUM DEGISIKLIGI: ${formData.customer_name.trim()} - ${oldLabel} > ${newLabel} - Tutar: ${formatCurrency(proceedingAmount)} TL`;
          try { await sendSms("905316852275", smsMsg); } catch (e) { console.error("SMS hatası:", e); }
        }
        toast({ title: "Başarılı", description: "İcralık güncellendi." });
      } else {
        const { error } = await supabase.from("legal_proceedings").insert([{ ...commonData, unpaid_months: 1, total_months: 1 }]).select().single();
        if (error) throw error;
        toast({ title: "Başarılı", description: "İcralık başarıyla eklendi." });
      }
      setDialogOpen(false);
      setEditingProceeding(null);
      setFormData({ customer_name: "", proceeding_amount: "", status: "YENİ_İCRA_TALEBİ", notes: "", contract_pdf_url: "", invoice_pdf_url: "" });
      fetchProceedings();
    } catch (error) {
      console.error("İcralık kaydedilirken hata:", error);
      toast({ title: "Hata", description: (error as any)?.message || "İcralık kaydedilirken bir hata oluştu.", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu icralığı silmek istediğinizden emin misiniz?")) return;
    try {
      const { error } = await supabase.from("legal_proceedings").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Başarılı", description: "İcralık silindi." });
      fetchProceedings();
    } catch (error) {
      toast({ title: "Hata", description: "İcralık silinirken bir hata oluştu.", variant: "destructive" });
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

  const downloadPDF = async (url: string, filename: string) => {
    try {
      const urlPath = new URL(url);
      const pathSegments = urlPath.pathname.split('/');
      const filePath = pathSegments[pathSegments.length - 1].split('?')[0];
      const { data: signedData, error: signedError } = await supabase.storage.from('legal-documents').createSignedUrl(filePath, 300);
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
      toast({ title: "Hata", description: "PDF indirilemedi.", variant: "destructive" });
    }
  };

  const getTotalAmount = () => proceedings.reduce((sum, p) => sum + p.proceeding_amount, 0);
  const getPaidAmount = () => proceedings.filter(p => p.status === "İCRA_TAMAMLANDI").reduce((sum, p) => sum + p.proceeding_amount, 0);
  const getUnpaidAmount = () => proceedings.filter(p => p.status !== "İCRA_TAMAMLANDI").reduce((sum, p) => sum + p.proceeding_amount, 0);
  const getActiveCount = () => proceedings.filter(p => p.status !== "İCRA_TAMAMLANDI").length;
  const FINALIZED_STATUSES = ["KESİNLEŞTİ", "ÖDEME_BEKLENİYOR", "HACİZ_YAPILDI", "İCRA_TAMAMLANDI"];
  const OBJECTION_STATUSES = ["İTİRAZ_ETTİ", "İTİRAZ_DAVASI_AÇILDI"];
  const getFinalizedAmount = () => proceedings.filter(p => FINALIZED_STATUSES.includes(p.status)).reduce((sum, p) => sum + p.proceeding_amount, 0);
  const getFinalizedCount = () => proceedings.filter(p => FINALIZED_STATUSES.includes(p.status)).length;
  const getObjectionAmount = () => proceedings.filter(p => OBJECTION_STATUSES.includes(p.status)).reduce((sum, p) => sum + p.proceeding_amount, 0);
  const getObjectionCount = () => proceedings.filter(p => OBJECTION_STATUSES.includes(p.status)).length;
  const getMediationAmount = () => proceedings.filter(p => p.status === "ARABULUCULUK_SÜRECİNDE").reduce((sum, p) => sum + p.proceeding_amount, 0);
  const getMediationCount = () => proceedings.filter(p => p.status === "ARABULUCULUK_SÜRECİNDE").length;

  const getStatusBadgeColor = (status: string) => {
    return statusOptions.find(opt => opt.value === status)?.color || "bg-gray-100 text-gray-800";
  };

  const filteredProceedings = useMemo(() => {
    let result = proceedings;
    if (statusFilter !== "all") result = result.filter(p => p.status === statusFilter);
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(p =>
        p.customer_name.toLowerCase().includes(term) ||
        (p.notes && p.notes.toLowerCase().includes(term))
      );
    }
    return result;
  }, [proceedings, statusFilter, searchTerm]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

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
      <div className="p-4 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <AdminBackButton />
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-2">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-200">
                <Gavel className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">İcralıklar</h1>
                <p className="text-sm text-gray-500">Hukuki süreçleri yönetin</p>
              </div>
            </div>
            <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditingProceeding(null); }}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md">
                  <Plus className="w-4 h-4 mr-2" />
                  Yeni İcralık
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingProceeding ? "İcralık Düzenle" : "Yeni İcralık Ekle"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="customer_name">Müşteri Adı</Label>
                    <Input id="customer_name" value={formData.customer_name} onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })} required />
                  </div>
                  <div>
                    <Label htmlFor="proceeding_amount">İcra Tutarı (₺)</Label>
                    <Input id="proceeding_amount" type="text" value={formData.proceeding_amount} onChange={(e) => handleAmountChange(e.target.value)} placeholder="22.491,00" required />
                    <p className="text-xs text-gray-500 mt-1">Örnek: 22.491,00</p>
                  </div>
                  <div>
                    <Label htmlFor="status">Durum</Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="notes">Açıklama</Label>
                    <Textarea id="notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="İcralık hakkında notlar..." rows={3} />
                  </div>
                  <div>
                    <Label>Sözleşme PDF</Label>
                    <FileUpload onUpload={(url) => setFormData({ ...formData, contract_pdf_url: url })} currentImage={formData.contract_pdf_url} accept=".pdf" maxSize={10 * 1024 * 1024} />
                  </div>
                  <div>
                    <Label>Fatura PDF</Label>
                    <FileUpload onUpload={(url) => setFormData({ ...formData, invoice_pdf_url: url })} currentImage={formData.invoice_pdf_url} accept=".pdf" maxSize={10 * 1024 * 1024} />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>İptal</Button>
                    <Button type="submit">{editingProceeding ? "Güncelle" : "Ekle"}</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3 mb-6">
          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Scale className="w-5 h-5 text-blue-500" />
                <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{getActiveCount()} aktif</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{proceedings.length}</p>
              <p className="text-xs text-gray-500 mt-0.5">Toplam İcra</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <CircleDollarSign className="w-5 h-5 text-gray-500" />
              </div>
              <p className="text-xl font-bold text-gray-900">₺{formatCurrency(getTotalAmount())}</p>
              <p className="text-xs text-gray-500 mt-0.5">Toplam Tutar</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <ShieldCheck className="w-5 h-5 text-teal-500" />
                <span className="text-xs font-medium text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">{getFinalizedCount()} adet</span>
              </div>
              <p className="text-xl font-bold text-teal-600">₺{formatCurrency(getFinalizedAmount())}</p>
              <p className="text-xs text-gray-500 mt-0.5">Kesinleşen Tutar</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">{getObjectionCount()} adet</span>
              </div>
              <p className="text-xl font-bold text-amber-600">₺{formatCurrency(getObjectionAmount())}</p>
              <p className="text-xs text-gray-500 mt-0.5">İtiraz Tutarı</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Handshake className="w-5 h-5 text-yellow-500" />
                <span className="text-xs font-medium text-yellow-700 bg-yellow-50 px-2 py-0.5 rounded-full">{getMediationCount()} adet</span>
              </div>
              <p className="text-xl font-bold text-yellow-700">₺{formatCurrency(getMediationAmount())}</p>
              <p className="text-xs text-gray-500 mt-0.5">Arabuluculuk Tutarı</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
              </div>
              <p className="text-xl font-bold text-emerald-600">₺{formatCurrency(getPaidAmount())}</p>
              <p className="text-xs text-gray-500 mt-0.5">Ödenen Tutar</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <TrendingDown className="w-5 h-5 text-red-500" />
              </div>
              <p className="text-xl font-bold text-red-600">₺{formatCurrency(getUnpaidAmount())}</p>
              <p className="text-xs text-gray-500 mt-0.5">Ödenmemiş Tutar</p>
            </CardContent>
          </Card>
        </div>

        {/* Search & Filter */}
        <Card className="border-0 shadow-sm mb-4">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Müşteri adı veya not ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-50 border-gray-200"
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                    <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-56 bg-gray-50 border-gray-200">
                  <SelectValue placeholder="Durum filtrele" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Durumlar</SelectItem>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              {filteredProceedings.length} / {proceedings.length} kayıt gösteriliyor
            </div>
          </CardContent>
        </Card>

        {/* Proceedings List - Card-based for mobile */}
        <div className="space-y-3">
          {filteredProceedings.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-8 text-center">
                <Gavel className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">
                  {searchTerm ? `"${searchTerm}" için sonuç bulunamadı` : "Henüz icralık kaydı yok"}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredProceedings.map((proceeding) => (
              <Card key={proceeding.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-semibold text-gray-900 text-base">{proceeding.customer_name}</h3>
                        <Badge variant="outline" className={`text-[11px] px-2 py-0.5 ${getStatusBadgeColor(proceeding.status)}`}>
                          {statusOptions.find(opt => opt.value === proceeding.status)?.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-lg font-bold text-gray-900">₺{formatCurrency(proceeding.proceeding_amount)}</span>
                        {proceeding.status === "İCRA_TAMAMLANDI" ? (
                          <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                            <Check className="w-3.5 h-3.5" /> Ödendi
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-red-500">Ödenmemiş</span>
                        )}
                      </div>
                      {proceeding.notes && (
                        <p className="text-sm text-gray-500 mt-1.5 line-clamp-2">{proceeding.notes}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        <span className="text-xs text-gray-400">
                          {new Date(proceeding.created_at).toLocaleDateString('tr-TR')}
                        </span>
                        {proceeding.contract_pdf_url && (
                          <button
                            onClick={() => downloadPDF(proceeding.contract_pdf_url!, `${proceeding.customer_name}_sozlesme.pdf`)}
                            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                          >
                            <FileText className="w-3.5 h-3.5" /> Sözleşme
                          </button>
                        )}
                        {proceeding.invoice_pdf_url && (
                          <button
                            onClick={() => downloadPDF(proceeding.invoice_pdf_url!, `${proceeding.customer_name}_fatura.pdf`)}
                            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                          >
                            <Download className="w-3.5 h-3.5" /> Fatura
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(proceeding)}>
                        <Edit className="w-4 h-4 text-gray-500" />
                      </Button>
                      {userProfile?.role === 'admin' && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(proceeding.id)}>
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default LegalProceedings;
