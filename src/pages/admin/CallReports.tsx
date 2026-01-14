import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, parseISO, getDaysInMonth, eachDayOfInterval, isSameDay, startOfWeek, endOfWeek, addWeeks, subWeeks, getWeek, getYear } from "date-fns";
import { tr } from "date-fns/locale";
import { ArrowLeft, Phone, Users, UserCheck, Calendar as CalendarIcon, Plus, Save, BarChart3, TrendingUp, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import AdminBackButton from "@/components/AdminBackButton";
import { useUserRole } from "@/hooks/useUserRole";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar } from 'recharts';

interface CallReport {
  id: string;
  report_date: string;
  employee_name: string;
  report_type: string;
  danisan_acmadi: number;
  danisan_vazgecti: number;
  danisan_yanlis: number;
  danisan_yonlendirme: number;
  danisma_acmadi: number;
  danisma_bilgi_verildi: number;
  danisma_kayit: number;
  created_at: string;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088FE', '#00C49F', '#FFBB28'];

const CallReports = () => {
  const navigate = useNavigate();
  const { userProfile } = useUserRole();
  const [reports, setReports] = useState<CallReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedDayFilter, setSelectedDayFilter] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState("danisan");
  const [mainTab, setMainTab] = useState("monthly");
  const [selectedWeekStart, setSelectedWeekStart] = useState<Date>(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [employeeName, setEmployeeName] = useState("");

  // Set employee name from current user profile
  useEffect(() => {
    if (userProfile) {
      if (userProfile.role === 'admin') {
        setEmployeeName('Yönetici');
      } else if (userProfile.name) {
        setEmployeeName(userProfile.name);
      }
    }
  }, [userProfile]);
  const [submitting, setSubmitting] = useState(false);

  // Danışan form state
  const [danisanAcmadi, setDanisanAcmadi] = useState<number>(0);
  const [danisanVazgecti, setDanisanVazgecti] = useState<number>(0);
  const [danisanYanlis, setDanisanYanlis] = useState<number>(0);
  const [danisanYonlendirme, setDanisanYonlendirme] = useState<number>(0);

  // Danışman form state
  const [danismaAcmadi, setDanismaAcmadi] = useState<number>(0);
  const [danismaBilgiVerildi, setDanismaBilgiVerildi] = useState<number>(0);
  const [danismaKayit, setDanismaKayit] = useState<number>(0);

  useEffect(() => {
    fetchReports();
  }, [selectedMonth, selectedYear]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const startDate = startOfMonth(new Date(selectedYear, selectedMonth - 1));
      const endDate = endOfMonth(new Date(selectedYear, selectedMonth - 1));

      const { data, error } = await supabase
        .from('call_reports')
        .select('*')
        .gte('report_date', format(startDate, 'yyyy-MM-dd'))
        .lte('report_date', format(endDate, 'yyyy-MM-dd'))
        .order('report_date', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Raporlar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!employeeName.trim()) {
      toast.error('Lütfen çalışan adını giriniz');
      return;
    }

    setSubmitting(true);
    try {
      const reportData = {
        report_date: format(selectedDate, 'yyyy-MM-dd'),
        employee_name: employeeName.trim(),
        report_type: activeTab,
        danisan_acmadi: activeTab === 'danisan' ? danisanAcmadi : 0,
        danisan_vazgecti: activeTab === 'danisan' ? danisanVazgecti : 0,
        danisan_yanlis: activeTab === 'danisan' ? danisanYanlis : 0,
        danisan_yonlendirme: activeTab === 'danisan' ? danisanYonlendirme : 0,
        danisma_acmadi: activeTab === 'danisma' ? danismaAcmadi : 0,
        danisma_bilgi_verildi: activeTab === 'danisma' ? danismaBilgiVerildi : 0,
        danisma_kayit: activeTab === 'danisma' ? danismaKayit : 0,
      };

      const { error } = await supabase
        .from('call_reports')
        .insert([reportData]);

      if (error) throw error;

      toast.success('Rapor başarıyla kaydedildi');
      resetForm();
      fetchReports();
    } catch (error) {
      console.error('Error saving report:', error);
      toast.error('Rapor kaydedilirken hata oluştu');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu raporu silmek istediğinizden emin misiniz?')) return;

    try {
      const { error } = await supabase
        .from('call_reports')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Rapor silindi');
      fetchReports();
    } catch (error) {
      console.error('Error deleting report:', error);
      toast.error('Rapor silinirken hata oluştu');
    }
  };

  const resetForm = () => {
    setDanisanAcmadi(0);
    setDanisanVazgecti(0);
    setDanisanYanlis(0);
    setDanisanYonlendirme(0);
    setDanismaAcmadi(0);
    setDanismaBilgiVerildi(0);
    setDanismaKayit(0);
  };

  // Analytics calculations
  const getEmployeeStats = () => {
    const stats: { [key: string]: { danisan: number; danisma: number; total: number } } = {};
    
    reports.forEach(report => {
      if (!stats[report.employee_name]) {
        stats[report.employee_name] = { danisan: 0, danisma: 0, total: 0 };
      }
      
      if (report.report_type === 'danisan') {
        const total = report.danisan_acmadi + report.danisan_vazgecti + report.danisan_yanlis + report.danisan_yonlendirme;
        stats[report.employee_name].danisan += total;
        stats[report.employee_name].total += total;
      } else {
        const total = report.danisma_acmadi + report.danisma_bilgi_verildi + report.danisma_kayit;
        stats[report.employee_name].danisma += total;
        stats[report.employee_name].total += total;
      }
    });

    return Object.entries(stats).map(([name, data]) => ({
      name,
      ...data
    }));
  };

  const getDanisanTotals = () => {
    return reports
      .filter(r => r.report_type === 'danisan')
      .reduce((acc, r) => ({
        acmadi: acc.acmadi + r.danisan_acmadi,
        vazgecti: acc.vazgecti + r.danisan_vazgecti,
        yanlis: acc.yanlis + r.danisan_yanlis,
        yonlendirme: acc.yonlendirme + r.danisan_yonlendirme,
      }), { acmadi: 0, vazgecti: 0, yanlis: 0, yonlendirme: 0 });
  };

  const getDanismaTotals = () => {
    return reports
      .filter(r => r.report_type === 'danisma')
      .reduce((acc, r) => ({
        acmadi: acc.acmadi + r.danisma_acmadi,
        bilgiVerildi: acc.bilgiVerildi + r.danisma_bilgi_verildi,
        kayit: acc.kayit + r.danisma_kayit,
      }), { acmadi: 0, bilgiVerildi: 0, kayit: 0 });
  };

  const danisanTotals = getDanisanTotals();
  const danismaTotals = getDanismaTotals();
  const employeeStats = getEmployeeStats();

  const danisanPieData = [
    { name: 'Açmadı', value: danisanTotals.acmadi },
    { name: 'Vazgeçti', value: danisanTotals.vazgecti },
    { name: 'Yanlış', value: danisanTotals.yanlis },
    { name: 'Yönlendirme', value: danisanTotals.yonlendirme },
  ].filter(d => d.value > 0);

  const danismaPieData = [
    { name: 'Açmadı', value: danismaTotals.acmadi },
    { name: 'Bilgi Verildi', value: danismaTotals.bilgiVerildi },
    { name: 'Kayıt', value: danismaTotals.kayit },
  ].filter(d => d.value > 0);

  // Günlük rapor filtreleme
  const filteredReports = selectedDayFilter 
    ? reports.filter(r => isSameDay(parseISO(r.report_date), selectedDayFilter))
    : reports;

  // Ayın günlerini ve her gün için rapor sayısını hesapla
  const getDailyStats = () => {
    const startDate = startOfMonth(new Date(selectedYear, selectedMonth - 1));
    const endDate = endOfMonth(new Date(selectedYear, selectedMonth - 1));
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    
    return days.map(day => {
      const dayReports = reports.filter(r => isSameDay(parseISO(r.report_date), day));
      const danisanTotal = dayReports
        .filter(r => r.report_type === 'danisan')
        .reduce((sum, r) => sum + r.danisan_acmadi + r.danisan_vazgecti + r.danisan_yanlis + r.danisan_yonlendirme, 0);
      const danismaTotal = dayReports
        .filter(r => r.report_type === 'danisma')
        .reduce((sum, r) => sum + r.danisma_acmadi + r.danisma_bilgi_verildi + r.danisma_kayit, 0);
      
      return {
        date: day,
        dayNumber: format(day, 'd'),
        dayName: format(day, 'EEE', { locale: tr }),
        reportCount: dayReports.length,
        danisanTotal,
        danismaTotal,
        total: danisanTotal + danismaTotal
      };
    });
  };

  const dailyStats = getDailyStats();

  // Haftalık istatistikler
  const getWeeklyEmployeeStats = () => {
    const weekEnd = endOfWeek(selectedWeekStart, { weekStartsOn: 1 });
    const weekStartStr = format(selectedWeekStart, 'yyyy-MM-dd');
    const weekEndStr = format(weekEnd, 'yyyy-MM-dd');
    
    const weekReports = reports.filter(r => {
      const reportDate = r.report_date;
      return reportDate >= weekStartStr && reportDate <= weekEndStr;
    });

    const stats: { 
      [key: string]: { 
        danisan_acmadi: number;
        danisan_vazgecti: number;
        danisan_yanlis: number;
        danisan_yonlendirme: number;
        danisma_acmadi: number;
        danisma_bilgi_verildi: number;
        danisma_kayit: number;
        danisan_total: number;
        danisma_total: number;
        total: number;
      } 
    } = {};
    
    weekReports.forEach(report => {
      if (!stats[report.employee_name]) {
        stats[report.employee_name] = { 
          danisan_acmadi: 0,
          danisan_vazgecti: 0,
          danisan_yanlis: 0,
          danisan_yonlendirme: 0,
          danisma_acmadi: 0,
          danisma_bilgi_verildi: 0,
          danisma_kayit: 0,
          danisan_total: 0,
          danisma_total: 0,
          total: 0 
        };
      }
      
      if (report.report_type === 'danisan') {
        stats[report.employee_name].danisan_acmadi += report.danisan_acmadi;
        stats[report.employee_name].danisan_vazgecti += report.danisan_vazgecti;
        stats[report.employee_name].danisan_yanlis += report.danisan_yanlis;
        stats[report.employee_name].danisan_yonlendirme += report.danisan_yonlendirme;
        const total = report.danisan_acmadi + report.danisan_vazgecti + report.danisan_yanlis + report.danisan_yonlendirme;
        stats[report.employee_name].danisan_total += total;
        stats[report.employee_name].total += total;
      } else {
        stats[report.employee_name].danisma_acmadi += report.danisma_acmadi;
        stats[report.employee_name].danisma_bilgi_verildi += report.danisma_bilgi_verildi;
        stats[report.employee_name].danisma_kayit += report.danisma_kayit;
        const total = report.danisma_acmadi + report.danisma_bilgi_verildi + report.danisma_kayit;
        stats[report.employee_name].danisma_total += total;
        stats[report.employee_name].total += total;
      }
    });

    return Object.entries(stats)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.total - a.total);
  };

  const weeklyEmployeeStats = getWeeklyEmployeeStats();
  const weekNumber = getWeek(selectedWeekStart, { weekStartsOn: 1 });
  const weekEndDate = endOfWeek(selectedWeekStart, { weekStartsOn: 1 });

  const months = [
    { value: 1, label: 'Ocak' },
    { value: 2, label: 'Şubat' },
    { value: 3, label: 'Mart' },
    { value: 4, label: 'Nisan' },
    { value: 5, label: 'Mayıs' },
    { value: 6, label: 'Haziran' },
    { value: 7, label: 'Temmuz' },
    { value: 8, label: 'Ağustos' },
    { value: 9, label: 'Eylül' },
    { value: 10, label: 'Ekim' },
    { value: 11, label: 'Kasım' },
    { value: 12, label: 'Aralık' },
  ];

  const years = [2025, 2026, 2027, 2028];

  const isAdmin = userProfile?.role === 'admin';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Helmet>
        <title>Görüşme Raporları | Divan Paneli</title>
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <AdminBackButton />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Phone className="w-8 h-8 text-purple-400" />
            Görüşme Raporları
          </h1>
          <p className="text-gray-400">Günlük arama raporlarını girin ve analiz edin</p>
        </div>

        {/* Main Tabs */}
        <Tabs value={mainTab} onValueChange={setMainTab} className="w-full mb-6">
          <TabsList className="grid w-full max-w-md grid-cols-2 bg-white/10">
            <TabsTrigger value="monthly" className="text-white data-[state=active]:bg-purple-500">
              <CalendarIcon className="w-4 h-4 mr-2" />
              Aylık Görünüm
            </TabsTrigger>
            <TabsTrigger value="weekly" className="text-white data-[state=active]:bg-blue-500">
              <BarChart3 className="w-4 h-4 mr-2" />
              Haftalık İstatistik
            </TabsTrigger>
          </TabsList>

          <TabsContent value="monthly" className="mt-6">
            {/* Filters */}
            <Card className="mb-6 bg-white/10 backdrop-blur-lg border-white/20">
              <CardContent className="pt-6">
                <div className="flex flex-wrap gap-4 items-center">
                  <div className="flex items-center gap-2">
                    <Label className="text-white">Ay:</Label>
                    <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                      <SelectTrigger className="w-32 bg-white/10 border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {months.map(m => (
                          <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-white">Yıl:</Label>
                    <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                      <SelectTrigger className="w-24 bg-white/10 border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {years.map(y => (
                          <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Toplam Danışan Arama</p>
                  <p className="text-3xl font-bold">
                    {danisanTotals.acmadi + danisanTotals.vazgecti + danisanTotals.yanlis + danisanTotals.yonlendirme}
                  </p>
                </div>
                <Users className="w-10 h-10 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Toplam Uzman Arama</p>
                  <p className="text-3xl font-bold">
                    {danismaTotals.acmadi + danismaTotals.bilgiVerildi + danismaTotals.kayit}
                  </p>
                </div>
                <UserCheck className="w-10 h-10 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Danışan Yönlendirme</p>
                  <p className="text-3xl font-bold">{danisanTotals.yonlendirme}</p>
                </div>
                <TrendingUp className="w-10 h-10 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-100 text-sm">Uzman Kayıt</p>
                  <p className="text-3xl font-bold">{danismaTotals.kayit}</p>
                </div>
                <BarChart3 className="w-10 h-10 text-amber-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Entry Form */}
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Yeni Rapor Ekle
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white">Tarih</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal bg-white/10 border-white/20 text-white hover:bg-white/20",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {format(selectedDate, "PPP", { locale: tr })}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={(date) => date && setSelectedDate(date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label className="text-white">Çalışan Adı</Label>
                    <Input
                      value={employeeName}
                      readOnly
                      disabled
                      className="bg-white/10 border-white/20 text-white cursor-not-allowed opacity-80"
                    />
                  </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-white/10">
                    <TabsTrigger value="danisan" className="text-white data-[state=active]:bg-blue-500">
                      Danışan
                    </TabsTrigger>
                    <TabsTrigger value="danisma" className="text-white data-[state=active]:bg-purple-500">
                      Danışman
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="danisan" className="mt-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-white text-sm">Açmadı</Label>
                        <Input
                          type="number"
                          min="0"
                          value={danisanAcmadi}
                          onChange={(e) => setDanisanAcmadi(parseInt(e.target.value) || 0)}
                          className="bg-white/10 border-white/20 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-white text-sm">Vazgeçti</Label>
                        <Input
                          type="number"
                          min="0"
                          value={danisanVazgecti}
                          onChange={(e) => setDanisanVazgecti(parseInt(e.target.value) || 0)}
                          className="bg-white/10 border-white/20 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-white text-sm">Yanlış</Label>
                        <Input
                          type="number"
                          min="0"
                          value={danisanYanlis}
                          onChange={(e) => setDanisanYanlis(parseInt(e.target.value) || 0)}
                          className="bg-white/10 border-white/20 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-white text-sm">Yönlendirme</Label>
                        <Input
                          type="number"
                          min="0"
                          value={danisanYonlendirme}
                          onChange={(e) => setDanisanYonlendirme(parseInt(e.target.value) || 0)}
                          className="bg-white/10 border-white/20 text-white"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="danisma" className="mt-4 space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label className="text-white text-sm">Açmadı</Label>
                        <Input
                          type="number"
                          min="0"
                          value={danismaAcmadi}
                          onChange={(e) => setDanismaAcmadi(parseInt(e.target.value) || 0)}
                          className="bg-white/10 border-white/20 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-white text-sm">Bilgi Verildi</Label>
                        <Input
                          type="number"
                          min="0"
                          value={danismaBilgiVerildi}
                          onChange={(e) => setDanismaBilgiVerildi(parseInt(e.target.value) || 0)}
                          className="bg-white/10 border-white/20 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-white text-sm">Kayıt</Label>
                        <Input
                          type="number"
                          min="0"
                          value={danismaKayit}
                          onChange={(e) => setDanismaKayit(parseInt(e.target.value) || 0)}
                          className="bg-white/10 border-white/20 text-white"
                        />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                <Button 
                  onClick={handleSubmit} 
                  disabled={submitting}
                  className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {submitting ? 'Kaydediliyor...' : 'Raporu Kaydet'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Employee Analytics */}
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Çalışan Performansı
              </CardTitle>
            </CardHeader>
            <CardContent>
              {employeeStats.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={employeeStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="name" stroke="#fff" fontSize={12} />
                    <YAxis stroke="#fff" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(0,0,0,0.8)', 
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="danisan" name="Danışan" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="danisma" name="Danışman" fill="#a855f7" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-gray-400">
                  Bu ay için veri bulunmuyor
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Danışan Dağılımı</CardTitle>
            </CardHeader>
            <CardContent>
              {danisanPieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={danisanPieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {danisanPieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-gray-400">
                  Danışan verisi bulunmuyor
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Danışman Dağılımı</CardTitle>
            </CardHeader>
            <CardContent>
              {danismaPieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={danismaPieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {danismaPieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-gray-400">
                  Danışman verisi bulunmuyor
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Daily View - Günlük Raporlar */}
        <Card className="bg-white/10 backdrop-blur-lg border-white/20 mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              Günlük Görünüm
            </CardTitle>
            <CardDescription className="text-gray-400">
              Bir güne tıklayarak o günün detaylı raporlarını görün
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2 mb-4">
              {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(day => (
                <div key={day} className="text-center text-gray-400 text-sm font-medium py-2">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {/* Ayın ilk gününe kadar boş hücreler */}
              {Array.from({ length: (new Date(selectedYear, selectedMonth - 1, 1).getDay() + 6) % 7 }).map((_, i) => (
                <div key={`empty-${i}`} className="h-16" />
              ))}
              {dailyStats.map((day) => {
                const isSelected = selectedDayFilter && isSameDay(day.date, selectedDayFilter);
                const hasReports = day.reportCount > 0;
                const isToday = isSameDay(day.date, new Date());
                
                return (
                  <button
                    key={day.dayNumber}
                    onClick={() => setSelectedDayFilter(isSelected ? null : day.date)}
                    className={cn(
                      "h-16 rounded-lg border transition-all flex flex-col items-center justify-center gap-1 hover:scale-105",
                      isSelected 
                        ? "bg-purple-500 border-purple-400 text-white" 
                        : hasReports 
                          ? "bg-white/10 border-white/30 text-white hover:bg-white/20" 
                          : "bg-white/5 border-white/10 text-gray-500 hover:bg-white/10",
                      isToday && !isSelected && "ring-2 ring-blue-400"
                    )}
                  >
                    <span className={cn("text-lg font-bold", isToday && "text-blue-400")}>
                      {day.dayNumber}
                    </span>
                    {hasReports && (
                      <div className="flex gap-1">
                        {day.danisanTotal > 0 && (
                          <span className="text-[10px] bg-blue-500/50 px-1 rounded">{day.danisanTotal}</span>
                        )}
                        {day.danismaTotal > 0 && (
                          <span className="text-[10px] bg-purple-500/50 px-1 rounded">{day.danismaTotal}</span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="flex justify-center gap-4 mt-4 text-sm text-gray-400">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 bg-blue-500/50 rounded"></span> Danışan
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 bg-purple-500/50 rounded"></span> Danışman
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Reports Table */}
        <Card className="bg-white/10 backdrop-blur-lg border-white/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white">
                  {selectedDayFilter 
                    ? `${format(selectedDayFilter, 'd MMMM yyyy', { locale: tr })} Raporları`
                    : 'Aylık Raporlar'
                  }
                </CardTitle>
                <CardDescription className="text-gray-400">
                  {selectedDayFilter 
                    ? `${filteredReports.length} rapor bulundu`
                    : `${months.find(m => m.value === selectedMonth)?.label} ${selectedYear} dönemi`
                  }
                </CardDescription>
              </div>
              {selectedDayFilter && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedDayFilter(null)}
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  Tümünü Göster
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                {selectedDayFilter ? 'Bu gün için rapor bulunmuyor' : 'Bu dönem için rapor bulunmuyor'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/20">
                      <TableHead className="text-gray-300">Tarih</TableHead>
                      <TableHead className="text-gray-300">Çalışan</TableHead>
                      <TableHead className="text-gray-300">Tür</TableHead>
                      <TableHead className="text-gray-300">Detaylar</TableHead>
                      {isAdmin && <TableHead className="text-gray-300">İşlem</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReports.map((report) => (
                      <TableRow key={report.id} className="border-white/10 hover:bg-white/5">
                        <TableCell className="text-white">
                          {format(parseISO(report.report_date), 'dd MMM yyyy', { locale: tr })}
                        </TableCell>
                        <TableCell className="text-white font-medium">
                          {report.employee_name}
                        </TableCell>
                        <TableCell>
                          <Badge className={report.report_type === 'danisan' ? 'bg-blue-500' : 'bg-purple-500'}>
                            {report.report_type === 'danisan' ? 'Danışan' : 'Danışman'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-300 text-sm">
                          {report.report_type === 'danisan' ? (
                            <>
                              Açmadı: {report.danisan_acmadi}, Vazgeçti: {report.danisan_vazgecti}, 
                              Yanlış: {report.danisan_yanlis}, Yönlendirme: {report.danisan_yonlendirme}
                            </>
                          ) : (
                            <>
                              Açmadı: {report.danisma_acmadi}, Bilgi: {report.danisma_bilgi_verildi}, 
                              Kayıt: {report.danisma_kayit}
                            </>
                          )}
                        </TableCell>
                        {isAdmin && (
                          <TableCell>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(report.id)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
          </TabsContent>

          <TabsContent value="weekly" className="mt-6">
            {/* Week Navigation */}
            <Card className="mb-6 bg-white/10 backdrop-blur-lg border-white/20">
              <CardContent className="pt-6">
                <div className="flex flex-wrap gap-4 items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedWeekStart(subWeeks(selectedWeekStart, 1))}
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div className="text-white text-center">
                      <p className="text-lg font-semibold">
                        {weekNumber}. Hafta - {getYear(selectedWeekStart)}
                      </p>
                      <p className="text-sm text-gray-400">
                        {format(selectedWeekStart, 'd MMMM', { locale: tr })} - {format(weekEndDate, 'd MMMM yyyy', { locale: tr })}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedWeekStart(addWeeks(selectedWeekStart, 1))}
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                    >
                      <ArrowLeft className="w-4 h-4 rotate-180" />
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    Bu Hafta
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Weekly Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm">Haftalık Danışan</p>
                      <p className="text-3xl font-bold">
                        {weeklyEmployeeStats.reduce((sum, s) => sum + s.danisan_total, 0)}
                      </p>
                    </div>
                    <Users className="w-10 h-10 text-blue-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm">Haftalık Danışman</p>
                      <p className="text-3xl font-bold">
                        {weeklyEmployeeStats.reduce((sum, s) => sum + s.danisma_total, 0)}
                      </p>
                    </div>
                    <UserCheck className="w-10 h-10 text-purple-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm">Toplam Görüşme</p>
                      <p className="text-3xl font-bold">
                        {weeklyEmployeeStats.reduce((sum, s) => sum + s.total, 0)}
                      </p>
                    </div>
                    <TrendingUp className="w-10 h-10 text-green-200" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Weekly Employee Table */}
            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Haftalık Personel İstatistikleri
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Her personelin haftalık performans detayları
                </CardDescription>
              </CardHeader>
              <CardContent>
                {weeklyEmployeeStats.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    Bu hafta için rapor bulunmuyor
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-white/20">
                          <TableHead className="text-gray-300">Çalışan</TableHead>
                          <TableHead className="text-gray-300 text-center" colSpan={4}>
                            <Badge className="bg-blue-500">Danışan</Badge>
                          </TableHead>
                          <TableHead className="text-gray-300 text-center" colSpan={3}>
                            <Badge className="bg-purple-500">Danışman</Badge>
                          </TableHead>
                          <TableHead className="text-gray-300 text-right">Toplam</TableHead>
                        </TableRow>
                        <TableRow className="border-white/20">
                          <TableHead className="text-gray-400 text-sm"></TableHead>
                          <TableHead className="text-gray-400 text-sm text-center">Açmadı</TableHead>
                          <TableHead className="text-gray-400 text-sm text-center">Vazgeçti</TableHead>
                          <TableHead className="text-gray-400 text-sm text-center">Yanlış</TableHead>
                          <TableHead className="text-gray-400 text-sm text-center">Yönlendirme</TableHead>
                          <TableHead className="text-gray-400 text-sm text-center">Açmadı</TableHead>
                          <TableHead className="text-gray-400 text-sm text-center">Bilgi</TableHead>
                          <TableHead className="text-gray-400 text-sm text-center">Kayıt</TableHead>
                          <TableHead className="text-gray-400 text-sm text-right"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {weeklyEmployeeStats.map((stat, index) => (
                          <TableRow key={stat.name} className="border-white/10 hover:bg-white/5">
                            <TableCell className="text-white font-medium">
                              <div className="flex items-center gap-2">
                                {index === 0 && <span className="text-yellow-400">🥇</span>}
                                {index === 1 && <span className="text-gray-300">🥈</span>}
                                {index === 2 && <span className="text-amber-600">🥉</span>}
                                {stat.name}
                              </div>
                            </TableCell>
                            <TableCell className="text-center text-blue-300">{stat.danisan_acmadi || '-'}</TableCell>
                            <TableCell className="text-center text-blue-300">{stat.danisan_vazgecti || '-'}</TableCell>
                            <TableCell className="text-center text-blue-300">{stat.danisan_yanlis || '-'}</TableCell>
                            <TableCell className="text-center text-blue-300 font-semibold">{stat.danisan_yonlendirme || '-'}</TableCell>
                            <TableCell className="text-center text-purple-300">{stat.danisma_acmadi || '-'}</TableCell>
                            <TableCell className="text-center text-purple-300">{stat.danisma_bilgi_verildi || '-'}</TableCell>
                            <TableCell className="text-center text-purple-300 font-semibold">{stat.danisma_kayit || '-'}</TableCell>
                            <TableCell className="text-right">
                              <span className="text-white font-bold text-lg">{stat.total}</span>
                            </TableCell>
                          </TableRow>
                        ))}
                        {/* Totals Row */}
                        <TableRow className="border-white/20 bg-white/5">
                          <TableCell className="text-white font-bold">TOPLAM</TableCell>
                          <TableCell className="text-center text-blue-300 font-bold">
                            {weeklyEmployeeStats.reduce((sum, s) => sum + s.danisan_acmadi, 0)}
                          </TableCell>
                          <TableCell className="text-center text-blue-300 font-bold">
                            {weeklyEmployeeStats.reduce((sum, s) => sum + s.danisan_vazgecti, 0)}
                          </TableCell>
                          <TableCell className="text-center text-blue-300 font-bold">
                            {weeklyEmployeeStats.reduce((sum, s) => sum + s.danisan_yanlis, 0)}
                          </TableCell>
                          <TableCell className="text-center text-blue-300 font-bold">
                            {weeklyEmployeeStats.reduce((sum, s) => sum + s.danisan_yonlendirme, 0)}
                          </TableCell>
                          <TableCell className="text-center text-purple-300 font-bold">
                            {weeklyEmployeeStats.reduce((sum, s) => sum + s.danisma_acmadi, 0)}
                          </TableCell>
                          <TableCell className="text-center text-purple-300 font-bold">
                            {weeklyEmployeeStats.reduce((sum, s) => sum + s.danisma_bilgi_verildi, 0)}
                          </TableCell>
                          <TableCell className="text-center text-purple-300 font-bold">
                            {weeklyEmployeeStats.reduce((sum, s) => sum + s.danisma_kayit, 0)}
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="text-green-400 font-bold text-xl">
                              {weeklyEmployeeStats.reduce((sum, s) => sum + s.total, 0)}
                            </span>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Weekly Bar Chart */}
            {weeklyEmployeeStats.length > 0 && (
              <Card className="mt-6 bg-white/10 backdrop-blur-lg border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Haftalık Performans Grafiği</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={weeklyEmployeeStats}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="name" stroke="#fff" fontSize={12} />
                      <YAxis stroke="#fff" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(0,0,0,0.8)', 
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Bar dataKey="danisan_yonlendirme" name="Yönlendirme" fill="#22c55e" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="danisma_kayit" name="Kayıt" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="danisan_total" name="Danışan Toplam" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="danisma_total" name="Danışman Toplam" fill="#a855f7" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CallReports;
