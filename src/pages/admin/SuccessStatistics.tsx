import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { HorizontalNavigation } from "@/components/HorizontalNavigation";
import AdminBackButton from "@/components/AdminBackButton";
import { Plus, TrendingUp, Edit, Trash2, Users, Target, Award, Calendar, BarChart3, PieChart, Activity, Gift } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart as RechartsPieChart, Cell, LineChart, Line, Area, AreaChart } from "recharts";

interface SuccessStatistic {
  id: string;
  employee_name: string;
  employee_surname: string;
  specialists_registered: number;
  month: number;
  year: number;
  day: number;
  created_at: string;
}

const SuccessStatistics = () => {
  const { userProfile } = useUserRole();
  const { toast } = useToast();
  const [statistics, setStatistics] = useState<SuccessStatistic[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStatistic, setEditingStatistic] = useState<SuccessStatistic | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    employee_name: "",
    employee_surname: "",
    specialists_registered: 0,
    month: new Date().getMonth() + 1,
    day: new Date().getDate()
  });

  const employees = ["Fatih", "İrem", "Fatıma", "Yağmur"];
  const months = [
    { value: 1, label: "Ocak" },
    { value: 2, label: "Şubat" },
    { value: 3, label: "Mart" },
    { value: 4, label: "Nisan" },
    { value: 5, label: "Mayıs" },
    { value: 6, label: "Haziran" },
    { value: 7, label: "Temmuz" },
    { value: 8, label: "Ağustos" },
    { value: 9, label: "Eylül" },
    { value: 10, label: "Ekim" },
    { value: 11, label: "Kasım" },
    { value: 12, label: "Aralık" }
  ];

  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  const employeeColors = {
    "Fatih": "#3B82F6",
    "İrem": "#EF4444", 
    "Fatıma": "#10B981",
    "Yağmur": "#F59E0B"
  };

  const pieColors = ["#3B82F6", "#EF4444", "#10B981", "#F59E0B"];

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("success_statistics")
        .select("*")
        .order("year", { ascending: false })
        .order("month", { ascending: false })
        .order("day", { ascending: false });

      if (error) {
        console.error("İstatistikler yüklenirken hata:", error);
        throw error;
      }
      
      console.log("İstatistikler yüklendi:", data);
      setStatistics(data || []);
    } catch (error) {
      console.error("İstatistikler yüklenirken hata:", error);
      toast({
        title: "Hata",
        description: "İstatistikler yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (submitting) return;
    
    setSubmitting(true);
    
    const submitData = {
      employee_name: formData.employee_name,
      employee_surname: formData.employee_surname,
      specialists_registered: formData.specialists_registered,
      month: formData.month,
      day: formData.day,
      year: new Date().getFullYear()
    };
    
    console.log("Form gönderiliyor:", submitData);
    
    try {
      let result;
      
      if (editingStatistic) {
        result = await supabase
          .from("success_statistics")
          .update(submitData)
          .eq("id", editingStatistic.id)
          .select();

        if (result.error) throw result.error;
        
        console.log("İstatistik güncellendi:", result.data);
        toast({
          title: "Başarılı",
          description: "İstatistik güncellendi.",
        });
      } else {
        result = await supabase
          .from("success_statistics")
          .insert([submitData])
          .select();

        if (result.error) throw result.error;
        
        console.log("Yeni istatistik eklendi:", result.data);
        toast({
          title: "Başarılı",
          description: "İstatistik eklendi.",
        });
      }

      // Form'u temizle
      setFormData({
        employee_name: "",
        employee_surname: "",
        specialists_registered: 0,
        month: new Date().getMonth() + 1,
        day: new Date().getDate()
      });
      
      // Dialog'u kapat
      setDialogOpen(false);
      setEditingStatistic(null);
      
      // Verileri yenile
      await fetchStatistics();
      
    } catch (error) {
      console.error("İstatistik kaydedilirken hata:", error);
      toast({
        title: "Hata",
        description: "İstatistik kaydedilirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu istatistiği silmek istediğinizden emin misiniz?")) return;

    try {
      const { error } = await supabase
        .from("success_statistics")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      toast({
        title: "Başarılı",
        description: "İstatistik silindi.",
      });
      
      await fetchStatistics();
    } catch (error) {
      console.error("İstatistik silinirken hata:", error);
      toast({
        title: "Hata",
        description: "İstatistik silinirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (statistic: SuccessStatistic) => {
    setEditingStatistic(statistic);
    setFormData({
      employee_name: statistic.employee_name,
      employee_surname: statistic.employee_surname,
      specialists_registered: statistic.specialists_registered,
      month: statistic.month,
      day: statistic.day || new Date().getDate()
    });
    setDialogOpen(true);
  };

  const getTotalRegistrations = () => {
    return statistics.reduce((sum, stat) => sum + stat.specialists_registered, 0);
  };

  const getMonthlyTotal = (month: number, year: number) => {
    return statistics
      .filter(stat => stat.month === month && stat.year === year)
      .reduce((sum, stat) => sum + stat.specialists_registered, 0);
  };

  const getEmployeeStats = () => {
    return employees.map(name => {
      const total = statistics
        .filter(stat => stat.employee_name === name)
        .reduce((sum, stat) => sum + stat.specialists_registered, 0);
      return { name, total, color: employeeColors[name as keyof typeof employeeColors] };
    }).sort((a, b) => b.total - a.total);
  };

  const getTopPerformer = () => {
    const employeeStats = getEmployeeStats();
    return employeeStats[0] || { name: "", total: 0 };
  };

  const getThisMonthTotal = () => {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    return getMonthlyTotal(currentMonth, currentYear);
  };

  const getMonthlyData = () => {
    const monthlyData = months.map(month => {
      const total = statistics
        .filter(stat => stat.month === month.value && stat.year === new Date().getFullYear())
        .reduce((sum, stat) => sum + stat.specialists_registered, 0);
      return {
        month: month.label,
        total
      };
    });
    return monthlyData;
  };

  const getPieData = () => {
    const employeeStats = getEmployeeStats();
    return employeeStats
      .filter(emp => emp.total > 0)
      .map((emp, index) => ({
        name: emp.name,
        value: emp.total,
        fill: pieColors[index % pieColors.length]
      }));
  };

  const getRecentActivity = () => {
    const recentData = [];
    const last7Days = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dayTotal = statistics
        .filter(stat => {
          const statDate = new Date(stat.created_at);
          return statDate.toDateString() === date.toDateString();
        })
        .reduce((sum, stat) => sum + stat.specialists_registered, 0);
      
      last7Days.push({
        day: date.toLocaleDateString('tr-TR', { weekday: 'short' }),
        total: dayTotal
      });
    }
    return last7Days;
  };

  const getMonthlyEmployeeStats = () => {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    
    return employees.map(name => {
      const monthlyTotal = statistics
        .filter(stat => 
          stat.employee_name === name && 
          stat.month === currentMonth && 
          stat.year === currentYear
        )
        .reduce((sum, stat) => sum + stat.specialists_registered, 0);
      
      let bonus = 0;
      if (monthlyTotal >= 50) {
        bonus = 10000;
      } else if (monthlyTotal >= 40) {
        bonus = 6000;
      } else if (monthlyTotal >= 25) {
        bonus = 4000;
      }
      
      return {
        name,
        monthlyTotal,
        bonus,
        color: employeeColors[name as keyof typeof employeeColors]
      };
    }).sort((a, b) => b.monthlyTotal - a.monthlyTotal);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Veriler yükleniyor...</p>
        </div>
      </div>
    );
  }

  const topPerformer = getTopPerformer();
  const employeeStats = getEmployeeStats();
  const monthlyData = getMonthlyData();
  const pieData = getPieData();
  const recentActivity = getRecentActivity();
  const monthlyEmployeeStats = getMonthlyEmployeeStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <HorizontalNavigation />
      <div className="p-6">
        <div className="container mx-auto max-w-7xl">
          <div className="mb-8">
            <AdminBackButton />
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl text-white">
                <TrendingUp className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900">Başarı İstatistikleri</h1>
              </div>
            </div>
          </div>

          {/* Prim Bilgisi */}
          <Card className="mb-8 shadow-xl border-0 bg-gradient-to-r from-yellow-50 to-yellow-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl text-yellow-800">
                <Gift className="w-6 h-6" />
                Aylık Prim Sistemi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-4 border border-yellow-200">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold">
                      25
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Aylık 25 kayıt</p>
                      <p className="text-2xl font-bold text-yellow-600">4.000₺</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">Prim</p>
                </div>
                
                <div className="bg-white rounded-lg p-4 border border-yellow-200">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold">
                      40
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Aylık 40 kayıt</p>
                      <p className="text-2xl font-bold text-orange-600">6.000₺</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">Prim</p>
                </div>
                
                <div className="bg-white rounded-lg p-4 border border-yellow-200">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white font-bold">
                      50
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Aylık 50 kayıt</p>
                      <p className="text-2xl font-bold text-red-600">10.000₺</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">Prim</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bu Ay Prim Durumu */}
          <Card className="mb-8 shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Award className="w-5 h-5 text-green-600" />
                Bu Ay Prim Durumu
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {monthlyEmployeeStats.map((employee, index) => (
                  <div key={employee.name} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 w-20">
                      <span className="text-lg font-bold text-gray-600">#{index + 1}</span>
                      {employee.bonus > 0 && (
                        <span className="text-xl">💰</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-gray-800">{employee.name}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-gray-600">
                            {employee.monthlyTotal} kayıt
                          </span>
                          <span className={`font-bold ${employee.bonus > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                            {employee.bonus > 0 ? `${employee.bonus.toLocaleString('tr-TR')}₺` : 'Prim yok'}
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                         <div 
                           className="h-3 rounded-full transition-all duration-700 ease-out"
                           style={{ 
                             width: `${Math.min((employee.monthlyTotal / 50) * 100, 100)}%`,
                             backgroundColor: employee.color
                           }}
                         ></div>
                       </div>
                       <div className="flex justify-between text-xs text-gray-500 mt-1">
                         <span>0</span>
                         <span className="text-yellow-600">25</span>
                         <span className="text-orange-600">40</span>
                         <span className="text-red-600">50</span>
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Analytics Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-lg">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium opacity-90">Toplam Kayıt</CardTitle>
                  <Users className="w-5 h-5 opacity-80" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-1">{getTotalRegistrations()}</div>
                <p className="text-xs opacity-80">Toplam specialist kaydı</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0 shadow-lg">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium opacity-90">Bu Ay</CardTitle>
                  <Calendar className="w-5 h-5 opacity-80" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-1">{getThisMonthTotal()}</div>
                <p className="text-xs opacity-80">Bu ay toplam kayıt</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 shadow-lg">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium opacity-90">En Başarılı</CardTitle>
                  <Award className="w-5 h-5 opacity-80" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-1 flex items-center gap-2">
                  {topPerformer.name} 
                  {topPerformer.name && (
                    <span className="text-2xl animate-pulse">
                      🔥
                    </span>
                  )}
                </div>
                <p className="text-xs opacity-80">{topPerformer.total} kayıt</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0 shadow-lg">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium opacity-90">Ortalama</CardTitle>
                  <Target className="w-5 h-5 opacity-80" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-1">
                  {statistics.length > 0 ? Math.round(getTotalRegistrations() / statistics.length) : 0}
                </div>
                <p className="text-xs opacity-80">Kayıt per entry</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
            {/* Employee Competition */}
            <Card className="xl:col-span-2 shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Activity className="w-5 h-5 text-blue-600" />
                  Çalışan Yarışı
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {employeeStats.map((employee, index) => (
                    <div key={employee.name} className="flex items-center gap-4">
                      <div className="flex items-center gap-2 w-20">
                        <span className="text-lg font-bold text-gray-600">#{index + 1}</span>
                        {index === 0 && (
                          <span className="text-xl animate-bounce">
                            🔥
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium text-gray-800">{employee.name}</span>
                          <span className="font-bold text-gray-900">{employee.total}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className="h-3 rounded-full transition-all duration-700 ease-out"
                            style={{ 
                              width: `${employeeStats[0].total > 0 ? (employee.total / employeeStats[0].total) * 100 : 0}%`,
                              backgroundColor: employee.color
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Pie Chart */}
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <PieChart className="w-5 h-5 text-purple-600" />
                  Dağılım
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    value: {
                      label: "Toplam",
                    },
                  }}
                  className="h-64"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <ChartTooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-white p-2 border rounded shadow">
                                <p>{`${payload[0].name}: ${payload[0].value}`}</p>
                              </div>
                            );
                          }
                          return null;
                        }} 
                      />
                      <RechartsPieChart 
                        data={pieData} 
                        cx="50%" 
                        cy="50%" 
                        innerRadius={40} 
                        outerRadius={80}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </RechartsPieChart>
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </ChartContainer>
                <div className="mt-4 space-y-2">
                  {pieData.map((employee, index) => (
                    <div key={employee.name} className="flex items-center gap-2 text-sm">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: employee.fill }}
                      ></div>
                      <span>{employee.name}: {employee.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* More Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Monthly Trend */}
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <BarChart3 className="w-5 h-5 text-green-600" />
                  Aylık Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    total: {
                      label: "Toplam",
                      color: "#10B981",
                    },
                  }}
                  className="h-64"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="month" fontSize={12} />
                      <YAxis fontSize={12} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area 
                        type="monotone" 
                        dataKey="total" 
                        stroke="#10B981" 
                        fill="#10B981" 
                        fillOpacity={0.3}
                        strokeWidth={3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Activity className="w-5 h-5 text-orange-600" />
                  Son 7 Gün
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    total: {
                      label: "Toplam",
                      color: "#F59E0B",
                    },
                  }}
                  className="h-64"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={recentActivity}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="day" fontSize={12} />
                      <YAxis fontSize={12} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="total" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Statistics Table */}
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
              <div className="flex justify-between items-center">
                <CardTitle className="text-2xl text-gray-800 flex items-center gap-2">
                  <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full"></div>
                  Detaylı İstatistikler
                </CardTitle>
                {userProfile?.role === "admin" && (
                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg">
                        <Plus className="w-4 h-4 mr-2" />
                        Yeni Kayıt
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle className="text-xl">
                          {editingStatistic ? "İstatistik Düzenle" : "Yeni İstatistik Ekle"}
                        </DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="employee_name">Çalışan Adı</Label>
                            <Select
                              value={formData.employee_name}
                              onValueChange={(value) => setFormData({ ...formData, employee_name: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Seçiniz" />
                              </SelectTrigger>
                              <SelectContent>
                                {employees.map((name) => (
                                  <SelectItem key={name} value={name}>
                                    {name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="employee_surname">Kayıt Edilen Kişi</Label>
                            <Input
                              id="employee_surname"
                              value={formData.employee_surname}
                              onChange={(e) => setFormData({ ...formData, employee_surname: e.target.value })}
                              placeholder="İsim giriniz"
                              required
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="specialists_registered">Kayıt Edilen Uzman Sayısı</Label>
                          <Input
                            id="specialists_registered"
                            type="number"
                            min="0"
                            value={formData.specialists_registered}
                            onChange={(e) => setFormData({ ...formData, specialists_registered: parseInt(e.target.value) || 0 })}
                            required
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="month">Ay</Label>
                            <Select
                              value={formData.month.toString()}
                              onValueChange={(value) => setFormData({ ...formData, month: parseInt(value) })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {months.map((month) => (
                                  <SelectItem key={month.value} value={month.value.toString()}>
                                    {month.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="day">Gün</Label>
                            <Select
                              value={formData.day.toString()}
                              onValueChange={(value) => setFormData({ ...formData, day: parseInt(value) })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {days.map((day) => (
                                  <SelectItem key={day} value={day.toString()}>
                                    {day}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setDialogOpen(false)}
                            disabled={submitting}
                          >
                            İptal
                          </Button>
                          <Button 
                            type="submit" 
                            className="bg-gradient-to-r from-blue-600 to-indigo-600"
                            disabled={submitting}
                          >
                            {submitting ? "Kaydediliyor..." : (editingStatistic ? "Güncelle" : "Ekle")}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/50">
                      <TableHead className="font-semibold text-gray-700">Çalışan</TableHead>
                      <TableHead className="font-semibold text-gray-700">Kayıt Edilen Kişi</TableHead>
                      <TableHead className="font-semibold text-gray-700">Uzman Sayısı</TableHead>
                      <TableHead className="font-semibold text-gray-700">Tarih</TableHead>
                      <TableHead className="font-semibold text-gray-700">Kayıt Tarihi</TableHead>
                      {userProfile?.role === "admin" && <TableHead className="font-semibold text-gray-700">İşlemler</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {statistics.map((statistic, index) => (
                      <TableRow key={statistic.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50/30"}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                              style={{ backgroundColor: employeeColors[statistic.employee_name as keyof typeof employeeColors] || "#6B7280" }}
                            >
                              {statistic.employee_name.charAt(0)}
                            </div>
                            {statistic.employee_name}
                            {statistic.employee_name === topPerformer.name && (
                              <span className="text-lg animate-bounce">🔥</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-700">{statistic.employee_surname}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {statistic.specialists_registered}
                          </span>
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {statistic.day} {months.find(m => m.value === statistic.month)?.label} {statistic.year}
                        </TableCell>
                        <TableCell className="text-gray-500 text-sm">
                          {new Date(statistic.created_at).toLocaleDateString('tr-TR')}
                        </TableCell>
                        {userProfile?.role === "admin" && (
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditDialog(statistic)}
                                className="hover:bg-blue-50 hover:border-blue-200"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(statistic.id)}
                                className="hover:bg-red-50 hover:border-red-200 text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SuccessStatistics;
