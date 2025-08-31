
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ContractDialogProps {
  open: boolean;
  onClose: () => void;
  contractType: "preInfo" | "distanceSales";
  formData: any;
  selectedPackage: any;
  paymentMethod: string;
  customerType: string;
  clientIP: string;
  orderCreatedAt: string;
  savedPreInfoHtml?: string;
  savedDistanceSalesHtml?: string;
}

const ContractDialog = ({
  open,
  onClose,
  contractType,
  formData,
  selectedPackage,
  paymentMethod,
  customerType,
  clientIP,
  orderCreatedAt,
  savedPreInfoHtml,
  savedDistanceSalesHtml
}: ContractDialogProps) => {
  const [contractContent, setContractContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);

useEffect(() => {
  if (!open) return;
  if (contractType === "preInfo") {
    if (savedPreInfoHtml) {
      setContractContent(savedPreInfoHtml);
      setIsLoading(false);
    } else {
      loadFormContent();
    }
  }
}, [open, contractType, savedPreInfoHtml]);

  const loadFormContent = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('form_contents')
        .select('content')
        .eq('form_type', 'pre_info')
        .single();

      if (error) {
        console.error('Error loading form content:', error);
        return;
      }

      if (data) {
        // Form içeriğini müşteri bilgileri ile birleştir
        let content = data.content;
        
        // Müşteri bilgilerini forma ekle
        const orderDate = new Date(orderCreatedAt);
        const contractDate = orderDate.toLocaleDateString('tr-TR');
        const contractDateTime = orderDate.toLocaleString('tr-TR');
        
        const customerInfo = `
<div style="background: #f0f9ff; padding: 20px; margin-bottom: 20px; border-radius: 8px; border: 1px solid #0ea5e9;">
<h3 style="color: #0369a1; margin-top: 0;">MÜŞTERI BİLGİLERİ:</h3>
<p><strong>Müşteri Adı:</strong> ${formData.name} ${formData.surname}</p>
<p><strong>E-posta:</strong> ${formData.email}</p>
<p><strong>Telefon:</strong> ${formData.phone || 'Belirtilmemiş'}</p>
<p><strong>TC Kimlik No:</strong> ${formData.tcNo || 'Belirtilmemiş'}</p>
<p><strong>Adres:</strong> ${formData.address || 'Belirtilmemiş'}</p>
<p><strong>Şehir:</strong> ${formData.city}</p>
<p><strong>Müşteri Tipi:</strong> ${customerType === 'individual' ? 'Bireysel' : 'Kurumsal'}</p>

${customerType === 'company' ? `<h3 style="color: #0369a1;">KURUMSAL BİLGİLER:</h3>
<p><strong>Firma Adı:</strong> ${formData.companyName || 'Belirtilmemiş'}</p>
<p><strong>Vergi No:</strong> ${formData.taxNumber || 'Belirtilmemiş'}</p>
<p><strong>Vergi Dairesi:</strong> ${formData.taxOffice || 'Belirtilmemiş'}</p>
` : ''}

<h3 style="color: #0369a1;">PAKET BİLGİLERİ:</h3>
<p><strong>Seçilen Paket:</strong> ${selectedPackage.name}</p>
<p><strong>Fiyat:</strong> ${selectedPackage.price.toLocaleString('tr-TR')} ₺</p>
<p><strong>Ödeme Yöntemi:</strong> ${paymentMethod === 'credit_card' ? 'Kredi Kartı' : 'Banka Havalesi/EFT'}</p>

<h4 style="color: #0369a1; margin-top: 15px;">Müşterinin Hizmet Aldığı Paket İçeriği:</h4>
<ul style="margin-left: 20px;">
${selectedPackage.features ? selectedPackage.features.map((feature: string) => `<li>${feature}</li>`).join('') : ''}
</ul>

<h3 style="color: #0369a1; margin-top: 20px;">TARİHLER:</h3>
<p><strong>Sözleşme Oluşturulma Tarihi:</strong> ${contractDate}</p>
<p><strong>Dijital Onaylama Tarihi:</strong> ${contractDateTime}</p>
<p><strong>IP Adresi:</strong> ${clientIP}</p>
</div>

<hr style="margin: 20px 0; border: 1px solid #e5e7eb;">

`;

        content = customerInfo + content;
        setContractContent(content);
      }
    } catch (error) {
      console.error('Error loading form content:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTitle = () => {
    return contractType === "preInfo" 
      ? "Ön Bilgilendirme Formu" 
      : "Mesafeli Satış Sözleşmesi";
  };

  const getDistanceSalesContent = () => {
    if (savedDistanceSalesHtml) {
      return savedDistanceSalesHtml;
    }
    return `KİŞİSEL VERİLERE İLİŞKİN AYDINLATMA METNİ

Doktorumol.com.tr ("doktorumol" veya "Şirket") olarak, işbu Aydınlatma Metni ile, Kişisel Verilerin Korunması Kanunu ("Kanun") ve Aydınlatma Yükümlülüğünün Yerine Getirilmesinde Uyulacak Usul ve Esaslar Hakkında Tebliğ kapsamında aydınlatma yükümlülüğümüzün yerine getirilmesi amaçlanmaktadır.

Bu kapsamda bilgi vermekle yükümlü olduğumuz konular aşağıdaki gibidir:

1. Veri sorumlusunun ve varsa temsilcisinin kimliği

Veri sorumlusu; doktorumol.com.tr'dir.

2. Kişisel verilerin hangi amaçla işleneceği

Ad, soyadı, telefon numarası, e-posta adresi, adres bilgileri, ödeme aracı bilgileri ve bunlarla sınırlı olmamak üzere varsa internet sitesi veya çağrı merkezi aracılığıyla iletmiş olduğunuz genel ve özel nitelikli kategorilerdeki kişisel verileriniz, internet sitesinde üyeliğinizin oluşturulması, Doktorumol üyeliği sebebiyle aldığınız hizmetlerin sunumu, alınan hizmet ile ilgili sizinle iletişime geçilmesi, müşteri ilişkilerinde sağlıklı ve uzun süreli etkileşim kurulması, onay vermeniz halinde tarafınıza ticari elektronik ileti gönderilmesi, talep ve şikayetlerinizin takibi ile ilerde oluşabilecek uyuşmazlık ve sorunların çözülmesi ve mevzuattan kaynaklanan zamanaşımı süresi doğrultusunda bu kişisel verilerinizin Doktorumol tarafından saklanması amacı ile işlenmektedir.

Ayrıca, internet sitemizi ziyaretiniz ve kullanımınız sırasında internet sayfası sunucusu tarafından sabit sürücünüze iletilen küçük metin dosyaları ("Çerezler") aracılığıyla elde edilen kullanılan tarayıcı, IP adresi, internet bağlantınız, site kullanımlarınız hakkındaki bilgiler, bilgisayarınızdaki işletim sistemi ve benzeri kategorilerdeki kişisel verileriniz, internet sitesinin düzgün bir şekilde çalışabilmesi, ziyaret edilebilmesi ve özelliklerinden faydalanılması, internet sitesinde sayfalar arasında bilgileri taşıyabilmek ve bilgileri tekrardan girmek zorunluluğunun ortadan kaldırılması amaçları ile işlenmektedir.

3. Şirket tarafından işlenen kişisel verilerin kimlere ve hangi amaçla aktarılabileceği

Kişisel verileriniz 2. maddede belirtilen amaçların yerine getirilebilmesi için Doktorumol hissedarları, iş ortakları, hizmet aldığı şirketler ile yetkili kamu kurum ve kuruluşlarına aktarılabilecektir.

4. Kişisel veri toplamanın yöntemi ve hukuki sebebi

Şirketimizin internet sitesi veya çağrı merkezi aracılığıyla, tamamen veya kısmen otomatik yollarla elde edilen kişisel verileriniz, kanunda açıkça öngörülmesi, Doktorumol ile aranızda kurulabilecek hukuki ilişkinin devamı için kişisel verilerinizin işlenmesinin gerekli olması, iletişim hakkının tesisi, kullanılması veya korunması için veri işlemenin zorunlu olması ve açık rızanız hukuki sebepleri ile toplanmaktadır.

5. Kişisel verileriniz ile ilgili Kanun kapsamındaki haklarınız aşağıdaki şekildedir:

(a) Kişisel verilerinizin işlenip işlenmediğini öğrenme, (b) Kişisel verileriniz işlenmişse buna ilişkin bilgi talep etme, (c) Kişisel verilerinizin işlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme, (ç) Yurt içinde veya yurt dışında kişisel verilerin aktarıldığı üçüncü kişileri bilme, (d) Kişisel verilerinizin eksik veya yanlış işlenmiş olması halinde bunların düzeltilmesini isteme, (e) Kişisel verilerinizin işlenmesini gerektiren sebeplerin ortadan kalkması halinde kişisel verilerinizin silinmesini veya yok edilmesini isteme, (f) (d) ve (e) bentleri uyarınca yapılan işlemlerin, kişisel verilerin aktarıldığı üçüncü kişilere bildirilmesini isteme, (g) İşlenen verilerin münhasıran otomatik sistemler vasıtasıyla analiz edilmesi suretiyle kişinin kendisi aleyhine bir sonucun ortaya çıkmasına itiraz etme, (ğ) Kişisel verilerin kanuna aykırı olarak işlenmesi sebebiyle zarara uğraması halinde zararın giderilmesini talep etme.

Bu haklarınızı yazılı olarak veya güvenli elektronik imza, mobil imza, kayıtlı elektronik posta (KEP) adresi ya da Şirket'in sisteminde kayıtlı bulunan elektronik posta adresini kullanmak suretiyle (Bu kapsamda info@doktorumol.com.tr e-posta adresi üzerinden Şirket'e ulaşabilirsiniz) veya başvuru amacına yönelik geliştirilmiş bir yazılım ya da uygulama vasıtasıyla Şirket'e iletebilirsiniz.

Bilginize sunarız.

Çağrı Merkezi Aydınlatma Metni

Doktorumol.com.tr olarak, işbu Aydınlatma Metni ile, Kişisel Verilerin Korunması Kanunu ("Kanun") ve Aydınlatma Yükümlülüğünün Yerine Getirilmesinde Uyulacak Usul ve Esaslar Hakkında Tebliğ kapsamında aydınlatma yükümlülüğümüzün yerine getirilmesi amaçlanmaktadır.

Doktoru mol; çağrı merkezini arayanların paylaşmış olduğu ad-soyad, iletişim bilgisi ve ses kaydına ait kişisel verilerni;

- Arayan kişiye doğru hitap edilebilmesi,
- Aramanın teyidi ve iletişim faaliyetlerinin yürütülmesi,
- Görüşme talep edilen uzman için randevu oluşturulması,
- Arayan kişinin uzmana yönlendirilmesi,
- Talep ve şikayetlerin takibi,
- Doğabilecek uyuşmazlıklarda delil olarak kullanılması amaçlarıyla sınırlı olarak işlemektedir.

Kişisel verileriniz yukarıda belirtilen amaçların yerine getirilebilmesi için Şirket'in hissedarları, iş ortakları, hizmet aldığı şirketler ile yetkili kamu kurum ve kuruluşlarına ve randevu oluşturma talebinde bulunduğunuz ilgili uzmana aktarılabilecektir.

Kişisel sağlık verilerinizi çağrı merkezi ile görüşmeniz sırasında paylaşmamanızı rica ederiz.Şirketimiz aracılığıyla randevu oluşturma talebiniz kapsamında çağrı merkezi aracılığıyla edilen kişisel verileriniz, Şirket ile aranızda kurulabilecek hukuki ilişkinin devamı için kişisel verilerinizin işlenmesinin gerekli olması, randevu oluşturulmasına ilişkin hakkınızın tesisi, kullanılması veya korunması için veri işlemenin zorunlu olması hukuki sebepleri ile telefon yoluyla otomatik olarak işlenmektedir.

Kanunun "İlgili kişinin haklarını düzenleyen" 11. maddesi kapsamındaki taleplerinizi, "Veri Sorumlusuna Başvuru Usul ve Esasları Hakkında Tebliğe" göre Doktorumol.com.tr'nin Şirket mailine info@doktorumol.com.tr'ye iletebilirsiniz.

ALICI BİLGİLERİ:
Ad Soyad: ${formData.name} ${formData.surname}
E-posta: ${formData.email}
Telefon: ${formData.phone || 'Belirtilmemiş'}
Adres: ${formData.address || 'Belirtilmemiş'}
Şehir: ${formData.city}

ÜRÜN/HİZMET BİLGİLERİ:
Ürün/Hizmet: ${selectedPackage.name}
Fiyat: ${selectedPackage.price.toLocaleString('tr-TR')} ₺
Ödeme Şekli: ${paymentMethod === 'credit_card' ? 'Kredi Kartı' : 'Banka Havalesi/EFT'}

Sözleşme Tarihi: ${new Date(orderCreatedAt).toLocaleDateString('tr-TR')}
IP Adresi: ${clientIP}`;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">
              {getTitle()}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {contractType === "preInfo" ? "Ön bilgilendirme formu içeriği" : "Mesafeli satış sözleşmesi içeriği"}
            </DialogDescription>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <ScrollArea className="px-6 pb-6 max-h-96">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div 
              className="text-base leading-relaxed font-sans text-foreground"
              dangerouslySetInnerHTML={{ 
                __html: contractType === "preInfo" ? contractContent : getDistanceSalesContent().replace(/\n/g, '<br>')
              }}
            />
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default ContractDialog;
