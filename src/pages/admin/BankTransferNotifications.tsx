import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import AdminBackButton from "@/components/AdminBackButton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Banknote, CheckCircle2, AlertCircle, Search, Link2, RefreshCw, ShieldAlert } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { useUserRole } from "@/hooks/useUserRole";
import { Navigate } from "react-router-dom";

interface Notification {
  id: string;
  sender_name: string;
  amount: number | null;
  status: string;
  matched_order_id: string | null;
  match_method: string | null;
  match_candidates: any;
  amount_diff: number | null;
  notes: string | null;
  raw_subject: string | null;
  created_at: string;
}

interface PendingOrder {
  id: string;
  customer_name: string;
  customer_email: string;
  amount: number;
  package_name: string;
  created_at: string;
}

const STATUS_LABEL: Record<string, { label: string; variant: any }> = {
  matched: { label: "Otomatik Onaylandı", variant: "default" },
  manual_matched: { label: "Manuel Onaylandı", variant: "default" },
  unmatched: { label: "Eşleşme Bekliyor", variant: "destructive" },
  pending: { label: "İşleniyor", variant: "secondary" },
  ignored: { label: "Yok Sayıldı", variant: "outline" },
};

export default function BankTransferNotifications() {
  const { toast } = useToast();
  const { userProfile, loading: roleLoading } = useUserRole();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  // Dialog
  const [selectedNotification, setSelectedNotification] =
    useState<Notification | null>(null);
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");
  const [linking, setLinking] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    let query = supabase
      .from("bank_transfer_notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    const { data, error } = await query;
    if (error) {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setNotifications((data ?? []) as any);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications();
  }, [statusFilter]);

  const openLinkDialog = async (notif: Notification) => {
    setSelectedNotification(notif);
    setSelectedOrderId("");
    const { data } = await supabase
      .from("orders")
      .select("id, customer_name, customer_email, amount, package_name, created_at")
      .eq("status", "pending")
      .in("payment_method", ["banka_havalesi", "bank_transfer"])
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(200);
    setPendingOrders((data ?? []) as any);
  };

  const handleManualMatch = async () => {
    if (!selectedNotification || !selectedOrderId) return;
    setLinking(true);

    const order = pendingOrders.find((o) => o.id === selectedOrderId);
    if (!order) {
      setLinking(false);
      return;
    }

    // 1) Siparişi onayla
    const { error: updErr } = await supabase
      .from("orders")
      .update({ status: "approved" })
      .eq("id", selectedOrderId);

    if (updErr) {
      toast({
        title: "Sipariş onaylanamadı",
        description: updErr.message,
        variant: "destructive",
      });
      setLinking(false);
      return;
    }

    // 2) Bildirimi güncelle
    const amountDiff =
      selectedNotification.amount != null
        ? Number(selectedNotification.amount) - Number(order.amount)
        : null;

    const { data: userData } = await supabase.auth.getUser();
    await supabase
      .from("bank_transfer_notifications")
      .update({
        status: "manual_matched",
        matched_order_id: selectedOrderId,
        matched_at: new Date().toISOString(),
        matched_by: userData.user?.id ?? null,
        match_method: "manual",
        amount_diff: amountDiff,
      })
      .eq("id", selectedNotification.id);

    toast({
      title: "Başarılı",
      description: `Sipariş onaylandı (${order.customer_name})`,
    });

    setSelectedNotification(null);
    setLinking(false);
    fetchNotifications();
  };

  const handleIgnore = async (id: string) => {
    if (!confirm("Bu bildirimi yok say?")) return;
    const { error } = await supabase
      .from("bank_transfer_notifications")
      .update({ status: "ignored" })
      .eq("id", id);
    if (error) {
      toast({ title: "Hata", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Bildirim yok sayıldı" });
      fetchNotifications();
    }
  };

  const filtered = notifications.filter((n) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      n.sender_name?.toLowerCase().includes(q) ||
      n.raw_subject?.toLowerCase().includes(q) ||
      String(n.amount ?? "").includes(q)
    );
  });

  const stats = {
    total: notifications.length,
    matched: notifications.filter(
      (n) => n.status === "matched" || n.status === "manual_matched",
    ).length,
    unmatched: notifications.filter((n) => n.status === "unmatched").length,
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <AdminBackButton />

      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-3">
          <Banknote className="w-7 h-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Banka Havalesi Bildirimleri</h1>
            <p className="text-sm text-muted-foreground">
              Akbank'tan gelen havale bildirimleri ve otomatik sipariş eşleştirme
            </p>
          </div>
        </div>
        <Button
          onClick={async () => {
            const t = toast({ title: "Mailler taranıyor...", description: "info@ kutusu kontrol ediliyor" });
            const { data, error } = await supabase.functions.invoke("poll-akbank-emails");
            if (error) {
              toast({ title: "Hata", description: error.message, variant: "destructive" });
              return;
            }
            const s = data?.summary || {};
            toast({
              title: "Tarama tamamlandı",
              description: `Bulunan: ${s.fetched ?? 0} • İşlenen: ${s.forwarded ?? 0} • Tekrar: ${s.skipped_duplicates ?? 0}`,
            });
            fetchNotifications();
          }}
          variant="outline"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Mailleri Şimdi Tara
        </Button>
      </div>

      {/* İstatistik */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Toplam Bildirim</div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-green-600" /> Eşleşti
            </div>
            <div className="text-2xl font-bold text-green-600">
              {stats.matched}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <AlertCircle className="w-4 h-4 text-red-600" /> Manuel İnceleme
            </div>
            <div className="text-2xl font-bold text-red-600">
              {stats.unmatched}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtreler */}
      <Card className="mb-4">
        <CardContent className="pt-6 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Gönderen veya tutar ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tümü</SelectItem>
              <SelectItem value="unmatched">Eşleşme Bekleyen</SelectItem>
              <SelectItem value="matched">Otomatik Onaylanan</SelectItem>
              <SelectItem value="manual_matched">Manuel Onaylanan</SelectItem>
              <SelectItem value="ignored">Yok Sayılan</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Liste */}
      <Card>
        <CardHeader>
          <CardTitle>Bildirimler ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-20 rounded-md bg-muted animate-pulse"
                />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Henüz bildirim yok.
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((n) => {
                const meta = STATUS_LABEL[n.status] ?? {
                  label: n.status,
                  variant: "secondary",
                };
                return (
                  <div
                    key={n.id}
                    className="border rounded-lg p-4 flex flex-col md:flex-row md:items-center gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{n.sender_name}</span>
                        <Badge variant={meta.variant}>{meta.label}</Badge>
                        {n.amount_diff != null &&
                          Math.abs(n.amount_diff) > 0.5 && (
                            <Badge variant="outline" className="text-amber-600">
                              Tutar farkı: {n.amount_diff > 0 ? "+" : ""}
                              {n.amount_diff.toFixed(2)} TL
                            </Badge>
                          )}
                      </div>
                      <div className="text-sm text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
                        <span>
                          Tutar:{" "}
                          <strong>
                            {n.amount != null
                              ? `${Number(n.amount).toFixed(2)} TL`
                              : "—"}
                          </strong>
                        </span>
                        <span>
                          Tarih:{" "}
                          {format(new Date(n.created_at), "dd MMM yyyy HH:mm", {
                            locale: tr,
                          })}
                        </span>
                        {n.match_method && (
                          <span>Yöntem: {n.match_method}</span>
                        )}
                      </div>
                      {n.notes && (
                        <div className="text-xs text-muted-foreground mt-1 italic">
                          {n.notes}
                        </div>
                      )}
                    </div>

                    {n.status === "unmatched" && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => openLinkDialog(n)}
                          className="gap-1"
                        >
                          <Link2 className="w-4 h-4" />
                          Siparişe Bağla
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleIgnore(n.id)}
                        >
                          Yok Say
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manuel eşleştirme dialog */}
      <Dialog
        open={!!selectedNotification}
        onOpenChange={(o) => !o && setSelectedNotification(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manuel Eşleştirme</DialogTitle>
          </DialogHeader>
          {selectedNotification && (
            <div className="space-y-4">
              <div className="bg-muted rounded-md p-3 text-sm">
                <div>
                  <strong>Gönderen:</strong> {selectedNotification.sender_name}
                </div>
                <div>
                  <strong>Tutar:</strong>{" "}
                  {selectedNotification.amount != null
                    ? `${Number(selectedNotification.amount).toFixed(2)} TL`
                    : "—"}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Bekleyen Banka Havalesi Siparişi Seç
                </label>
                <Select
                  value={selectedOrderId}
                  onValueChange={setSelectedOrderId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sipariş seçin..." />
                  </SelectTrigger>
                  <SelectContent>
                    {pendingOrders.length === 0 ? (
                      <div className="p-3 text-sm text-muted-foreground">
                        Bekleyen banka havalesi siparişi yok.
                      </div>
                    ) : (
                      pendingOrders.map((o) => (
                        <SelectItem key={o.id} value={o.id}>
                          {o.customer_name} — {Number(o.amount).toFixed(2)} TL —{" "}
                          {format(new Date(o.created_at), "dd MMM", {
                            locale: tr,
                          })}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSelectedNotification(null)}
            >
              İptal
            </Button>
            <Button
              onClick={handleManualMatch}
              disabled={!selectedOrderId || linking}
            >
              {linking ? "Onaylanıyor..." : "Eşleştir ve Onayla"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
