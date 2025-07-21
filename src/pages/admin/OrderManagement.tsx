import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import AdminBackButton from "@/components/AdminBackButton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, Clock, DollarSign, Users, RefreshCw, Search, Filter, CheckCircle, XCircle, AlertCircle, FileText, Send, Download, Check, Trash2, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Checkbox } from "@/components/ui/checkbox";

interface Order {
  id: string;
  customer_name: string;
  customer_email: string;
  package_name: string;
  amount: number;
  status: "pending" | "completed" | "cancelled" | "approved";
  created_at: string;
  customer_phone: string;
  customer_address: string;
  customer_city: string;
  customer_tc_no: string;
  company_name: string;
  company_tax_no: string;
  company_tax_office: string;
  package_type: string;
  payment_method: string;
  is_first_order: boolean;
  subscription_month: number;
  deleted_at?: string;
}

interface AutomaticOrder {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  customer_city: string;
  customer_tc_no: string;
  company_name: string;
  company_tax_no: string;
  company_tax_office: string;
  package_name: string;
  amount: number;
  created_at: string;
  package_type: string;
  payment_method: string;
  is_active: boolean;
  customer_type: string;
  registration_date: string;
  monthly_payment_day: number;
  total_months: number;
  paid_months: number[];
  current_month: number;
  updated_at: string;
}

const OrderManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [activeTab, setActiveTab] = useState("orders");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);

  const {
    data: orders,
    isLoading: isOrdersLoading,
    error: ordersError,
  } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Order[];
    },
  });

  // Silinen siparişler için ayrı query
  const {
    data: deletedOrders,
    isLoading: isDeletedOrdersLoading,
    error: deletedOrdersError,
  } = useQuery({
    queryKey: ["deleted_orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .not("deleted_at", "is", null)
        .order("deleted_at", { ascending: false });
      if (error) throw error;
      return data as Order[];
    },
  });

  const {
    data: automaticOrders,
    isLoading: isAutomaticOrdersLoading,
    error: automaticOrdersError,
  } = useQuery({
    queryKey: ["automatic_orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("automatic_orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as AutomaticOrder[];
    },
  });

  const updateOrderMutation = useMutation({
    mutationFn: async (order: Order) => {
      const { data, error } = await supabase
        .from("orders")
        .update(order)
        .eq("id", order.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Sipariş Güncellendi",
        description: "Sipariş başarıyla güncellendi",
      });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      setEditingOrder(null);
      setSelectedOrder(null);
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: "Sipariş güncellenirken hata oluştu",
        variant: "destructive",
      });
      console.error("Error updating order:", error);
    },
  });

  const deleteOrderMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("orders")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Sipariş Çöp Kutusuna Taşındı",
        description: "Sipariş başarıyla çöp kutusuna taşındı",
      });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["deleted_orders"] });
      setSelectedOrder(null);
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: "Sipariş silinirken hata oluştu",
        variant: "destructive",
      });
      console.error("Error deleting order:", error);
    },
  });

  // Kalıcı silme mutation
  const permanentDeleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.from("orders").delete().eq("id", id);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Sipariş Kalıcı Olarak Silindi",
        description: "Sipariş veritabanından kalıcı olarak silindi",
      });
      queryClient.invalidateQueries({ queryKey: ["deleted_orders"] });
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: "Sipariş kalıcı olarak silinirken hata oluştu",
        variant: "destructive",
      });
      console.error("Error permanently deleting order:", error);
    },
  });

  // Geri getirme mutation
  const restoreOrderMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("orders")
        .update({ deleted_at: null })
        .eq("id", id);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Sipariş Geri Getirildi",
        description: "Sipariş başarıyla geri getirildi",
      });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["deleted_orders"] });
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: "Sipariş geri getirilirken hata oluştu",
        variant: "destructive",
      });
      console.error("Error restoring order:", error);
    },
  });

  // Toplu onay mutation
  const bulkApproveMutation = useMutation({
    mutationFn: async (orderIds: string[]) => {
      const { data, error } = await supabase
        .from("orders")
        .update({ status: "approved" })
        .in("id", orderIds);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Siparişler Onaylandı",
        description: `${selectedOrders.length} sipariş başarıyla onaylandı`,
      });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      setSelectedOrders([]);
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: "Siparişler onaylanırken hata oluştu",
        variant: "destructive",
      });
      console.error("Error bulk approving orders:", error);
    },
  });

  // Toplu silme mutation (çöp kutusuna taşıma)
  const bulkDeleteMutation = useMutation({
    mutationFn: async (orderIds: string[]) => {
      const { data, error } = await supabase
        .from("orders")
        .update({ deleted_at: new Date().toISOString() })
        .in("id", orderIds);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Siparişler Çöp Kutusuna Taşındı",
        description: `${selectedOrders.length} sipariş başarıyla çöp kutusuna taşındı`,
      });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["deleted_orders"] });
      setSelectedOrders([]);
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: "Siparişler silinirken hata oluştu",
        variant: "destructive",
      });
      console.error("Error bulk deleting orders:", error);
    },
  });

  // PDF indirme fonksiyonu
  const downloadPDF = async (orderId: string, type: 'pre_info' | 'distance_sales') => {
    try {
      const { data: orderData, error } = await supabase
        .from("orders")
        .select("pre_info_pdf_content, distance_sales_pdf_content, customer_name")
        .eq("id", orderId)
        .single();

      if (error) throw error;

      const pdfContent = type === 'pre_info' 
        ? orderData.pre_info_pdf_content 
        : orderData.distance_sales_pdf_content;

      if (!pdfContent) {
        toast({
          title: "PDF Bulunamadı",
          description: "Bu sipariş için PDF henüz oluşturulmamış",
          variant: "destructive",
        });
        return;
      }

      // Base64'ü blob'a dönüştür
      const byteCharacters = atob(pdfContent);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });

      // İndirme linkini oluştur
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const fileName = type === 'pre_info' 
        ? `${orderData.customer_name}_on_bilgilendirme_formu.pdf`
        : `${orderData.customer_name}_mesafeli_satis_sozlesmesi.pdf`;
      
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "PDF İndirildi",
        description: "PDF başarıyla indirildi",
      });
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast({
        title: "Hata",
        description: "PDF indirilirken hata oluştu",
        variant: "destructive",
      });
    }
  };

  const generateOrdersMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('generate-monthly-orders', {
        body: { manual: true }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Otomatik Siparişler Oluşturuldu",
        description: `${data.details?.orders_created || 0} yeni sipariş oluşturuldu`,
      });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: "Otomatik siparişler oluşturulurken hata oluştu",
        variant: "destructive",
      });
      console.error("Error generating orders:", error);
    },
  });

  const sendContractEmailsMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const { data, error } = await supabase.functions.invoke('send-contract-emails', {
        body: { orderId }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Sözleşmeler Gönderildi",
        description: "Sözleşme e-postaları başarıyla gönderildi",
      });
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: "Sözleşmeler gönderilirken hata oluştu",
        variant: "destructive",
      });
      console.error("Error sending contract emails:", error);
    },
  });

  const handleUpdateOrder = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, field: string) => {
    if (editingOrder) {
      setEditingOrder({ ...editingOrder, [field]: e.target.value });
    }
  };

  const handleSaveOrder = () => {
    if (editingOrder) {
      updateOrderMutation.mutate(editingOrder);
    }
  };

  const handleDeleteOrder = (id: string) => {
    deleteOrderMutation.mutate(id);
  };

  const handleCancelEdit = () => {
    setEditingOrder(null);
    setSelectedOrder(null);
  };

  // Checkbox işlemleri
  const handleSelectOrder = (orderId: string, checked: boolean) => {
    if (checked) {
      setSelectedOrders([...selectedOrders, orderId]);
    } else {
      setSelectedOrders(selectedOrders.filter(id => id !== orderId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedOrders(filteredOrders?.map(order => order.id) || []);
    } else {
      setSelectedOrders([]);
    }
  };

  const handleBulkApprove = () => {
    if (selectedOrders.length === 0) {
      toast({
        title: "Uyarı",
        description: "Lütfen onaylanacak siparişleri seçin",
        variant: "destructive",
      });
      return;
    }
    bulkApproveMutation.mutate(selectedOrders);
  };

  const handleBulkDelete = () => {
    if (selectedOrders.length === 0) {
      toast({
        title: "Uyarı", 
        description: "Lütfen silinecek siparişleri seçin",
        variant: "destructive",
      });
      return;
    }
    
    if (confirm(`${selectedOrders.length} siparişi silmek istediğinizden emin misiniz?`)) {
      bulkDeleteMutation.mutate(selectedOrders);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "cancelled":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "pending":
      default:
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "approved":
      case "completed":
        return "default";
      case "cancelled":
        return "destructive";
      case "pending":
      default:
        return "secondary";
    }
  };

  const filteredOrders = orders?.filter(order => {
    const matchesSearch = order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.package_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredAutomaticOrders = automaticOrders?.filter(order => {
    return order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           order.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
           order.package_name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  console.log("DEBUG: activeTab:", activeTab);
  console.log("DEBUG: deletedOrders:", deletedOrders);
  console.log("DEBUG: Component rendering...");

  return (
    <div className="container mx-auto p-6 space-y-6">
      <AdminBackButton />
      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sipariş Yönetimi</h1>
          <p className="text-gray-600 mt-1">Tüm siparişleri ve otomatik sipariş sistemini yönetin</p>
        </div>
        <Button
          onClick={() => generateOrdersMutation.mutate()}
          disabled={generateOrdersMutation.isPending}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${generateOrdersMutation.isPending ? 'animate-spin' : ''}`} />
          Otomatik Sipariş Oluştur
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Toplam Sipariş</p>
                <p className="text-2xl font-bold text-blue-600">{orders?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Onaylanan</p>
                <p className="text-2xl font-bold text-green-600">
                  {orders?.filter(o => o.status === 'approved' || o.status === 'completed').length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Bekleyen</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {orders?.filter(o => o.status === 'pending').length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Toplam Tutar</p>
                <p className="text-2xl font-bold text-purple-600">
                  {orders?.reduce((sum, order) => sum + order.amount, 0).toLocaleString('tr-TR')} ₺
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Siparişler
          </TabsTrigger>
          <TabsTrigger value="trash" className="flex items-center gap-2">
            <Trash2 className="w-4 h-4" />
            Çöp Kutusu ({deletedOrders?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="automatic" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Otomatik Siparişler
          </TabsTrigger>
        </TabsList>

        {/* Search and Filter Bar */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Müşteri adı, email veya paket adı ile ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              {activeTab === "orders" && (
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Durum filtrele" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Durumlar</SelectItem>
                    <SelectItem value="pending">Bekleyen</SelectItem>
                    <SelectItem value="approved">Onaylanan</SelectItem>
                    <SelectItem value="completed">Tamamlanan</SelectItem>
                    <SelectItem value="cancelled">İptal Edilen</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </CardContent>
        </Card>

        <TabsContent value="orders" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Sipariş Listesi ({filteredOrders?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Toplu İşlemler */}
              {filteredOrders && filteredOrders.length > 0 && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                      <span className="text-sm font-medium">
                        {selectedOrders.length > 0 
                          ? `${selectedOrders.length} sipariş seçildi`
                          : "Tümünü seç"
                        }
                      </span>
                    </div>
                    
                    {selectedOrders.length > 0 && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={handleBulkApprove}
                          disabled={bulkApproveMutation.isPending}
                          className="flex items-center gap-1"
                        >
                          <Check className="w-4 h-4" />
                          Toplu Onay ({selectedOrders.length})
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={handleBulkDelete}
                          disabled={bulkDeleteMutation.isPending}
                          className="flex items-center gap-1"
                        >
                          <Trash2 className="w-4 h-4" />
                          Toplu Sil ({selectedOrders.length})
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {isOrdersLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : ordersError ? (
                <div className="text-center py-8 text-red-600">
                  Hata: {ordersError.message}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedOrders.length === filteredOrders?.length && filteredOrders.length > 0}
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                        <TableHead>Müşteri</TableHead>
                        <TableHead>Paket</TableHead>
                        <TableHead>Tutar</TableHead>
                        <TableHead>Durum</TableHead>
                        <TableHead>Tarih</TableHead>
                        <TableHead>Ay</TableHead>
                        <TableHead className="text-right">İşlemler</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrders?.map((order) => (
                        <TableRow key={order.id} className="hover:bg-gray-50">
                          <TableCell>
                            <Checkbox
                              checked={selectedOrders.includes(order.id)}
                              onCheckedChange={(checked) => handleSelectOrder(order.id, checked as boolean)}
                            />
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{order.customer_name}</div>
                              <div className="text-sm text-gray-500">{order.customer_email}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{order.package_name}</div>
                          </TableCell>
                          <TableCell>
                            <div className="font-semibold">{order.amount.toLocaleString('tr-TR')} ₺</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(order.status)} className="flex items-center gap-1 w-fit">
                              {getStatusIcon(order.status)}
                              {order.status === 'pending' ? 'Bekleyen' : 
                               order.status === 'approved' ? 'Onaylanan' :
                               order.status === 'completed' ? 'Tamamlanan' : 'İptal'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {format(new Date(order.created_at), "dd MMM yyyy", { locale: tr })}
                          </TableCell>
                          <TableCell>
                            {order.subscription_month ? (
                              <Badge variant="outline">{order.subscription_month}. Ay</Badge>
                            ) : (
                              <Badge variant="secondary">İlk Sipariş</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end flex-wrap">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setEditingOrder(order);
                                }}
                              >
                                Düzenle
                              </Button>
                              
                              {/* PDF İndirme Butonları */}
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => downloadPDF(order.id, 'pre_info')}
                                className="flex items-center gap-1"
                                title="Ön Bilgilendirme Formu İndir"
                              >
                                <Download className="w-3 h-3" />
                                Ön Bilgi
                              </Button>
                              
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => downloadPDF(order.id, 'distance_sales')}
                                className="flex items-center gap-1"
                                title="Mesafeli Satış Sözleşmesi İndir"
                              >
                                <Download className="w-3 h-3" />
                                Sözleşme
                              </Button>

                              {order.is_first_order && (
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => sendContractEmailsMutation.mutate(order.id)}
                                  disabled={sendContractEmailsMutation.isPending}
                                  className="flex items-center gap-1"
                                >
                                  <Send className="w-3 h-3" />
                                  Sözleşme Gönder
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {selectedOrder && (
            <Card>
              <CardHeader>
                <CardTitle>Sipariş Detayları</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {editingOrder ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="customer_name">Müşteri Adı</Label>
                      <Input
                        type="text"
                        id="customer_name"
                        value={editingOrder.customer_name}
                        onChange={(e) => handleUpdateOrder(e, "customer_name")}
                      />
                    </div>
                    <div>
                      <Label htmlFor="customer_email">Müşteri Email</Label>
                      <Input
                        type="email"
                        id="customer_email"
                        value={editingOrder.customer_email}
                        onChange={(e) => handleUpdateOrder(e, "customer_email")}
                      />
                    </div>
                    <div>
                      <Label htmlFor="package_name">Paket Adı</Label>
                      <Input
                        type="text"
                        id="package_name"
                        value={editingOrder.package_name}
                        onChange={(e) => handleUpdateOrder(e, "package_name")}
                      />
                    </div>
                    <div>
                      <Label htmlFor="amount">Tutar</Label>
                      <Input
                        type="number"
                        id="amount"
                        value={editingOrder.amount}
                        onChange={(e) => handleUpdateOrder(e, "amount")}
                      />
                    </div>
                    <div>
                      <Label htmlFor="status">Durum</Label>
                      <Select
                        value={editingOrder.status}
                        onValueChange={(value) =>
                          setEditingOrder({ ...editingOrder, status: value as "pending" | "completed" | "cancelled" | "approved" })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={editingOrder.status} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Beklemede</SelectItem>
                          <SelectItem value="approved">Onaylandı</SelectItem>
                          <SelectItem value="completed">Tamamlandı</SelectItem>
                          <SelectItem value="cancelled">İptal Edildi</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-end gap-2 md:col-span-2">
                      <Button variant="ghost" onClick={handleCancelEdit}>
                        İptal
                      </Button>
                      <Button onClick={handleSaveOrder}>Kaydet</Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleDeleteOrder(selectedOrder.id)}
                        disabled={deleteOrderMutation.isPending}
                      >
                        {deleteOrderMutation.isPending ? "Siliniyor..." : "Sil"}
                      </Button>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="trash" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trash2 className="w-5 h-5" />
                Çöp Kutusu ({deletedOrders?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isDeletedOrdersLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : deletedOrdersError ? (
                <div className="text-center py-8 text-red-600">
                  Hata: {deletedOrdersError.message}
                </div>
              ) : deletedOrders && deletedOrders.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Çöp kutusunda sipariş bulunmuyor.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Müşteri</TableHead>
                        <TableHead>Paket</TableHead>
                        <TableHead>Tutar</TableHead>
                        <TableHead>Durum</TableHead>
                        <TableHead>Silinme Tarihi</TableHead>
                        <TableHead className="text-right">İşlemler</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {deletedOrders?.map((order) => (
                        <TableRow key={order.id} className="hover:bg-gray-50">
                          <TableCell>
                            <div>
                              <div className="font-medium">{order.customer_name}</div>
                              <div className="text-sm text-gray-500">{order.customer_email}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{order.package_name}</div>
                          </TableCell>
                          <TableCell>
                            <div className="font-semibold">{order.amount.toLocaleString('tr-TR')} ₺</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(order.status)} className="flex items-center gap-1 w-fit">
                              {getStatusIcon(order.status)}
                              {order.status === 'pending' ? 'Bekleyen' : 
                               order.status === 'approved' ? 'Onaylanan' :
                               order.status === 'completed' ? 'Tamamlanan' : 'İptal'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {order.deleted_at && format(new Date(order.deleted_at), "dd MMM yyyy", { locale: tr })}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => restoreOrderMutation.mutate(order.id)}
                                disabled={restoreOrderMutation.isPending}
                                className="flex items-center gap-1"
                              >
                                <RotateCcw className="w-3 h-3" />
                                Geri Getir
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  if (confirm('Bu siparişi kalıcı olarak silmek istediğinizden emin misiniz?')) {
                                    permanentDeleteMutation.mutate(order.id);
                                  }
                                }}
                                disabled={permanentDeleteMutation.isPending}
                                className="flex items-center gap-1"
                              >
                                <Trash2 className="w-3 h-3" />
                                Kalıcı Sil
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automatic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Otomatik Sipariş Sistemi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2">Sistem Durumu</h3>
                  <p className="text-blue-700 text-sm">
                    Otomatik sipariş sistemi her gün saat 09:00'da çalışır ve ödeme tarihi gelen müşteriler için otomatik sipariş oluşturur.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="text-sm text-gray-600">Aktif Müşteriler</p>
                          <p className="text-2xl font-bold text-green-600">
                            {automaticOrders?.filter(order => order.is_active).length || 0}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="text-sm text-gray-600">Bu Ay Bekleyen</p>
                          <p className="text-2xl font-bold text-blue-600">
                            {orders?.filter(order => 
                              order.status === 'pending' && 
                              order.subscription_month && 
                              order.subscription_month > 1
                            ).length || 0}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-purple-600" />
                        <div>
                          <p className="text-sm text-gray-600">Toplam Tutar</p>
                          <p className="text-2xl font-bold text-purple-600">
                            {automaticOrders?.reduce((sum, order) => sum + order.amount, 0).toLocaleString('tr-TR')} ₺
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Button
                  onClick={() => generateOrdersMutation.mutate()}
                  disabled={generateOrdersMutation.isPending}
                  className="w-full"
                >
                  {generateOrdersMutation.isPending ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Otomatik Siparişler Oluşturuluyor...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Manuel Otomatik Sipariş Oluştur
                    </>
                  )}
                </Button>

                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-4">Otomatik Sipariş Listesi ({filteredAutomaticOrders?.length || 0})</h3>
                  {isAutomaticOrdersLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    </div>
                  ) : automaticOrdersError ? (
                    <div className="text-center py-8 text-red-600">
                      Hata: {automaticOrdersError.message}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Müşteri</TableHead>
                            <TableHead>Paket</TableHead>
                            <TableHead>Tutar</TableHead>
                            <TableHead>Ödeme Günü</TableHead>
                            <TableHead>Ödenen Aylar</TableHead>
                            <TableHead>Toplam Ay</TableHead>
                            <TableHead>Durum</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredAutomaticOrders?.map((order) => (
                            <TableRow key={order.id} className="hover:bg-gray-50">
                              <TableCell>
                                <div>
                                  <div className="font-medium">{order.customer_name}</div>
                                  <div className="text-sm text-gray-500">{order.customer_email}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="font-medium">{order.package_name}</div>
                              </TableCell>
                              <TableCell>
                                <div className="font-semibold">{order.amount.toLocaleString('tr-TR')} ₺</div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{order.monthly_payment_day}. Gün</Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1">
                                  {order.paid_months?.slice(0, 6).map((month) => (
                                    <Badge key={month} variant="secondary" className="text-xs">
                                      {month}
                                    </Badge>
                                  ))}
                                  {order.paid_months?.length > 6 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{order.paid_months.length - 6}
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{order.total_months} Ay</Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant={order.is_active ? "default" : "destructive"}>
                                  {order.is_active ? "Aktif" : "Pasif"}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OrderManagement;

// Cache buster comment to force rebuild
// Force rebuild with checkbox features
