
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, Calendar, CreditCard, BarChart3, Users, PieChart, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Cell } from 'recharts';

const Reports = () => {
  // Empty data for clean presentation
  const monthlyData = [];
  const totalRevenue = 0;
  const totalCustomers = 0;
  const averageMonthlyRevenue = 0;
  const currentMonthRevenue = 0;

  return (
    <>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="googlebot" content="noindex, nofollow" />
        <title>Raporlar - Divan Paneli</title>
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
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Patron Raporu</h1>
                <p className="text-slate-600 mt-1">Detaylı performans analizi ve gelir takibi</p>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-6 py-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-100">Toplam Yıllık Gelir</CardTitle>
                <CreditCard className="h-5 w-5 text-blue-200" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {totalRevenue.toLocaleString('tr-TR')} ₺
                </div>
                <p className="text-xs text-blue-200 mt-1">
                  2024 yılı toplam
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-emerald-100">Aylık Ortalama</CardTitle>
                <TrendingUp className="h-5 w-5 text-emerald-200" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {Math.round(averageMonthlyRevenue).toLocaleString('tr-TR')} ₺
                </div>
                <p className="text-xs text-emerald-200 mt-1">
                  Aylık ortalama gelir
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-purple-100">Bu Ay</CardTitle>
                <Calendar className="h-5 w-5 text-purple-200" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {currentMonthRevenue.toLocaleString('tr-TR')} ₺
                </div>
                <p className="text-xs text-purple-200 mt-1">
                  {new Date().toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-orange-100">Toplam Müşteri</CardTitle>
                <Users className="h-5 w-5 text-orange-200" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{totalCustomers}</div>
                <p className="text-xs text-orange-200 mt-1">
                  Yıllık toplam
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Monthly Revenue Chart */}
            <Card className="shadow-lg border-0 bg-white">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-t-lg">
                <div className="flex items-center gap-3">
                  <BarChart3 className="h-5 w-5 text-slate-600" />
                  <CardTitle className="text-slate-800">Aylık Gelir Grafiği - 2024</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="h-80 flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 text-lg font-medium mb-2">Henüz veri yok</p>
                    <p className="text-slate-400 text-sm">İlk siparişler geldiğinde grafikler burada görünecek</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Overview */}
            <Card className="shadow-lg border-0 bg-white">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-t-lg">
                <div className="flex items-center gap-3">
                  <PieChart className="h-5 w-5 text-slate-600" />
                  <CardTitle className="text-slate-800">Performans Özeti</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="h-80 flex items-center justify-center">
                  <div className="text-center">
                    <PieChart className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 text-lg font-medium mb-2">Analiz Hazırlanıyor</p>
                    <p className="text-slate-400 text-sm">Yeterli veri toplandığında detaylı analizler burada görünecek</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Details Table */}
          <Card className="shadow-lg border-0 bg-white">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-t-lg">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-slate-600" />
                <CardTitle className="text-slate-800">Aylık Detay Raporu</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 text-lg font-medium mb-2">Rapor Verileri Bekleniyor</p>
                <p className="text-slate-400 text-sm mb-6">
                  Siparişler ve ödemeler başladığında detaylı aylık raporlar bu tabloda görüntülenecek
                </p>
                <div className="bg-slate-50 rounded-lg p-6 max-w-md mx-auto">
                  <h3 className="font-semibold text-slate-700 mb-3">Raporda gösterilecek veriler:</h3>
                  <ul className="text-sm text-slate-600 space-y-2 text-left">
                    <li>• Aylık gelir miktarları</li>
                    <li>• Müşteri sayıları</li>
                    <li>• Ortalama müşteri değeri</li>
                    <li>• Büyüme oranları</li>
                    <li>• Performans karşılaştırmaları</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default Reports;
