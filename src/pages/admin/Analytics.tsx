import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Users, Eye, Globe, TrendingUp, Clock, MousePointer, Smartphone, Monitor, MapPin, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const Analytics = () => {
  const [realTimeUsers, setRealTimeUsers] = useState(0);
  const [todayVisitors, setTodayVisitors] = useState(0);
  const pageViews = 423;
  const bounceRate = 42.5;
  const avgSessionDuration = "2m 34s";
  
  // Traffic sources data
  const trafficSources = [
    { name: "Organik Arama", value: 45, color: "#3B82F6" },
    { name: "Direkt", value: 28, color: "#10B981" },
    { name: "Sosyal Medya", value: 15, color: "#F59E0B" },
    { name: "Referans", value: 12, color: "#8B5CF6" }
  ];

  // Hourly visitors data for today
  const hourlyData = [
    { hour: "00", visitors: 5 },
    { hour: "01", visitors: 3 },
    { hour: "02", visitors: 2 },
    { hour: "03", visitors: 1 },
    { hour: "04", visitors: 2 },
    { hour: "05", visitors: 4 },
    { hour: "06", visitors: 8 },
    { hour: "07", visitors: 12 },
    { hour: "08", visitors: 18 },
    { hour: "09", visitors: 24 },
    { hour: "10", visitors: 32 },
    { hour: "11", visitors: 28 },
    { hour: "12", visitors: 35 },
    { hour: "13", visitors: 30 },
    { hour: "14", visitors: 26 },
    { hour: "15", visitors: 29 },
    { hour: "16", visitors: 33 },
    { hour: "17", visitors: 25 },
    { hour: "18", visitors: 22 },
    { hour: "19", visitors: 18 },
    { hour: "20", visitors: 15 },
    { hour: "21", visitors: 12 },
    { hour: "22", visitors: 8 },
    { hour: "23", visitors: 6 }
  ];

  // Popular pages data
  const popularPages = [
    { page: "/", views: 89, title: "Ana Sayfa" },
    { page: "/uzmanlar", views: 67, title: "Uzmanlar" },
    { page: "/paketler", views: 45, title: "Paketler" },
    { page: "/hakkimizda", views: 38, title: "Hakkımızda" },
    { page: "/iletisim", views: 32, title: "İletişim" },
    { page: "/blog", views: 28, title: "Blog" }
  ];

  // Device data
  const deviceData = [
    { name: "Mobil", value: 65, color: "#3B82F6" },
    { name: "Masaüstü", value: 28, color: "#10B981" },
    { name: "Tablet", value: 7, color: "#F59E0B" }
  ];

  // Geographic data
  const geographicData = [
    { city: "İstanbul", visitors: 45, percentage: 28.8 },
    { city: "Ankara", visitors: 23, percentage: 14.7 },
    { city: "İzmir", visitors: 19, percentage: 12.2 },
    { city: "Bursa", visitors: 12, percentage: 7.7 },
    { city: "Antalya", visitors: 10, percentage: 6.4 },
    { city: "Adana", visitors: 8, percentage: 5.1 },
    { city: "Diğer", visitors: 39, percentage: 25.1 }
  ];

  // Fetch real-time and daily analytics data
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        // Get current active sessions (last 30 minutes)
        const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
        const { data: activeSessions } = await supabase
          .from('website_analytics')
          .select('session_id')
          .gte('last_active', thirtyMinutesAgo);

        setRealTimeUsers(activeSessions?.length || 0);

        // Get today's unique visitors
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const { data: todaySessions } = await supabase
          .from('website_analytics')
          .select('session_id')
          .gte('created_at', today.toISOString());

        setTodayVisitors(todaySessions?.length || 0);
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      }
    };

    fetchAnalytics();

    // Set up real-time subscription for live updates
    const channel = supabase
      .channel('analytics-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'website_analytics'
        },
        () => {
          fetchAnalytics(); // Refresh data when changes occur
        }
      )
      .subscribe();

    // Refresh data every 30 seconds
    const interval = setInterval(fetchAnalytics, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium">{`Saat: ${label}:00`}</p>
          <p className="text-sm text-blue-600">
            {`Ziyaretçi: ${payload[0].value}`}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="googlebot" content="noindex, nofollow" />
        <title>Site Analitikleri - Divan Paneli</title>
      </Helmet>
      
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        {/* Header */}
        <div className="bg-white shadow-lg border-b border-slate-200">
          <div className="container mx-auto px-6 py-6">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" asChild className="hover:bg-slate-50">
                <Link to="/divan_paneli/dashboard">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Geri
                </Link>
              </Button>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                  <Globe className="w-8 h-8 text-blue-600" />
                  Site Analitikleri
                </h1>
                <p className="text-slate-600 mt-1">doktorumol.com.tr - Anlık trafik ve ziyaretçi analitiği</p>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200 px-3 py-1">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                Canlı
              </Badge>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-6 py-8 space-y-8">
          {/* Real-time Overview */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-100">Anlık Ziyaretçi</CardTitle>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <Users className="h-4 w-4 text-blue-200" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{realTimeUsers}</div>
                <p className="text-xs text-blue-200">Şu anda sitede</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-0 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-emerald-100">Bugün</CardTitle>
                <Eye className="h-4 w-4 text-emerald-200" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{todayVisitors}</div>
                <p className="text-xs text-emerald-200">Toplam ziyaretçi</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-purple-100">Sayfa Görüntüleme</CardTitle>
                <MousePointer className="h-4 w-4 text-purple-200" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{pageViews}</div>
                <p className="text-xs text-purple-200">Bugün toplam</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-orange-100">Çıkış Oranı</CardTitle>
                <TrendingUp className="h-4 w-4 text-orange-200" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">%{bounceRate}</div>
                <p className="text-xs text-orange-200">Ortalama oran</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white border-0 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-cyan-100">Oturum Süresi</CardTitle>
                <Clock className="h-4 w-4 text-cyan-200" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{avgSessionDuration}</div>
                <p className="text-xs text-cyan-200">Ortalama süre</p>
              </CardContent>
            </Card>
          </div>

          {/* Hourly Traffic Chart */}
          <Card className="shadow-lg border-0 bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-slate-800">
                <BarChart className="h-5 w-5 text-blue-600" />
                Saatlik Ziyaretçi Trafiği (Bugün)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={hourlyData}>
                    <defs>
                      <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="hour" stroke="#64748B" />
                    <YAxis stroke="#64748B" />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="visitors"
                      stroke="#3B82F6"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorVisitors)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Analytics Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Traffic Sources */}
            <Card className="shadow-lg border-0 bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-slate-800">
                  <ExternalLink className="h-5 w-5 text-green-600" />
                  Trafik Kaynakları
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={trafficSources}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, value }) => `${name}: %${value}`}
                      >
                        {trafficSources.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Device Distribution */}
            <Card className="shadow-lg border-0 bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-slate-800">
                  <Monitor className="h-5 w-5 text-purple-600" />
                  Cihaz Dağılımı
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {deviceData.map((device, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {device.name === "Mobil" && <Smartphone className="w-4 h-4 text-blue-600" />}
                        {device.name === "Masaüstü" && <Monitor className="w-4 h-4 text-green-600" />}
                        {device.name === "Tablet" && <Monitor className="w-4 h-4 text-orange-600" />}
                        <span className="text-sm font-medium">{device.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-500"
                            style={{ 
                              width: `${device.value}%`, 
                              backgroundColor: device.color 
                            }}
                          />
                        </div>
                        <span className="text-sm font-bold w-8">%{device.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Geographic Distribution */}
            <Card className="shadow-lg border-0 bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-slate-800">
                  <MapPin className="h-5 w-5 text-red-600" />
                  Coğrafi Dağılım
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {geographicData.map((location, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{location.city}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-600">{location.visitors}</span>
                        <span className="text-xs text-slate-400">(%{location.percentage})</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Popular Pages */}
          <Card className="shadow-lg border-0 bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-slate-800">
                <Eye className="h-5 w-5 text-indigo-600" />
                Popüler Sayfalar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {popularPages.map((page, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <span className="bg-indigo-100 text-indigo-600 px-2 py-1 rounded text-sm font-medium">
                        #{index + 1}
                      </span>
                      <div>
                        <p className="font-medium text-slate-800">{page.title}</p>
                        <p className="text-sm text-slate-500">{page.page}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-slate-800">{page.views}</p>
                      <p className="text-xs text-slate-500">görüntülenme</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default Analytics;