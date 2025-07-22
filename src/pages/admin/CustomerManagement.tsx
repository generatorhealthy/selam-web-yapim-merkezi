import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import AdminBackButton from "@/components/AdminBackButton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Search, Eye, Edit, Calendar, User, Mail, Phone, MapPin, CreditCard, Check, X, TrendingUp, Users, Award, Trash2 } from "lucide-react";
import { getMonthName } from "@/utils/monthUtils";

interface Customer {
  id: string;
  customer_email: string;
  customer_name: string;
  customer_phone: string | null;
  customer_tc_no: string | null;
  customer_address: string | null;
  customer_city: string | null;
  package_name: string;
  amount: number;
  payment_method: string;
  registration_date: string;
  monthly_payment_day: number;
  total_months: number;
  paid_months: number[];
  current_month: number;
  is_active: boolean;
  created_at: string;
}

interface Specialist {
  id: string;
  name: string;
  specialty: string;
  city: string;
  phone?: string;
  email?: string;
  payment_day?: number;
  is_active: boolean;
  created_at: string;
}

const CustomerManagement = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [loading, setLoading] = useState(true);
  const [specialistsLoading, setSpecialistsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [editingTotalMonths, setEditingTotalMonths] = useState<string | null>(null);
  const [newTotalMonths, setNewTotalMonths] = useState<number>(12);
  const [editingAmount, setEditingAmount] = useState<string | null>(null);
  const [newAmount, setNewAmount] = useState<number>(3000);
  const [editingPaymentDay, setEditingPaymentDay] = useState<string | null>(null);
  const [newPaymentDay, setNewPaymentDay] = useState<number>(1);
  const { toast } = useToast();

  useEffect(() => {
    // Test - JavaScript çalışıyor mu?
    console.log('🚀 CustomerManagement component yüklendi');
    alert('CustomerManagement sayfası yüklendi!');
    
    fetchCustomers();
    fetchSpecialists();
  }, []);

  const fetchCustomers = async () => {
    try {
      console.log('🔍 CustomerManagement: fetchCustomers başladı');
      setLoading(true);
      
      // Check auth state
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      console.log('🔍 Auth durumu:', { user: user?.email, authError });
      
      // Also check session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('🔍 Session durumu:', { 
        hasSession: !!session, 
        accessToken: session?.access_token ? 'exists' : 'missing',
        sessionError 
      });

      const { data, error } = await supabase
        .from('automatic_orders')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('🔍 Supabase sorgu sonucu:', { data: data?.length, error });

      if (error) {
        console.error('🔍 Supabase hatası:', error);
        throw error;
      }

      setCustomers(data || []);
      console.log('🔍 Müşteriler state\'e set edildi:', data?.length);
      
      toast({
        title: "Başarılı",
        description: "Müşteri verileri yüklendi"
      });
    } catch (error) {
      console.error('🔍 Catch bloğu - Müşteri verileri yüklenirken hata:', error);
      toast({
        title: "Hata",
        description: "Müşteri verileri yüklenirken bir hata oluştu",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSpecialists = async () => {
    try {
      setSpecialistsLoading(true);
      const { data, error } = await supabase
        .from('specialists')
        .select('id, name, specialty, city, phone, email, payment_day, is_active, created_at')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setSpecialists(data || []);
    } catch (error) {
      console.error('Uzman verileri yüklenirken hata:', error);
      toast({
        title: "Hata",
        description: "Uzman verileri yüklenirken bir hata oluştu",
        variant: "destructive"
      });
    } finally {
      setSpecialistsLoading(false);
    }
  };

  const updateSpecialistPaymentDay = async (specialistId: string, paymentDay: number) => {
    try {
      const { error } = await supabase
        .from('specialists')
        .update({ payment_day: paymentDay })
        .eq('id', specialistId);

      if (error) {
        throw error;
      }

      await fetchSpecialists();
      setEditingPaymentDay(null);
      
      toast({
        title: "Başarılı",
        description: `Ödeme günü ${paymentDay}. gün olarak güncellendi`
      });
    } catch (error) {
      console.error('Ödeme günü güncellenirken hata:', error);
      toast({
        title: "Hata",
        description: "Ödeme günü güncellenirken bir hata oluştu",
        variant: "destructive"
      });
    }
  };

  const updateTotalMonths = async (customerId: string, totalMonths: number) => {
    try {
      const { error } = await supabase
        .from('automatic_orders')
        .update({ total_months: totalMonths })
        .eq('id', customerId);

      if (error) {
        throw error;
      }

      await fetchCustomers();
      setEditingTotalMonths(null);
      
      toast({
        title: "Başarılı",
        description: `Toplam ay sayısı ${totalMonths} olarak güncellendi`
      });
    } catch (error) {
      console.error('Toplam ay sayısı güncellenirken hata:', error);
      toast({
        title: "Hata",
        description: "Toplam ay sayısı güncellenirken bir hata oluştu",
        variant: "destructive"
      });
    }
  };

  const updateAmount = async (customerId: string, amount: number) => {
    try {
      const { error } = await supabase
        .from('automatic_orders')
        .update({ amount: amount })
        .eq('id', customerId);

      if (error) {
        throw error;
      }

      await fetchCustomers();
      setEditingAmount(null);
      
      toast({
        title: "Başarılı",
        description: `Paket fiyatı ₺${amount.toLocaleString('tr-TR')} olarak güncellendi`
      });
    } catch (error) {
      console.error('Paket fiyatı güncellenirken hata:', error);
      toast({
        title: "Hata",
        description: "Paket fiyatı güncellenirken bir hata oluştu",
        variant: "destructive"
      });
    }
  };

  const togglePaymentStatus = async (customerId: string, month: number) => {
    try {
      const customer = customers.find(c => c.id === customerId);
      if (!customer) return;

      const currentPaidMonths = customer.paid_months || [];
      const isCurrentlyPaid = currentPaidMonths.includes(month);
      
      let updatedPaidMonths;
      if (isCurrentlyPaid) {
        updatedPaidMonths = currentPaidMonths.filter(m => m !== month);
      } else {
        updatedPaidMonths = [...currentPaidMonths, month].sort((a, b) => a - b);
      }

      const { error } = await supabase
        .from('automatic_orders')
        .update({ paid_months: updatedPaidMonths })
        .eq('id', customerId);

      if (error) {
        throw error;
      }

      await fetchCustomers();
      
      toast({
        title: "Başarılı",
        description: isCurrentlyPaid 
          ? `${month}. ay ödemesi iptal edildi` 
          : `${month}. ay ödemesi işaretlendi`
      });
    } catch (error) {
      console.error('Ödeme durumu güncellenirken hata:', error);
      toast({
        title: "Hata",
        description: "Ödeme durumu güncellenirken bir hata oluştu",
        variant: "destructive"
      });
    }
  };

  const deleteCustomer = async (customerId: string) => {
    try {
      console.log('🔍 deleteCustomer başladı:', customerId);
      
      // Check auth state
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      console.log('🔍 Delete - Auth durumu:', { user: user?.email, authError });
      
      const { error } = await supabase
        .from('automatic_orders')
        .delete()
        .eq('id', customerId);

      console.log('🔍 Delete sorgu sonucu:', { error });

      if (error) {
        console.error('🔍 Delete hatası:', error);
        throw error;
      }

      console.log('🔍 Müşteri silindi, fetchCustomers çağrılıyor');
      await fetchCustomers();
      
      toast({
        title: "Başarılı",
        description: "Müşteri başarıyla silindi"
      });
    } catch (error) {
      console.error('🔍 Delete catch bloğu:', error);
      toast({
        title: "Hata",
        description: "Müşteri silinirken bir hata oluştu",
        variant: "destructive"
      });
    }
  };

  const getPaymentStatus = (customer: Customer) => {
    const paidMonthsCount = customer.paid_months?.length || 0;
    const totalMonths = customer.total_months;
    
    if (paidMonthsCount >= totalMonths) {
      return { text: "Tamamlandı", color: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    } else if (paidMonthsCount > 0) {
      return { text: `${paidMonthsCount}/${totalMonths} Ay`, color: "bg-blue-50 text-blue-700 border-blue-200" };
    } else {
      return { text: "Başlamamış", color: "bg-slate-50 text-slate-600 border-slate-200" };
    }
  };

  const renderPaymentMonths = (customer: Customer, interactive: boolean = false) => {
    const totalMonths = customer.total_months;
    const paidMonths = customer.paid_months || [];
    
    return (
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
        <div className="text-xs font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          {interactive ? 'Ödeme durumunu değiştirmek için aylara tıklayın' : 'Ödeme Durumu'}
        </div>
        
        <div className="grid grid-cols-12 gap-1 mb-4">
          {Array.from({ length: totalMonths }, (_, i) => {
            const month = i + 1;
            const isPaid = paidMonths.includes(month);
            const monthName = getMonthName(month);
            
            return (
              <div
                key={month}
                className={`
                  relative aspect-square rounded-lg text-xs flex items-center justify-center font-bold
                  cursor-pointer transition-all duration-300 border-2 shadow-sm
                  ${isPaid 
                    ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-emerald-400 shadow-emerald-200' 
                    : 'bg-gradient-to-br from-slate-50 to-slate-100 text-slate-700 border-slate-300 hover:border-slate-400'
                  }
                  ${interactive ? 'hover:scale-110 hover:shadow-lg transform-gpu' : ''}
                  ${isPaid && interactive ? 'hover:from-emerald-600 hover:to-emerald-700' : ''}
                  ${!isPaid && interactive ? 'hover:from-blue-50 hover:to-blue-100 hover:text-blue-700 hover:border-blue-300' : ''}
                `}
                onClick={interactive ? () => togglePaymentStatus(customer.id, month) : undefined}
                title={interactive ? 
                  `${monthName} - ${isPaid ? 'Ödemeyi iptal et' : 'Ödeme olarak işaretle'}` : 
                  monthName
                }
              >
                <span className="text-xs font-semibold">{month}</span>
                {isPaid && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full flex items-center justify-center">
                    <Check className="w-2 h-2 text-emerald-600" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Payment progress bar */}
        <div className="pt-3 border-t border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-600 mb-2">
            <span>İlerleme</span>
            <span>{paidMonths.length} / {totalMonths} ay</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all duration-500"
              style={{ width: `${(paidMonths.length / totalMonths) * 100}%` }}
            />
          </div>
        </div>
      </div>
    );
  };

  const filteredCustomers = customers.filter(customer => {
    const searchLower = searchTerm.toLowerCase();
    return (
      customer.customer_name.toLowerCase().includes(searchLower) ||
      customer.customer_email.toLowerCase().includes(searchLower) ||
      customer.package_name.toLowerCase().includes(searchLower)
    );
  });

  const getCustomerStats = () => {
    const totalCustomers = customers.length;
    const activeCustomers = customers.filter(c => c.is_active).length;
    const completedCustomers = customers.filter(c => 
      (c.paid_months?.length || 0) >= c.total_months
    ).length;

    return { totalCustomers, activeCustomers, completedCustomers };
  };

  const stats = getCustomerStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <AdminBackButton />
        </div>
        
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-800">Müşteri Yönetimi</h1>
          </div>
          <p className="text-slate-600">Müşteri bilgilerini yönetin ve ödeme durumlarını takip edin</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Toplam Müşteri</p>
                  <p className="text-3xl font-bold">{stats.totalCustomers}</p>
                </div>
                <Users className="w-8 h-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg bg-gradient-to-r from-emerald-500 to-emerald-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm font-medium">Aktif Müşteri</p>
                  <p className="text-3xl font-bold">{stats.activeCustomers}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-emerald-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg bg-gradient-to-r from-amber-500 to-amber-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-100 text-sm font-medium">Tamamlanan</p>
                  <p className="text-3xl font-bold">{stats.completedCustomers}</p>
                </div>
                <Award className="w-8 h-8 text-amber-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Actions */}
        <Card className="border-0 shadow-lg mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <Input
                  placeholder="Müşteri adı, e-posta veya paket adı ile ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-12 border-slate-200 focus:border-blue-400 focus:ring-blue-400"
                />
              </div>
              <Button 
                onClick={fetchCustomers}
                className="h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white font-medium"
              >
                Yenile
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Customers Table */}
        <Card className="border-0 shadow-lg overflow-hidden">
          <CardHeader className="bg-slate-50 border-b border-slate-200">
            <CardTitle className="text-xl text-slate-800">Müşteri Listesi</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="font-semibold text-slate-700">Müşteri Bilgileri</TableHead>
                    <TableHead className="font-semibold text-slate-700">Paket & Fiyat</TableHead>
                    <TableHead className="font-semibold text-slate-700">Durum</TableHead>
                    <TableHead className="font-semibold text-slate-700 w-96">Ödeme Takibi</TableHead>
                    <TableHead className="font-semibold text-slate-700">Toplam Ay</TableHead>
                    <TableHead className="font-semibold text-slate-700">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-slate-600">Yükleniyor...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredCustomers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12">
                        <div className="text-slate-500">
                          <Users className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                          <p className="text-lg font-medium">Müşteri bulunamadı</p>
                          <p className="text-sm">Arama kriterlerinizi değiştirmeyi deneyin</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCustomers.map((customer) => {
                      const paymentStatus = getPaymentStatus(customer);
                      return (
                        <TableRow key={customer.id} className="hover:bg-slate-50 transition-colors">
                          <TableCell className="py-4">
                            <div className="space-y-1">
                              <div className="font-semibold text-slate-800">{customer.customer_name}</div>
                              <div className="flex items-center gap-1 text-sm text-slate-600">
                                <Mail className="w-3 h-3" />
                                {customer.customer_email}
                              </div>
                              {customer.customer_phone && (
                                <div className="flex items-center gap-1 text-sm text-slate-600">
                                  <Phone className="w-3 h-3" />
                                  {customer.customer_phone}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="space-y-2">
                              <div className="font-medium text-slate-800">{customer.package_name}</div>
                              {editingAmount === customer.id ? (
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="number"
                                    value={newAmount}
                                    onChange={(e) => setNewAmount(Number(e.target.value))}
                                    className="w-24 text-sm h-8"
                                    min="0"
                                    step="100"
                                  />
                                  <Button
                                    size="sm"
                                    onClick={() => updateAmount(customer.id, newAmount)}
                                    className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700"
                                  >
                                    <Check className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setEditingAmount(null)}
                                    className="h-8 px-3"
                                  >
                                    <X className="w-3 h-3" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-emerald-600">
                                    ₺{Number(customer.amount).toLocaleString('tr-TR')} / ay
                                  </span>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      setEditingAmount(customer.id);
                                      setNewAmount(Number(customer.amount));
                                    }}
                                    className="h-6 w-6 p-0 hover:bg-slate-100"
                                  >
                                    <Edit className="w-3 h-3" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <Badge className={`${paymentStatus.color} border font-medium px-3 py-1`}>
                              {paymentStatus.text}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-6">
                            {renderPaymentMonths(customer, true)}
                          </TableCell>
                          <TableCell className="py-4">
                            {editingTotalMonths === customer.id ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  value={newTotalMonths}
                                  onChange={(e) => setNewTotalMonths(Number(e.target.value))}
                                  className="w-20 h-8"
                                  min="1"
                                  max="60"
                                />
                                <Button
                                  size="sm"
                                  onClick={() => updateTotalMonths(customer.id, newTotalMonths)}
                                  className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700"
                                >
                                  <Check className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingTotalMonths(null)}
                                  className="h-8 px-3"
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-slate-800">{customer.total_months} ay</span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setEditingTotalMonths(customer.id);
                                    setNewTotalMonths(customer.total_months);
                                  }}
                                  className="h-6 w-6 p-0 hover:bg-slate-100"
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                           <TableCell className="py-4">
                             <div className="flex items-center gap-2">
                               <Dialog>
                                 <DialogTrigger asChild>
                                   <Button 
                                     variant="outline" 
                                     size="sm"
                                     onClick={() => setSelectedCustomer(customer)}
                                     className="h-8 px-4 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors"
                                   >
                                     <Eye className="w-4 h-4 mr-1" />
                                     Detay
                                   </Button>
                                 </DialogTrigger>
                              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle className="text-xl flex items-center gap-2">
                                    <User className="w-5 h-5" />
                                    Müşteri Detayları
                                  </DialogTitle>
                                  <DialogDescription>
                                    {selectedCustomer?.customer_name} müşterisinin detaylı bilgileri
                                  </DialogDescription>
                                </DialogHeader>
                                {selectedCustomer && (
                                  <div className="space-y-6">
                                    {/* Personal Information */}
                                    <div className="bg-slate-50 rounded-lg p-4">
                                      <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                        <User className="w-4 h-4" />
                                        Kişisel Bilgiler
                                      </h3>
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <Label className="text-sm font-medium text-slate-600">Ad Soyad</Label>
                                          <p className="font-medium text-slate-800">{selectedCustomer.customer_name}</p>
                                        </div>
                                        <div>
                                          <Label className="text-sm font-medium text-slate-600">E-posta</Label>
                                          <p className="font-medium text-slate-800">{selectedCustomer.customer_email}</p>
                                        </div>
                                        <div>
                                          <Label className="text-sm font-medium text-slate-600">Telefon</Label>
                                          <p className="font-medium text-slate-800">{selectedCustomer.customer_phone || 'Belirtilmemiş'}</p>
                                        </div>
                                        <div>
                                          <Label className="text-sm font-medium text-slate-600">TC Kimlik No</Label>
                                          <p className="font-medium text-slate-800">{selectedCustomer.customer_tc_no || 'Belirtilmemiş'}</p>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Address Information */}
                                    <div className="bg-slate-50 rounded-lg p-4">
                                      <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                        <MapPin className="w-4 h-4" />
                                        Adres Bilgileri
                                      </h3>
                                      <p className="font-medium text-slate-800">
                                        {selectedCustomer.customer_address || 'Belirtilmemiş'}
                                        {selectedCustomer.customer_city && `, ${selectedCustomer.customer_city}`}
                                      </p>
                                    </div>

                                    {/* Package Information */}
                                    <div className="bg-slate-50 rounded-lg p-4">
                                      <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                        <CreditCard className="w-4 h-4" />
                                        Paket Bilgileri
                                      </h3>
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <Label className="text-sm font-medium text-slate-600">Paket</Label>
                                          <p className="font-medium text-slate-800">{selectedCustomer.package_name}</p>
                                        </div>
                                        <div>
                                          <Label className="text-sm font-medium text-slate-600">Aylık Ücret</Label>
                                          <p className="font-medium text-emerald-600">₺{Number(selectedCustomer.amount).toLocaleString('tr-TR')}</p>
                                        </div>
                                        <div>
                                          <Label className="text-sm font-medium text-slate-600">Kayıt Tarihi</Label>
                                          <p className="font-medium text-slate-800">
                                            {new Date(selectedCustomer.registration_date).toLocaleDateString('tr-TR')}
                                          </p>
                                        </div>
                                        <div>
                                          <Label className="text-sm font-medium text-slate-600">Aylık Ödeme Günü</Label>
                                          <p className="font-medium text-slate-800">{selectedCustomer.monthly_payment_day}. gün</p>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Payment Status */}
                                    <div className="bg-slate-50 rounded-lg p-4">
                                      <h3 className="font-semibold text-slate-800 mb-4">
                                        Ödeme Durumu ({selectedCustomer.paid_months?.length || 0}/{selectedCustomer.total_months} ay)
                                      </h3>
                                      {renderPaymentMonths(selectedCustomer)}
                                    </div>
                                  </div>
                                )}
                              </DialogContent>
                             </Dialog>
                               <Button
                                 variant="destructive"
                                 size="sm"
                                 onClick={() => deleteCustomer(customer.id)}
                                 className="h-8 px-4 hover:bg-destructive/90"
                               >
                                 <Trash2 className="w-4 h-4 mr-1" />
                                 Sil
                               </Button>
                             </div>
                           </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Specialists Section */}
        <Card className="border-0 shadow-lg overflow-hidden mt-8">
          <CardHeader className="bg-slate-50 border-b border-slate-200">
            <CardTitle className="text-xl text-slate-800">Uzman Ödeme Günleri</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="font-semibold text-slate-700">Uzman Bilgileri</TableHead>
                    <TableHead className="font-semibold text-slate-700">Uzmanlık</TableHead>
                    <TableHead className="font-semibold text-slate-700">Şehir</TableHead>
                    <TableHead className="font-semibold text-slate-700">Ödeme Günü</TableHead>
                    <TableHead className="font-semibold text-slate-700">Durum</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {specialistsLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-slate-600">Uzmanlar yükleniyor...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : specialists.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12">
                        <div className="text-slate-500">
                          <Users className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                          <p className="text-lg font-medium">Uzman bulunamadı</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    specialists.map((specialist) => (
                      <TableRow key={specialist.id} className="hover:bg-slate-50 transition-colors">
                        <TableCell className="py-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <div className="font-semibold text-slate-800">{specialist.name}</div>
                              {new Date().getDate() === (specialist.payment_day || 1) && (
                                <div className="relative">
                                  <span className="text-orange-500 text-lg animate-pulse flame-flicker">🔥</span>
                                  <span className="absolute inset-0 text-yellow-400 text-lg animate-ping flame-glow">🔥</span>
                                </div>
                              )}
                            </div>
                            {specialist.email && (
                              <div className="flex items-center gap-1 text-sm text-slate-600">
                                <Mail className="w-3 h-3" />
                                {specialist.email}
                              </div>
                            )}
                            {specialist.phone && (
                              <div className="flex items-center gap-1 text-sm text-slate-600">
                                <Phone className="w-3 h-3" />
                                {specialist.phone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <span className="font-medium text-slate-700">{specialist.specialty}</span>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-center gap-1 text-slate-600">
                            <MapPin className="w-3 h-3" />
                            {specialist.city}
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          {editingPaymentDay === specialist.id ? (
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                value={newPaymentDay}
                                onChange={(e) => setNewPaymentDay(Number(e.target.value))}
                                className="w-20 h-8"
                                min="1"
                                max="31"
                              />
                              <Button
                                size="sm"
                                onClick={() => updateSpecialistPaymentDay(specialist.id, newPaymentDay)}
                                className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700"
                              >
                                <Check className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingPaymentDay(null)}
                                className="h-8 px-3"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-800">
                                Her ayın {specialist.payment_day || 1}'i
                              </span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setEditingPaymentDay(specialist.id);
                                  setNewPaymentDay(specialist.payment_day || 1);
                                }}
                                className="h-6 w-6 p-0 hover:bg-slate-100"
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="py-4">
                          <Badge variant={specialist.is_active ? "default" : "secondary"}>
                            {specialist.is_active ? "Aktif" : "Pasif"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CustomerManagement;
