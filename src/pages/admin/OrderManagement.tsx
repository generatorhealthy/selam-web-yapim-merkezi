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

// CRITICAL TEST - Component loading check
console.error("🚨 OrderManagement component is loading! 🚨");
alert("OrderManagement component loaded!");
(window as any).TESTVAR = "WORKING";

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
  package_type: string;
  amount: number;
  registration_date: string;
  monthly_payment_day: number;
  total_months: number;
  paid_months: number[];
  current_month: number;
  is_active: boolean;
  payment_method: string;
  customer_type: string;
  created_at: string;
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

  // Normal siparişler
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

  // Silinen siparişler
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

  // Otomatik siparişler
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

  // Sipariş silme (çöp kutusuna taşıma)
  const deleteOrderMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("orders")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["deleted_orders"] });
      toast({
        title: "Sipariş Çöp Kutusuna Taşındı",
        description: "Sipariş başarıyla çöp kutusuna taşındı",
      });
    },
  });

  // Sipariş geri getirme
  const restoreOrderMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("orders")
        .update({ deleted_at: null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["deleted_orders"] });
      toast({
        title: "Sipariş Geri Getirildi",
        description: "Sipariş başarıyla geri getirildi",
      });
    },
  });

  // Kalıcı silme
  const permanentDeleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("orders")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deleted_orders"] });
      toast({
        title: "Sipariş Kalıcı Olarak Silindi",
        description: "Sipariş veritabanından kalıcı olarak silindi",
      });
    },
  });

  // Toplu silme
  const bulkDeleteMutation = useMutation({
    mutationFn: async (orderIds: string[]) => {
      const { error } = await supabase
        .from("orders")
        .update({ deleted_at: new Date().toISOString() })
        .in("id", orderIds);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["deleted_orders"] });
      setSelectedOrders([]);
      toast({
        title: "Siparişler Çöp Kutusuna Taşındı",
        description: `${selectedOrders.length} sipariş başarıyla çöp kutusuna taşındı`,
      });
    },
  });

  // Toplu onaylama
  const bulkApproveMutation = useMutation({
    mutationFn: async (orderIds: string[]) => {
      const { error } = await supabase
        .from("orders")
        .update({ status: "approved" })
        .in("id", orderIds);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      setSelectedOrders([]);
      toast({
        title: "Siparişler Onaylandı",
        description: `${selectedOrders.length} sipariş başarıyla onaylandı`,
      });
    },
  });

  // Sipariş güncelleme
  const updateOrderMutation = useMutation({
    mutationFn: async (order: Order) => {
      const { error } = await supabase
        .from("orders")
        .update({
          customer_name: order.customer_name,
          customer_email: order.customer_email,
          customer_phone: order.customer_phone,
          package_name: order.package_name,
          amount: order.amount,
          status: order.status,
        })
        .eq("id", order.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      setEditingOrder(null);
      toast({
        title: "Sipariş Güncellendi",
        description: "Sipariş başarıyla güncellendi",
      });
    },
  });

  // Filtreleme
  const filteredOrders = orders?.filter((order) => {
    const matchesSearch = 
      order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.package_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const filteredDeletedOrders = deletedOrders?.filter((order) =>
    order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.package_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAutomaticOrders = automaticOrders?.filter((order) =>
    order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.package_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Checkbox işlemleri
  const handleSelectOrder = (orderId: string) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleSelectAll = () => {
    if (selectedOrders.length === filteredOrders?.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(filteredOrders?.map(order => order.id) || []);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { label: "Beklemede", variant: "secondary" as const },
      approved: { label: "Onaylandı", variant: "default" as const },
      completed: { label: "Tamamlandı", variant: "default" as const },
      cancelled: { label: "İptal Edildi", variant: "destructive" as const },
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap];
    return (
      <Badge variant={statusInfo?.variant || "secondary"}>
        {statusInfo?.label || status}
      </Badge>
    );
  };

  console.log("OrderManagement rendered - activeTab:", activeTab);
  console.log("Orders:", orders?.length);
  console.log("DeletedOrders:", deletedOrders?.length);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <AdminBackButton />
      
      {/* Başlık ve İstatistikler */}
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Sipariş Yönetimi</h1>
          <Button 
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ["orders"] });
              queryClient.invalidateQueries({ queryKey: ["deleted_orders"] });
              queryClient.invalidateQueries({ queryKey: ["automatic_orders"] });
            }}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Yenile
          </Button>
        </div>

        {/* İstatistik Kartları */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Toplam Sipariş</p>
                  <p className="text-2xl font-bold">{orders?.length || 0}</p>
                </div>
                <Calendar className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Bekleyen</p>
                  <p className="text-2xl font-bold">
                    {orders?.filter(o => o.status === "pending").length || 0}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Toplam Gelir</p>
                  <p className="text-2xl font-bold">
                    ₺{orders?.reduce((sum, order) => sum + Number(order.amount), 0).toLocaleString('tr-TR') || 0}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Çöp Kutusu</p>
                  <p className="text-2xl font-bold">{deletedOrders?.length || 0}</p>
                </div>
                <Trash2 className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Sekmeler */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-muted rounded-lg p-1">
          <TabsTrigger 
            value="orders" 
            className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground"
          >
            <Calendar className="w-4 h-4" />
            Siparişler ({orders?.length || 0})
          </TabsTrigger>
          <TabsTrigger 
            value="trash" 
            className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground"
          >
            <Trash2 className="w-4 h-4" />
            Çöp Kutusu ({deletedOrders?.length || 0})
          </TabsTrigger>
          <TabsTrigger 
            value="automatic" 
            className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground"
          >
            <Clock className="w-4 h-4" />
            Otomatik Siparişler ({automaticOrders?.length || 0})
          </TabsTrigger>
        </TabsList>

        {/* Normal Siparişler */}
        <TabsContent value="orders" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Siparişler ({filteredOrders?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Arama ve Filtre */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Müşteri adı, email veya paket adı ile ara..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Durum Filtresi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tümü</SelectItem>
                    <SelectItem value="pending">Beklemede</SelectItem>
                    <SelectItem value="approved">Onaylandı</SelectItem>
                    <SelectItem value="completed">Tamamlandı</SelectItem>
                    <SelectItem value="cancelled">İptal Edildi</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Toplu İşlemler */}
              {selectedOrders.length > 0 && (
                <div className="flex gap-2 mb-4 p-4 bg-muted rounded-lg">
                  <Button
                    onClick={() => bulkApproveMutation.mutate(selectedOrders)}
                    className="flex items-center gap-2"
                    size="sm"
                  >
                    <Check className="w-4 h-4" />
                    Toplu Onayla ({selectedOrders.length})
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => bulkDeleteMutation.mutate(selectedOrders)}
                    className="flex items-center gap-2"
                    size="sm"
                  >
                    <Trash2 className="w-4 h-4" />
                    Toplu Sil ({selectedOrders.length})
                  </Button>
                </div>
              )}

              {/* Sipariş Tablosu */}
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedOrders.length === filteredOrders?.length && filteredOrders?.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Müşteri</TableHead>
                      <TableHead>Paket</TableHead>
                      <TableHead>Tutar</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead>Tarih</TableHead>
                      <TableHead>İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isOrdersLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          Yükleniyor...
                        </TableCell>
                      </TableRow>
                    ) : filteredOrders?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          Sipariş bulunmuyor.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredOrders?.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedOrders.includes(order.id)}
                              onCheckedChange={() => handleSelectOrder(order.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{order.customer_name}</div>
                              <div className="text-sm text-muted-foreground">{order.customer_email}</div>
                            </div>
                          </TableCell>
                          <TableCell>{order.package_name}</TableCell>
                          <TableCell>₺{Number(order.amount).toLocaleString('tr-TR')}</TableCell>
                          <TableCell>{getStatusBadge(order.status)}</TableCell>
                          <TableCell>
                            {format(new Date(order.created_at), "dd MMM yyyy", { locale: tr })}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => deleteOrderMutation.mutate(order.id)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Çöp Kutusu */}
        <TabsContent value="trash" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trash2 className="w-5 h-5" />
                Çöp Kutusu ({deletedOrders?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Arama */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Silinen siparişlerde ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Silinen Siparişler Tablosu */}
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Müşteri</TableHead>
                      <TableHead>Paket</TableHead>
                      <TableHead>Tutar</TableHead>
                      <TableHead>Silinme Tarihi</TableHead>
                      <TableHead>İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isDeletedOrdersLoading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          Yükleniyor...
                        </TableCell>
                      </TableRow>
                    ) : filteredDeletedOrders?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          Çöp kutusunda sipariş bulunmuyor.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredDeletedOrders?.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{order.customer_name}</div>
                              <div className="text-sm text-muted-foreground">{order.customer_email}</div>
                            </div>
                          </TableCell>
                          <TableCell>{order.package_name}</TableCell>
                          <TableCell>₺{Number(order.amount).toLocaleString('tr-TR')}</TableCell>
                          <TableCell>
                            {order.deleted_at && format(new Date(order.deleted_at), "dd MMM yyyy", { locale: tr })}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => restoreOrderMutation.mutate(order.id)}
                              >
                                <RotateCcw className="w-3 h-3" />
                                Geri Getir
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => permanentDeleteMutation.mutate(order.id)}
                              >
                                <Trash2 className="w-3 h-3" />
                                Kalıcı Sil
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Otomatik Siparişler */}
        <TabsContent value="automatic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Otomatik Siparişler ({automaticOrders?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Arama */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Otomatik siparişlerde ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Otomatik Siparişler Tablosu */}
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Müşteri</TableHead>
                      <TableHead>Paket</TableHead>
                      <TableHead>Aylık Tutar</TableHead>
                      <TableHead>Ödenen Ay</TableHead>
                      <TableHead>Toplam Ay</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead>Kayıt Tarihi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isAutomaticOrdersLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          Yükleniyor...
                        </TableCell>
                      </TableRow>
                    ) : filteredAutomaticOrders?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          Otomatik sipariş bulunmuyor.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredAutomaticOrders?.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{order.customer_name}</div>
                              <div className="text-sm text-muted-foreground">{order.customer_email}</div>
                            </div>
                          </TableCell>
                          <TableCell>{order.package_name}</TableCell>
                          <TableCell>₺{Number(order.amount).toLocaleString('tr-TR')}</TableCell>
                          <TableCell>{order.paid_months.length}</TableCell>
                          <TableCell>{order.total_months}</TableCell>
                          <TableCell>
                            <Badge variant={order.is_active ? "default" : "secondary"}>
                              {order.is_active ? "Aktif" : "Pasif"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {format(new Date(order.registration_date), "dd MMM yyyy", { locale: tr })}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OrderManagement;