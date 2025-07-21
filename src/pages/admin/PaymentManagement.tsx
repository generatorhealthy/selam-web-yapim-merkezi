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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import AdminBackButton from "@/components/AdminBackButton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Search, Eye, Download, Filter, Check, X, Trash2, Mail } from "lucide-react";
import { sendContractEmailsAfterPurchase } from "@/services/contractEmailService";

interface Order {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  package_name: string;
  package_type: string;
  amount: number;
  status: string;
  payment_method: string;
  payment_transaction_id: string | null;
  customer_type: string;
  customer_address: string | null;
  customer_city: string | null;
  customer_tc_no: string | null;
  company_name: string | null;
  company_tax_no: string | null;
  company_tax_office: string | null;
  created_at: string;
  updated_at: string;
  approved_at: string | null;
  approved_by: string | null;
  contract_emails_sent: boolean | null;
  is_first_order: boolean | null;
  subscription_month: number | null;
  parent_order_id: string | null;
}

const PaymentManagement = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [processingEmails, setProcessingEmails] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setOrders(data || []);
      
      toast({
        title: "Başarılı",
        description: "Sipariş verileri yüklendi"
      });
    } catch (error) {
      console.error('Sipariş verileri yüklenirken hata:', error);
      toast({
        title: "Hata",
        description: "Sipariş verileri yüklenirken bir hata oluştu",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;

      const updateData: any = { 
        status, 
        approved_at: status === 'approved' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) {
        throw error;
      }

      // Eğer sipariş onaylandıysa, müşteri yönetimindeki ödeme durumunu güncelle
      if (status === 'approved') {
        await updateAutomaticOrderPayment(order);
      }

      // Eğer sipariş onaylandıysa ve ilk sipariş ise sözleşme e-postalarını gönder
      if (status === 'approved' && order.is_first_order && !order.contract_emails_sent) {
        await sendContractEmails(order);
      }

      await fetchOrders();
      
      const statusText = status === 'approved' ? 'onaylandı' : 
                        status === 'cancelled' ? 'iptal edildi' : 'güncellendi';
      
      toast({
        title: "Başarılı",
        description: `Sipariş ${statusText}`
      });
    } catch (error) {
      console.error('Sipariş durumu güncellenirken hata:', error);
      toast({
        title: "Hata",
        description: "Sipariş durumu güncellenirken bir hata oluştu",
        variant: "destructive"
      });
    }
  };

  const updateAutomaticOrderPayment = async (order: Order) => {
    try {
      // Automatic orders tablosunda bu müşteriyi bul
      const { data: automaticOrder, error: fetchError } = await supabase
        .from('automatic_orders')
        .select('*')
        .eq('customer_email', order.customer_email)
        .single();

      if (fetchError || !automaticOrder) {
        console.log('Automatic order bulunamadı veya hata:', fetchError);
        return;
      }

      // Mevcut ödenen ayları al
      const currentPaidMonths = automaticOrder.paid_months || [];
      const subscriptionMonth = order.subscription_month || 1;

      // Eğer bu ay henüz ödenmemişse ekle
      if (!currentPaidMonths.includes(subscriptionMonth)) {
        const updatedPaidMonths = [...currentPaidMonths, subscriptionMonth].sort((a, b) => a - b);

        const { error: updateError } = await supabase
          .from('automatic_orders')
          .update({ 
            paid_months: updatedPaidMonths,
            updated_at: new Date().toISOString()
          })
          .eq('id', automaticOrder.id);

        if (updateError) {
          console.error('Automatic order güncellenirken hata:', updateError);
        } else {
          console.log(`${subscriptionMonth}. ay ödemesi otomatik olarak işaretlendi`);
        }
      }
    } catch (error) {
      console.error('Automatic order güncelleme hatası:', error);
    }
  };

  const sendContractEmails = async (order: Order) => {
    const orderId = order.id;
    setProcessingEmails(prev => new Set(prev).add(orderId));

    try {
      // Parse customer name
      const nameParts = order.customer_name.split(' ');
      const name = nameParts[0] || '';
      const surname = nameParts.slice(1).join(' ') || '';

      const emailData = {
        customerData: {
          name,
          surname,
          email: order.customer_email,
          phone: order.customer_phone || '',
          tcNo: order.customer_tc_no || '',
          address: order.customer_address || '',
          city: order.customer_city || '',
          postalCode: '',
          companyName: order.company_name || undefined,
          taxNo: order.company_tax_no || undefined,
          taxOffice: order.company_tax_office || undefined,
        },
        packageData: {
          name: order.package_name,
          price: Number(order.amount),
          originalPrice: Number(order.amount),
        },
        paymentMethod: order.payment_method,
        customerType: order.customer_type,
        orderId: order.id
      };

      // Send email using the edge function
      const { data, error } = await supabase.functions.invoke('send-order-completion-email', {
        body: emailData
      });

      if (error) {
        throw error;
      }

      // Update order to mark emails as sent
      await supabase
        .from('orders')
        .update({ contract_emails_sent: true })
        .eq('id', orderId);

      await fetchOrders();

      toast({
        title: "Başarılı",
        description: "Sipariş tamamlama e-postası PDF'lerle birlikte gönderildi"
      });

    } catch (error) {
      console.error('E-posta gönderim hatası:', error);
      toast({
        title: "Hata",
        description: "E-postalar gönderilirken bir hata oluştu",
        variant: "destructive"
      });
    } finally {
      setProcessingEmails(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

  const deleteOrder = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (error) {
        throw error;
      }

      await fetchOrders();
      
      toast({
        title: "Başarılı",
        description: "Sipariş silindi"
      });
    } catch (error) {
      console.error('Sipariş silinirken hata:', error);
      toast({
        title: "Hata",
        description: "Sipariş silinirken bir hata oluştu",
        variant: "destructive"
      });
    }
  };

  const generateMonthlyOrders = async () => {
    try {
      const { error } = await supabase.rpc('generate_monthly_orders');
      
      if (error) {
        throw error;
      }

      await fetchOrders();
      
      toast({
        title: "Başarılı",
        description: "Aylık siparişler oluşturuldu"
      });
    } catch (error) {
      console.error('Aylık siparişler oluşturulurken hata:', error);
      toast({
        title: "Hata",
        description: "Aylık siparişler oluşturulurken bir hata oluştu",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (order: Order) => {
    const { status, payment_method } = order;
    
    if (status === 'approved') {
      return <Badge className="bg-green-100 text-green-800">Onaylandı</Badge>;
    } else if (status === 'pending') {
      const paymentText = payment_method === 'credit_card' 
        ? 'Kredi Kartı ile ödeme sağlandı, onay bekliyor'
        : 'Havale ile ödeme sağlandı, onay bekliyor';
      return <Badge className="bg-yellow-100 text-yellow-800">{paymentText}</Badge>;
    } else if (status === 'cancelled') {
      return <Badge className="bg-red-100 text-red-800">İptal Edildi</Badge>;
    }
    
    return <Badge variant="secondary">{status}</Badge>;
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.package_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getOrderStats = () => {
    const totalRevenue = orders
      .filter(order => order.status === 'approved')
      .reduce((sum, order) => sum + Number(order.amount), 0);
    
    const approvedCount = orders.filter(order => order.status === 'approved').length;
    const pendingCount = orders.filter(order => order.status === 'pending').length;
    const cancelledCount = orders.filter(order => order.status === 'cancelled').length;

    return { totalRevenue, approvedCount, pendingCount, cancelledCount };
  };

  const stats = getOrderStats();

  return (
    <div className="container mx-auto px-4 py-8">
      <AdminBackButton />
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Sipariş Yönetimi
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filtreler */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Müşteri adı, e-posta veya paket adı ile ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Durum Filtrele" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  <SelectItem value="approved">Onaylandı</SelectItem>
                  <SelectItem value="pending">Beklemede</SelectItem>
                  <SelectItem value="cancelled">İptal Edildi</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={generateMonthlyOrders}>
                Aylık Siparişler Oluştur
              </Button>
              <Button variant="outline" size="sm" onClick={fetchOrders}>
                <Download className="w-4 h-4 mr-2" />
                Yenile
              </Button>
            </div>
          </div>

          {/* Özet Kartları */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">₺{stats.totalRevenue.toLocaleString('tr-TR')}</div>
                <p className="text-sm text-gray-600">Toplam Gelir</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">{stats.approvedCount}</div>
                <p className="text-sm text-gray-600">Onaylanan</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-yellow-600">{stats.pendingCount}</div>
                <p className="text-sm text-gray-600">Bekleyen</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-red-600">{stats.cancelledCount}</div>
                <p className="text-sm text-gray-600">İptal Edildi</p>
              </CardContent>
            </Card>
          </div>

          {/* Siparişler Tablosu */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Müşteri</TableHead>
                  <TableHead>Paket</TableHead>
                  <TableHead>Tutar</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Ödeme Yöntemi</TableHead>
                  <TableHead>Tarih</TableHead>
                  <TableHead>İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Yükleniyor...
                    </TableCell>
                  </TableRow>
                ) : filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Sipariş bulunamadı
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{order.customer_name}</div>
                          <div className="text-sm text-gray-500">{order.customer_email}</div>
                          {order.customer_phone && (
                            <div className="text-sm text-gray-500">{order.customer_phone}</div>
                          )}
                          {order.is_first_order && (
                            <Badge variant="outline" className="text-xs mt-1">
                              İlk Sipariş
                            </Badge>
                          )}
                          {order.subscription_month && order.subscription_month > 1 && (
                            <Badge variant="outline" className="text-xs mt-1">
                              {order.subscription_month}. Ay
                            </Badge>
                          )}
                          {order.contract_emails_sent && (
                            <Badge variant="outline" className="text-xs mt-1 bg-green-50 text-green-700">
                              E-posta Gönderildi
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{order.package_name}</div>
                          <div className="text-sm text-gray-500">
                            {order.customer_type === 'company' ? 'Kurumsal' : 'Bireysel'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        ₺{Number(order.amount).toLocaleString('tr-TR')}
                      </TableCell>
                      <TableCell>{getStatusBadge(order)}</TableCell>
                      <TableCell>
                        {order.payment_method === 'credit_card' ? 'Kredi Kartı' : 'Banka Transferi'}
                      </TableCell>
                      <TableCell>
                        {new Date(order.created_at).toLocaleDateString('tr-TR')}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {order.status === 'pending' && (
                            <>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => updateOrderStatus(order.id, 'approved')}
                                className="text-green-600 hover:text-green-700"
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => updateOrderStatus(order.id, 'cancelled')}
                                className="text-red-600 hover:text-red-700"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          {order.status === 'approved' && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => sendContractEmails(order)}
                              disabled={processingEmails.has(order.id)}
                              className="text-blue-600 hover:text-blue-700"
                              title={order.contract_emails_sent ? "E-posta Tekrar Gönder" : "Sözleşme E-postası Gönder"}
                            >
                              <Mail className="w-4 h-4" />
                            </Button>
                          )}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Siparişi Sil</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Bu siparişi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>İptal</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => deleteOrder(order.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Sil
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
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
    </div>
  );
};

export default PaymentManagement;
