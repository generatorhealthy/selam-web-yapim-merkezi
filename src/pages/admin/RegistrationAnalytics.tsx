import { useState, useEffect, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HorizontalNavigation } from "@/components/HorizontalNavigation";
import AdminBackButton from "@/components/AdminBackButton";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { useAdminActivityTracker } from "@/hooks/useAdminActivityTracker";
import {
  Users, Clock, MousePointerClick, TrendingUp, Monitor, Smartphone, Tablet,
  ArrowRight, Target, BarChart3, Eye, Filter, RefreshCw, Megaphone,
  ChevronDown, ChevronUp, AlertCircle
} from "lucide-react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { tr } from "date-fns/locale";

interface AnalyticsRow {
  id: string;
  session_id: string;
  visitor_id: string | null;
  referrer: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  landing_url: string | null;
  user_agent: string | null;
  device_type: string | null;
  current_step: number | null;
  max_step_reached: number | null;
  step_timestamps: any;
  click_events: any;
  time_on_page: number | null;
  started_at: string | null;
  last_activity_at: string | null;
  left_at: string | null;
  completed: boolean | null;
  created_at: string | null;
}

const STEP_NAMES: Record<number, string> = {
  1: "Hesap Oluşturma",
  2: "Bilgiler",
  3: "AI Profil Oluşturma",
  4: "Ödeme",
};

