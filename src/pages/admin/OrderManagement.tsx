

import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import AdminBackButton from "@/components/AdminBackButton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, Clock, DollarSign, Users, Search, Filter, CheckCircle, XCircle, AlertCircle, Trash2, RotateCcw, Download, FileText, Copy, Receipt } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { generatePreInfoPDF } from "@/services/pdfService";
import { useUserRole } from "@/hooks/useUserRole";

interface Order {
  id: string;
  customer_name: string;
  customer_email: string;
  package_name: string;
  package_features?: string;
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
  customer_type: string;
  contract_ip_address: string;
  is_first_order: boolean;
  subscription_month: number;
  deleted_at?: string | null;
  pre_info_pdf_content?: string | null;
  distance_sales_pdf_content?: string | null;
  invoice_sent?: boolean;
  invoice_number?: string | null;
  invoice_date?: string | null;
}


const OrderManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { userProfile } = useUserRole();
  
  // Check if user is staff
  const isStaff = userProfile?.role === 'staff' && userProfile?.is_approved;
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [activeTab, setActiveTab] = useState("orders");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);

  const PAGE_SIZE = 50;

  // Infinite scroll query for orders
  const {
    data: ordersData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isOrdersLoading,
    error: ordersError,
  } = useInfiniteQuery({
    queryKey: ["orders", searchTerm, statusFilter],
    queryFn: async ({ pageParam = 0 }) => {
      let query = supabase
        .from("orders")
        .select("*", { count: 'exact' })
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      // Arama varsa filtrele
      if (searchTerm) {
        query = query.or(`customer_name.ilike.%${searchTerm}%,customer_email.ilike.%${searchTerm}%,package_name.ilike.%${searchTerm}%`);
      }

      // Durum filtresi
      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error, count } = await query
        .range(pageParam * PAGE_SIZE, (pageParam + 1) * PAGE_SIZE - 1);

      if (error) throw error;
      return { data: data as Order[], count: count || 0 };
    },
    getNextPageParam: (lastPage, allPages) => {
      const loadedCount = allPages.reduce((acc, page) => acc + page.data.length, 0);
      return loadedCount < lastPage.count ? allPages.length : undefined;
    },
    initialPageParam: 0,
  });

  // Flatten pages into single array
  const orders = ordersData?.pages.flatMap(page => page.data) || [];
  const totalOrders = ordersData?.pages[0]?.count || 0;

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
    onSuccess: (data) => {
      const previousOrder = orders?.find(o => o.id === data.id);
      
      // Otomatik fatura oluştur eğer durum approved'a değişti
      if (data.status === 'approved' && previousOrder?.status !== 'approved') {
        setTimeout(() => {
          createInvoiceMutation.mutate(data.id);
        }, 1000);
      }
      
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

  // Soft delete mutation
  const softDeleteOrderMutation = useMutation({
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
        title: "Sipariş Silindi",
        description: "Sipariş çöp kutusuna taşındı",
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
      console.error("Error soft deleting order:", error);
    },
  });

  // Bulk soft delete mutation
  const bulkSoftDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { data, error } = await supabase
        .from("orders")
        .update({ deleted_at: new Date().toISOString() })
        .in("id", ids);
      if (error) throw error;
      return data;
    },
    onSuccess: (_, ids) => {
      toast({
        title: "Siparişler Silindi",
        description: `${ids.length} sipariş çöp kutusuna taşındı`,
      });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["deleted_orders"] });
      setSelectedOrderIds([]);
      setSelectAll(false);
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: "Siparişler silinirken hata oluştu",
        variant: "destructive",
      });
      console.error("Error bulk soft deleting orders:", error);
    },
  });

  // Restore order mutation
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

  // Bulk restore mutation
  const bulkRestoreMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { data, error } = await supabase
        .from("orders")
        .update({ deleted_at: null })
        .in("id", ids);
      if (error) throw error;
      return data;
    },
    onSuccess: (_, ids) => {
      toast({
        title: "Siparişler Geri Getirildi",
        description: `${ids.length} sipariş başarıyla geri getirildi`,
      });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["deleted_orders"] });
      setSelectedOrderIds([]);
      setSelectAll(false);
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: "Siparişler geri getirilirken hata oluştu",
        variant: "destructive",
      });
      console.error("Error bulk restoring orders:", error);
    },
  });

  // Permanent delete mutation (for deleted orders)
  const permanentDeleteOrderMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.from("orders").delete().eq("id", id);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Sipariş Kalıcı Silindi",
        description: "Sipariş kalıcı olarak silindi",
      });
      queryClient.invalidateQueries({ queryKey: ["deleted_orders"] });
      setSelectedOrder(null);
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: "Sipariş silinirken hata oluştu",
        variant: "destructive",
      });
      console.error("Error permanently deleting order:", error);
    },
  });


  // Copy order mutation
  const copyOrderMutation = useMutation({
    mutationFn: async (originalOrder: Order) => {
      const newOrder = {
        customer_name: originalOrder.customer_name,
        customer_email: originalOrder.customer_email,
        customer_phone: originalOrder.customer_phone,
        customer_address: originalOrder.customer_address,
        customer_city: originalOrder.customer_city,
        customer_tc_no: originalOrder.customer_tc_no,
        company_name: originalOrder.company_name,
        company_tax_no: originalOrder.company_tax_no,
        company_tax_office: originalOrder.company_tax_office,
        package_name: originalOrder.package_name,
        package_type: originalOrder.package_type,
        amount: originalOrder.amount,
        payment_method: originalOrder.payment_method,
        customer_type: originalOrder.customer_type,
        status: 'pending' as const,
        is_first_order: false,
        subscription_month: 1,
      };
      
      const { data, error } = await supabase
        .from("orders")
        .insert(newOrder)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Sipariş Kopyalandı",
        description: "Yeni sipariş bugün tarihli olarak oluşturuldu",
      });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: "Sipariş kopyalanırken hata oluştu",
        variant: "destructive",
      });
      console.error("Error copying order:", error);
    },
  });

  const handleCopyOrder = (order: Order) => {
    copyOrderMutation.mutate(order);
  };

  // Create BirFatura invoice mutation
  const createInvoiceMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const { data, error } = await supabase.functions.invoke('create-birfatura-invoice', {
        body: { orderId }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data && data.success === false) {
        toast({
          title: "Fatura Oluşturma Hatası",
          description: data.error || "BirFatura'dan başarısız yanıt alındı",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Fatura Oluşturuldu",
        description: `Fatura numarası: ${data?.invoiceNumber || 'Oluşturuldu'}`,
      });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (error) => {
      toast({
        title: "Fatura Oluşturma Hatası",
        description: error.message || "BirFatura'da fatura oluşturulurken hata oluştu",
        variant: "destructive",
      });
      console.error("Error creating invoice:", error);
    },
  });

  const handleCreateInvoice = (orderId: string) => {
    createInvoiceMutation.mutate(orderId);
  };

  const handleUpdateOrder = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, field: string) => {
    if (editingOrder) {
      const value = field === 'subscription_month' || field === 'amount' ? 
        (e.target.value === '' ? 0 : Number(e.target.value)) : 
        e.target.value;
      setEditingOrder({ ...editingOrder, [field]: value });
    }
  };

  const handleSaveOrder = () => {
    if (editingOrder) {
      updateOrderMutation.mutate(editingOrder);
    }
  };

  const handleSoftDeleteOrder = (id: string) => {
    softDeleteOrderMutation.mutate(id);
  };

  const handleCancelEdit = () => {
    setEditingOrder(null);
    setSelectedOrder(null);
  };

  // Checkbox selection handlers
  const handleSelectAll = (currentOrders: Order[]) => {
    if (selectAll) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(currentOrders.map(order => order.id));
    }
    setSelectAll(!selectAll);
  };

  const handleSelectOrder = (orderId: string, checked: boolean) => {
    if (checked) {
      setSelectedOrderIds([...selectedOrderIds, orderId]);
    } else {
      setSelectedOrderIds(selectedOrderIds.filter(id => id !== orderId));
      setSelectAll(false);
    }
  };

  // Bulk action handlers
  const handleBulkSoftDelete = () => {
    if (selectedOrderIds.length > 0) {
      bulkSoftDeleteMutation.mutate(selectedOrderIds);
    }
  };

  const handleBulkRestore = () => {
    if (selectedOrderIds.length > 0) {
      bulkRestoreMutation.mutate(selectedOrderIds);
    }
  };

  // PDF download functions
  const downloadPreInfoPDF = async (order: Order) => {
    try {
      const nameParts = order.customer_name.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      

      const pdf = await generatePreInfoPDF(order.id);

      // Download PDF
      const currentDate = new Date().toLocaleDateString('tr-TR').replace(/\./g, '-');
      const fileName = `${firstName}_${lastName}_OnBilgilendirme_${currentDate}.pdf`;
      pdf.save(fileName);

      toast({
        title: "Başarılı",
        description: "Ön bilgilendirme formu PDF olarak indirildi.",
      });

    } catch (error) {
      console.error('PDF dosyası oluşturulurken hata:', error);
      toast({
        title: "Hata",
        description: "PDF dosyası oluşturulurken hata oluştu",
        variant: "destructive",
      });
    }
  };

  const downloadDistanceSalesPDF = async (order: Order) => {
    try {
      // Mesafeli satış sözleşmesi içeriğini hazırla
      const currentDate = new Date().toLocaleDateString('tr-TR');
      const currentDateTime = new Date().toLocaleString('tr-TR');
      
      const nameParts = order.customer_name.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      // Package features'ı JSON'dan parse et veya packages tablosundan çek
      let packageFeatures = [];
      
      // Önce order'da package_features varsa onu kullan
      if (order.package_features) {
        try {
          const features = JSON.parse(order.package_features);
          packageFeatures = Array.isArray(features) ? features : [];
        } catch {
          packageFeatures = [];
        }
      }
      
      // Eğer package features boşsa, packages tablosundan çekmeye çalış
      if (packageFeatures.length === 0) {
        try {
          const { data: packageData, error } = await supabase
            .from('packages')
            .select('features')
            .eq('name', order.package_name)
            .single();
          
          if (packageData && !error) {
            packageFeatures = Array.isArray(packageData.features) ? packageData.features : [];
          }
        } catch (error) {
          console.log('Package features could not be fetched from packages table');
        }
      }

      const distanceSalesContent = `
<div style="padding: 20px; font-family: Arial, sans-serif; line-height: 1.4; color: #333;">

<p style="text-align: justify; margin-bottom: 15px;">
sistemler vasıtasıyla analiz edilmesi suretiyle kişinin kendisi aleyhine bir sonucun ortaya çıkmasına itiraz etme, (g) 
Kişisel verilerin kanuna aykırı olarak işlenmesi sebebiyle zarara uğraması halinde zararın giderilmesini talep etme.
</p>

<p style="text-align: justify; margin-bottom: 15px;">
Bu haklarınızı yazılı olarak veya güvenli elektronik imza, mobil imza, kayıtlı elektronik posta (KEP) adresi ya da 
Şirket'in sisteminde kayıtlı bulunan elektronik posta adresini kullanmak suretiyle (Bu kapsamda 
info@doktorumol.com.tr e-posta adresi üzerinden Şirket'e ulaşabilirsiniz) veya başvuru amacına yönelik geliştirilmiş 
bir yazılım ya da uygulama vasıtasıyla Şirket'e iletebilirsiniz.
</p>

<p style="text-align: justify; margin-bottom: 20px;">
Bilginize sunarız.
</p>

<h2 style="text-align: center; margin-top: 30px; margin-bottom: 20px; font-size: 16px; font-weight: bold;">
Çağrı Merkezi Aydınlatma Metni
</h2>

<p style="text-align: justify; margin-bottom: 15px;">
Doktorumol.com.tr olarak, işbu Aydınlatma Metni ile, Kişisel Verilerin Korunması Kanunu ("Kanun") ve Aydınlatma 
Yükümlülüğünün Yerine Getirilmesinde Uyulacak Usul ve Esaslar Hakkında Tebliğ kapsamında aydınlatma 
yükümlülüğümüzün yerine getirilmesi amaçlanmaktadır.
</p>

<p style="text-align: justify; margin-bottom: 15px;">
Doktoru mol; çağrı merkezini arayanların paylaşmış olduğu ad-soyad, iletişim bilgisi ve ses kaydına ait kişisel 
verileri;
</p>

<ul style="margin-left: 30px; margin-bottom: 15px;">
<li style="margin-bottom: 8px;">- Arayan kişiye doğru hitap edilebilmesi,</li>
<li style="margin-bottom: 8px;">- Aramanın teyidi ve iletişim faaliyetlerinin yürütülmesi,</li>
<li style="margin-bottom: 8px;">- Görüşme talep edilen uzman için randevu oluşturulması,</li>
<li style="margin-bottom: 8px;">- Arayan kişinin uzmana yönlendirilmesi,</li>
<li style="margin-bottom: 8px;">- Talep ve şikayetlerin takibi,</li>
<li style="margin-bottom: 8px;">- Doğabilecek uyuşmazlıklarda delil olarak kullanılması amaçlarıyla sınırlı olarak işlemektedir.</li>
</ul>

<p style="text-align: justify; margin-bottom: 15px;">
Kişisel verileriniz yukarıda belirtilen amaçların yerine getirilebilmesi için Şirket'in hissedarları, iş ortakları, hizmet 
aldığı şirketler ile yetkili kamu kurum ve kuruluşlarına ve randevu oluşturma talebinde bulunduğunuz ilgili uzmana 
aktarılabilecektir.
</p>

<p style="text-align: justify; margin-bottom: 15px;">
Kişisel sağlık verilerinizi çağrı merkezi ile görüşmeniz sırasında paylaşmamanızı rica ederiz.Şirketimiz aracılığıyla 
randevu oluşturma talebiniz kapsamında çağrı merkezi aracılığıyla edilen kişisel verileriniz, Şirket ile aranızda 
kurulabilecek hukuki ilişkinin devamı için kişisel verilerinizin işlenmesinin gerekli olması, randevu oluşturulmasına 
ilişkin hakkınızın tesisi, kullanılması veya korunması için veri işlemenin zorunlu olması hukuki sebepleri ile telefon 
yoluyla otomatik olarak işlenmektedir.
</p>

<p style="text-align: justify; margin-bottom: 15px;">
Kanunun "İlgili kişinin haklarını düzenleyen" 11. maddesi kapsamındaki taleplerinizi, "Veri Sorumlusuna Başvuru Usul 
ve Esasları Hakkında Tebliğ"e göre <strong>Doktorumol.com.tr'nin Şirket mailine info@doktorumol.com.tr'ye 
iletebilirsiniz.</strong>
</p>

<div style="page-break-before: always;">

<h1 style="text-align: center; margin-top: 20px; margin-bottom: 25px; font-size: 18px; font-weight: bold;">
KİŞİSEL VERİLERE İLİŞKİN AYDINLATMA METNİ
</h1>

<p style="text-align: justify; margin-bottom: 15px;">
Doktorumol.com.tr ("<strong>doktorumol</strong>" veya "<strong>Şirket</strong>") olarak, işbu Aydınlatma Metni ile, Kişisel Verilerin Korunması 
Kanunu ("<strong>Kanun</strong>") ve Aydınlatma Yükümlülüğünün Yerine Getirilmesinde Uyulacak Usul ve Esaslar Hakkında Tebliğ 
kapsamında aydınlatma yükümlülüğümüzün yerine getirilmesi amaçlanmaktadır.
</p>

<p style="text-align: justify; margin-bottom: 15px;">
Bu kapsamda bilgi vermekle yükümlü olduğumuz konular aşağıdaki gibidir:
</p>

<h3 style="font-size: 14px; font-weight: bold; margin-top: 20px; margin-bottom: 10px;">
1. Veri sorumlusunun ve varsa temsilcisinin kimliği
</h3>

<p style="text-align: justify; margin-bottom: 15px;">
Veri sorumlusu; doktorumol.com.tr'dir.
</p>

<h3 style="font-size: 14px; font-weight: bold; margin-top: 20px; margin-bottom: 10px;">
2. Kişisel verilerin hangi amaçla işleneceği
</h3>

<p style="text-align: justify; margin-bottom: 15px;">
Ad, soyadı, telefon numarası, e-posta adresi, adres bilgileri, ödeme aracı bilgileri ve bunlarla sınırlı olmamak üzere 
varsa internet sitesi veya çağrı merkezi aracılığıyla iletmiş olduğunuz <strong>genel ve özel nitelikli kategorilerdeki 
kişisel verileriniz</strong>, internet sitesinde üyeliğinizin oluşturulması, Doktorumol üyeliği sebebiyle aldığınız hizmetlerin 
sunumu, alınan hizmet ile ilgili sizinle iletişime geçilmesi, müşteri ilişkilerinde sağlıklı ve uzun süreli etkileşim 
kurulması, <strong>onay vermeniz halinde</strong> tarafınıza ticari elektronik ileti gönderilmesi, talep ve şikayetlerinizin takibi ile 
ilerde oluşabilecek uyuşmazlık ve sorunların çözülmesi ve mevzuattan kaynaklanan zamanaşımı süresi doğrultusunda 
bu kişisel verilerinizin Doktorumol tarafından saklanması <strong>amacı ile</strong> işlenmektedir.
</p>

<p style="text-align: justify; margin-bottom: 15px;">
Ayrıca, internet sitemizi ziyaretiniz ve kullanımınız sırasında internet sayfası sunucusu tarafından sabit sürücününüze 
iletilen küçük metin dosyaları ("<strong>Çerezler</strong>") aracılığıyla elde edilen kullanılan tarayıcı, IP adresi, internet bağlantınız, 
site kullanımlarınız hakkındaki bilgiler, bilgisayarınızdaki işletim sistemi ve benzeri <strong>kategorilerdeki kişisel 
verileriniz</strong>, internet sitesinin düzgün bir şekilde çalışabilmesi, ziyaret edilebilmesi ve özelliklerinden faydalanılması, 
internet sitesinde sayfalar arasında bilgileri taşıyabilmek ve bilgileri tekrardan girmek zorluluğunu ortadan 
kaldırmak <strong>amaçları ile</strong> işlenmektedir.
</p>

<h3 style="font-size: 14px; font-weight: bold; margin-top: 20px; margin-bottom: 10px;">
3. Şirket tarafından işlenen kişisel verilerin kimlere ve hangi amaçla aktarılabileceği
</h3>

<p style="text-align: justify; margin-bottom: 15px;">
Kişisel verileriniz 2. maddede belirtilen amaçların yerine getirilebilmesi için Doktorumol hissedarları, iş ortakları, 
hizmet aldığı şirketler ile yetkili kamu kurum ve kuruluşlarına aktarılabilecektir.
</p>

<h3 style="font-size: 14px; font-weight: bold; margin-top: 20px; margin-bottom: 10px;">
4. Kişisel veri toplamanın yöntemi ve hukuki sebebi
</h3>

<p style="text-align: justify; margin-bottom: 15px;">
Şirketimizin internet sitesi veya çağrı merkezi aracılığıyla, tamamen veya kısmen otomatik yollarla elde edilen kişisel 
verileriniz, kanunda açıkça öngörülmesi, Doktorumol ile aranızda kurulabilecek hukuki ilişkinin devamı için kişisel 
verilerinizin işlenmesinin gerekli olması, iletişim hakkının tesisi, kullanılması veya korunması için veri işlemenin 
zorunlu olması ve açık rızanız <strong>hukuki sebepleri</strong> ile toplanmaktadır.
</p>

<h3 style="font-size: 14px; font-weight: bold; margin-top: 20px; margin-bottom: 10px;">
5. Kişisel verileriniz ile ilgili Kanun kapsamındaki haklarınız aşağıdaki şekildedir:
</h3>

<p style="text-align: justify; margin-bottom: 8px;">
<strong>(a)</strong> Kişisel verilerinizin işlenip işlenmediğini öğrenme, <strong>(b)</strong> Kişisel verileriniz işlenmişse buna ilişkin bilgi talep etme, <strong>(c)</strong> 
Kişisel verilerinizin işlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme, <strong>(ç)</strong> Yurt içinde 
veya yurt dışında kişisel verilerin aktarıldığı üçüncü kişileri bilme, <strong>(d)</strong> Kişisel verilerinizin eksik veya yanlış işlenmiş 
olması halinde bunların düzeltilmesini isteme, <strong>(e)</strong> Kişisel verilerinizin işlenmesini gerektiren sebeplerin ortadan 
kalkması halinde kişisel verilerinizin silinmesini veya yok edilmesini isteme, <strong>(f)</strong> (d) ve (e) bentleri uyarınca yapılan 
işlemlerin, kişisel verilerin aktarıldığı üçüncü kişilere bildirilmesini isteme, <strong>(g)</strong> İşlenen verilerin münhasıran otomatik
</p>

</div>
`;

      // HTML'yi PDF'e çevir
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');
      
      // Geçici div oluştur
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = distanceSalesContent;
      tempDiv.style.width = '190mm'; // A4 width minus margins
      tempDiv.style.maxWidth = '190mm';
      tempDiv.style.padding = '20mm';
      tempDiv.style.backgroundColor = 'white';
      tempDiv.style.fontFamily = 'Arial, sans-serif';
      tempDiv.style.fontSize = '11px';
      tempDiv.style.lineHeight = '1.5';
      tempDiv.style.color = '#000';
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '0';
      tempDiv.style.wordWrap = 'break-word';
      tempDiv.style.pageBreakInside = 'avoid';
      
      // Add CSS for better page breaks
      const style = document.createElement('style');
      style.textContent = `
        h1, h2, h3, h4 { 
          page-break-after: avoid; 
          margin-bottom: 10px; 
          margin-top: 15px;
        }
        p { 
          page-break-inside: avoid; 
          margin-bottom: 8px; 
        }
        ul, ol { 
          page-break-inside: avoid; 
          margin-bottom: 10px; 
        }
        li { 
          margin-bottom: 3px; 
        }
        .customer-info { 
          page-break-inside: avoid; 
          margin-bottom: 20px; 
        }
      `;
      document.head.appendChild(style);
      document.body.appendChild(tempDiv);

      try {
        const canvas = await html2canvas(tempDiv, {
          scale: 1.5,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false,
          width: tempDiv.scrollWidth,
          height: tempDiv.scrollHeight
        });
        
        const imgData = canvas.toDataURL('image/jpeg', 0.85);
        const pdf = new jsPDF('p', 'mm', 'a4');
        
        const pageWidth = 210;
        const pageHeight = 297;
        const margin = 10;
        const contentWidth = pageWidth - (margin * 2);
        const imgHeight = (canvas.height * contentWidth) / canvas.width;
        
        // Calculate page breaks more carefully
        const pageContentHeight = pageHeight - (margin * 2);
        let currentPosition = 0;
        let pageNumber = 0;

        while (currentPosition < imgHeight) {
          if (pageNumber > 0) {
            pdf.addPage();
          }
          
          const remainingHeight = imgHeight - currentPosition;
          const heightForThisPage = Math.min(pageContentHeight, remainingHeight);
          
          // Position for this page
          const yPosition = margin - currentPosition;
          
          pdf.addImage(imgData, 'JPEG', margin, yPosition, contentWidth, imgHeight);
          
          currentPosition += heightForThisPage;
          pageNumber++;
        }
        
        document.head.removeChild(style);
        pdf.save(`mesafeli-satis-${order.customer_name.replace(/\s+/g, '-')}-${order.id.slice(0, 8)}.pdf`);
        
        toast({
          title: "Başarılı",
          description: "Mesafeli satış sözleşmesi PDF'i indirildi",
          variant: "default",
        });
      } finally {
        document.body.removeChild(tempDiv);
      }
    } catch (error) {
      console.error('PDF generation error:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace',
        order: {
          id: order.id,
          customer_name: order.customer_name,
          package_name: order.package_name
        }
      });
      toast({
        title: "Hata",
        description: `PDF oluşturulurken hata oluştu: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`,
        variant: "destructive",
      });
    }
  };

  // Mevcut siparişler için sözleşme indirme
  const handleDownloadContract = async (order: Order, contractType: 'pre_info' | 'distance_sales') => {
    if (contractType === 'pre_info') {
      await downloadPreInfoPDF(order);
    } else {
      await downloadDistanceSalesPDF(order);
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

  // Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  // Filtreleme artık query'de yapılıyor
  const filteredOrders = orders;


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto p-6 space-y-8">
        <AdminBackButton />
        
        {/* Header Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/90 via-primary to-primary/80 p-8 text-white shadow-2xl">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSI0Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
          <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                Sipariş Yönetimi
              </h1>
              <p className="text-blue-100 text-lg">Tüm siparişleri yönetin</p>
            </div>
          </div>
        </div>

        {/* Statistics Cards - Hidden for staff */}
        {!isStaff && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-blue-100 text-sm font-medium">Toplam Sipariş</p>
                    <p className="text-3xl font-bold">{orders?.length || 0}</p>
                  </div>
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <Users className="w-6 h-6" />
                  </div>
                </div>
                <div className="mt-4 h-2 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white/40 rounded-full w-full"></div>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-green-100 text-sm font-medium">Onaylanan</p>
                    <p className="text-3xl font-bold">
                      {orders?.filter(o => o.status === 'approved' || o.status === 'completed').length || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                </div>
                <div className="mt-4 h-2 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white/40 rounded-full w-4/5"></div>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden bg-gradient-to-br from-yellow-500 to-orange-500 text-white border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-yellow-100 text-sm font-medium">Bekleyen</p>
                    <p className="text-3xl font-bold">
                      {orders?.filter(o => o.status === 'pending').length || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                </div>
                <div className="mt-4 h-2 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white/40 rounded-full w-3/5"></div>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-purple-100 text-sm font-medium">Toplam Tutar</p>
                    <p className="text-2xl font-bold">
                      {orders?.reduce((sum, order) => sum + order.amount, 0).toLocaleString('tr-TR')} ₺
                    </p>
                  </div>
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <DollarSign className="w-6 h-6" />
                  </div>
                </div>
                <div className="mt-4 h-2 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white/40 rounded-full w-full"></div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
            <TabsList className={`grid w-full lg:w-auto ${isStaff ? 'grid-cols-1' : 'grid-cols-2'} bg-white/60 backdrop-blur-sm border border-white/20 shadow-lg rounded-xl p-1`}>
              <TabsTrigger value="orders" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg">
                <Calendar className="w-4 h-4" />
                Siparişler
              </TabsTrigger>
              {!isStaff && (
                <TabsTrigger value="trash" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg">
                  <Trash2 className="w-4 h-4" />
                  Çöp Kutusu
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          {/* Search and Filter Bar */}
          <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    placeholder="Müşteri adı, email veya paket adı ile ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 h-12 border-0 bg-white/80 backdrop-blur-sm shadow-inner text-gray-700 placeholder:text-gray-500"
                  />
                </div>
                {activeTab === "orders" && (
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[200px] h-12 border-0 bg-white/80 backdrop-blur-sm shadow-inner">
                      <Filter className="w-4 h-4 mr-2 text-gray-500" />
                      <SelectValue placeholder="Durum filtrele" />
                    </SelectTrigger>
                    <SelectContent className="bg-white/95 backdrop-blur-sm border-0 shadow-xl">
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
          {/* Bulk Actions - Hidden for staff */}
          {!isStaff && selectedOrderIds.length > 0 && (
            <Card className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <CheckCircle className="w-4 h-4 text-red-600" />
                    </div>
                    <span className="text-sm font-medium text-red-700">
                      {selectedOrderIds.length} sipariş seçildi
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleBulkSoftDelete}
                      disabled={bulkSoftDeleteMutation.isPending}
                      className="flex items-center gap-2 bg-red-500 hover:bg-red-600 shadow-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                      Toplu Sil
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="shadow-xl border-0 bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50 rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-purple-600/10 border-b border-white/20 backdrop-blur-sm">
              <CardTitle className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Sipariş Listesi
                  </span>
                  <span className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-semibold rounded-full shadow-lg">
                    {totalOrders}
                  </span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isOrdersLoading ? (
                <div className="flex justify-center py-12">
                  <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600"></div>
                    <span className="text-gray-600 font-medium">Yükleniyor...</span>
                  </div>
                </div>
              ) : ordersError ? (
                <div className="text-center py-12">
                  <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-200 inline-block">
                    Hata: {ordersError.message}
                  </div>
                </div>
              ) : (
                <div className="w-full space-y-4">
                  {filteredOrders && filteredOrders.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                      {filteredOrders.map((order) => (
                        <Card key={order.id} className="bg-white/80 backdrop-blur-sm border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl overflow-hidden">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                {!isStaff && (
                                  <Checkbox
                                    checked={selectedOrderIds.includes(order.id)}
                                    onCheckedChange={(checked) => handleSelectOrder(order.id, !!checked)}
                                  />
                                )}
                                <Badge variant={getStatusBadgeVariant(order.status)} className="flex items-center gap-1 font-medium text-xs">
                                  {getStatusIcon(order.status)}
                                  {order.status === 'pending' ? 'Bekleyen' : 
                                   order.status === 'approved' ? 'Onaylanan' :
                                   order.status === 'completed' ? 'Tamamlanan' : 'İptal'}
                                </Badge>
                              </div>
                              {order.subscription_month ? (
                                <Badge variant="outline" className="font-medium text-xs">{order.subscription_month}. Ay</Badge>
                              ) : (
                                <Badge variant="secondary" className="font-medium text-xs">İlk</Badge>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {/* Customer Info */}
                            <div className="space-y-2">
                              <div className="font-semibold text-gray-900 text-lg">{order.customer_name}</div>
                              <div className="text-sm text-muted-foreground">{order.customer_email}</div>
                              <div className="text-sm text-gray-600">{order.customer_phone || 'Telefon belirtilmemiş'}</div>
                            </div>

                            {/* Address Info */}
                            {order.customer_address && (
                              <div className="bg-gray-50 p-3 rounded-lg">
                                <div className="text-xs text-gray-500 mb-1">Adres</div>
                                <div className="text-sm text-gray-700">{order.customer_address}</div>
                                {order.customer_city && (
                                  <div className="text-xs text-gray-500 mt-1">{order.customer_city}</div>
                                )}
                              </div>
                            )}

                            {/* Package & Payment Info */}
                            <div className="space-y-2">
                              <div>
                                <div className="font-semibold text-gray-900">{order.package_name}</div>
                                <div className="text-sm text-muted-foreground">{order.package_type}</div>
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="font-bold text-xl text-primary">{order.amount.toLocaleString('tr-TR')} ₺</div>
                                <div className="text-xs text-muted-foreground">
                                  {order.payment_method === 'credit_card' ? 'Kredi Kartı' : 'Banka Havalesi'}
                                </div>
                              </div>
                            </div>

                            {/* TC & Date Info */}
                            <div className="flex justify-between items-center text-sm">
                              <div>
                                <div className="text-xs text-gray-500">TC Kimlik No</div>
                                <div className="text-gray-700">{order.customer_tc_no || 'Belirtilmemiş'}</div>
                              </div>
                              <div className="text-right">
                                <div className="font-medium text-gray-900">
                                  {format(new Date(order.created_at), "dd MMM yyyy", { locale: tr })}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {format(new Date(order.created_at), "HH:mm", { locale: tr })}
                                </div>
                              </div>
                            </div>

                            {/* Action Buttons - Disabled for staff */}
                            <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-200">
                              {/* Invoice sent indicator */}
                              {order.invoice_sent && (
                                <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-xs">
                                  Fatura Gönderildi
                                </Badge>
                              )}
                              
                              {!isStaff && (
                                <>
                                  {/* BirFatura Invoice Button - only for approved orders */}
                                  {(order.status === 'approved') && !order.invoice_sent && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleCreateInvoice(order.id)}
                                      disabled={createInvoiceMutation.isPending}
                                      className="flex items-center gap-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200 text-xs flex-1"
                                    >
                                      <Receipt className="w-3 h-3" />
                                      {createInvoiceMutation.isPending ? 'Kesiliyor...' : 'Fatura Kes'}
                                    </Button>
                                  )}
                                  
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleCopyOrder(order)}
                                    disabled={copyOrderMutation.isPending}
                                    className="flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 text-xs flex-1"
                                  >
                                    <Copy className="w-3 h-3" />
                                    Kopyala
                                  </Button>
                                  
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedOrder(order);
                                      setEditingOrder(order);
                                    }}
                                    className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200 text-xs flex-1"
                                  >
                                    Düzenle
                                  </Button>
                                </>
                              )}
                              
                              {/* Empty space for staff - no message */}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="p-6 bg-gray-50 text-gray-600 rounded-lg border-2 border-dashed border-gray-200 inline-block">
                        <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <div className="text-lg font-medium mb-2">Sipariş bulunamadı</div>
                        <div className="text-sm">Arama kriterlerinize uygun sipariş bulunmuyor.</div>
                      </div>
                    </div>
                  )}
                  
                  {/* Infinite scroll observer */}
                  {hasNextPage && (
                    <div ref={observerTarget} className="flex justify-center py-8">
                      {isFetchingNextPage && (
                        <div className="flex items-center gap-3">
                          <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-200 border-t-blue-600"></div>
                          <span className="text-gray-600 font-medium">Daha fazla yükleniyor...</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Loaded all message */}
                  {!hasNextPage && filteredOrders && filteredOrders.length > 0 && (
                    <div className="text-center py-6">
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-600 rounded-full border border-gray-200">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">Tüm siparişler yüklendi ({totalOrders})</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Edit Order Dialog */}
          <Dialog open={!!editingOrder} onOpenChange={(open) => !open && handleCancelEdit()}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Sipariş Düzenle</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                {editingOrder && (
                  <>
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
                    <div>
                      <Label htmlFor="customer_tc_no">TC Kimlik No</Label>
                      <Input
                        type="text"
                        id="customer_tc_no"
                        value={editingOrder.customer_tc_no || ''}
                        onChange={(e) => handleUpdateOrder(e, "customer_tc_no")}
                        placeholder="TC Kimlik numarasını girin"
                      />
                    </div>
                    <div>
                      <Label htmlFor="payment_method">Ödeme Yöntemi</Label>
                      <Select
                        value={editingOrder.payment_method}
                        onValueChange={(value) =>
                          setEditingOrder({ ...editingOrder, payment_method: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Ödeme yöntemi seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="credit_card">Kredi Kartı</SelectItem>
                          <SelectItem value="banka_havalesi">Banka Havalesi</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="subscription_month">Sipariş Ayı</Label>
                      <Input
                        type="number"
                        id="subscription_month"
                        value={editingOrder.subscription_month || 1}
                        onChange={(e) => handleUpdateOrder(e, "subscription_month")}
                        min="1"
                      />
                    </div>
                    <div className="flex justify-end gap-2 md:col-span-2 pt-4">
                      <Button variant="ghost" onClick={handleCancelEdit}>
                        İptal
                      </Button>
                      <Button onClick={handleSaveOrder}>Kaydet</Button>
                      <Button
                        variant="destructive"
                        onClick={() => {
                          handleSoftDeleteOrder(editingOrder.id);
                          setEditingOrder(null);
                        }}
                        disabled={softDeleteOrderMutation.isPending}
                      >
                        {softDeleteOrderMutation.isPending ? "Siliniyor..." : "Sil"}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="trash" className="space-y-6">
          {/* Bulk Actions for Trash */}
          {selectedOrderIds.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {selectedOrderIds.length} sipariş seçildi
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleBulkRestore}
                      disabled={bulkRestoreMutation.isPending}
                      className="flex items-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Toplu Geri Getir
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trash2 className="w-5 h-5" />
                Silinmiş Siparişler ({deletedOrders?.length || 0})
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
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectAll}
                            onCheckedChange={() => handleSelectAll(deletedOrders || [])}
                          />
                        </TableHead>
                        <TableHead>Müşteri</TableHead>
                        <TableHead>Paket</TableHead>
                        <TableHead>Tutar</TableHead>
                        <TableHead>Silinme Tarihi</TableHead>
                        <TableHead className="text-right">İşlemler</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {deletedOrders?.map((order) => (
                        <TableRow key={order.id} className="hover:bg-gray-50">
                          <TableCell>
                            <Checkbox
                              checked={selectedOrderIds.includes(order.id)}
                              onCheckedChange={(checked) => handleSelectOrder(order.id, !!checked)}
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
                            {order.deleted_at && format(new Date(order.deleted_at), "dd MMM yyyy", { locale: tr })}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
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
                                onClick={() => permanentDeleteOrderMutation.mutate(order.id)}
                                disabled={permanentDeleteOrderMutation.isPending}
                              >
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

      </Tabs>
      </div>
    </div>
  );
};

export default OrderManagement;
