import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ShieldCheck, Search, RefreshCw, Download, Eye, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import AdminBackButton from "@/components/AdminBackButton";
import { AdminTopBar } from "@/components/AdminTopBar";
import { useUserRole } from "@/hooks/useUserRole";
import { useAdminActivityTracker } from "@/hooks/useAdminActivityTracker";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { toast } from "sonner";

interface ConsentLog {
  id: string;
  user_id: string | null;
  email: string | null;
  consent_type: string;
  consent_version: string | null;
  accepted: boolean;
  ip_address: string | null;
  user_agent: string | null;
  document_hash: string | null;
  source: string | null;
  metadata: any;
  accepted_at: string;
}

const TYPE_LABELS: Record<string, string> = {
  disclosure: "Aydınlatma (KVKK m.10)",
  explicit_consent: "Açık Rıza (Sağlık Verisi)",
  marketing: "Ticari İleti (ETK/İYS)",
  terms: "Kullanım Koşulları",
  privacy: "Gizlilik Politikası",
};

export default function ConsentLogs() {
  const { userProfile } = useUserRole();
  useAdminActivityTracker(userProfile);

  const [logs, setLogs] = useState<ConsentLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [acceptedFilter, setAcceptedFilter] = useState<string>("all");
  const [selected, setSelected] = useState<ConsentLog | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("user_consent_logs")
      .select("*")
      .order("accepted_at", { ascending: false })
      .limit(1000);
    if (error) {
      toast.error("Loglar yüklenemedi: " + error.message);
    } else {
      setLogs((data as ConsentLog[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filtered = useMemo(() => {
    return logs.filter((l) => {
      if (typeFilter !== "all" && l.consent_type !== typeFilter) return false;
      if (acceptedFilter === "accepted" && !l.accepted) return false;
      if (acceptedFilter === "rejected" && l.accepted) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = [l.email, l.ip_address, l.user_id, l.consent_version]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [logs, search, typeFilter, acceptedFilter]);

  const exportCSV = () => {
    const headers = [
      "Tarih",
      "E-posta",
      "Kullanıcı ID",
      "Rıza Tipi",
      "Versiyon",
      "Onay",
      "IP",
      "User-Agent",
      "Kaynak",
      "Doküman Hash",
    ];
    const rows = filtered.map((l) => [
      format(new Date(l.accepted_at), "yyyy-MM-dd HH:mm:ss"),
      l.email || "",
      l.user_id || "",
      l.consent_type,
      l.consent_version || "",
      l.accepted ? "Evet" : "Hayır",
      l.ip_address || "",
      (l.user_agent || "").replace(/"/g, "'"),
      l.source || "",
      l.document_hash || "",
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kvkk-riza-loglari-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${filtered.length} kayıt indirildi`);
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminTopBar userRole={userProfile?.role || null} />
      <div className="container mx-auto p-4 md:p-6 space-y-6">
        <AdminBackButton />

        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">KVKK Rıza Logları</h1>
            <p className="text-sm text-muted-foreground">
              Aydınlatma, açık rıza ve ticari ileti onaylarının hukuki delil kayıtları
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Toplam Kayıt</p>
              <p className="text-2xl font-bold">{logs.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Aydınlatma</p>
              <p className="text-2xl font-bold">
                {logs.filter((l) => l.consent_type === "disclosure" && l.accepted).length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Açık Rıza</p>
              <p className="text-2xl font-bold">
                {logs.filter((l) => l.consent_type === "explicit_consent" && l.accepted).length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Ticari İleti</p>
              <p className="text-2xl font-bold">
                {logs.filter((l) => l.consent_type === "marketing" && l.accepted).length}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-2 flex-wrap">
              <span>Kayıtlar ({filtered.length})</span>
              <div className="flex gap-2">
                <Button onClick={fetchLogs} variant="outline" size="sm" disabled={loading}>
                  <RefreshCw className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`} />
                  Yenile
                </Button>
                <Button onClick={exportCSV} size="sm" disabled={!filtered.length}>
                  <Download className="w-4 h-4 mr-1" />
                  CSV İndir
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="E-posta, IP, kullanıcı ID, versiyon..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Rıza tipi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm tipler</SelectItem>
                  <SelectItem value="disclosure">Aydınlatma</SelectItem>
                  <SelectItem value="explicit_consent">Açık Rıza</SelectItem>
                  <SelectItem value="marketing">Ticari İleti</SelectItem>
                  <SelectItem value="terms">Kullanım Koşulları</SelectItem>
                  <SelectItem value="privacy">Gizlilik Politikası</SelectItem>
                </SelectContent>
              </Select>
              <Select value={acceptedFilter} onValueChange={setAcceptedFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Onay durumu" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  <SelectItem value="accepted">Onaylananlar</SelectItem>
                  <SelectItem value="rejected">Reddedilenler</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tarih</TableHead>
                    <TableHead>E-posta</TableHead>
                    <TableHead>Tip</TableHead>
                    <TableHead>Versiyon</TableHead>
                    <TableHead>Onay</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead className="text-right">Detay</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Yükleniyor...
                      </TableCell>
                    </TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Kayıt bulunamadı
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((l) => (
                      <TableRow key={l.id}>
                        <TableCell className="whitespace-nowrap text-xs">
                          {format(new Date(l.accepted_at), "dd.MM.yyyy HH:mm", { locale: tr })}
                        </TableCell>
                        <TableCell className="text-xs">{l.email || "-"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {TYPE_LABELS[l.consent_type] || l.consent_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs font-mono">{l.consent_version || "-"}</TableCell>
                        <TableCell>
                          {l.accepted ? (
                            <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Onay
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              <XCircle className="w-3 h-3 mr-1" />
                              Red
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs font-mono">{l.ip_address || "-"}</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="ghost" onClick={() => setSelected(l)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Rıza Kaydı Detayı</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <Row label="Kayıt ID" value={selected.id} mono />
              <Row label="Tarih" value={format(new Date(selected.accepted_at), "dd.MM.yyyy HH:mm:ss", { locale: tr })} />
              <Row label="E-posta" value={selected.email || "-"} />
              <Row label="Kullanıcı ID" value={selected.user_id || "-"} mono />
              <Row label="Rıza Tipi" value={TYPE_LABELS[selected.consent_type] || selected.consent_type} />
              <Row label="Versiyon" value={selected.consent_version || "-"} mono />
              <Row label="Onay Durumu" value={selected.accepted ? "✅ Onaylandı" : "❌ Reddedildi"} />
              <Row label="IP Adresi" value={selected.ip_address || "-"} mono />
              <Row label="Kaynak" value={selected.source || "-"} />
              <Row label="Doküman Hash" value={selected.document_hash || "-"} mono />
              <div>
                <p className="text-xs text-muted-foreground mb-1">User-Agent</p>
                <p className="text-xs font-mono bg-muted p-2 rounded break-all">
                  {selected.user_agent || "-"}
                </p>
              </div>
              {selected.metadata && Object.keys(selected.metadata).length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Metadata</p>
                  <pre className="text-xs font-mono bg-muted p-2 rounded overflow-auto">
                    {JSON.stringify(selected.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 border-b pb-2">
      <span className="text-xs text-muted-foreground sm:w-32 shrink-0">{label}</span>
      <span className={`text-sm break-all ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}