const RegistrationAnalytics = () => {
  const { userProfile, loading } = useUserRole();
  useAdminActivityTracker(userProfile);
  const [data, setData] = useState<AnalyticsRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState("7");
  const [expandedSession, setExpandedSession] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    const fromDate = subDays(new Date(), parseInt(dateRange));
    
    const { data: rows, error } = await supabase
      .from('registration_analytics')
      .select('*')
      .gte('created_at', startOfDay(fromDate).toISOString())
      .order('created_at', { ascending: false });

    if (!error && rows) {
      setData(rows as AnalyticsRow[]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (userProfile && ['admin', 'staff'].includes(userProfile.role)) {
      fetchData();
    }
  }, [userProfile, dateRange]);

  const stats = useMemo(() => {
    const total = data.length;
    const completed = data.filter(d => d.completed).length;
    const avgTime = total > 0 ? Math.round(data.reduce((sum, d) => sum + (d.time_on_page || 0), 0) / total) : 0;
    
    const stepDropoff: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
    data.forEach(d => {
      const maxStep = d.max_step_reached || 1;
      if (!d.completed) {
        stepDropoff[maxStep] = (stepDropoff[maxStep] || 0) + 1;
      }
    });

    const devices = { desktop: 0, mobile: 0, tablet: 0 };
    data.forEach(d => {
      const type = (d.device_type || 'desktop') as keyof typeof devices;
      if (devices[type] !== undefined) devices[type]++;
    });

    const sources: Record<string, number> = {};
    data.forEach(d => {
      const source = d.utm_source || d.referrer || 'Direkt';
      sources[source] = (sources[source] || 0) + 1;
    });

    const campaigns: Record<string, { total: number; completed: number }> = {};
    data.forEach(d => {
      const campaign = d.utm_campaign || 'Kampanyasız';
      if (!campaigns[campaign]) campaigns[campaign] = { total: 0, completed: 0 };
      campaigns[campaign].total++;
      if (d.completed) campaigns[campaign].completed++;
    });

    return { total, completed, avgTime, stepDropoff, devices, sources, campaigns };
  }, [data]);

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}sn`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}dk ${secs}sn`;
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-pulse text-lg font-semibold text-slate-600">Yükleniyor...</div>
      </div>
    );
  }

  const conversionRate = stats.total > 0 ? ((stats.completed / stats.total) * 100).toFixed(1) : '0';

  return (
    <>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
        <title>Kayıt Sayfası Analizi - Divan Paneli</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <HorizontalNavigation />
        
        <div className="px-4 sm:px-6 py-8 max-w-7xl mx-auto">
          <AdminBackButton />
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Kayıt Sayfası Analizi
              </h1>
              <p className="text-slate-500 mt-1">/kayit-ol sayfası ziyaretçi davranış analizi</p>
            </div>
            <div className="flex items-center gap-3">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-40">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Son 24 Saat</SelectItem>
                  <SelectItem value="7">Son 7 Gün</SelectItem>
                  <SelectItem value="14">Son 14 Gün</SelectItem>
                  <SelectItem value="30">Son 30 Gün</SelectItem>
                  <SelectItem value="90">Son 90 Gün</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={fetchData}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="border-0 shadow-lg bg-white/90 backdrop-blur">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Toplam Ziyaretçi</p>
                    <p className="text-3xl font-bold text-slate-800">{stats.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/90 backdrop-blur">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Dönüşüm Oranı</p>
                    <p className="text-3xl font-bold text-slate-800">%{conversionRate}</p>
                    <p className="text-xs text-emerald-600">{stats.completed} tamamlanan</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/90 backdrop-blur">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Ort. Sayfa Süresi</p>
                    <p className="text-3xl font-bold text-slate-800">{formatDuration(stats.avgTime)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/90 backdrop-blur">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-rose-500 to-red-600">
                    <AlertCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Ayrılan Ziyaretçi</p>
                    <p className="text-3xl font-bold text-slate-800">{stats.total - stats.completed}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Funnel & Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Step Funnel */}
            <Card className="border-0 shadow-lg bg-white/90 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-indigo-600" />
                  Adım Bazlı Dönüşüm Hunisi
                </CardTitle>
                <CardDescription>Hangi adımda kaç kişi ayrılıyor</CardDescription>
              </CardHeader>
              <CardContent>
                {[1, 2, 3, 4].map(step => {
                  const reachedThisStep = data.filter(d => (d.max_step_reached || 1) >= step).length;
                  const percentage = stats.total > 0 ? ((reachedThisStep / stats.total) * 100).toFixed(0) : '0';
                  const droppedHere = stats.stepDropoff[step] || 0;
                  
                  return (
                    <div key={step} className="mb-4">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <Badge variant={step === 4 ? "default" : "secondary"} className="text-xs">
                            Adım {step}
                          </Badge>
                          <span className="text-sm font-medium text-slate-700">{STEP_NAMES[step]}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-slate-800">{reachedThisStep} kişi</span>
                          {droppedHere > 0 && (
                            <span className="text-xs text-red-500 font-medium">-{droppedHere} ayrıldı</span>
                          )}
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full transition-all duration-500 ${
                            step === 4 ? 'bg-gradient-to-r from-emerald-500 to-green-500' :
                            step === 3 ? 'bg-gradient-to-r from-amber-500 to-orange-500' :
                            step === 2 ? 'bg-gradient-to-r from-blue-500 to-indigo-500' :
                            'bg-gradient-to-r from-indigo-500 to-purple-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <p className="text-xs text-slate-400 mt-1">%{percentage}</p>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Device & Source */}
            <div className="space-y-6">
              {/* Devices */}
              <Card className="border-0 shadow-lg bg-white/90 backdrop-blur">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Monitor className="w-5 h-5 text-indigo-600" />
                    Cihaz Dağılımı
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    {[
                      { label: 'Masaüstü', count: stats.devices.desktop, icon: Monitor, color: 'from-blue-500 to-indigo-500' },
                      { label: 'Mobil', count: stats.devices.mobile, icon: Smartphone, color: 'from-emerald-500 to-green-500' },
                      { label: 'Tablet', count: stats.devices.tablet, icon: Tablet, color: 'from-amber-500 to-orange-500' },
                    ].map(device => (
                      <div key={device.label} className="flex-1 text-center p-3 rounded-xl bg-slate-50">
                        <device.icon className="w-5 h-5 mx-auto mb-1 text-slate-600" />
                        <p className="text-2xl font-bold text-slate-800">{device.count}</p>
                        <p className="text-xs text-slate-500">{device.label}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Campaign Performance */}
              <Card className="border-0 shadow-lg bg-white/90 backdrop-blur">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Megaphone className="w-5 h-5 text-indigo-600" />
                    Kampanya Performansı
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-48 overflow-y-auto">
                    {Object.entries(stats.campaigns)
                      .sort(([, a], [, b]) => b.total - a.total)
                      .map(([name, data]) => (
                        <div key={name} className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                          <div>
                            <p className="text-sm font-medium text-slate-700 truncate max-w-[200px]">{name}</p>
                            <p className="text-xs text-slate-500">{data.total} ziyaret</p>
                          </div>
                          <Badge variant={data.completed > 0 ? "default" : "secondary"}>
                            {data.completed} dönüşüm
                          </Badge>
                        </div>
                      ))}
                    {Object.keys(stats.campaigns).length === 0 && (
                      <p className="text-sm text-slate-400 text-center py-4">Henüz kampanya verisi yok</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Traffic Sources */}
          <Card className="border-0 shadow-lg bg-white/90 backdrop-blur mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
                Trafik Kaynakları
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {Object.entries(stats.sources)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 10)
                  .map(([source, count]) => (
                    <div key={source} className="p-3 rounded-xl bg-slate-50 text-center">
                      <p className="text-xl font-bold text-slate-800">{count}</p>
                      <p className="text-xs text-slate-500 truncate" title={source}>
                        {source.length > 25 ? source.slice(0, 25) + '...' : source}
                      </p>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Session Details Table */}
          <Card className="border-0 shadow-lg bg-white/90 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-indigo-600" />
                Ziyaretçi Detayları
              </CardTitle>
              <CardDescription>Son {dateRange} güne ait tüm ziyaretçi oturumları</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-2 text-slate-600 font-medium">Tarih</th>
                      <th className="text-left py-3 px-2 text-slate-600 font-medium">Kaynak</th>
                      <th className="text-left py-3 px-2 text-slate-600 font-medium">Kampanya</th>
                      <th className="text-left py-3 px-2 text-slate-600 font-medium">Cihaz</th>
                      <th className="text-left py-3 px-2 text-slate-600 font-medium">Son Adım</th>
                      <th className="text-left py-3 px-2 text-slate-600 font-medium">Süre</th>
                      <th className="text-left py-3 px-2 text-slate-600 font-medium">Durum</th>
                      <th className="text-left py-3 px-2 text-slate-600 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.slice(0, 100).map(row => (
                      <>
                        <tr 
                          key={row.id} 
                          className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                          onClick={() => setExpandedSession(expandedSession === row.id ? null : row.id)}
                        >
                          <td className="py-3 px-2 text-slate-700">
                            {row.created_at ? format(new Date(row.created_at), 'dd MMM HH:mm', { locale: tr }) : '-'}
                          </td>
                          <td className="py-3 px-2">
                            <span className="text-slate-700">{row.utm_source || 'Direkt'}</span>
                          </td>
                          <td className="py-3 px-2">
                            <span className="text-slate-500 text-xs">{row.utm_campaign || '-'}</span>
                          </td>
                          <td className="py-3 px-2">
                            <Badge variant="outline" className="text-xs capitalize">
                              {row.device_type || 'desktop'}
                            </Badge>
                          </td>
                          <td className="py-3 px-2">
                            <Badge variant="secondary" className="text-xs">
                              Adım {row.max_step_reached || 1} - {STEP_NAMES[row.max_step_reached || 1]}
                            </Badge>
                          </td>
                          <td className="py-3 px-2 text-slate-700">
                            {formatDuration(row.time_on_page || 0)}
                          </td>
                          <td className="py-3 px-2">
                            {row.completed ? (
                              <Badge className="bg-emerald-100 text-emerald-700 text-xs">Tamamladı</Badge>
                            ) : (
                              <Badge className="bg-red-100 text-red-700 text-xs">Ayrıldı</Badge>
                            )}
                          </td>
                          <td className="py-3 px-2">
                            {expandedSession === row.id ? (
                              <ChevronUp className="w-4 h-4 text-slate-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-slate-400" />
                            )}
                          </td>
                        </tr>
                        {expandedSession === row.id && (
                          <tr key={`${row.id}-detail`}>
                            <td colSpan={8} className="p-4 bg-slate-50">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className="font-medium text-slate-600 mb-2">Oturum Bilgileri</p>
                                  <div className="space-y-1 text-slate-500">
                                    <p><strong>Referrer:</strong> {row.referrer || 'Direkt giriş'}</p>
                                    <p><strong>UTM Source:</strong> {row.utm_source || '-'}</p>
                                    <p><strong>UTM Medium:</strong> {row.utm_medium || '-'}</p>
                                    <p><strong>UTM Campaign:</strong> {row.utm_campaign || '-'}</p>
                                    <p><strong>UTM Content:</strong> {row.utm_content || '-'}</p>
                                    <p><strong>UTM Term:</strong> {row.utm_term || '-'}</p>
                                    <p><strong>Giriş URL:</strong> {row.landing_url || '-'}</p>
                                  </div>
                                </div>
                                <div>
                                  <p className="font-medium text-slate-600 mb-2">Adım Geçişleri</p>
                                  <div className="space-y-1 text-slate-500">
                                    {row.step_timestamps && typeof row.step_timestamps === 'object' &&
                                      Object.entries(row.step_timestamps).map(([step, time]) => (
                                        <p key={step}>
                                          <strong>Adım {step} ({STEP_NAMES[parseInt(step)] || '?'}):</strong>{' '}
                                          {format(new Date(time as string), 'HH:mm:ss', { locale: tr })}
                                        </p>
                                      ))
                                    }
                                  </div>
                                  <p className="font-medium text-slate-600 mt-3 mb-2">Tıklama Sayısı</p>
                                  <p className="text-slate-500">
                                    {Array.isArray(row.click_events) ? row.click_events.length : 0} tıklama
                                  </p>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
                {data.length === 0 && (
                  <div className="text-center py-12 text-slate-400">
                    <Eye className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Henüz kayıt sayfası ziyareti yok</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Footer />
      </div>
    </>
  );
};

export default RegistrationAnalytics;
