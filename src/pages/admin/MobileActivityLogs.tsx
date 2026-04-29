import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Smartphone, Apple, Globe, Search, Clock, User as UserIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import AdminBackButton from "@/components/AdminBackButton";
import { AdminTopBar } from "@/components/AdminTopBar";
import { useUserRole } from "@/hooks/useUserRole";
import { format, formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

interface MobileLog {
  id: string;
  user_id: string | null;
  user_name: string | null;
  user_email: string | null;
  user_role: string | null;
  action_type: string;
  page_url: string | null;
  page_title: string | null;
  platform: string | null;
  is_native: boolean | null;
  app_version: string | null;
  device_info: string | null;
  user_agent: string | null;
  session_id: string | null;
  session_start: string | null;
  session_end: string | null;
  created_at: string;
}

const platformBadge = (p: string | null, isNative: boolean | null) => {
  if (p === "ios") return { label: "iOS", icon: Apple, color: "bg-gray-900 text-white" };
  if (p === "android") return { label: "Android", icon: Smartphone, color: "bg-green-600 text-white" };
  return { label: isNative ? "Native" : "Web", icon: Globe, color: "bg-blue-500 text-white" };
};

export default function MobileActivityLogs() {
  const [logs, setLogs] = useState<MobileLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("today");

  useEffect(() => {
    fetchLogs();
  }, [roleFilter, platformFilter, dateFilter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("mobile_activity_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);

      if (roleFilter !== "all") query = query.eq("user_role", roleFilter);
      if (platformFilter !== "all") query = query.eq("platform", platformFilter);

      if (dateFilter === "today") {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        query = query.gte("created_at", today.toISOString());
      } else if (dateFilter === "week") {
        const w = new Date();
        w.setDate(w.getDate() - 7);
        query = query.gte("created_at", w.toISOString());
      } else if (dateFilter === "month") {
        const m = new Date();
        m.setDate(m.getDate() - 30);
        query = query.gte("created_at", m.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      setLogs((data as MobileLog[]) || []);
    } catch (e) {
      console.error("Mobile logs fetch failed:", e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = logs.filter((l) => {
    if (!searchTerm) return true;
    const t = searchTerm.toLowerCase();
    return (
      l.user_name?.toLowerCase().includes(t) ||
      l.user_email?.toLowerCase().includes(t) ||
      l.page_title?.toLowerCase().includes(t) ||
      l.page_url?.toLowerCase().includes(t)
    );
  });

  const uniqueUsers = new Set(filtered.map((l) => l.user_id)).size;
  const nativeCount = filtered.filter((l) => l.is_native).length;
  const webCount = filtered.filter((l) => !l.is_native).length;
  const todayCount = filtered.filter(
    (l) => new Date(l.created_at).toDateString() === new Date().toDateString()
  ).length;

  return (
    <div className="min-h-screen bg-background">
      <AdminTopBar />
      <div className="container mx-auto px-4 py-6 space-y-6">
        <AdminBackButton />

        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 text-white">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Mobil Uygulama Aktivite Logları</h1>
            <p className="text-sm text-muted-foreground">
              Mobil uygulamaya giriş yapan kullanıcıların hareketlerini izleyin
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground">Toplam Hareket</div>
              <div className="text-2xl font-bold">{filtered.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground">Tekil Kullanıcı</div>
              <div className="text-2xl font-bold">{uniqueUsers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground">Native (iOS/Android)</div>
              <div className="text-2xl font-bold text-green-600">{nativeCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground">Web</div>
              <div className="text-2xl font-bold text-blue-600">{webCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Filtreler</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Kullanıcı, e-posta veya sayfa ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger><SelectValue placeholder="Rol" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Roller</SelectItem>
                <SelectItem value="specialist">Uzman</SelectItem>
                <SelectItem value="patient">Danışan</SelectItem>
                <SelectItem value="guest">Misafir</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
              </SelectContent>
            </Select>
            <Select value={platformFilter} onValueChange={setPlatformFilter}>
              <SelectTrigger><SelectValue placeholder="Platform" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Platformlar</SelectItem>
                <SelectItem value="ios">iOS</SelectItem>
                <SelectItem value="android">Android</SelectItem>
                <SelectItem value="web">Web</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger><SelectValue placeholder="Tarih" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Bugün</SelectItem>
                <SelectItem value="week">Son 7 Gün</SelectItem>
                <SelectItem value="month">Son 30 Gün</SelectItem>
                <SelectItem value="all">Tümü</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Hareketler</CardTitle>
            <CardDescription>
              Toplam {filtered.length} kayıt — Bugün {todayCount}
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {loading ? (
              <div className="py-12 text-center text-muted-foreground">Yükleniyor...</div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">Kayıt bulunamadı.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kullanıcı</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Platform</TableHead>
                    <TableHead>Sayfa</TableHead>
                    <TableHead>İşlem</TableHead>
                    <TableHead>Zaman</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((l) => {
                    const pb = platformBadge(l.platform, l.is_native);
                    const Icon = pb.icon;
                    return (
                      <TableRow key={l.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <UserIcon className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium text-sm">{l.user_name || "—"}</div>
                              <div className="text-xs text-muted-foreground">{l.user_email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{l.user_role || "guest"}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={pb.color}>
                            <Icon className="w-3 h-3 mr-1" />
                            {pb.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">{l.page_title || "—"}</div>
                          <div className="text-xs text-muted-foreground font-mono">{l.page_url}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={l.action_type === "session_end" ? "destructive" : "secondary"}>
                            {l.action_type === "page_view" ? "Sayfa Görüntüleme" :
                             l.action_type === "session_end" ? "Oturum Sonu" : l.action_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            {format(new Date(l.created_at), "dd MMM HH:mm", { locale: tr })}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(l.created_at), { locale: tr, addSuffix: true })}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
