import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Mail, Search, RefreshCw, CheckCircle, XCircle, Clock, Filter, Download, Eye, MousePointer, AlertTriangle, Ban, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import AdminBackButton from "@/components/AdminBackButton";
import { AdminTopBar } from "@/components/AdminTopBar";
import { useUserRole } from "@/hooks/useUserRole";
import { useAdminActivityTracker } from "@/hooks/useAdminActivityTracker";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { toast } from "sonner";

interface EmailLog {
  id: string;
  recipient_email: string;
  recipient_name: string | null;
  sender_email: string;
  subject: string;
  template_name: string | null;
  status: string;
  brevo_message_id: string | null;
  error_message: string | null;
  metadata: any;
  created_at: string;
}

interface BrevoStats {
  requests: number;
  delivered: number;
  opens: number;
  uniqueOpens: number;
  clicks: number;
  uniqueClicks: number;
  hardBounces: number;
  softBounces: number;
  blocked: number;
  complaints: number;
  invalid: number;
}

interface BrevoEvent {
  email: string;
  date: string;
  subject: string;
  messageId: string;
  event: string;
  tag: string;
  from: string;
}

export default function EmailLogs() {
  const { userProfile } = useUserRole();
  useAdminActivityTracker(userProfile);
  const [emails, setEmails] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [templateFilter, setTemplateFilter] = useState("all");
  const [templates, setTemplates] = useState<string[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [brevoStats, setBrevoStats] = useState<BrevoStats | null>(null);
  const [brevoEvents, setBrevoEvents] = useState<BrevoEvent[]>([]);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsPeriod, setStatsPeriod] = useState("7");
  const [activeTab, setActiveTab] = useState<"logs" | "brevo">("logs");

  useEffect(() => {
    fetchEmails();
    fetchBrevoStats();
  }, []);

  const fetchEmails = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('brevo_email_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) {
        console.error('Email logs fetch error:', error);
      } else {
        setEmails((data as EmailLog[]) || []);
        const uniqueTemplates = [...new Set((data || []).map((e: EmailLog) => e.template_name).filter(Boolean))] as string[];
        setTemplates(uniqueTemplates);
      }
    } catch (error) {
      console.error('Error fetching email logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBrevoStats = async (days?: string) => {
    try {
      setStatsLoading(true);
      const period = days || statsPeriod;
      const { data, error } = await supabase.functions.invoke('get-brevo-statistics', {
        body: { days: parseInt(period) }
      });
      if (error) throw error;
      if (data?.aggregated) setBrevoStats(data.aggregated);
      if (data?.events) setBrevoEvents(data.events);
    } catch (err: any) {
      console.error('Brevo stats error:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  const handlePeriodChange = (val: string) => {
    setStatsPeriod(val);
    fetchBrevoStats(val);
  };

  const syncBrevoHistory = async () => {
    try {
      setSyncing(true);
      toast.info("Brevo geçmişi senkronize ediliyor...");
      const { data, error } = await supabase.functions.invoke('sync-brevo-email-history');
      if (error) throw error;
      toast.success(`${data?.imported || 0} e-posta geçmişten aktarıldı`);
      await fetchEmails();
    } catch (err: any) {
      console.error('Sync error:', err);
      toast.error("Senkronizasyon hatası: " + err.message);
    } finally {
      setSyncing(false);
    }
  };

  const filteredEmails = emails.filter(email => {
    const matchesSearch = searchTerm === "" || 
      email.recipient_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (email.recipient_name || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || email.status === statusFilter;
    const matchesTemplate = templateFilter === "all" || email.template_name === templateFilter;
    return matchesSearch && matchesStatus && matchesTemplate;
  });

  const stats = {
    total: emails.length,
    sent: emails.filter(e => e.status === 'sent').length,
    failed: emails.filter(e => e.status === 'failed').length,
    pending: emails.filter(e => e.status === 'pending').length,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />Gönderildi</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Başarısız</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Bekliyor</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getEventBadge = (event: string) => {
    switch (event) {
      case 'delivered':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Teslim Edildi</Badge>;
      case 'opened': case 'uniqueOpened':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200"><Eye className="w-3 h-3 mr-1" />Açıldı</Badge>;
      case 'clicks': case 'uniqueClicks':
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200"><MousePointer className="w-3 h-3 mr-1" />Tıklandı</Badge>;
      case 'hardBounces':
        return <Badge variant="destructive">Hard Bounce</Badge>;
      case 'softBounces':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Soft Bounce</Badge>;
      case 'blocked':
        return <Badge className="bg-red-100 text-red-800 border-red-200"><Ban className="w-3 h-3 mr-1" />Engellendi</Badge>;
      case 'requests':
        return <Badge className="bg-slate-100 text-slate-800 border-slate-200">Gönderildi</Badge>;
      case 'deferred':
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200"><Clock className="w-3 h-3 mr-1" />Ertelendi</Badge>;
      default:
        return <Badge variant="outline">{event}</Badge>;
    }
  };

  const getTemplateLabel = (name: string | null) => {
    const labels: Record<string, string> = {
      'appointment-notification': 'Randevu Bildirimi',
      'contact-email': 'İletişim Formu',
      'registration-email': 'Kayıt Başvurusu',
      'support-response': 'Destek Yanıtı',
      'ticket-notification': 'Destek Talebi',
      'patient-confirmation': 'Hasta Onay',
      'accounting-notification': 'Muhasebe Bildirimi',
      'blog-notification': 'Blog Bildirimi',
      'order-documents': 'Sipariş Belgeleri',
      'test-results': 'Test Sonuçları',
      'legal-proceeding': 'Hukuki İşlem',
    };
    return labels[name || ''] || name || 'Bilinmiyor';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <AdminTopBar userRole={userProfile?.role || null} />
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-600">E-posta logları yükleniyor...</p>
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
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <AdminBackButton />
            <h1 className="text-4xl font-bold text-slate-900 mb-2">E-posta Logları</h1>
            <p className="text-slate-600">Brevo üzerinden gönderilen tüm e-postaların kaydı ve istatistikleri</p>
          </div>
          <Button onClick={syncBrevoHistory} disabled={syncing} variant="outline" className="gap-2">
            <Download className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Senkronize ediliyor...' : 'Brevo Geçmişini Aktar'}
          </Button>
        </div>

        {/* Tab Buttons */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === "logs" ? "default" : "outline"}
            onClick={() => setActiveTab("logs")}
            className="gap-2"
          >
            <Mail className="w-4 h-4" />
            E-posta Logları
          </Button>
          <Button
            variant={activeTab === "brevo" ? "default" : "outline"}
            onClick={() => setActiveTab("brevo")}
            className="gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            Brevo İstatistikleri
          </Button>
        </div>

        {activeTab === "logs" && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                  <p className="text-sm text-slate-500">Toplam</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">{stats.sent}</p>
                  <p className="text-sm text-slate-500">Gönderildi</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
                  <p className="text-sm text-slate-500">Başarısız</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
                  <p className="text-sm text-slate-500">Bekliyor</p>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="E-posta, konu veya alıcı ara..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full md:w-[180px]">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Durum" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tüm Durumlar</SelectItem>
                      <SelectItem value="sent">Gönderildi</SelectItem>
                      <SelectItem value="failed">Başarısız</SelectItem>
                      <SelectItem value="pending">Bekliyor</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={templateFilter} onValueChange={setTemplateFilter}>
                    <SelectTrigger className="w-full md:w-[220px]">
                      <SelectValue placeholder="Şablon" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tüm Şablonlar</SelectItem>
                      {templates.map(t => (
                        <SelectItem key={t} value={t}>{getTemplateLabel(t)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={fetchEmails} variant="outline" size="icon">
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Email Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Gönderilen E-postalar ({filteredEmails.length})
                </CardTitle>
                <CardDescription>Brevo API üzerinden gönderilen tüm e-posta kayıtları</CardDescription>
              </CardHeader>
              <CardContent>
                {filteredEmails.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <Mail className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p>Henüz e-posta kaydı bulunamadı.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tarih</TableHead>
                          <TableHead>Alıcı</TableHead>
                          <TableHead>Konu</TableHead>
                          <TableHead>Şablon</TableHead>
                          <TableHead>Durum</TableHead>
                          <TableHead>Hata</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredEmails.map((email) => (
                          <TableRow key={email.id}>
                            <TableCell className="whitespace-nowrap text-sm">
                              {format(new Date(email.created_at), 'dd.MM.yyyy HH:mm', { locale: tr })}
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium text-sm">{email.recipient_name || '-'}</p>
                                <p className="text-xs text-slate-500">{email.recipient_email}</p>
                              </div>
                            </TableCell>
                            <TableCell className="max-w-[250px] truncate text-sm">{email.subject}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {getTemplateLabel(email.template_name)}
                              </Badge>
                            </TableCell>
                            <TableCell>{getStatusBadge(email.status)}</TableCell>
                            <TableCell className="max-w-[200px] truncate text-xs text-red-600">
                              {email.error_message || '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {activeTab === "brevo" && (
          <>
            {/* Period Selector */}
            <div className="flex items-center gap-3 mb-6">
              <span className="text-sm font-medium text-slate-600">Dönem:</span>
              {[
                { label: "Son 7 Gün", value: "7" },
                { label: "Son 30 Gün", value: "30" },
                { label: "Son 90 Gün", value: "90" },
              ].map(p => (
                <Button
                  key={p.value}
                  variant={statsPeriod === p.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePeriodChange(p.value)}
                  disabled={statsLoading}
                >
                  {p.label}
                </Button>
              ))}
              <Button onClick={() => fetchBrevoStats()} variant="outline" size="icon" disabled={statsLoading}>
                <RefreshCw className={`w-4 h-4 ${statsLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            {/* Brevo Aggregated Stats */}
            {brevoStats && (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4 text-center">
                    <Mail className="w-5 h-5 mx-auto mb-1 text-blue-600" />
                    <p className="text-2xl font-bold text-slate-900">{brevoStats.requests}</p>
                    <p className="text-xs text-slate-500">Gönderim İsteği</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <CheckCircle className="w-5 h-5 mx-auto mb-1 text-green-600" />
                    <p className="text-2xl font-bold text-green-600">{brevoStats.delivered}</p>
                    <p className="text-xs text-slate-500">Teslim Edildi</p>
                    {brevoStats.requests > 0 && (
                      <p className="text-xs text-green-500 font-medium">
                        %{((brevoStats.delivered / brevoStats.requests) * 100).toFixed(1)}
                      </p>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <Eye className="w-5 h-5 mx-auto mb-1 text-blue-600" />
                    <p className="text-2xl font-bold text-blue-600">{brevoStats.uniqueOpens}</p>
                    <p className="text-xs text-slate-500">Açan Kişi</p>
                    {brevoStats.delivered > 0 && (
                      <p className="text-xs text-blue-500 font-medium">
                        %{((brevoStats.uniqueOpens / brevoStats.delivered) * 100).toFixed(1)}
                      </p>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <MousePointer className="w-5 h-5 mx-auto mb-1 text-purple-600" />
                    <p className="text-2xl font-bold text-purple-600">{brevoStats.uniqueClicks}</p>
                    <p className="text-xs text-slate-500">Tıklayan Kişi</p>
                    {brevoStats.delivered > 0 && (
                      <p className="text-xs text-purple-500 font-medium">
                        %{((brevoStats.uniqueClicks / brevoStats.delivered) * 100).toFixed(1)}
                      </p>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <AlertTriangle className="w-5 h-5 mx-auto mb-1 text-orange-600" />
                    <p className="text-2xl font-bold text-orange-600">{brevoStats.softBounces + brevoStats.hardBounces}</p>
                    <p className="text-xs text-slate-500">Bounce</p>
                    <p className="text-[10px] text-slate-400">Hard: {brevoStats.hardBounces} / Soft: {brevoStats.softBounces}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <Ban className="w-5 h-5 mx-auto mb-1 text-red-600" />
                    <p className="text-2xl font-bold text-red-600">{brevoStats.blocked}</p>
                    <p className="text-xs text-slate-500">Engellendi</p>
                    {brevoStats.requests > 0 && (
                      <p className="text-xs text-red-500 font-medium">
                        %{((brevoStats.blocked / brevoStats.requests) * 100).toFixed(1)}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {statsLoading && !brevoStats && (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-600">Brevo istatistikleri yükleniyor...</p>
              </div>
            )}

            {/* Brevo Events Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Brevo E-posta Olayları ({brevoEvents.length})
                </CardTitle>
                <CardDescription>
                  Brevo API'den alınan gerçek zamanlı e-posta olayları — açılma, tıklanma, bounce vb.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {brevoEvents.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p>Bu dönem için olay bulunamadı.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tarih</TableHead>
                          <TableHead>Alıcı</TableHead>
                          <TableHead>Konu</TableHead>
                          <TableHead>Olay</TableHead>
                          <TableHead>Gönderen</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {brevoEvents.map((event, idx) => (
                          <TableRow key={`${event.messageId}-${idx}`}>
                            <TableCell className="whitespace-nowrap text-sm">
                              {event.date ? format(new Date(event.date), 'dd.MM.yyyy HH:mm', { locale: tr }) : '-'}
                            </TableCell>
                            <TableCell className="text-sm">{event.email}</TableCell>
                            <TableCell className="max-w-[250px] truncate text-sm">{event.subject || '-'}</TableCell>
                            <TableCell>{getEventBadge(event.event)}</TableCell>
                            <TableCell className="text-sm text-slate-500">{event.from || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
