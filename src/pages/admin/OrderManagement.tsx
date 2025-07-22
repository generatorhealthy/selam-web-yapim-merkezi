

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Calendar, Clock, DollarSign, Users, RefreshCw, Search, Filter, CheckCircle, XCircle, AlertCircle, Trash2, RotateCcw, Download, FileText } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

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
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

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
      // Supabase'den form içeriğini çek
      const { data: formData, error } = await supabase
        .from('form_contents')
        .select('content')
        .eq('form_type', 'pre_info')
        .single();

      if (error) {
        toast({
          title: "Hata",
          description: "Form içeriği yüklenemedi",
          variant: "destructive",
        });
        return;
      }

      // jsPDF import
      const { jsPDF } = await import('jspdf');
      
      // PDF oluştur
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 15;
      const contentWidth = pageWidth - (margin * 2);
      let currentY = margin;

      // Font ayarları
      pdf.setFont("helvetica", "normal");
      
      // Müşteri bilgilerini hazırla
      const currentDate = new Date().toLocaleDateString('tr-TR');
      const currentDateTime = new Date().toLocaleString('tr-TR');
      
      const nameParts = order.customer_name.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      // Package features'ı JSON'dan parse et veya packages tablosundan çek
      let packageFeatures = [];
      
      if (order.package_features) {
        try {
          const features = JSON.parse(order.package_features);
          packageFeatures = Array.isArray(features) ? features : [];
        } catch {
          packageFeatures = [];
        }
      }
      
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
          console.log('Package features could not be fetched');
        }
      }

      // Helper functions
      const addText = (text: string, fontSize = 10, isBold = false, color = [0, 0, 0]) => {
        if (currentY > pageHeight - margin - 10) {
          pdf.addPage();
          currentY = margin;
        }
        
        pdf.setFontSize(fontSize);
        pdf.setFont("helvetica", isBold ? "bold" : "normal");
        pdf.setTextColor(color[0], color[1], color[2]);
        
        const lines = pdf.splitTextToSize(text, contentWidth);
        const lineHeight = fontSize * 0.352778; // Convert pt to mm
        
        for (let i = 0; i < lines.length; i++) {
          if (currentY > pageHeight - margin - 10) {
            pdf.addPage();
            currentY = margin;
          }
          pdf.text(lines[i], margin, currentY);
          currentY += lineHeight + 1;
        }
        currentY += 2;
      };

      const addTitle = (text: string) => {
        addText(text, 14, true, [3, 105, 161]);
        currentY += 3;
      };

      const addSubTitle = (text: string) => {
        addText(text, 12, true, [3, 105, 161]);
        currentY += 2;
      };

      // PDF içeriği oluştur
      addTitle("ÖN BİLGİLENDİRME FORMU");
      currentY += 5;

      addSubTitle("MÜŞTERI BİLGİLERİ");
      addText(`Müşteri Adı: ${firstName} ${lastName}`);
      addText(`E-posta: ${order.customer_email}`);
      addText(`Telefon: ${order.customer_phone || 'Belirtilmemiş'}`);
      addText(`TC Kimlik No: ${order.customer_tc_no || 'Belirtilmemiş'}`);
      addText(`Adres: ${order.customer_address || 'Belirtilmemiş'}`);
      addText(`Şehir: ${order.customer_city || 'Belirtilmemiş'}`);
      addText(`Müşteri Tipi: ${order.customer_type === 'individual' ? 'Bireysel' : 'Kurumsal'}`);
      
      if (order.customer_type === 'company') {
        currentY += 5;
        addSubTitle("KURUMSAL BİLGİLER");
        addText(`Firma Adı: ${order.company_name || 'Belirtilmemiş'}`);
        addText(`Vergi No: ${order.company_tax_no || 'Belirtilmemiş'}`);
        addText(`Vergi Dairesi: ${order.company_tax_office || 'Belirtilmemiş'}`);
      }

      currentY += 5;
      addSubTitle("PAKET BİLGİLERİ");
      addText(`Seçilen Paket: ${order.package_name}`);
      addText(`Fiyat: ${order.amount.toLocaleString('tr-TR')} ₺`);
      addText(`Ödeme Yöntemi: ${order.payment_method === 'credit_card' ? 'Kredi Kartı' : 'Banka Havalesi/EFT'}`);
      
      currentY += 3;
      addText("Müşterinin Hizmet Aldığı Paket İçeriği:", 11, true);
      if (packageFeatures.length > 0) {
        packageFeatures.forEach((feature: string) => {
          addText(`• ${feature}`);
        });
      } else {
        addText("Paket özellik bilgisi mevcut değil. Lütfen paket yönetiminden kontrol ediniz.", 9, false, [102, 102, 102]);
      }

      currentY += 5;
      addSubTitle("TARİHLER");
      addText(`Sözleşme Oluşturulma Tarihi: ${currentDate}`);
      addText(`Dijital Onaylama Tarihi: ${currentDateTime}`);
      addText(`IP Adresi: ${order.contract_ip_address || 'Bilinmiyor'}`);

      currentY += 10;

      // Form içeriğini HTML'den temizleyip ekle
      if (formData.content) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = formData.content;
        const plainText = tempDiv.textContent || tempDiv.innerText || '';
        
        // Form içeriğini parçalara ayır ve ekle
        const sections = plainText.split(/(?:\r?\n){2,}/).filter(section => section.trim());
        sections.forEach((section, index) => {
          const trimmedSection = section.trim();
          if (trimmedSection) {
            if (trimmedSection.length < 100 && (trimmedSection.includes(':') || index === 0)) {
              addSubTitle(trimmedSection);
            } else {
              addText(trimmedSection);
            }
          }
        });
      }
      
      pdf.save(`on-bilgilendirme-${order.customer_name.replace(/\s+/g, '-')}-${order.id.slice(0, 8)}.pdf`);
      
      toast({
        title: "Başarılı",
        description: "Ön bilgilendirme formu PDF'i indirildi",
      });
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({
        title: "Hata",
        description: "PDF oluşturulurken hata oluştu: " + error.message,
        variant: "destructive",
      });
    }
  };

  const downloadDistanceSalesPDF = async (order: Order) => {
    try {
      // jsPDF import
      const { jsPDF } = await import('jspdf');
      
      // PDF oluştur
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 15;
      const contentWidth = pageWidth - (margin * 2);
      let currentY = margin;

      // Helper functions
      const addText = (text: string, fontSize = 10, isBold = false, color = [0, 0, 0]) => {
        if (currentY > pageHeight - margin - 15) {
          pdf.addPage();
          currentY = margin;
        }
        
        pdf.setFontSize(fontSize);
        pdf.setFont("helvetica", isBold ? "bold" : "normal");
        pdf.setTextColor(color[0], color[1], color[2]);
        
        const lines = pdf.splitTextToSize(text, contentWidth);
        const lineHeight = fontSize * 0.352778;
        
        for (let i = 0; i < lines.length; i++) {
          if (currentY > pageHeight - margin - 15) {
            pdf.addPage();
            currentY = margin;
          }
          pdf.text(lines[i], margin, currentY);
          currentY += lineHeight + 1;
        }
        currentY += 2;
      };

      const addTitle = (text: string) => {
        addText(text, 16, true, [44, 62, 80]);
        currentY += 5;
      };

      const addSubTitle = (text: string) => {
        addText(text, 12, true, [44, 62, 80]);
        currentY += 3;
      };

      // KVKK Aydınlatma Metni
      addTitle("KİŞİSEL VERİLERE İLİŞKİN AYDINLATMA METNİ");
      
      addText("Doktorumol.com.tr (\"doktorumol\" veya \"Şirket\") olarak, işbu Aydınlatma Metni ile, Kişisel Verilerin Korunması Kanunu (\"Kanun\") ve Aydınlatma Yükümlülüğünün Yerine Getirilmesinde Uyulacak Usul ve Esaslar Hakkında Tebliğ kapsamında aydınlatma yükümlülüğümüzün yerine getirilmesi amaçlanmaktadır.");
      
      addText("Bu kapsamda bilgi vermekle yükümlü olduğumuz konular aşağıdaki gibidir:");

      currentY += 5;
      addSubTitle("1. Veri sorumlusunun ve varsa temsilcisinin kimliği");
      addText("Veri sorumlusu; doktorumol.com.tr'dir.");

      addSubTitle("2. Kişisel verilerin hangi amaçla işleneceği");
      addText("Ad, soyadı, telefon numarası, e-posta adresi, adres bilgileri, ödeme aracı bilgileri ve bunlarla sınırlı olmamak üzere varsa internet sitesi veya çağrı merkezi aracılığıyla iletmiş olduğunuz genel ve özel nitelikli kategorilerdeki kişisel verileriniz, internet sitesinde üyeliğinizin oluşturulması, Doktorumol üyeliği sebebiyle aldığınız hizmetlerin sunumu, alınan hizmet ile ilgili sizinle iletişime geçilmesi, müşteri ilişkilerinde sağlıklı ve uzun süreli etkileşim kurulması, onay vermeniz halinde tarafınıza ticari elektronik ileti gönderilmesi, talep ve şikayetlerinizin takibi ile ilerde oluşabilecek uyuşmazlık ve sorunların çözülmesi ve mevzuattan kaynaklanan zamanaşımı süresi doğrultusunda bu kişisel verilerinizin Doktorumol tarafından saklanması amacı ile işlenmektedir.");

      addText("Ayrıca, internet sitemizi ziyaretiniz ve kullanımınız sırasında internet sayfası sunucusu tarafından sabit sürücünüze iletilen küçük metin dosyaları (\"Çerezler\") aracılığıyla elde edilen kullanılan tarayıcı, IP adresi, internet bağlantınız, site kullanımlarınız hakkındaki bilgiler, bilgisayarınızdaki işletim sistemi ve benzeri kategorilerdeki kişisel verileriniz, internet sitesinin düzgün bir şekilde çalışabilmesi, ziyaret edilebilmesi ve özelliklerinden faydalanılması, internet sitesinde sayfalar arasında bilgileri taşıyabilmek ve bilgileri tekrardan girmek zorunda olmamak amaçları ile işlenmektedir.");

      addSubTitle("3. Şirket tarafından işlenen kişisel verilerin kimlere ve hangi amaçla aktarılabileceği");
      addText("Kişisel verileriniz 2. maddede belirtilen amaçların yerine getirilebilmesi için Doktorumol hissedarları, iş ortakları, hizmet aldığı şirketler ile yetkili kamu kurum ve kuruluşlarına aktarılabilecektir.");

      addSubTitle("4. Kişisel veri toplamanın yöntemi ve hukuki sebebi");
      addText("Şirketimizin internet sitesi veya çağrı merkezi aracılığıyla, tamamen veya kısmen otomatik yollarla elde edilen kişisel verileriniz, kanunda açıkça öngörülmesi, Doktorumol ile aranızda kurulabilecek hukuki ilişkinin devamı için kişisel verilerinin işlenmesinin gerekli olması, iletişim hakkının tesisi, kullanılması veya korunması için veri işlemenin zorunlu olması ve açık rızanız hukuki sebepleri ile toplanmaktadır.");

      addSubTitle("5. Kişisel verileriniz ile ilgili Kanun kapsamındaki haklarınız aşağıdaki şekildedir:");
      addText("(a) Kişisel verilerinizin işlenip işlenmediğini öğrenme, (b) Kişisel verileriniz işlenmişse buna ilişkin bilgi talep etme, (c) Kişisel verilerinizin işlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme, (ç) Yurt içinde veya yurt dışında kişisel verilerin aktarıldığı üçüncü kişileri bilme, (d) Kişisel verilerinizin eksik veya yanlış işlenmiş olması halinde bunların düzeltilmesini isteme, (e) Kişisel verilerinizin işlenmesini gerektiren sebeplerin ortadan kalkması halinde kişisel verilerinizin silinmesini veya yok edilmesini isteme, (f) (d) ve (e) bentleri uyarınca yapılan işlemlerin, kişisel verilerin aktarıldığı üçüncü kişilere bildirilmesini isteme, (g) İşlenen verilerin münhasıran otomatik sistemler vasıtasıyla analiz edilmesi suretiyle kişinin kendisi aleyhine bir sonucun ortaya çıkmasına itiraz etme, (ğ) Kişisel verilerin kanuna aykırı olarak işlenmesi sebebiyle zarara uğraması halinde zararın giderilmesini talep etme.");

      addText("Bu haklarınızı yazılı olarak veya güvenli elektronik imza, mobil imza, kayıtlı elektronik posta (KEP) adresi ya da Şirket'in sisteminde kayıtlı bulunan elektronik posta adresini kullanmak suretiyle (Bu kapsamda info@doktorumol.com.tr e-posta adresi üzerinden Şirket'e ulaşabilirsiniz) veya başvuru amacına yönelik geliştirilmiş bir yazılım ya da uygulama vasıtasıyla Şirket'e iletebilirsiniz.");

      addText("Bilginize sunarız.");

      currentY += 10;
      addSubTitle("Çağrı Merkezi Aydınlatma Metni");

      addText("Doktorumol.com.tr olarak, işbu Aydınlatma Metni ile, Kişisel Verilerin Korunması Kanunu (\"Kanun\") ve Aydınlatma Yükümlülüğünün Yerine Getirilmesinde Uyulacak Usul ve Esaslar Hakkında Tebliğ kapsamında aydınlatma yükümlülüğümüzün yerine getirilmesi amaçlanmaktadır.");

      addText("Doktorumol; çağrı merkezini arayanların paylaşmış olduğu ad-soyad, iletişim bilgisi ve ses kaydına ait kişisel verileri;");

      addText("• Arayan kişiye doğru hitap edilebilmesi,");
      addText("• Aramanın teyidi ve iletişim faaliyetlerinin yürütülmesi,");
      addText("• Görüşme talep edilen uzman için randevu oluşturulması,");
      addText("• Arayan kişinin uzmana yönlendirilmesi,");
      addText("• Talep ve şikayetlerin takibi,");
      addText("• Doğabilecek uyuşmazlıklarda delil olarak kullanılması amacıyla sınırlı olarak işlemektedir.");

      addText("Kişisel verileriniz yukarıda belirtilen amaçların yerine getirebilmesi için Şirket'in hissedarları, iş ortakları, hizmet aldığı şirketler ile yetkili kamu kurum ve kuruluşlarına ve randevu oluşturma talebinde bulunduğunuz ilgili uzmana aktarılabilecektir.");

      addText("Kişisel sağlık verilerinizi çağrı merkezi ile görüşmeniz sırasında paylaşmamanızı rica ederiz. Şirketimiz aracılığıyla randevu oluşturma talebiniz kapsamında çağrı merkezi aracılığıyla edinen kişisel verileriniz, Şirket ile aranızda kurulabilecek hukuki ilişkinin devamı için kişisel verilerinin işlenmesinin gerekli olması, randevu oluşturulmasına ilişkin hakkının tesisi, kullanılması veya korunması için veri işlemenin zorunlu olması hukuki sebepleri ile telefon yoluyla otomatik olarak işlenmektedir.");

      addText("Kanunun \"İlgili kişinin haklarını düzenleyen\" 11. maddesindeki taleplerinizi, \"Veri Sorumlusuna Başvuru Usul ve Esasları Hakkında Tebliğe\" göre Doktorumol.com.tr'nin Şirket mailine info@doktorumol.com.tr'ye iletebilirsiniz.");

      pdf.save(`kvkk-aydinlatma-${order.customer_name.replace(/\s+/g, '-')}-${order.id.slice(0, 8)}.pdf`);
      
      toast({
        title: "Başarılı",
        description: "KVKK Aydınlatma Metni PDF'i indirildi",
      });
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({
        title: "Hata",
        description: "PDF oluşturulurken hata oluştu: " + error.message,
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
            Çöp Kutusu
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
          {/* Bulk Actions */}
          {selectedOrderIds.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {selectedOrderIds.length} sipariş seçildi
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleBulkSoftDelete}
                      disabled={bulkSoftDeleteMutation.isPending}
                      className="flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Toplu Sil
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Sipariş Listesi ({filteredOrders?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
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
                            checked={selectAll}
                            onCheckedChange={() => handleSelectAll(filteredOrders || [])}
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
                            <div className="flex items-center justify-end gap-2">
                              {order.is_first_order && (
                                <div className="flex gap-1">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDownloadContract(order, 'pre_info')}
                                    className="flex items-center gap-1"
                                  >
                                    <FileText className="w-3 h-3" />
                                    Ön Bilgi
                                  </Button>
                                  
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDownloadContract(order, 'distance_sales')}
                                    className="flex items-center gap-1"
                                  >
                                    <Download className="w-3 h-3" />
                                    Mesafeli Satış
                                  </Button>
                                </div>
                              )}
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
                        onClick={() => handleSoftDeleteOrder(selectedOrder.id)}
                        disabled={softDeleteOrderMutation.isPending}
                      >
                        {softDeleteOrderMutation.isPending ? "Siliniyor..." : "Sil"}
                      </Button>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          )}
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

                {/* Automatic Orders Table */}
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
