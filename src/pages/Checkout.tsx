import { useState, useEffect, useRef } from "react";
import { createSubmissionAttempt } from '@/lib/submissionAttempt';
import { newSaleCatalog, newSalePackage } from "@/lib/newSaleCatalog";
import { checkoutAfterOrder } from '@/lib/checkoutSubmission';
import { paymentErrorMessage } from '@/lib/paymentError';
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Building, User, Banknote, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getClientIP } from "@/utils/ipUtils";
import ContractDialog from "@/components/ContractDialog";
import BankTransferInfo from "@/components/BankTransferInfo";
import { HorizontalNavigation } from "@/components/HorizontalNavigation";

// Ödeme yalnızca banka havalesiyle alınır; kart sağlayıcısı anlaşması yoktur.
import { supabase } from "@/integrations/supabase/client";

const turkishCities = [
  "İstanbul", "Ankara", "İzmir", "Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Aksaray", "Amasya", "Antalya",
  "Ardahan", "Artvin", "Aydın", "Balıkesir", "Bartın", "Batman", "Bayburt", "Bilecik", "Bingöl", "Bitlis",
  "Bolu", "Burdur", "Bursa", "Çanakkale", "Çankırı", "Çorum", "Denizli", "Diyarbakır", "Düzce", "Edirne",
  "Elazığ", "Erzincan", "Erzurum", "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane", "Hakkâri", "Hatay",
  "Iğdır", "Isparta", "Kahramanmaraş", "Karabük", "Karaman", "Kars", "Kastamonu", "Kayseri", "Kırıkkale",
  "Kırklareli", "Kırşehir", "Kilis", "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa", "Mardin", "Mersin",
  "Muğla", "Muş", "Nevşehir", "Niğde", "Ordu", "Osmaniye", "Rize", "Sakarya", "Samsun", "Siirt", "Sinop",
  "Sivas", "Şanlıurfa", "Şırnak", "Tekirdağ", "Tokat", "Trabzon", "Tunceli", "Uşak", "Van", "Yalova",
  "Yozgat", "Zonguldak"
];

