import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Mail, Search, RefreshCw, CheckCircle, XCircle, Clock, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import AdminBackButton from "@/components/AdminBackButton";
import { AdminTopBar } from "@/components/AdminTopBar";
import { useUserRole } from "@/hooks/useUserRole";
import { useAdminActivityTracker } from "@/hooks/useAdminActivityTracker";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

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

export default function EmailLogs() {
  const { userProfile } = useUserRole();
  useAdminActivityTracker(userProfile);
  const [emails, setEmails] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [templateFilter, setTemplateFilter] = useState("all");
  const [templates, setTemplates] = useState<string[]>([]);

  useEffect(() => {
    fetchEmails();
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
        <div className="mb-8">
          <AdminBackButton />
          <h1 className="text-4xl font-bold text-slate-900 mb-2">E-posta Logları</h1>
          <p className="text-slate-600">Brevo üzerinden gönderilen tüm e-postaların kaydı</p>
        </div>

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
                <p className="text-sm mt-2">E-postalar gönderildikçe burada görünecektir.</p>
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
      </div>
    </div>
  );
}
