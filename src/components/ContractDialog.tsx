
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { sanitizeRichHtml } from "@/utils/sanitize";
import { supabase } from "@/integrations/supabase/client";
import { withCommitmentDisclosure } from "@/lib/contractDisclosure";
import { buildDistanceSalesHtml } from "@/lib/distanceSalesContract";

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
      // Eski sözleşmelere hizmet süresi maddesini ekle
      let content = savedPreInfoHtml;
      const serviceDurationClause = `<p style="margin-top: 15px;"><strong>Toplam Hizmet Süresi (Taahhütlü):</strong> Premium üyelik başlangıç imza tarihiyle birlikte 365 Gün ( 12 Ay ) Taahhütlü Hizmet Süresi.</p>

<p style="margin-top: 10px;">Her ay danışan yönlendirmesi garantisi verilmektedir. İlgili ay içinde yönlendirme yapılmazsa, o aya ait ücret iade edilir ve üyelik ücretsiz olarak iptal edilebilir. Bu hak yalnızca yönlendirme yapılmayan aylar için geçerlidir.</p>`;
      
      // Eğer bu madde yoksa ve TARİHLER: başlığı varsa, ekle
      if (!content.includes('Toplam Hizmet Süresi (Taahhütlü)') && content.includes('TARİHLER:')) {
        content = content.replace(
          /<h3 style="color: #0369a1; margin-top: 20px;">TARİHLER:<\/h3>/,
          `${serviceDurationClause}\n\n<h3 style="color: #0369a1; margin-top: 20px;">TARİHLER:</h3>`
        );
      }
      
      setContractContent(withCommitmentDisclosure(content, selectedPackage.price));
      setIsLoading(false);
    } else {
      loadFormContent();
    }
  }
}, [open, contractType, savedPreInfoHtml, selectedPackage.price]);

  const loadFormContent = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('form_contents')
        .select('content')
        .eq('form_type', 'pre_info')
        .maybeSingle();

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
<p><strong>Telefon:</strong> ${(formData.phone || formData.gsmNumber) || 'Belirtilmemiş'}</p>
<p><strong>TC Kimlik No:</strong> ${(formData.tcNo || formData.identityNumber) || 'Belirtilmemiş'}</p>
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

${selectedPackage.price === 4000 ? `
<p style="margin-top: 10px;"><strong>Bilgilendirme:</strong> Bu hizmet, belirlenen taahhüt süresi kapsamında özel indirimden yararlanmaktadır. Taahhüt sebebiyle hizmet bedeli 6.500 TL yerine 4.000 TL olarak uygulanmaktadır.</p>
` : ''}

${selectedPackage.price === 3600 ? `
<p style="margin-top: 10px;"><strong>Bilgilendirme:</strong> Bu hizmet, belirlenen taahhüt süresi kapsamında özel indirimden yararlanmaktadır. Taahhüt sebebiyle hizmet bedeli 4.999 TL yerine 3.600 TL olarak uygulanmaktadır.</p>
` : ''}

${selectedPackage.price === 2998 ? `
<p style="margin-top: 10px;"><strong>Bilgilendirme:</strong> Bu hizmet, belirlenen taahhüt süresi kapsamında özel indirimden yararlanmaktadır. Taahhüt sebebiyle hizmet bedeli 4.999 TL yerine 2.998 TL olarak uygulanmaktadır.</p>
` : ''}

${selectedPackage.price === 2398 ? `
<p style="margin-top: 10px;"><strong>Bilgilendirme:</strong> Bu hizmet, belirlenen taahhüt süresi kapsamında özel indirimden yararlanmaktadır. Taahhüt sebebiyle hizmet bedeli 4.999 TL yerine 2.398 TL olarak uygulanmaktadır.</p>
` : ''}

<p style="margin-top: 15px;"><strong>Toplam Hizmet Süresi (Taahhütlü):</strong> Premium üyelik başlangıç imza tarihiyle birlikte 365 Gün ( 12 Ay ) Taahhütlü Hizmet Süresi.</p>

<p style="margin-top: 10px;">Her ay danışan yönlendirmesi garantisi verilmektedir. İlgili ay içinde yönlendirme yapılmazsa, o aya ait ücret iade edilir ve üyelik ücretsiz olarak iptal edilebilir. Bu hak yalnızca yönlendirme yapılmayan aylar için geçerlidir.</p>

<h3 style="color: #0369a1; margin-top: 20px;">TARİHLER:</h3>
<p><strong>Sözleşme Oluşturulma Tarihi:</strong> ${contractDate}</p>
<p><strong>Dijital Onaylama Tarihi:</strong> ${contractDateTime}</p>
<p><strong>IP Adresi:</strong> ${clientIP}</p>
</div>

<hr style="margin: 20px 0; border: 1px solid #e5e7eb;">

`;

        content = customerInfo + content;
        setContractContent(withCommitmentDisclosure(content, selectedPackage.price));
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
      return savedDistanceSalesHtml.replace(/\n/g, '<br>');
    }
    return buildDistanceSalesHtml({ formData, selectedPackage, paymentMethod, customerType, clientIP, orderCreatedAt });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="flex max-h-[85dvh] w-[calc(100%-2rem)] max-w-4xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b border-border px-5 py-5 pr-12 text-left sm:px-6">
          <div className="min-w-0">
            <DialogTitle className="text-lg font-semibold leading-snug sm:text-xl">
              {getTitle()}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {contractType === "preInfo" ? "Ön bilgilendirme formu içeriği" : "Mesafeli satış sözleşmesi içeriği"}
            </DialogDescription>
          </div>
        </DialogHeader>
        
        <div className="min-h-0 min-w-0 overflow-y-auto overflow-x-hidden px-5 py-6 sm:px-6" role="region" aria-label={getTitle()} tabIndex={0}>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-pulse h-8 w-full rounded bg-muted"></div>
            </div>
          ) : (
            <div 
              className="min-w-0 max-w-full text-left text-sm leading-7 font-sans text-foreground [overflow-wrap:anywhere] sm:text-base [&_*]:!max-w-full [&_*]:!whitespace-normal [&_*]:[overflow-wrap:anywhere] [&_*]:!text-foreground [&_*]:!bg-transparent [&_*]:!border-border [&_p]:my-3 [&_h2]:mt-6 [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:mt-5 [&_h3]:font-semibold [&_ul]:list-disc [&_ul]:pl-6 [&_hr]:my-6 [&_table]:!w-full [&_table]:table-fixed [&_pre]:!whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ 
                __html: sanitizeRichHtml(contractType === "preInfo" ? contractContent : getDistanceSalesContent())
              }}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ContractDialog;
