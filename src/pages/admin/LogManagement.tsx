import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Activity, Globe, ShoppingCart, Database, Clock, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import AdminBackButton from "@/components/AdminBackButton";
import { AdminTopBar } from "@/components/AdminTopBar";
import { useUserRole } from "@/hooks/useUserRole";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface WebsiteAnalytics {
  id: string;
  page_url: string;
  ip_address: string;
  user_agent: string;
  referrer: string;
  session_id: string;
  created_at: string;
  last_active: string;
}

interface PostgresLog {
  id: string;
  event_message: string;
  error_severity: string;
  timestamp: number;
  identifier: string;
}

interface OrderLog {
  id: string;
  customer_name: string;
  customer_email: string;
  package_name: string;
  amount: number;
  status: string;
  contract_ip_address: string;
  created_at: string;
}

export default function LogManagement() {
  const { userProfile } = useUserRole();
  const [websiteAnalytics, setWebsiteAnalytics] = useState<WebsiteAnalytics[]>([]);
  const [postgresLogs, setPostgresLogs] = useState<PostgresLog[]>([]);
  const [orderLogs, setOrderLogs] = useState<OrderLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);

      // Fetch website analytics (visitor logs)
      const { data: analyticsData, error: analyticsError } = await supabase
        .from('website_analytics')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (analyticsError) {
        console.error('Analytics fetch error:', analyticsError);
      } else {
        setWebsiteAnalytics(analyticsData || []);
      }

      // Fetch postgres logs (system errors) - using direct query for demo
      // In a real implementation, you would fetch from a proper logging system
      const postgresData = [
        {
          id: '1',
          event_message: 'Website analytics insert attempt failed',
          error_severity: 'ERROR',
          timestamp: Date.now() * 1000,
          identifier: 'demo_log'
        },
        {
          id: '2', 
          event_message: 'Authentication token expired',
          error_severity: 'WARNING',
          timestamp: (Date.now() - 300000) * 1000,
          identifier: 'demo_log'
        }
      ];
      setPostgresLogs(postgresData);

      // Fetch order logs
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('id, customer_name, customer_email, package_name, amount, status, contract_ip_address, created_at')
        .order('created_at', { ascending: false })
        .limit(50);

      if (ordersError) {
        console.error('Orders fetch error:', ordersError);
      } else {
        setOrderLogs(ordersData || []);
      }

    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'secondary';
      case 'approved': return 'default';
      case 'completed': return 'default';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const getSeverityBadgeVariant = (severity: string) => {
    switch (severity) {
      case 'ERROR': return 'destructive';
      case 'WARNING': return 'secondary';
      default: return 'outline';
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
              <p className="text-slate-600">Log kayıtları yükleniyor...</p>
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
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Log Kayıtları</h1>
          <p className="text-slate-600">Site hataları, müşteri hareketleri ve sistem logları</p>
        </div>

        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Müşteri Hareketleri
            </TabsTrigger>
            <TabsTrigger value="errors" className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Sistem Hataları
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              Sipariş Logları
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Website Ziyaret Logları
                </CardTitle>
                <CardDescription>
                  Müşteri IP adresleri, ziyaret edilen sayfalar ve oturum bilgileri
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {websiteAnalytics.map((log) => (
                    <div key={log.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-blue-600" />
                          <span className="font-medium">{log.page_url}</span>
                        </div>
                        <Badge variant="outline">
                          <Clock className="w-3 h-3 mr-1" />
                          {format(new Date(log.created_at), 'dd.MM.yyyy HH:mm', { locale: tr })}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-slate-600">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span>IP: {log.ip_address || 'Bilinmiyor'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Database className="w-3 h-3" />
                          <span>Oturum: {log.session_id.substring(0, 8)}...</span>
                        </div>
                      </div>
                      {log.referrer && (
                        <div className="text-sm text-slate-500">
                          Referans: {log.referrer}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="errors" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Sistem Hata Logları
                </CardTitle>
                <CardDescription>
                  Veritabanı hataları ve sistem uyarıları
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {postgresLogs.map((log) => (
                    <div key={log.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant={getSeverityBadgeVariant(log.error_severity)}>
                          {log.error_severity}
                        </Badge>
                        <Badge variant="outline">
                          <Clock className="w-3 h-3 mr-1" />
                          {format(new Date(log.timestamp / 1000), 'dd.MM.yyyy HH:mm', { locale: tr })}
                        </Badge>
                      </div>
                      <div className="text-sm text-slate-700">
                        {log.event_message}
                      </div>
                      <div className="text-xs text-slate-500">
                        DB: {log.identifier}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Sipariş İşlem Logları
                </CardTitle>
                <CardDescription>
                  Yeni siparişler ve müşteri IP takibi
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orderLogs.map((log) => (
                    <div key={log.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ShoppingCart className="w-4 h-4 text-green-600" />
                          <span className="font-medium">{log.customer_name}</span>
                        </div>
                        <Badge variant={getStatusBadgeVariant(log.status)}>
                          {log.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-slate-600">
                        <div>Email: {log.customer_email}</div>
                        <div>Paket: {log.package_name}</div>
                        <div>Tutar: {log.amount} ₺</div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          IP: {log.contract_ip_address || 'Bilinmiyor'}
                        </div>
                      </div>
                      <div className="text-xs text-slate-500">
                        {format(new Date(log.created_at), 'dd.MM.yyyy HH:mm:ss', { locale: tr })}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}