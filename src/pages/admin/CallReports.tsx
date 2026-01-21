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
import { format, startOfMonth, endOfMonth, parseISO, getDaysInMonth, eachDayOfInterval, isSameDay, startOfWeek, endOfWeek, addWeeks, subWeeks, getWeek, getYear, addDays, subDays } from "date-fns";
import { tr } from "date-fns/locale";
import { ArrowLeft, ArrowRight, Phone, Users, UserCheck, Calendar as CalendarIcon, Plus, Save, BarChart3, TrendingUp, Trash2, Activity, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import AdminBackButton from "@/components/AdminBackButton";
import { useUserRole } from "@/hooks/useUserRole";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar, LineChart, Line, ComposedChart } from 'recharts';

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
  danisma_eski_bilgilendirme: number;
  created_at: string;
}

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f97316', '#22c55e', '#06b6d4', '#eab308'];
const GRADIENT_COLORS = {
  blue: ['#3b82f6', '#1d4ed8'],
  purple: ['#a855f7', '#7c3aed'],
  green: ['#22c55e', '#15803d'],
  amber: ['#f59e0b', '#d97706'],
  rose: ['#f43f5e', '#e11d48'],
  cyan: ['#06b6d4', '#0891b2'],
};

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
  const [selectedDailyDate, setSelectedDailyDate] = useState<Date>(new Date());
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
  const [danismaEskiBilgilendirme, setDanismaEskiBilgilendirme] = useState<number>(0);

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
        danisma_eski_bilgilendirme: activeTab === 'danisma' ? danismaEskiBilgilendirme : 0,
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
    setDanismaEskiBilgilendirme(0);
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
        const total = report.danisma_acmadi + report.danisma_bilgi_verildi + report.danisma_kayit + (report.danisma_eski_bilgilendirme || 0);
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
        eskiBilgilendirme: acc.eskiBilgilendirme + (r.danisma_eski_bilgilendirme || 0),
      }), { acmadi: 0, bilgiVerildi: 0, kayit: 0, eskiBilgilendirme: 0 });
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
    { name: 'Eski Bilgilendirme', value: danismaTotals.eskiBilgilendirme },
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
        .reduce((sum, r) => sum + r.danisma_acmadi + r.danisma_bilgi_verildi + r.danisma_kayit + (r.danisma_eski_bilgilendirme || 0), 0);
      
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
        danisma_eski_bilgilendirme: number;
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
          danisma_eski_bilgilendirme: 0,
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
        stats[report.employee_name].danisma_eski_bilgilendirme += (report.danisma_eski_bilgilendirme || 0);
        const total = report.danisma_acmadi + report.danisma_bilgi_verildi + report.danisma_kayit + (report.danisma_eski_bilgilendirme || 0);
        stats[report.employee_name].danisma_total += total;
        stats[report.employee_name].total += total;
      }
    });

    return Object.entries(stats)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.total - a.total);
  };

  // Günlük İstatistik için fonksiyonlar
  const getDailyEmployeeStats = () => {
    const dateStr = format(selectedDailyDate, 'yyyy-MM-dd');
    const dayReports = reports.filter(r => r.report_date === dateStr);

    const stats: { 
      [key: string]: { 
        danisan_acmadi: number;
        danisan_vazgecti: number;
        danisan_yanlis: number;
        danisan_yonlendirme: number;
        danisma_acmadi: number;
        danisma_bilgi_verildi: number;
        danisma_kayit: number;
        danisma_eski_bilgilendirme: number;
        danisan_total: number;
        danisma_total: number;
        total: number;
      } 
    } = {};
    
    dayReports.forEach(report => {
      if (!stats[report.employee_name]) {
        stats[report.employee_name] = { 
          danisan_acmadi: 0,
          danisan_vazgecti: 0,
          danisan_yanlis: 0,
          danisan_yonlendirme: 0,
          danisma_acmadi: 0,
          danisma_bilgi_verildi: 0,
          danisma_kayit: 0,
          danisma_eski_bilgilendirme: 0,
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
        stats[report.employee_name].danisma_eski_bilgilendirme += (report.danisma_eski_bilgilendirme || 0);
        const total = report.danisma_acmadi + report.danisma_bilgi_verildi + report.danisma_kayit + (report.danisma_eski_bilgilendirme || 0);
        stats[report.employee_name].danisma_total += total;
        stats[report.employee_name].total += total;
      }
    });

    return Object.entries(stats)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.total - a.total);
  };

  const getDailyTotals = () => {
    const dateStr = format(selectedDailyDate, 'yyyy-MM-dd');
    const dayReports = reports.filter(r => r.report_date === dateStr);
    
    const danisan = dayReports
      .filter(r => r.report_type === 'danisan')
      .reduce((acc, r) => ({
        acmadi: acc.acmadi + r.danisan_acmadi,
        vazgecti: acc.vazgecti + r.danisan_vazgecti,
        yanlis: acc.yanlis + r.danisan_yanlis,
        yonlendirme: acc.yonlendirme + r.danisan_yonlendirme,
      }), { acmadi: 0, vazgecti: 0, yanlis: 0, yonlendirme: 0 });
    
    const danisma = dayReports
      .filter(r => r.report_type === 'danisma')
      .reduce((acc, r) => ({
        acmadi: acc.acmadi + r.danisma_acmadi,
        bilgiVerildi: acc.bilgiVerildi + r.danisma_bilgi_verildi,
        kayit: acc.kayit + r.danisma_kayit,
        eskiBilgilendirme: acc.eskiBilgilendirme + (r.danisma_eski_bilgilendirme || 0),
      }), { acmadi: 0, bilgiVerildi: 0, kayit: 0, eskiBilgilendirme: 0 });

    return { danisan, danisma };
  };

  const weeklyEmployeeStats = getWeeklyEmployeeStats();
  const dailyEmployeeStats = getDailyEmployeeStats();
  const dailyTotals = getDailyTotals();
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

  const years = Array.from({ length: 10 }, (_, i) => 2026 + i);

  const isAdmin = userProfile?.role === 'admin';

  // Daily pie data
  const dailyDanisanPieData = [
    { name: 'Açmadı', value: dailyTotals.danisan.acmadi },
    { name: 'Vazgeçti', value: dailyTotals.danisan.vazgecti },
    { name: 'Yanlış', value: dailyTotals.danisan.yanlis },
    { name: 'Yönlendirme', value: dailyTotals.danisan.yonlendirme },
  ].filter(d => d.value > 0);

  const dailyDanismaPieData = [
    { name: 'Açmadı', value: dailyTotals.danisma.acmadi },
    { name: 'Bilgi Verildi', value: dailyTotals.danisma.bilgiVerildi },
    { name: 'Kayıt', value: dailyTotals.danisma.kayit },
    { name: 'Eski Bilgilendirme', value: dailyTotals.danisma.eskiBilgilendirme },
  ].filter(d => d.value > 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950">
      <Helmet>
        <title>Görüşme Raporları | Divan Paneli</title>
      </Helmet>

      <div className="container mx-auto px-4 py-6">
        <AdminBackButton />

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
              <Phone className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">
                Görüşme Raporları
              </h1>
              <p className="text-slate-400 text-sm">Günlük arama raporlarını girin ve analiz edin</p>
            </div>
          </div>
        </div>

        {/* Main Tabs - Improved Design */}
        <Tabs value={mainTab} onValueChange={setMainTab} className="w-full">
          <div className="mb-6">
            <TabsList className="inline-flex h-12 items-center justify-center rounded-xl bg-slate-800/50 p-1.5 text-slate-400 backdrop-blur-sm border border-slate-700/50">
              <TabsTrigger 
                value="monthly" 
                className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-5 py-2.5 text-sm font-medium transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg"
              >
                <CalendarIcon className="w-4 h-4 mr-2" />
                Aylık Görünüm
              </TabsTrigger>
              <TabsTrigger 
                value="weekly" 
                className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-5 py-2.5 text-sm font-medium transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white data-[state=active]:shadow-lg"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Haftalık İstatistik
              </TabsTrigger>
              <TabsTrigger 
                value="daily" 
                className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-5 py-2.5 text-sm font-medium transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white data-[state=active]:shadow-lg"
              >
                <Clock className="w-4 h-4 mr-2" />
                Günlük İstatistik
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Monthly View Tab */}
          <TabsContent value="monthly" className="mt-0 space-y-6">
            {/* Filters */}
            <Card className="bg-slate-800/40 backdrop-blur-xl border-slate-700/50 shadow-xl">
              <CardContent className="pt-6">
                <div className="flex flex-wrap gap-4 items-center">
                  <div className="flex items-center gap-3">
                    <Label className="text-slate-300 font-medium">Ay:</Label>
                    <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                      <SelectTrigger className="w-36 bg-slate-900/50 border-slate-600/50 text-white rounded-lg hover:border-violet-500/50 transition-colors">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        {months.map(m => (
                          <SelectItem key={m.value} value={m.value.toString()} className="text-white hover:bg-slate-700">{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-3">
                    <Label className="text-slate-300 font-medium">Yıl:</Label>
                    <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                      <SelectTrigger className="w-28 bg-slate-900/50 border-slate-600/50 text-white rounded-lg hover:border-violet-500/50 transition-colors">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        {years.map(y => (
                          <SelectItem key={y} value={y.toString()} className="text-white hover:bg-slate-700">{y}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-blue-700 border-0 shadow-xl shadow-blue-500/20">
                <CardContent className="pt-6 relative z-10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm font-medium">Toplam Danışan Arama</p>
                      <p className="text-4xl font-bold text-white mt-1">
                        {danisanTotals.acmadi + danisanTotals.vazgecti + danisanTotals.yanlis + danisanTotals.yonlendirme}
                      </p>
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                      <Users className="w-7 h-7 text-white" />
                    </div>
                  </div>
                </CardContent>
                <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
              </Card>

              <Card className="relative overflow-hidden bg-gradient-to-br from-violet-600 to-purple-700 border-0 shadow-xl shadow-purple-500/20">
                <CardContent className="pt-6 relative z-10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm font-medium">Toplam Uzman Arama</p>
                      <p className="text-4xl font-bold text-white mt-1">
                        {danismaTotals.acmadi + danismaTotals.bilgiVerildi + danismaTotals.kayit + danismaTotals.eskiBilgilendirme}
                      </p>
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                      <UserCheck className="w-7 h-7 text-white" />
                    </div>
                  </div>
                </CardContent>
                <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
              </Card>

              <Card className="relative overflow-hidden bg-gradient-to-br from-emerald-600 to-green-700 border-0 shadow-xl shadow-green-500/20">
                <CardContent className="pt-6 relative z-10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm font-medium">Danışan Yönlendirme</p>
                      <p className="text-4xl font-bold text-white mt-1">{danisanTotals.yonlendirme}</p>
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                      <TrendingUp className="w-7 h-7 text-white" />
                    </div>
                  </div>
                </CardContent>
                <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
              </Card>

              <Card className="relative overflow-hidden bg-gradient-to-br from-amber-500 to-orange-600 border-0 shadow-xl shadow-orange-500/20">
                <CardContent className="pt-6 relative z-10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-amber-100 text-sm font-medium">Uzman Kayıt</p>
                      <p className="text-4xl font-bold text-white mt-1">{danismaTotals.kayit}</p>
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                      <BarChart3 className="w-7 h-7 text-white" />
                    </div>
                  </div>
                </CardContent>
                <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
              </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Entry Form */}
              <Card className="bg-slate-800/40 backdrop-blur-xl border-slate-700/50 shadow-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-white flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                      <Plus className="w-5 h-5 text-white" />
                    </div>
                    Yeni Rapor Ekle
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-slate-300 text-sm font-medium mb-2 block">Tarih</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal bg-slate-900/50 border-slate-600/50 text-white hover:bg-slate-800 hover:border-violet-500/50 rounded-lg h-11",
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4 text-violet-400" />
                              {format(selectedDate, "d MMMM yyyy", { locale: tr })}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-700">
                            <Calendar
                              mode="single"
                              selected={selectedDate}
                              onSelect={(date) => date && setSelectedDate(date)}
                              initialFocus
                              className="bg-slate-800"
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div>
                        <Label className="text-slate-300 text-sm font-medium mb-2 block">Çalışan Adı</Label>
                        <Input
                          value={employeeName}
                          readOnly
                          disabled
                          className="bg-slate-900/50 border-slate-600/50 text-white cursor-not-allowed opacity-70 rounded-lg h-11"
                        />
                      </div>
                    </div>

                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                      <TabsList className="grid w-full grid-cols-2 bg-slate-900/50 rounded-lg p-1 h-12">
                        <TabsTrigger value="danisan" className="text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 rounded-md">
                          Danışan
                        </TabsTrigger>
                        <TabsTrigger value="danisma" className="text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:to-purple-600 rounded-md">
                          Danışman
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="danisan" className="mt-5 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-slate-400 text-sm">Açmadı</Label>
                            <Input
                              type="number"
                              min="0"
                              value={danisanAcmadi}
                              onChange={(e) => setDanisanAcmadi(parseInt(e.target.value) || 0)}
                              className="bg-slate-900/50 border-slate-600/50 text-white rounded-lg h-11 mt-1.5"
                            />
                          </div>
                          <div>
                            <Label className="text-slate-400 text-sm">Vazgeçti</Label>
                            <Input
                              type="number"
                              min="0"
                              value={danisanVazgecti}
                              onChange={(e) => setDanisanVazgecti(parseInt(e.target.value) || 0)}
                              className="bg-slate-900/50 border-slate-600/50 text-white rounded-lg h-11 mt-1.5"
                            />
                          </div>
                          <div>
                            <Label className="text-slate-400 text-sm">Yanlış</Label>
                            <Input
                              type="number"
                              min="0"
                              value={danisanYanlis}
                              onChange={(e) => setDanisanYanlis(parseInt(e.target.value) || 0)}
                              className="bg-slate-900/50 border-slate-600/50 text-white rounded-lg h-11 mt-1.5"
                            />
                          </div>
                          <div>
                            <Label className="text-slate-400 text-sm">Yönlendirme</Label>
                            <Input
                              type="number"
                              min="0"
                              value={danisanYonlendirme}
                              onChange={(e) => setDanisanYonlendirme(parseInt(e.target.value) || 0)}
                              className="bg-slate-900/50 border-slate-600/50 text-white rounded-lg h-11 mt-1.5"
                            />
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="danisma" className="mt-5 space-y-4">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                          <div>
                            <Label className="text-slate-400 text-sm">Açmadı</Label>
                            <Input
                              type="number"
                              min="0"
                              value={danismaAcmadi}
                              onChange={(e) => setDanismaAcmadi(parseInt(e.target.value) || 0)}
                              className="bg-slate-900/50 border-slate-600/50 text-white rounded-lg h-11 mt-1.5"
                            />
                          </div>
                          <div>
                            <Label className="text-slate-400 text-sm">Bilgi Verildi</Label>
                            <Input
                              type="number"
                              min="0"
                              value={danismaBilgiVerildi}
                              onChange={(e) => setDanismaBilgiVerildi(parseInt(e.target.value) || 0)}
                              className="bg-slate-900/50 border-slate-600/50 text-white rounded-lg h-11 mt-1.5"
                            />
                          </div>
                          <div>
                            <Label className="text-slate-400 text-sm">Kayıt</Label>
                            <Input
                              type="number"
                              min="0"
                              value={danismaKayit}
                              onChange={(e) => setDanismaKayit(parseInt(e.target.value) || 0)}
                              className="bg-slate-900/50 border-slate-600/50 text-white rounded-lg h-11 mt-1.5"
                            />
                          </div>
                          <div>
                            <Label className="text-slate-400 text-sm">Eski Bilgi</Label>
                            <Input
                              type="number"
                              min="0"
                              value={danismaEskiBilgilendirme}
                              onChange={(e) => setDanismaEskiBilgilendirme(parseInt(e.target.value) || 0)}
                              className="bg-slate-900/50 border-slate-600/50 text-white rounded-lg h-11 mt-1.5"
                            />
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>

                    <Button 
                      onClick={handleSubmit} 
                      disabled={submitting}
                      className="w-full h-12 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-medium rounded-lg shadow-lg shadow-purple-500/25 transition-all hover:shadow-purple-500/40"
                    >
                      <Save className="w-5 h-5 mr-2" />
                      {submitting ? 'Kaydediliyor...' : 'Raporu Kaydet'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Employee Analytics */}
              <Card className="bg-slate-800/40 backdrop-blur-xl border-slate-700/50 shadow-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-white flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-white" />
                    </div>
                    Çalışan Performansı
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {employeeStats.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={employeeStats} barGap={8}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(15,23,42,0.95)', 
                            border: '1px solid rgba(148,163,184,0.2)',
                            borderRadius: '12px',
                            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
                          }}
                          labelStyle={{ color: '#fff' }}
                        />
                        <Bar dataKey="danisan" name="Danışan" fill="url(#blueGradient)" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="danisma" name="Danışman" fill="url(#purpleGradient)" radius={[6, 6, 0, 0]} />
                        <defs>
                          <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3b82f6" />
                            <stop offset="100%" stopColor="#1d4ed8" />
                          </linearGradient>
                          <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#a855f7" />
                            <stop offset="100%" stopColor="#7c3aed" />
                          </linearGradient>
                        </defs>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[280px] flex items-center justify-center text-slate-500">
                      <div className="text-center">
                        <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>Bu ay için veri bulunmuyor</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Charts Row */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="bg-slate-800/40 backdrop-blur-xl border-slate-700/50 shadow-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-white flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    Danışan Dağılımı
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {danisanPieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie
                          data={danisanPieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={3}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                          labelLine={{ stroke: 'rgba(148,163,184,0.5)' }}
                        >
                          {danisanPieData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(15,23,42,0.95)', 
                            border: '1px solid rgba(148,163,184,0.2)',
                            borderRadius: '12px'
                          }}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[280px] flex items-center justify-center text-slate-500">
                      Danışan verisi bulunmuyor
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-slate-800/40 backdrop-blur-xl border-slate-700/50 shadow-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-white flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                    Danışman Dağılımı
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {danismaPieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie
                          data={danismaPieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={3}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                          labelLine={{ stroke: 'rgba(148,163,184,0.5)' }}
                        >
                          {danismaPieData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(15,23,42,0.95)', 
                            border: '1px solid rgba(148,163,184,0.2)',
                            borderRadius: '12px'
                          }}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[280px] flex items-center justify-center text-slate-500">
                      Danışman verisi bulunmuyor
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Daily View - Günlük Raporlar */}
            <Card className="bg-slate-800/40 backdrop-blur-xl border-slate-700/50 shadow-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-white flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center">
                    <CalendarIcon className="w-5 h-5 text-white" />
                  </div>
                  Günlük Görünüm
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Bir güne tıklayarak o günün detaylı raporlarını görün
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-2 mb-4">
                  {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(day => (
                    <div key={day} className="text-center text-slate-400 text-sm font-medium py-2">
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
                          "h-16 rounded-xl border transition-all flex flex-col items-center justify-center gap-1 hover:scale-105 hover:shadow-lg",
                          isSelected 
                            ? "bg-gradient-to-br from-violet-500 to-purple-600 border-violet-400 text-white shadow-lg shadow-purple-500/30" 
                            : hasReports 
                              ? "bg-slate-700/50 border-slate-600/50 text-white hover:bg-slate-700" 
                              : "bg-slate-800/30 border-slate-700/30 text-slate-500 hover:bg-slate-700/50",
                          isToday && !isSelected && "ring-2 ring-cyan-400/50"
                        )}
                      >
                        <span className={cn("text-lg font-bold", isToday && !isSelected && "text-cyan-400")}>
                          {day.dayNumber}
                        </span>
                        {hasReports && (
                          <div className="flex gap-1">
                            {day.danisanTotal > 0 && (
                              <span className="text-[10px] bg-blue-500/40 px-1.5 py-0.5 rounded-full">{day.danisanTotal}</span>
                            )}
                            {day.danismaTotal > 0 && (
                              <span className="text-[10px] bg-purple-500/40 px-1.5 py-0.5 rounded-full">{day.danismaTotal}</span>
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
                <div className="flex justify-center gap-6 mt-6 text-sm">
                  <span className="flex items-center gap-2 text-slate-400">
                    <span className="w-4 h-4 bg-blue-500/40 rounded-full"></span> Danışan
                  </span>
                  <span className="flex items-center gap-2 text-slate-400">
                    <span className="w-4 h-4 bg-purple-500/40 rounded-full"></span> Danışman
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Reports Table */}
            <Card className="bg-slate-800/40 backdrop-blur-xl border-slate-700/50 shadow-xl">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">
                      {selectedDayFilter 
                        ? `${format(selectedDayFilter, 'd MMMM yyyy', { locale: tr })} Raporları`
                        : 'Aylık Raporlar'
                      }
                    </CardTitle>
                    <CardDescription className="text-slate-400">
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
                      className="bg-transparent border-slate-600/50 text-slate-300 hover:bg-slate-700 rounded-lg"
                    >
                      Tümünü Göster
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {filteredReports.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <Phone className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Bu dönem için rapor bulunmuyor</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-slate-700/50 hover:bg-transparent">
                          <TableHead className="text-slate-300 font-semibold">Tarih</TableHead>
                          <TableHead className="text-slate-300 font-semibold">Çalışan</TableHead>
                          <TableHead className="text-slate-300 font-semibold">Tür</TableHead>
                          <TableHead className="text-slate-300 font-semibold text-center">Açmadı</TableHead>
                          <TableHead className="text-slate-300 font-semibold text-center">Vazgeçti/Bilgi</TableHead>
                          <TableHead className="text-slate-300 font-semibold text-center">Yanlış/Kayıt</TableHead>
                          <TableHead className="text-slate-300 font-semibold text-center">Yönl./Eski</TableHead>
                          <TableHead className="text-slate-300 font-semibold text-right">Toplam</TableHead>
                          {isAdmin && <TableHead className="text-slate-300 font-semibold text-right">İşlem</TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredReports.map((report) => {
                          const isDanisan = report.report_type === 'danisan';
                          const total = isDanisan 
                            ? report.danisan_acmadi + report.danisan_vazgecti + report.danisan_yanlis + report.danisan_yonlendirme
                            : report.danisma_acmadi + report.danisma_bilgi_verildi + report.danisma_kayit + (report.danisma_eski_bilgilendirme || 0);
                          
                          return (
                            <TableRow key={report.id} className="border-slate-700/30 hover:bg-slate-700/30">
                              <TableCell className="text-slate-300">
                                {format(parseISO(report.report_date), 'd MMM', { locale: tr })}
                              </TableCell>
                              <TableCell className="text-white font-medium">{report.employee_name}</TableCell>
                              <TableCell>
                                <Badge className={cn(
                                  "rounded-lg font-medium",
                                  isDanisan 
                                    ? "bg-blue-500/20 text-blue-300 border-blue-500/30" 
                                    : "bg-purple-500/20 text-purple-300 border-purple-500/30"
                                )}>
                                  {isDanisan ? 'Danışan' : 'Danışman'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center text-slate-300">
                                {isDanisan ? report.danisan_acmadi : report.danisma_acmadi}
                              </TableCell>
                              <TableCell className="text-center text-slate-300">
                                {isDanisan ? report.danisan_vazgecti : report.danisma_bilgi_verildi}
                              </TableCell>
                              <TableCell className="text-center text-slate-300">
                                {isDanisan ? report.danisan_yanlis : report.danisma_kayit}
                              </TableCell>
                              <TableCell className="text-center text-slate-300">
                                {isDanisan ? report.danisan_yonlendirme : (report.danisma_eski_bilgilendirme || 0)}
                              </TableCell>
                              <TableCell className="text-right">
                                <span className="text-white font-bold text-lg">{total}</span>
                              </TableCell>
                              {isAdmin && (
                                <TableCell className="text-right">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleDelete(report.id)}
                                    className="text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </TableCell>
                              )}
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Weekly Statistics Tab */}
          <TabsContent value="weekly" className="mt-0 space-y-6">
            {/* Week Navigation */}
            <Card className="bg-slate-800/40 backdrop-blur-xl border-slate-700/50 shadow-xl">
              <CardContent className="pt-6">
                <div className="flex flex-wrap gap-4 items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setSelectedWeekStart(subWeeks(selectedWeekStart, 1))}
                      className="bg-slate-900/50 border-slate-600/50 text-white hover:bg-slate-800 rounded-xl h-11 w-11"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div className="text-center min-w-[200px]">
                      <p className="text-xl font-bold text-white">
                        {weekNumber}. Hafta - {getYear(selectedWeekStart)}
                      </p>
                      <p className="text-sm text-slate-400 mt-1">
                        {format(selectedWeekStart, 'd MMMM', { locale: tr })} - {format(weekEndDate, 'd MMMM yyyy', { locale: tr })}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setSelectedWeekStart(addWeeks(selectedWeekStart, 1))}
                      className="bg-slate-900/50 border-slate-600/50 text-white hover:bg-slate-800 rounded-xl h-11 w-11"
                    >
                      <ArrowRight className="w-5 h-5" />
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
                    className="bg-slate-900/50 border-slate-600/50 text-white hover:bg-slate-800 rounded-xl h-11"
                  >
                    Bu Hafta
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Weekly Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-blue-700 border-0 shadow-xl shadow-blue-500/20">
                <CardContent className="pt-6 relative z-10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm font-medium">Haftalık Danışan</p>
                      <p className="text-4xl font-bold text-white mt-1">
                        {weeklyEmployeeStats.reduce((sum, s) => sum + s.danisan_total, 0)}
                      </p>
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                      <Users className="w-7 h-7 text-white" />
                    </div>
                  </div>
                </CardContent>
                <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
              </Card>

              <Card className="relative overflow-hidden bg-gradient-to-br from-violet-600 to-purple-700 border-0 shadow-xl shadow-purple-500/20">
                <CardContent className="pt-6 relative z-10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm font-medium">Haftalık Danışman</p>
                      <p className="text-4xl font-bold text-white mt-1">
                        {weeklyEmployeeStats.reduce((sum, s) => sum + s.danisma_total, 0)}
                      </p>
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                      <UserCheck className="w-7 h-7 text-white" />
                    </div>
                  </div>
                </CardContent>
                <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
              </Card>

              <Card className="relative overflow-hidden bg-gradient-to-br from-emerald-600 to-green-700 border-0 shadow-xl shadow-green-500/20">
                <CardContent className="pt-6 relative z-10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm font-medium">Toplam Görüşme</p>
                      <p className="text-4xl font-bold text-white mt-1">
                        {weeklyEmployeeStats.reduce((sum, s) => sum + s.total, 0)}
                      </p>
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                      <TrendingUp className="w-7 h-7 text-white" />
                    </div>
                  </div>
                </CardContent>
                <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
              </Card>
            </div>

            {/* Weekly Employee Table */}
            <Card className="bg-slate-800/40 backdrop-blur-xl border-slate-700/50 shadow-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-white flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                  Haftalık Personel İstatistikleri
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Her personelin haftalık performans detayları
                </CardDescription>
              </CardHeader>
              <CardContent>
                {weeklyEmployeeStats.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Bu hafta için rapor bulunmuyor</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-slate-700/50 hover:bg-transparent">
                          <TableHead className="text-slate-300 font-semibold">Çalışan</TableHead>
                          <TableHead className="text-slate-300 text-center" colSpan={4}>
                            <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">Danışan</Badge>
                          </TableHead>
                          <TableHead className="text-slate-300 text-center" colSpan={4}>
                            <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">Danışman</Badge>
                          </TableHead>
                          <TableHead className="text-slate-300 font-semibold text-right">Toplam</TableHead>
                        </TableRow>
                        <TableRow className="border-slate-700/50 hover:bg-transparent">
                          <TableHead className="text-slate-500 text-sm"></TableHead>
                          <TableHead className="text-slate-500 text-sm text-center">Açmadı</TableHead>
                          <TableHead className="text-slate-500 text-sm text-center">Vazgeçti</TableHead>
                          <TableHead className="text-slate-500 text-sm text-center">Yanlış</TableHead>
                          <TableHead className="text-slate-500 text-sm text-center">Yönlendirme</TableHead>
                          <TableHead className="text-slate-500 text-sm text-center">Açmadı</TableHead>
                          <TableHead className="text-slate-500 text-sm text-center">Bilgi</TableHead>
                          <TableHead className="text-slate-500 text-sm text-center">Kayıt</TableHead>
                          <TableHead className="text-slate-500 text-sm text-center">Eski Bilgi</TableHead>
                          <TableHead className="text-slate-500 text-sm text-right"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {weeklyEmployeeStats.map((stat, index) => (
                          <TableRow key={stat.name} className="border-slate-700/30 hover:bg-slate-700/30">
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
                            <TableCell className="text-center text-purple-300">{stat.danisma_eski_bilgilendirme || '-'}</TableCell>
                            <TableCell className="text-right">
                              <span className="text-white font-bold text-lg">{stat.total}</span>
                            </TableCell>
                          </TableRow>
                        ))}
                        {/* Totals Row */}
                        <TableRow className="border-slate-700/50 bg-slate-700/20">
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
                          <TableCell className="text-center text-purple-300 font-bold">
                            {weeklyEmployeeStats.reduce((sum, s) => sum + s.danisma_eski_bilgilendirme, 0)}
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="text-emerald-400 font-bold text-xl">
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
              <Card className="bg-slate-800/40 backdrop-blur-xl border-slate-700/50 shadow-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-white flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    Haftalık Performans Grafiği
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={weeklyEmployeeStats} barGap={4}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(15,23,42,0.95)', 
                          border: '1px solid rgba(148,163,184,0.2)',
                          borderRadius: '12px',
                          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
                        }}
                        labelStyle={{ color: '#fff' }}
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

          {/* Daily Statistics Tab */}
          <TabsContent value="daily" className="mt-0 space-y-6">
            {/* Day Navigation */}
            <Card className="bg-slate-800/40 backdrop-blur-xl border-slate-700/50 shadow-xl">
              <CardContent className="pt-6">
                <div className="flex flex-wrap gap-4 items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setSelectedDailyDate(subDays(selectedDailyDate, 1))}
                      className="bg-slate-900/50 border-slate-600/50 text-white hover:bg-slate-800 rounded-xl h-11 w-11"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div className="text-center min-w-[200px]">
                      <p className="text-xl font-bold text-white">
                        {format(selectedDailyDate, 'd MMMM yyyy', { locale: tr })}
                      </p>
                      <p className="text-sm text-slate-400 mt-1">
                        {format(selectedDailyDate, 'EEEE', { locale: tr })}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setSelectedDailyDate(addDays(selectedDailyDate, 1))}
                      className="bg-slate-900/50 border-slate-600/50 text-white hover:bg-slate-800 rounded-xl h-11 w-11"
                    >
                      <ArrowRight className="w-5 h-5" />
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedDailyDate(new Date())}
                    className="bg-slate-900/50 border-slate-600/50 text-white hover:bg-slate-800 rounded-xl h-11"
                  >
                    Bugün
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Daily Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-blue-700 border-0 shadow-xl shadow-blue-500/20">
                <CardContent className="pt-6 relative z-10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm font-medium">Danışan Arama</p>
                      <p className="text-4xl font-bold text-white mt-1">
                        {dailyTotals.danisan.acmadi + dailyTotals.danisan.vazgecti + dailyTotals.danisan.yanlis + dailyTotals.danisan.yonlendirme}
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
              </Card>

              <Card className="relative overflow-hidden bg-gradient-to-br from-violet-600 to-purple-700 border-0 shadow-xl shadow-purple-500/20">
                <CardContent className="pt-6 relative z-10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm font-medium">Danışman Arama</p>
                      <p className="text-4xl font-bold text-white mt-1">
                        {dailyTotals.danisma.acmadi + dailyTotals.danisma.bilgiVerildi + dailyTotals.danisma.kayit + dailyTotals.danisma.eskiBilgilendirme}
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                      <UserCheck className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
              </Card>

              <Card className="relative overflow-hidden bg-gradient-to-br from-emerald-600 to-green-700 border-0 shadow-xl shadow-green-500/20">
                <CardContent className="pt-6 relative z-10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm font-medium">Yönlendirme</p>
                      <p className="text-4xl font-bold text-white mt-1">{dailyTotals.danisan.yonlendirme}</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
              </Card>

              <Card className="relative overflow-hidden bg-gradient-to-br from-amber-500 to-orange-600 border-0 shadow-xl shadow-orange-500/20">
                <CardContent className="pt-6 relative z-10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-amber-100 text-sm font-medium">Kayıt</p>
                      <p className="text-4xl font-bold text-white mt-1">{dailyTotals.danisma.kayit}</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                      <BarChart3 className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
              </Card>
            </div>

            {/* Daily Charts */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="bg-slate-800/40 backdrop-blur-xl border-slate-700/50 shadow-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-white flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    Danışan Dağılımı
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {dailyDanisanPieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie
                          data={dailyDanisanPieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={3}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                          labelLine={{ stroke: 'rgba(148,163,184,0.5)' }}
                        >
                          {dailyDanisanPieData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(15,23,42,0.95)', 
                            border: '1px solid rgba(148,163,184,0.2)',
                            borderRadius: '12px'
                          }}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[280px] flex items-center justify-center text-slate-500">
                      <div className="text-center">
                        <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>Bu gün için danışan verisi yok</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-slate-800/40 backdrop-blur-xl border-slate-700/50 shadow-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-white flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                    Danışman Dağılımı
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {dailyDanismaPieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie
                          data={dailyDanismaPieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={3}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                          labelLine={{ stroke: 'rgba(148,163,184,0.5)' }}
                        >
                          {dailyDanismaPieData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(15,23,42,0.95)', 
                            border: '1px solid rgba(148,163,184,0.2)',
                            borderRadius: '12px'
                          }}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[280px] flex items-center justify-center text-slate-500">
                      <div className="text-center">
                        <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>Bu gün için danışman verisi yok</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Daily Employee Stats */}
            <Card className="bg-slate-800/40 backdrop-blur-xl border-slate-700/50 shadow-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-white flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                  Günlük Personel İstatistikleri
                </CardTitle>
                <CardDescription className="text-slate-400">
                  {format(selectedDailyDate, 'd MMMM yyyy', { locale: tr })} tarihindeki performans detayları
                </CardDescription>
              </CardHeader>
              <CardContent>
                {dailyEmployeeStats.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Bu gün için rapor bulunmuyor</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-slate-700/50 hover:bg-transparent">
                          <TableHead className="text-slate-300 font-semibold">Çalışan</TableHead>
                          <TableHead className="text-slate-300 text-center" colSpan={4}>
                            <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">Danışan</Badge>
                          </TableHead>
                          <TableHead className="text-slate-300 text-center" colSpan={4}>
                            <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">Danışman</Badge>
                          </TableHead>
                          <TableHead className="text-slate-300 font-semibold text-right">Toplam</TableHead>
                        </TableRow>
                        <TableRow className="border-slate-700/50 hover:bg-transparent">
                          <TableHead className="text-slate-500 text-sm"></TableHead>
                          <TableHead className="text-slate-500 text-sm text-center">Açmadı</TableHead>
                          <TableHead className="text-slate-500 text-sm text-center">Vazgeçti</TableHead>
                          <TableHead className="text-slate-500 text-sm text-center">Yanlış</TableHead>
                          <TableHead className="text-slate-500 text-sm text-center">Yönlendirme</TableHead>
                          <TableHead className="text-slate-500 text-sm text-center">Açmadı</TableHead>
                          <TableHead className="text-slate-500 text-sm text-center">Bilgi</TableHead>
                          <TableHead className="text-slate-500 text-sm text-center">Kayıt</TableHead>
                          <TableHead className="text-slate-500 text-sm text-center">Eski Bilgi</TableHead>
                          <TableHead className="text-slate-500 text-sm text-right"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dailyEmployeeStats.map((stat, index) => (
                          <TableRow key={stat.name} className="border-slate-700/30 hover:bg-slate-700/30">
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
                            <TableCell className="text-center text-purple-300">{stat.danisma_eski_bilgilendirme || '-'}</TableCell>
                            <TableCell className="text-right">
                              <span className="text-white font-bold text-lg">{stat.total}</span>
                            </TableCell>
                          </TableRow>
                        ))}
                        {/* Totals Row */}
                        <TableRow className="border-slate-700/50 bg-slate-700/20">
                          <TableCell className="text-white font-bold">TOPLAM</TableCell>
                          <TableCell className="text-center text-blue-300 font-bold">
                            {dailyEmployeeStats.reduce((sum, s) => sum + s.danisan_acmadi, 0)}
                          </TableCell>
                          <TableCell className="text-center text-blue-300 font-bold">
                            {dailyEmployeeStats.reduce((sum, s) => sum + s.danisan_vazgecti, 0)}
                          </TableCell>
                          <TableCell className="text-center text-blue-300 font-bold">
                            {dailyEmployeeStats.reduce((sum, s) => sum + s.danisan_yanlis, 0)}
                          </TableCell>
                          <TableCell className="text-center text-blue-300 font-bold">
                            {dailyEmployeeStats.reduce((sum, s) => sum + s.danisan_yonlendirme, 0)}
                          </TableCell>
                          <TableCell className="text-center text-purple-300 font-bold">
                            {dailyEmployeeStats.reduce((sum, s) => sum + s.danisma_acmadi, 0)}
                          </TableCell>
                          <TableCell className="text-center text-purple-300 font-bold">
                            {dailyEmployeeStats.reduce((sum, s) => sum + s.danisma_bilgi_verildi, 0)}
                          </TableCell>
                          <TableCell className="text-center text-purple-300 font-bold">
                            {dailyEmployeeStats.reduce((sum, s) => sum + s.danisma_kayit, 0)}
                          </TableCell>
                          <TableCell className="text-center text-purple-300 font-bold">
                            {dailyEmployeeStats.reduce((sum, s) => sum + s.danisma_eski_bilgilendirme, 0)}
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="text-emerald-400 font-bold text-xl">
                              {dailyEmployeeStats.reduce((sum, s) => sum + s.total, 0)}
                            </span>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Daily Bar Chart */}
            {dailyEmployeeStats.length > 0 && (
              <Card className="bg-slate-800/40 backdrop-blur-xl border-slate-700/50 shadow-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-white flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    Günlük Performans Grafiği
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={dailyEmployeeStats} barGap={4}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(15,23,42,0.95)', 
                          border: '1px solid rgba(148,163,184,0.2)',
                          borderRadius: '12px',
                          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
                        }}
                        labelStyle={{ color: '#fff' }}
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
