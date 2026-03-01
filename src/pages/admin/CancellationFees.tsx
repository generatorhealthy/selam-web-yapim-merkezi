import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Helmet } from "react-helmet-async";
import AdminBackButton from "@/components/AdminBackButton";
import { HorizontalNavigation } from "@/components/HorizontalNavigation";
import {
  CreditCard, Trash2, Loader2, Search, Plus, AlertTriangle,
  CheckCircle, XCircle, Clock, RefreshCw
} from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface CancellationFee {
  id: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  customer_tc_no: string | null;
  subscription_reference_code: string | null;
  amount: number;
  charge_status: string;
  charge_result: string | null;
  charged_at: string | null;
  notes: string | null;
  created_at: string;
}

const CancellationFees = () => {
  const [fees, setFees] = useState<CancellationFee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [chargingId, setChargingId] = useState<string | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedFee, setSelectedFee] = useState<CancellationFee | null>(null);
  const [newFee, setNewFee] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    subscription_reference_code: "",
    amount: 0,
    notes: "",
  });

  const fetchFees = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("cancellation_fees")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Veriler yüklenemedi: " + error.message);
    } else {
      setFees((data as CancellationFee[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchFees(); }, []);

  const handleCharge = async (fee: CancellationFee) => {
    if (!fee.subscription_reference_code) {
      toast.error("Abonelik referans kodu bulunamadı!");
      return;
    }
    if (!fee.amount || fee.amount <= 0) {
      toast.error("Geçerli bir tutar girilmelidir!");
      return;
    }

    setChargingId(fee.id);
    try {
      const { data, error } = await supabase.functions.invoke("charge-cancellation-fee", {
        body: {
          action: "charge",
          feeId: fee.id,
          subscriptionReferenceCode: fee.subscription_reference_code,
          amount: fee.amount,
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(`${fee.customer_name} - ${data.message}`);
      } else {
        toast.error(`${fee.customer_name} - ${data?.message || "Çekim başarısız"}`);
      }
      fetchFees();
    } catch (err: any) {
      toast.error("Hata: " + (err.message || "Bilinmeyen hata"));
    } finally {
      setChargingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu kaydı silmek istediğinize emin misiniz?")) return;
    const { error } = await supabase.from("cancellation_fees").delete().eq("id", id);
    if (error) {
      toast.error("Silinemedi: " + error.message);
    } else {
      toast.success("Kayıt silindi");
      fetchFees();
    }
  };

  const handleAdd = async () => {
    if (!newFee.customer_name) {
      toast.error("Müşteri adı zorunludur");
      return;
    }
    const { error } = await supabase.from("cancellation_fees").insert({
      customer_name: newFee.customer_name,
      customer_email: newFee.customer_email || null,
      customer_phone: newFee.customer_phone || null,
      subscription_reference_code: newFee.subscription_reference_code || null,
      amount: newFee.amount,
      notes: newFee.notes || null,
    });
    if (error) {
      toast.error("Eklenemedi: " + error.message);
    } else {
      toast.success("Kayıt eklendi");
      setAddDialogOpen(false);
      setNewFee({ customer_name: "", customer_email: "", customer_phone: "", subscription_reference_code: "", amount: 0, notes: "" });
      fetchFees();
    }
  };

  const handleUpdateAmount = async () => {
    if (!selectedFee) return;
    const { error } = await supabase
      .from("cancellation_fees")
      .update({ amount: selectedFee.amount, notes: selectedFee.notes, subscription_reference_code: selectedFee.subscription_reference_code })
      .eq("id", selectedFee.id);
    if (error) {
      toast.error("Güncellenemedi: " + error.message);
    } else {
      toast.success("Güncellendi");
      setEditDialogOpen(false);
      fetchFees();
    }
  };

  const filteredFees = fees.filter((f) =>
    f.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.customer_phone?.includes(searchTerm)
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "charged":
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Tahsil Edildi</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Başarısız</Badge>;
      case "cancelled":
        return <Badge className="bg-gray-100 text-gray-800">İptal</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Bekliyor</Badge>;
    }
  };

  return (
    <>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
        <title>Cayma Bedelleri | Admin Panel</title>
      </Helmet>
      <HorizontalNavigation />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <AdminBackButton />

          <Card className="mb-6">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-6 h-6 text-rose-600" />
                  Cayma Bedelleri
                  <Badge variant="outline">{filteredFees.length} kayıt</Badge>
                </CardTitle>
                <div className="flex gap-2">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Ara..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Button onClick={() => setAddDialogOpen(true)} className="bg-rose-600 hover:bg-rose-700">
                    <Plus className="w-4 h-4 mr-1" /> Ekle
                  </Button>
                  <Button variant="outline" onClick={fetchFees}>
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
              ) : filteredFees.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Kayıt bulunamadı</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Müşteri</TableHead>
                        <TableHead>İletişim</TableHead>
                        <TableHead>Ref. Kodu</TableHead>
                        <TableHead>Tutar</TableHead>
                        <TableHead>Durum</TableHead>
                        <TableHead>Sonuç</TableHead>
                        <TableHead>Tarih</TableHead>
                        <TableHead>İşlemler</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredFees.map((fee) => (
                        <TableRow key={fee.id}>
                          <TableCell className="font-medium">{fee.customer_name}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {fee.customer_email && <div>{fee.customer_email}</div>}
                              {fee.customer_phone && <div className="text-gray-500">{fee.customer_phone}</div>}
                            </div>
                          </TableCell>
                          <TableCell>
                            <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                              {fee.subscription_reference_code || "—"}
                            </code>
                          </TableCell>
                          <TableCell className="font-bold text-rose-600">
                            {fee.amount} ₺
                          </TableCell>
                          <TableCell>{getStatusBadge(fee.charge_status)}</TableCell>
                          <TableCell>
                            <span className="text-xs text-gray-600 max-w-[200px] truncate block">
                              {fee.charge_result || "—"}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {format(new Date(fee.created_at), "dd MMM yyyy", { locale: tr })}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => { setSelectedFee({ ...fee }); setEditDialogOpen(true); }}
                              >
                                Düzenle
                              </Button>
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handleCharge(fee)}
                                disabled={chargingId === fee.id || fee.charge_status === "charged"}
                              >
                                {chargingId === fee.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <CreditCard className="w-4 h-4" />
                                )}
                                <span className="ml-1">Çek</span>
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDelete(fee.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cayma Bedeli Ekle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Müşteri Adı *</Label>
              <Input value={newFee.customer_name} onChange={(e) => setNewFee({ ...newFee, customer_name: e.target.value })} />
            </div>
            <div>
              <Label>E-posta</Label>
              <Input value={newFee.customer_email} onChange={(e) => setNewFee({ ...newFee, customer_email: e.target.value })} />
            </div>
            <div>
              <Label>Telefon</Label>
              <Input value={newFee.customer_phone} onChange={(e) => setNewFee({ ...newFee, customer_phone: e.target.value })} />
            </div>
            <div>
              <Label>Abonelik Ref. Kodu (Iyzico)</Label>
              <Input value={newFee.subscription_reference_code} onChange={(e) => setNewFee({ ...newFee, subscription_reference_code: e.target.value })} />
            </div>
            <div>
              <Label>Tutar (₺)</Label>
              <Input type="number" value={newFee.amount} onChange={(e) => setNewFee({ ...newFee, amount: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Notlar</Label>
              <Textarea value={newFee.notes} onChange={(e) => setNewFee({ ...newFee, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>İptal</Button>
            <Button onClick={handleAdd} className="bg-rose-600 hover:bg-rose-700">Ekle</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Düzenle - {selectedFee?.customer_name}</DialogTitle>
          </DialogHeader>
          {selectedFee && (
            <div className="space-y-4">
              <div>
                <Label>Abonelik Ref. Kodu (Iyzico)</Label>
                <Input
                  value={selectedFee.subscription_reference_code || ""}
                  onChange={(e) => setSelectedFee({ ...selectedFee, subscription_reference_code: e.target.value })}
                />
              </div>
              <div>
                <Label>Tutar (₺)</Label>
                <Input
                  type="number"
                  value={selectedFee.amount}
                  onChange={(e) => setSelectedFee({ ...selectedFee, amount: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>Notlar</Label>
                <Textarea
                  value={selectedFee.notes || ""}
                  onChange={(e) => setSelectedFee({ ...selectedFee, notes: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>İptal</Button>
            <Button onClick={handleUpdateAmount} className="bg-blue-600 hover:bg-blue-700">Güncelle</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CancellationFees;
