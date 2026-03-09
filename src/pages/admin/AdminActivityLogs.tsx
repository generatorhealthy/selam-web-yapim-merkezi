import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Activity, Clock, User, Search, Filter, Monitor, LogOut, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import AdminBackButton from "@/components/AdminBackButton";
import { AdminTopBar } from "@/components/AdminTopBar";
import { useUserRole } from "@/hooks/useUserRole";
import { format, formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

interface ActivityLog {
  id: string;
  user_id: string;
  user_name: string | null;
  user_email: string | null;
  user_role: string | null;
  action_type: string;
  page_url: string | null;
  page_title: string | null;
  details: string | null;
  session_start: string | null;
  session_end: string | null;
  created_at: string;
}

export default function AdminActivityLogs() {
  const { userProfile } = useUserRole();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("today");

  useEffect(() => {
    fetchLogs();
  }, [roleFilter, dateFilter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('admin_activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (roleFilter !== "all") {
        query = query.eq('user_role', roleFilter);
      }

      if (dateFilter === "today") {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        query = query.gte('created_at', today.toISOString());
      } else if (dateFilter === "week") {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        query = query.gte('created_at', weekAgo.toISOString());
      } else if (dateFilter === "month") {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        query = query.gte('created_at', monthAgo.toISOString());
      }

      const { data, error } = await query;
      if (error) {
        console.error('Error fetching activity logs:', error);
      } else {
        setLogs(data || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (log.user_name || '').toLowerCase().includes(term) ||
      (log.user_email || '').toLowerCase().includes(term) ||
      (log.page_title || '').toLowerCase().includes(term) ||
      (log.page_url || '').toLowerCase().includes(term)
    );
  });

  // Group logs by user for session summary
  const userSessions = filteredLogs.reduce((acc, log) => {
    const key = log.user_id;
    if (!acc[key]) {
      acc[key] = {
        user_name: log.user_name,
        user_email: log.user_email,
        user_role: log.user_role,
        logs: [],
        firstActivity: log.created_at,
        lastActivity: log.created_at,
      };
    }
    acc[key].logs.push(log);
    if (new Date(log.created_at) < new Date(acc[key].firstActivity)) {
      acc[key].firstActivity = log.created_at;
    }
    if (new Date(log.created_at) > new Date(acc[key].lastActivity)) {
      acc[key].lastActivity = log.created_at;
    }
    return acc;
  }, {} as Record<string, { user_name: string | null; user_email: string | null; user_role: string | null; logs: ActivityLog[]; firstActivity: string; lastActivity: string }>);

  const getRoleBadge = (role: string | null) => {
    switch (role) {
      case 'admin': return <Badge className="bg-red-500 text-white">Admin</Badge>;
      case 'staff': return <Badge className="bg-blue-500 text-white">Staff</Badge>;
      case 'legal': return <Badge className="bg-purple-500 text-white">Hukuk</Badge>;
      case 'muhasebe': return <Badge className="bg-green-500 text-white">Muhasebe</Badge>;
      default: return <Badge variant="secondary">{role || 'Bilinmiyor'}</Badge>;
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'page_view': return <Eye className="w-3.5 h-3.5 text-blue-500" />;
      case 'session_end': return <LogOut className="w-3.5 h-3.5 text-red-500" />;
      default: return <Activity className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <AdminTopBar userRole={userProfile?.role || null} />
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-600">Aktivite logları yükleniyor...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <AdminTopBar userRole={userProfile?.role || null} />
      
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <AdminBackButton />
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Panel Aktivite Logları</h1>
          <p className="text-slate-600">Admin ve Staff üyelerinin panel giriş-çıkış ve sayfa gezinme kayıtları</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <Activity className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{filteredLogs.length}</p>
                  <p className="text-xs text-slate-500">Toplam İşlem</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100">
                  <User className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{Object.keys(userSessions).length}</p>
                  <p className="text-xs text-slate-500">Aktif Kullanıcı</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-100">
                  <Monitor className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">
                    {filteredLogs.filter(l => l.user_role === 'admin').length}
                  </p>
                  <p className="text-xs text-slate-500">Admin İşlemleri</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100">
                  <Monitor className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">
                    {filteredLogs.filter(l => l.user_role === 'staff').length}
                  </p>
                  <p className="text-xs text-slate-500">Staff İşlemleri</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-slate-400" />
                <Input
                  placeholder="İsim, e-posta veya sayfa ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-white"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[160px] bg-white">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Rol filtrele" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Roller</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="legal">Hukuk</SelectItem>
                  <SelectItem value="muhasebe">Muhasebe</SelectItem>
                </SelectContent>
              </Select>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-[160px] bg-white">
                  <Clock className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Tarih filtrele" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Bugün</SelectItem>
                  <SelectItem value="week">Son 7 Gün</SelectItem>
                  <SelectItem value="month">Son 30 Gün</SelectItem>
                  <SelectItem value="all">Tümü</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={fetchLogs} size="sm">
                Yenile
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* User Session Summary */}
        <Card className="mb-6 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Kullanıcı Oturum Özeti
            </CardTitle>
            <CardDescription>Her kullanıcının giriş saatleri ve ziyaret ettikleri sayfalar</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(userSessions).map(([userId, session]) => {
                const uniquePages = [...new Set(session.logs.filter(l => l.action_type === 'page_view').map(l => l.page_title))];
                return (
                  <div key={userId} className="border rounded-xl p-4 bg-white hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                          {(session.user_name || '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{session.user_name || 'Bilinmiyor'}</p>
                          <p className="text-xs text-slate-500">{session.user_email}</p>
                        </div>
                        {getRoleBadge(session.user_role)}
                      </div>
                      <div className="text-right text-sm">
                        <p className="text-slate-600">
                          <span className="font-medium">{session.logs.length}</span> işlem
                        </p>
                        <p className="text-xs text-slate-400">
                          Son: {formatDistanceToNow(new Date(session.lastActivity), { addSuffix: true, locale: tr })}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {uniquePages.map((page, i) => (
                        <Badge key={i} variant="outline" className="text-xs bg-slate-50">
                          {page}
                        </Badge>
                      ))}
                    </div>
                    <div className="mt-2 text-xs text-slate-400 flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        İlk Giriş: {format(new Date(session.firstActivity), 'dd.MM.yyyy HH:mm:ss', { locale: tr })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Son Aktivite: {format(new Date(session.lastActivity), 'dd.MM.yyyy HH:mm:ss', { locale: tr })}
                      </span>
                    </div>
                  </div>
                );
              })}
              {Object.keys(userSessions).length === 0 && (
                <p className="text-center text-slate-500 py-8">Bu filtreler için kayıt bulunamadı.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Detailed Log Table */}
        <Card className="bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Detaylı İşlem Logları
            </CardTitle>
            <CardDescription>Tüm sayfa gezinme ve oturum kayıtları detaylı olarak</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tarih / Saat</TableHead>
                    <TableHead>Kullanıcı</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>İşlem</TableHead>
                    <TableHead>Sayfa</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.slice(0, 200).map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap text-sm">
                        {format(new Date(log.created_at), 'dd.MM.yyyy HH:mm:ss', { locale: tr })}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{log.user_name || 'Bilinmiyor'}</p>
                          <p className="text-xs text-slate-400">{log.user_email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{getRoleBadge(log.user_role)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {getActionIcon(log.action_type)}
                          <span className="text-sm">
                            {log.action_type === 'page_view' ? 'Sayfa Görüntüleme' : 
                             log.action_type === 'session_end' ? 'Oturum Kapanış' : log.action_type}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium">{log.page_title}</span>
                        <p className="text-xs text-slate-400">{log.page_url}</p>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredLogs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                        Kayıt bulunamadı.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            {filteredLogs.length > 200 && (
              <p className="text-center text-sm text-slate-400 mt-4">
                İlk 200 kayıt gösteriliyor. Toplam: {filteredLogs.length}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
