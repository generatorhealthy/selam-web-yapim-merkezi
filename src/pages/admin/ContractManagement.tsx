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
  created_at: string;
  pre_info_pdf_content: string | null;
  distance_sales_pdf_content: string | null;
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
            created_at,
            pre_info_pdf_content,
            distance_sales_pdf_content
          `)
          .not('pre_info_pdf_content', 'is', null)
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

          {/* Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filtreler
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="search">Müşteri / E-posta / Paket Ara</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="search"
                      type="text"
                      placeholder="Arama yapmak için yazın..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="filter">Müşteri Tipi</Label>
                  <select
                    id="filter"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as "all" | "individual" | "company")}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Yenile
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Toplam Sözleşme</p>
                    <p className="text-xl font-bold text-gray-900">{orders.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <User className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Bireysel</p>
                    <p className="text-xl font-bold text-gray-900">
                      {orders.filter(o => o.customer_type === 'individual').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Building className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Kurumsal</p>
                    <p className="text-xl font-bold text-gray-900">
                      {orders.filter(o => o.customer_type === 'company').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <Package className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Filtreli</p>
                    <p className="text-xl font-bold text-gray-900">{filteredOrders.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contracts List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Sözleşme Listesi</span>
                <Badge variant="secondary">{filteredOrders.length} sonuç</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
                  <p className="text-gray-600">Sözleşmeler yükleniyor...</p>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Sözleşme Bulunamadı</h3>
                  <p className="text-gray-600">
                    {searchTerm || filterType !== "all" ? "Arama kriterlerinize uygun sözleşme bulunamadı." : "Henüz hiç sözleşme bulunmuyor."}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredOrders.map((order) => (
                    <Card key={order.id} className="border border-gray-200 hover:border-gray-300 transition-colors">
                      <CardContent className="p-6">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3">
                              <h3 className="text-lg font-semibold text-gray-900">{order.customer_name}</h3>
                              <div className="flex items-center gap-2 mt-2 sm:mt-0">
                                <Badge variant={order.customer_type === 'individual' ? 'default' : 'secondary'}>
                                  {order.customer_type === 'individual' ? 'Bireysel' : 'Kurumsal'}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {format(new Date(order.created_at), 'dd MMM yyyy', { locale: tr })}
                                </Badge>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4" />
                                <span>{order.customer_email}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Package className="w-4 h-4" />
                                <span>{order.package_name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <CreditCard className="w-4 h-4" />
                                <span>{order.amount.toLocaleString('tr-TR')} ₺</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                <span>{order.customer_phone}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 flex-wrap">
                            <Button
                              onClick={() => openContractDialog(order, "preInfo")}
                              size="sm"
                              className="flex items-center gap-2"
                            >
                              <Eye className="w-4 h-4" />
                              Ön Bilgi
                            </Button>
                            
                            <Button
                              onClick={() => openContractDialog(order, "distanceSales")}
                              size="sm"
                              variant="outline"
                              className="flex items-center gap-2"
                            >
                              <Eye className="w-4 h-4" />
                              Mesafeli Satış
                            </Button>

                            <Button
                              onClick={() => deleteContract(order)}
                              size="sm"
                              variant="destructive"
                              className="flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              Sil
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
            clientIP="Admin Panel"
          />
        )}
      </div>
    </>
  );
};

export default ContractManagement;