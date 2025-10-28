import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Helmet } from "react-helmet-async";
import { AdminTopBar } from "@/components/AdminTopBar";
import AdminBackButton from "@/components/AdminBackButton";
import { useUserRole } from "@/hooks/useUserRole";
import ContractDialog from "@/components/ContractDialog";
import { 
  FileText, 
  Download, 
  Search, 
  Filter,
  Eye,
  Calendar,
  User,
  Package,
  CreditCard,
  Building,
  Loader2,
  RefreshCw,
  Trash2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface ContractOrder {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_tc_no: string;
  customer_address: string;
  customer_city: string;
  package_name: string;
  amount: number;
  payment_method: string;
  customer_type: string;
  status: string;
  created_at: string;
  pre_info_pdf_content: string | null;
  distance_sales_pdf_content: string | null;
  contract_ip_address: string | null;
  package_features?: string[];
}

const ContractManagement = () => {
  const { toast } = useToast();
  const { userProfile, loading: userLoading } = useUserRole();
  const [orders, setOrders] = useState<ContractOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "individual" | "company">("all");
  
  // Dialog states
  const [contractDialogOpen, setContractDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<ContractOrder | null>(null);
  const [contractType, setContractType] = useState<"preInfo" | "distanceSales">("preInfo");

  const isAdmin = userProfile?.role === 'admin';

  useEffect(() => {
    if (!userLoading && isAdmin) {
      fetchOrders();
    }
  }, [userLoading, isAdmin]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      // Önce orders ve packages verilerini al
      const [ordersResponse, packagesResponse] = await Promise.all([
        supabase
          .from('orders')
          .select(`
            id,
            customer_name,
            customer_email,
            customer_phone,
            customer_tc_no,
            customer_address,
            customer_city,
            package_name,
            amount,
            payment_method,
            customer_type,
            status,
            created_at,
            pre_info_pdf_content,
            distance_sales_pdf_content,
            contract_ip_address,
            subscription_month,
            is_first_order
          `)
          .eq('subscription_month', 1)
          .order('created_at', { ascending: false }),
        
        supabase
          .from('packages')
          .select('name, features')
      ]);

      if (ordersResponse.error) {
        throw ordersResponse.error;
      }

      if (packagesResponse.error) {
        console.error('Paket verileri alınırken hata:', packagesResponse.error);
      }

      // Paket özelliklerini orders ile birleştir
      const ordersWithPackageFeatures = (ordersResponse.data || []).map(order => {
        const packageData = (packagesResponse.data || []).find(pkg => pkg.name === order.package_name);
        return {
          ...order,
          package_features: packageData?.features || []
        };
      });

      setOrders(ordersWithPackageFeatures);
    } catch (error) {
      console.error('Sözleşmeler yüklenirken hata:', error);
      toast({
        title: "Hata",
        description: "Sözleşmeler yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Contract dialog functions
  const openContractDialog = (order: ContractOrder, type: "preInfo" | "distanceSales") => {
    setSelectedOrder(order);
    setContractType(type);
    setContractDialogOpen(true);
  };

  const downloadPreInfoPDF = async (order: ContractOrder) => {
    try {
      // PDF service'ını import edelim
      const { generatePreInfoPDF } = await import('@/services/pdfService');
      
      const pdf = await generatePreInfoPDF(order.id);
      
      // Download PDF
      const currentDate = new Date().toLocaleDateString('tr-TR').replace(/\./g, '-');
      const firstName = order.customer_name.split(' ')[0] || 'Müşteri';
      const lastName = order.customer_name.split(' ')[1] || '';
      const fileName = `${firstName}_${lastName}_OnBilgilendirme_${currentDate}.pdf`;
      pdf.save(fileName);

      toast({
        title: "Başarılı",
        description: "Ön bilgilendirme formu PDF olarak indirildi.",
      });
    } catch (error) {
      console.error('PDF indirme hatası:', error);
      toast({
        title: "Hata",
        description: "PDF dosyası indirilirken hata oluştu",
        variant: "destructive",
      });
    }
  };

  const downloadDistanceSalesPDF = async (order: ContractOrder) => {
    try {
      // PDF service'ını import edelim
      const { generateDistanceSalesPDF } = await import('@/services/pdfService');
      
      const customerData = {
        name: order.customer_name.split(' ')[0] || '',
        surname: order.customer_name.split(' ').slice(1).join(' ') || '',
        email: order.customer_email,
        phone: order.customer_phone,
        tcNo: '',
        address: '',
        city: '',
        postalCode: ''
      };

      const packageData = {
        name: order.package_name,
        price: order.amount,
        originalPrice: order.amount
      };
      
      const pdf = generateDistanceSalesPDF(
        customerData,
        packageData,
        order.payment_method,
        order.customer_type,
        ''
      );
      
      // Download PDF
      const currentDate = new Date().toLocaleDateString('tr-TR').replace(/\./g, '-');
      const firstName = order.customer_name.split(' ')[0] || 'Müşteri';
      const lastName = order.customer_name.split(' ')[1] || '';
      const fileName = `${firstName}_${lastName}_MesafeliSatis_${currentDate}.pdf`;
      pdf.save(fileName);

      toast({
        title: "Başarılı",
        description: "Mesafeli satış sözleşmesi PDF olarak indirildi.",
      });
    } catch (error) {
      console.error('PDF indirme hatası:', error);
      toast({
        title: "Hata",
        description: "PDF dosyası indirilirken hata oluştu",
        variant: "destructive",
      });
    }
  };

  const deleteContract = async (order: ContractOrder) => {
    if (!confirm(`${order.customer_name} müşterisinin sözleşmesini silmek istediğinizden emin misiniz?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', order.id);

      if (error) throw error;

      toast({
        title: "Başarılı",
        description: "Sözleşme başarıyla silindi.",
      });

      // Listeyi yenile
      fetchOrders();
    } catch (error) {
      console.error('Sözleşme silme hatası:', error);
      toast({
        title: "Hata",
        description: "Sözleşme silinirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.package_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === "all" || order.customer_type === filterType;
    
    return matchesSearch && matchesFilter;
  });

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-rose-50 flex items-center justify-center">
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Erişim Reddedildi</h2>
          <p className="text-gray-600">Bu sayfaya erişim yetkiniz bulunmamaktadır.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
        <title>Sözleşmeler - Divan Paneli</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <AdminTopBar userRole={userProfile?.role || 'user'} />
        
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center gap-4 mb-8">
            <AdminBackButton />
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-xl shadow-lg">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Sözleşmeler</h1>
                <p className="text-gray-600 mt-1">Müşteri ön bilgilendirme ve mesafeli satış sözleşmeleri</p>
              </div>
            </div>
          </div>

          {/* Modern Filters */}
          <Card className="mb-8 bg-white/70 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                  <Filter className="w-5 h-5 text-white" />
                </div>
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Filtreler
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="search" className="text-sm font-medium text-gray-700">Müşteri / E-posta / Paket Ara</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      id="search"
                      type="text"
                      placeholder="Arama yapmak için yazın..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-11 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="filter" className="text-sm font-medium text-gray-700">Müşteri Tipi</Label>
                  <select
                    id="filter"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as "all" | "individual" | "company")}
                    className="w-full h-12 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    <option value="all">Tümü</option>
                    <option value="individual">Bireysel</option>
                    <option value="company">Kurumsal</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <Button
                    onClick={fetchOrders}
                    variant="outline"
                    className="h-12 px-6 border-gray-200 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 rounded-xl transition-all duration-200 flex items-center gap-2"
                  >
                    <RefreshCw className="w-5 h-5" />
                    Yenile
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Modern Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600 mb-1">Toplam Sözleşme</p>
                    <p className="text-3xl font-bold text-blue-900">{orders.length}</p>
                  </div>
                  <div className="p-3 bg-blue-500 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-200">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-50 to-green-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-emerald-600 mb-1">Bireysel</p>
                    <p className="text-3xl font-bold text-emerald-900">
                      {orders.filter(o => o.customer_type === 'individual').length}
                    </p>
                  </div>
                  <div className="p-3 bg-emerald-500 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-200">
                    <User className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-violet-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600 mb-1">Kurumsal</p>
                    <p className="text-3xl font-bold text-purple-900">
                      {orders.filter(o => o.customer_type === 'company').length}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-500 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-200">
                    <Building className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-50 to-orange-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-amber-600 mb-1">Filtreli</p>
                    <p className="text-3xl font-bold text-amber-900">{filteredOrders.length}</p>
                  </div>
                  <div className="p-3 bg-amber-500 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-200">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Modern Contracts List */}
          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                    Sözleşme Listesi
                  </span>
                </div>
                <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 text-sm font-medium">
                  {filteredOrders.length} sonuç
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {loading ? (
                <div className="text-center py-12">
                  <div className="relative">
                    <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <Loader2 className="w-8 h-8 animate-spin text-white" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Sözleşmeler Yükleniyor</h3>
                  <p className="text-gray-600">Lütfen bekleyiniz...</p>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                    <FileText className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Sözleşme Bulunamadı</h3>
                  <p className="text-gray-600 max-w-md mx-auto">
                    {searchTerm || filterType !== "all" ? "Arama kriterlerinize uygun sözleşme bulunamadı. Filtreleri değiştirmeyi deneyin." : "Henüz hiç sözleşme bulunmuyor. İlk sözleşmeniz oluşturulduğunda burada görünecek."}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredOrders.map((order, index) => (
                    <Card 
                      key={order.id} 
                      className="bg-white border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all duration-300 group animate-fade-in"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <CardContent className="p-6">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                          <div className="flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                                  <User className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                    {order.customer_name}
                                  </h3>
                                  <p className="text-sm text-gray-500">{order.customer_email}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 mt-3 sm:mt-0">
                                <Badge 
                                  className={`px-3 py-1 text-xs font-medium ${
                                    order.customer_type === 'individual' 
                                      ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white' 
                                      : 'bg-gradient-to-r from-purple-500 to-violet-600 text-white'
                                  }`}
                                >
                                  {order.customer_type === 'individual' ? 'Bireysel' : 'Kurumsal'}
                                </Badge>
                                <Badge 
                                  className={`px-3 py-1 text-xs font-medium ${
                                    order.status === 'approved' 
                                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white' 
                                      : order.status === 'completed'
                                      ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white'
                                      : order.status === 'pending'
                                      ? 'bg-gradient-to-r from-yellow-500 to-orange-600 text-white'
                                      : 'bg-gradient-to-r from-gray-500 to-slate-600 text-white'
                                  }`}
                                >
                                  {order.status === 'approved' ? 'Onaylandı' 
                                   : order.status === 'completed' ? 'Tamamlandı'
                                   : order.status === 'pending' ? 'Bekliyor'
                                   : order.status}
                                </Badge>
                                <Badge variant="outline" className="text-xs border-gray-300 text-gray-600">
                                  {format(new Date(order.created_at), 'dd MMM yyyy', { locale: tr })}
                                </Badge>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                <div className="p-2 bg-blue-500 rounded-lg">
                                  <Package className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 uppercase tracking-wide">Paket</p>
                                  <p className="text-sm font-semibold text-gray-900">{order.package_name}</p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                <div className="p-2 bg-emerald-500 rounded-lg">
                                  <CreditCard className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 uppercase tracking-wide">Tutar</p>
                                  <p className="text-sm font-semibold text-gray-900">{order.amount.toLocaleString('tr-TR')} ₺</p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                <div className="p-2 bg-purple-500 rounded-lg">
                                  <Calendar className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 uppercase tracking-wide">Telefon</p>
                                  <p className="text-sm font-semibold text-gray-900">{order.customer_phone}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-col sm:flex-row items-center gap-2 flex-wrap">
                            <Button
                              onClick={() => openContractDialog(order, "preInfo")}
                              size="sm"
                              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 px-4"
                            >
                              <Eye className="w-4 h-4" />
                              Ön Bilgi
                            </Button>
                            
                            <Button
                              onClick={() => openContractDialog(order, "distanceSales")}
                              size="sm"
                              className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 px-4"
                            >
                              <Eye className="w-4 h-4" />
                              Mesafeli Satış
                            </Button>

                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Contract Dialog */}
        {selectedOrder && (
          <ContractDialog
            open={contractDialogOpen}
            onClose={() => setContractDialogOpen(false)}
            contractType={contractType}
            formData={{
              name: selectedOrder.customer_name.split(' ')[0] || '',
              surname: selectedOrder.customer_name.split(' ').slice(1).join(' ') || '',
              email: selectedOrder.customer_email,
              phone: selectedOrder.customer_phone,
              tcNo: selectedOrder.customer_tc_no,
              address: selectedOrder.customer_address,
              city: selectedOrder.customer_city
            }}
            selectedPackage={{
              name: selectedOrder.package_name,
              price: selectedOrder.amount,
              features: selectedOrder.package_features || []
            }}
            paymentMethod={selectedOrder.payment_method}
            customerType={selectedOrder.customer_type}
            clientIP={selectedOrder.contract_ip_address || '127.0.0.1'}
            orderCreatedAt={selectedOrder.created_at}
            savedPreInfoHtml={selectedOrder.pre_info_pdf_content || undefined}
            savedDistanceSalesHtml={selectedOrder.distance_sales_pdf_content || undefined}
          />
        )}
      </div>
    </>
  );
};

export default ContractManagement;