const Checkout = ({ fixedPackage }: { fixedPackage?: string } = {}) => {
  const { packageType: routePackage } = useParams();
  const packageId = fixedPackage ?? routePackage;
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [selectedPackage, setSelectedPackage] = useState(newSaleCatalog["ozel-firsat"]);
  const [loading, setLoading] = useState(false);
  const [customerType, setCustomerType] = useState<"individual" | "company">("individual");
  const [contractAccepted, setContractAccepted] = useState(false);
  const [showPreInfoDialog, setShowPreInfoDialog] = useState(false);
  const [showDistanceSalesDialog, setShowDistanceSalesDialog] = useState(false);
  const [showBankInfo, setShowBankInfo] = useState(false);
  const cardEnabled = true;
  const [paymentMethod, setPaymentMethod] = useState<"bank_transfer" | "credit_card">("bank_transfer");
  const [clientIP, setClientIP] = useState<string>("");
  const paymentLock = useRef(false);
  const orderAttempt = useRef(createSubmissionAttempt());
  
  const [formData, setFormData] = useState({
    name: "",
    surname: "",
    email: "",
    gsmNumber: "",
    identityNumber: "",
    address: "",
    city: "İstanbul",
    zipCode: "34100",
    companyName: "",
    taxNumber: "",
    taxOffice: "",
    referralCode: ""
  });

  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);

      try {
        const selected = newSalePackage(packageId ?? location.state?.packageData?.id);
        if (!selected) {
          navigate('/ozel-firsat', { replace: true });
          return;
        }
        // Navigation state may select an ID, but cannot supply price/name/scope.
        setSelectedPackage(selected);

        // IP fetch — 3sn timeout, hata olursa fallback
        try {
          const ipPromise = getClientIP();
          const timeoutPromise = new Promise<string>((resolve) =>
            setTimeout(() => resolve('127.0.0.1'), 3000)
          );
          const ip = await Promise.race([ipPromise, timeoutPromise]);
          setClientIP(ip || '127.0.0.1');
        } catch {
          setClientIP('127.0.0.1');
        }
      } catch (err) {
        console.error('[Checkout] initializeData error:', err);
        setClientIP('127.0.0.1');
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, [packageId, navigate, location.state, toast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    let { name, value } = e.target;
    
    // TC Kimlik No formatı
    if (name === "identityNumber") {
      value = value.replace(/\D/g, "").substring(0, 11);
    }
    
    // Telefon formatı - Iyzico +90xxxxxxxxxx formatını bekliyor (13 karakter)
    if (name === "gsmNumber") {
      value = value.replace(/\D/g, "");
      if (value.startsWith("90")) {
        value = "+" + value;
      } else if (value.startsWith("0")) {
        value = "+9" + value;
      } else if (!value.startsWith("+90")) {
        value = "+90" + value;
      }
      value = value.substring(0, 13); // +90xxxxxxxxxx = 13 karakter
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    const requiredFields = [
      'name', 'surname', 'email', 'gsmNumber', 'identityNumber',
      'address', 'city'
    ];

    for (const field of requiredFields) {
      if (!formData[field as keyof typeof formData]) {
        toast({
          title: "Eksik Bilgi",
          description: `Lütfen tüm zorunlu alanları doldurun.`,
          variant: "destructive"
        });
        return false;
      }
    }

    if (customerType === 'company') {
      if (!formData.companyName || !formData.taxNumber) {
        toast({
          title: "Eksik Bilgi", 
          description: "Kurumsal müşteriler için firma adı ve vergi numarası zorunludur.",
          variant: "destructive"
        });
        return false;
      }
    }

    if (!contractAccepted && !(selectedPackage as any).existingCustomer) {
      toast({
        title: "Sözleşme Onayı",
        description: "Devam etmek için sözleşmeleri kabul etmelisiniz.",
        variant: "destructive"
      });
      return false;
    }

    // Email formatı kontrolü
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Geçersiz Email",
        description: "Lütfen geçerli bir email adresi girin.",
        variant: "destructive"
      });
      return false;
    }

    // TC Kimlik No kontrolü
    if (formData.identityNumber.length !== 11) {
      toast({
        title: "Geçersiz TC Kimlik No",
        description: "TC Kimlik No 11 haneli olmalıdır.",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const [redirecting, setRedirecting] = useState(false);
  const [fullName, setFullName] = useState("");
  const [showReferral, setShowReferral] = useState(false);

  const handlePaymentProcess = async () => {
    if (paymentLock.current || !validateForm()) return;
    paymentLock.current = true;
    if (paymentMethod === 'credit_card') setRedirecting(true);
    let leaving = false;
    try {
      await checkoutAfterOrder(
        () => saveOrder(paymentMethod),
        async () => {
          if (paymentMethod === 'credit_card') {
            const orderId = JSON.parse(localStorage.getItem('lastOrder') || '{}').id;
            const { data, error } = await supabase.functions.invoke('hoppa-subscription', { body: { action: 'start', orderId } });
            if (error || !data?.url) {
              toast({ title: "Ödeme sayfası açılamadı", description: await paymentErrorMessage(data, error), variant: "destructive" });
              return;
            }
            leaving = true;
            window.location.href = data.url;
            return;
          }
          setShowBankInfo(true);
        },
      );
    } finally {
      paymentLock.current = false;
      if (!leaving) setRedirecting(false);
    }
  };

  const saveOrder = async (paymentMethod: string) => {
    const orderId = orderAttempt.current.begin({ formData, customerType, packageType: selectedPackage.type, amount: selectedPackage.price, paymentMethod });
    if (!orderId) {
      toast({ title: 'Siparişiniz zaten kaydedildi', description: 'Yeni bir ödeme başlatmadan önce destek hattından mevcut siparişinizi teyit edin.', variant: 'destructive' });
      return false;
    }
    try {
      setLoading(true);
      
      const orderData = {
        id: orderId,
        customer_name: `${formData.name} ${formData.surname}`,
        customer_email: formData.email,
        customer_phone: formData.gsmNumber,
        customer_tc_no: formData.identityNumber,
        customer_address: formData.address,
        customer_city: formData.city,
        customer_type: customerType,
        company_name: customerType === 'company' ? formData.companyName : null,
        company_tax_no: customerType === 'company' ? formData.taxNumber : null,
        company_tax_office: customerType === 'company' ? formData.taxOffice : null,
        package_name: selectedPackage.name,
        package_type: selectedPackage.type,
        // The server assigns the canonical TRY amount from package_type.
        amount: null,
        payment_method: paymentMethod,
        status: 'pending',
        is_first_order: true,
        subscription_month: 1,
        contract_ip_address: clientIP
      };

      // Davet kodunu güvenli şekilde sakla — Iyzico'ya gönderilmez,
      // SpecialistRegistration kayıt formunda otomatik doldurulur.
      const referralCodeClean = formData.referralCode?.trim().toUpperCase() || "";
      if (referralCodeClean) {
        try {
          localStorage.setItem('pending_referral_code', referralCodeClean);
          localStorage.setItem('pending_referral_email', formData.email.toLowerCase());
        } catch (e) { /* ignore */ }
      }

      const { error } = await supabase
        .from('orders')
        .insert(orderData);

      if (error) {
        throw new Error(error.code === '23505'
          ? 'Bu sipariş daha önce kaydedilmiş olabilir. Yeniden ödeme başlatmadan önce siparişinizi teyit edin.'
          : 'Sipariş kaydı doğrulanamadı. Ödeme başlatılmadı; bağlantınızı kontrol edip tekrar deneyin.');
      }
      orderAttempt.current.finish(true);

      // Yeni sipariş SMS bildirimi gönder
      try {
        const now = new Date();
        const orderDateTime = `${now.toLocaleDateString('tr-TR')} ${now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`;
        
        void supabase.functions.invoke('send-new-order-sms', {
          body: {
            customerName: `${formData.name} ${formData.surname}`,
            customerPhone: formData.gsmNumber,
            packageName: selectedPackage.name,
            amount: selectedPackage.price,
            paymentMethod: paymentMethod,
            orderDate: orderDateTime,
            customerCity: formData.city
          }
        });
      } catch (smsError) {
        console.error('Failed to send order notification SMS:', smsError);
        // SMS hatası sipariş oluşturmayı engellemez
      }

      localStorage.setItem('lastOrder', JSON.stringify({
        id: orderId,
        orderNumber: `DRP-${Date.now()}`,
        package: selectedPackage.name,
        amount: selectedPackage.price,
        paymentMethod: paymentMethod,
        customerName: `${formData.name} ${formData.surname}`
      }));

      if (paymentMethod === 'bank_transfer') {
        navigate("/odeme-basarili");
      }
      return true;

    } catch (error) {
      console.error('Save order error:', error);
      toast({
        title: "Hata",
        description: error.message || "Beklenmeyen bir hata oluştu.",
        variant: "destructive"
      });
      return false;
    } finally {
      orderAttempt.current.finish();
      setLoading(false);
    }
  };

  const handlePreInfoLinkClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowPreInfoDialog(true);
  };

  const handleDistanceSalesLinkClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowDistanceSalesDialog(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted">
      <Helmet>
        <title>Ödeme Sayfası - Doktorumol</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="description" content="Güvenli ödeme sayfası" />
      </Helmet>

      <HorizontalNavigation />

      <div className="mx-auto w-full max-w-md px-4 py-6">
        <button type="button" onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Geri
        </button>

        {/* Fiyat kartı */}
        <div className="flex items-center justify-between rounded-2xl bg-card p-5 shadow-sm">
          <div>
            <div className="text-sm text-muted-foreground">{selectedPackage.name}</div>
            <div className="text-2xl font-bold text-foreground">
              {selectedPackage.price.toLocaleString('tr-TR')} ₺<span className="text-sm font-normal text-muted-foreground">/ay</span>
            </div>
            {selectedPackage.originalPrice && <div className="text-xs text-muted-foreground line-through">{selectedPackage.originalPrice.toLocaleString('tr-TR')} ₺</div>}
          </div>
          {selectedPackage.originalPrice && selectedPackage.originalPrice > selectedPackage.price && (
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              %{Math.round((1 - selectedPackage.price / selectedPackage.originalPrice) * 100)} indirim
            </span>
          )}
        </div>

        {/* Ödeme yöntemi */}
        <div className="mb-2 mt-6 px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Ödeme yöntemi</div>
        <div className="divide-y divide-border overflow-hidden rounded-2xl bg-card shadow-sm">
          {([["credit_card", "Kredi Kartı", CreditCard], ["bank_transfer", "Banka Havalesi", Banknote]] as const).map(([val, label, Icon]) => (
            <button key={val} type="button" onClick={() => setPaymentMethod(val)} aria-pressed={paymentMethod === val}
              className="flex w-full items-center justify-between px-4 py-3.5 text-left text-base text-foreground">
              <span className="flex items-center gap-3"><Icon className="h-5 w-5 text-primary" />{label}</span>
              <span className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${paymentMethod === val ? "border-primary" : "border-border"}`}>
                {paymentMethod === val && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
              </span>
            </button>
          ))}
        </div>

        {/* Fatura bilgileri */}
        <div className="mb-2 mt-6 flex items-center justify-between px-1">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Fatura bilgileri</span>
          <button type="button" className="text-sm text-primary" onClick={() => setCustomerType(customerType === "company" ? "individual" : "company")}>
            {customerType === "company" ? "‹ Bireysel" : "Kurumsal ›"}
          </button>
        </div>
        <div className="divide-y divide-border overflow-hidden rounded-2xl bg-card shadow-sm [&_input]:h-12 [&_input]:rounded-none [&_input]:border-0 [&_input]:bg-transparent [&_input]:px-4 [&_input]:text-base [&_input]:shadow-none [&_input]:focus-visible:ring-0 [&_input]:focus-visible:ring-offset-0">
          {customerType === "company" && <>
            <Input aria-label="Firma adı" name="companyName" value={formData.companyName} onChange={handleInputChange} placeholder="Firma adı" />
            <Input aria-label="Vergi numarası" name="taxNumber" value={formData.taxNumber} onChange={handleInputChange} placeholder="Vergi numarası" />
            <Input aria-label="Vergi dairesi" name="taxOffice" value={formData.taxOffice} onChange={handleInputChange} placeholder="Vergi dairesi" />
          </>}
          <Input aria-label="Ad Soyad" autoComplete="name" value={fullName} onChange={(e) => {
            const v = e.target.value; setFullName(v);
            const parts = v.trim().split(/\s+/);
            setFormData(prev => ({ ...prev, name: parts.length > 1 ? parts.slice(0, -1).join(" ") : parts[0] || "", surname: parts.length > 1 ? parts[parts.length - 1] : "" }));
          }} placeholder="Ad Soyad" />
          <Input aria-label="E-posta" name="email" type="email" autoComplete="email" value={formData.email} onChange={handleInputChange} placeholder="E-posta" />
          <Input aria-label="Telefon" name="gsmNumber" type="tel" autoComplete="tel" value={formData.gsmNumber} onChange={handleInputChange} placeholder="Telefon (05xx xxx xx xx)" />
          <Input aria-label="TC Kimlik No" name="identityNumber" inputMode="numeric" value={formData.identityNumber} onChange={handleInputChange} placeholder="TC Kimlik No" maxLength={11} />
          <Select value={formData.city} onValueChange={(value) => handleSelectChange('city', value)}>
            <SelectTrigger aria-label="Şehir" className="h-12 rounded-none border-0 px-4 text-base shadow-none focus:ring-0 focus:ring-offset-0">
              <SelectValue placeholder="Şehir seçin" />
            </SelectTrigger>
            <SelectContent>
              {turkishCities.map((city) => <SelectItem key={city} value={city}>{city}</SelectItem>)}
            </SelectContent>
          </Select>
          <Textarea aria-label="Adres" name="address" autoComplete="street-address" value={formData.address} onChange={handleInputChange}
            placeholder="Açık adres (mahalle, sokak, bina no, daire, ilçe)" rows={3}
            className="resize-none rounded-none border-0 bg-transparent px-4 py-3 text-base shadow-none focus-visible:ring-0 focus-visible:ring-offset-0" />
        </div>

        {/* Davet kodu */}
        {showReferral ? (
          <Input className="mt-3 uppercase tracking-wider" aria-label="Davet kodu" value={formData.referralCode}
            onChange={(e) => setFormData(prev => ({ ...prev, referralCode: e.target.value.toUpperCase() }))} placeholder="Davet kodu (Örn: A1B2C3D4)" maxLength={8} />
        ) : (
          <button type="button" className="mt-3 px-1 text-sm text-primary" onClick={() => setShowReferral(true)}>Davet kodu ekle</button>
        )}

        {/* Sözleşme + buton */}
        {!(selectedPackage as any).existingCustomer && (
          <div className="mt-5 flex items-start gap-3 px-1">
            <Checkbox id="contract-acceptance" className="mt-0.5" checked={contractAccepted} onCheckedChange={(c) => setContractAccepted(c === true)} />
            <Label htmlFor="contract-acceptance" className="text-sm font-normal leading-relaxed text-muted-foreground">
              <button type="button" onClick={handlePreInfoLinkClick} className="text-primary">Ön Bilgilendirme</button>
              {" ve "}
              <button type="button" onClick={handleDistanceSalesLinkClick} className="text-primary">Mesafeli Satış Sözleşmesi</button>
              'ni kabul ediyorum.
            </Label>
          </div>
        )}
        <Button onClick={handlePaymentProcess} disabled={loading || (!contractAccepted && !(selectedPackage as any).existingCustomer)}
          className="mt-4 h-14 w-full rounded-2xl text-base font-semibold" size="lg">
          {loading ? "İşleniyor..." : paymentMethod === "credit_card" ? "Kredi Kartı ile Al" : "Banka Havalesi Olarak Al"}
        </Button>
      </div>

      {redirecting && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-background/90 backdrop-blur-sm" role="status" aria-live="polite">
          <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-lg font-semibold text-foreground">Güvenli ödeme sayfasına yönlendiriliyorsunuz…</p>
          <p className="text-sm text-muted-foreground">Lütfen sayfayı kapatmayın.</p>
        </div>
      )}

      {/* Dialog'lar */}
      <ContractDialog
        open={showPreInfoDialog}
        onClose={() => setShowPreInfoDialog(false)}
        contractType="preInfo"
        formData={formData}
        selectedPackage={selectedPackage}
        paymentMethod={paymentMethod}
        customerType={customerType}
        clientIP={clientIP}
        orderCreatedAt={new Date().toISOString()}
      />
      <ContractDialog
        open={showDistanceSalesDialog}
        onClose={() => setShowDistanceSalesDialog(false)}
        contractType="distanceSales"
        formData={formData}
        selectedPackage={selectedPackage}
        paymentMethod={paymentMethod}
        customerType={customerType}
        clientIP={clientIP}
        orderCreatedAt={new Date().toISOString()}
      />
      {showBankInfo && (
        <BankTransferInfo
          amount={selectedPackage.price}
          customerName={`${formData.name} ${formData.surname}`}
          onComplete={() => {
            setShowBankInfo(false);
            navigate("/odeme-basarili");
          }}
        />
      )}
    </div>
  );
};

export default Checkout;
