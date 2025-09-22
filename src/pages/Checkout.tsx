import { useState, useEffect } from "react";
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
import { supabase } from "@/integrations/supabase/client";

const packages = {
  campaign: {
    name: "Kampanyalı Paket",
    type: "campaign",
    price: 2398,
    originalPrice: 4999,
    features: [
      "Hasta Takibi",
      "Detaylı Profil", 
      "Branş (Doktor Üyeliği 1)",
      "İletişim",
      "Adres ve Konum",
      "Sosyal Medya Hesapları Ekleme",
      "Video Yayınlama",
      "Soru Cevaplama",
      "Danışan Görüşleri",
      "Doktor Sayfasına Özgün Seo Çalışması"
    ]
  },
  basic: {
    name: "Premium Paket",
    type: "basic",
    price: 2998,
    originalPrice: 6499,
    features: [
      "Hasta Takibi",
      "Detaylı Profil", 
      "Branş (Doktor Üyeliği 1)",
      "İletişim",
      "Adres ve Konum",
      "Sosyal Medya Hesapları Ekleme",
      "Video Yayınlama",
      "Soru Cevaplama",
      "Danışan Görüşleri",
      "Doktor Sayfasına Özgün Seo Çalışması",
      "Online Randevu Takimi",
      "Google Reklam ve Yönetimi"
    ]
  },
  professional: {
    name: "Professional Paket",
    type: "professional",
    price: 3600,
    originalPrice: 7200,
    features: [
      "Hasta Takibi",
      "Detaylı Profil",
      "Branş (Doktor Üyeliği 1)",
      "İletişim", 
      "Adres ve Konum",
      "Sosyal Medya Hesapları Ekleme",
      "Video Yayınlama",
      "Soru Cevaplama",
      "Danışan Görüşleri",
      "Doktor Sayfasına Özgün Seo Çalışması",
      "Online Randevu Takimi",
      "Google Reklam ve Yönetimi",
      "Sosyal Medya Reklam ve Yönetimi"
    ]
  },
  premium: {
    name: "Full Paket",
    type: "premium", 
    price: 4998,
    originalPrice: 8750,
    features: [
      "Hasta Takibi",
      "Detaylı Profil",
      "Branş (Doktor Üyeliği 1)",
      "İletişim", 
      "Adres ve Konum",
      "Sosyal Medya Hesapları Ekleme",
      "Video Yayınlama",
      "Soru Cevaplama",
      "Danışan Görüşleri",
      "Doktor Sayfasına Özgün Seo Çalışması",
      "Online Randevu Takimi",
      "Google Reklam ve Yönetimi",
      "Sosyal Medya Reklam ve Yönetimi",
      "Santral Sistemden Danışan Yönlendirme"
    ]
  }
};

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

const Checkout = () => {
  const { packageId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [selectedPackage, setSelectedPackage] = useState<any>(packages.basic);
  const [loading, setLoading] = useState(false);
  const [customerType, setCustomerType] = useState<"individual" | "company">("individual");
  const [contractAccepted, setContractAccepted] = useState(false);
  const [showPreInfoDialog, setShowPreInfoDialog] = useState(false);
  const [showDistanceSalesDialog, setShowDistanceSalesDialog] = useState(false);
  const [showBankInfo, setShowBankInfo] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"bank_transfer" | "credit_card">("credit_card");
  const [clientIP, setClientIP] = useState<string>("");
  
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
    taxOffice: ""
  });

  const getSubscriptionReferenceCode = (packageType: string) => {
    const referenceCodeMap: { [key: string]: string } = {
      "campaign": "e01a059d-9392-4690-b030-0002064f9421",
      "basic": "205eb35c-e122-401f-aef7-618daf3732f8", 
      "professional": "92feac6d-1181-4b78-b0c2-3b5d5742adff",
      "premium": "4a9ab9e6-407f-4008-9a0d-6a31fac6fd94"
    };
    return referenceCodeMap[packageType] || referenceCodeMap["basic"];
  };

  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      
      // Ödeme sayfasına doğrudan erişimi engelle
      // Sadece paket seçimi yapılmışsa (state veya referrer kontrolü) erişime izin ver
      const packageData = location.state?.packageData;
      const hasValidReferrer = document.referrer && 
        (document.referrer.includes('/paketler') || document.referrer.includes('/packages'));
      
      if (!packageData && !hasValidReferrer) {
        toast({
          title: "Geçersiz Erişim",
          description: "Ödeme sayfasına erişmek için önce bir paket seçmelisiniz.",
          variant: "destructive"
        });
        navigate('/paketler');
        return;
      }
      
      if (packageData) {
        const convertedPackage = {
          name: packageData.name,
          type: packageData.id,
          price: packageData.price,
          originalPrice: packageData.originalPrice,
          features: packageData.features
        };
        setSelectedPackage(convertedPackage);
      } else {
        setSelectedPackage(packages.basic);
      }

      try {
        const ip = await getClientIP();
        setClientIP(ip);
      } catch (error) {
        setClientIP('127.0.0.1');
      }

      setLoading(false);
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

    if (!contractAccepted) {
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

  const handlePaymentProcess = async () => {
    if (!validateForm()) return;

    if (paymentMethod === "bank_transfer") {
      await saveOrder('bank_transfer');
      setShowBankInfo(true);
    } else {
      await saveOrder('credit_card');
      await handleCreditCardPayment();
    }
  };

const handleCreditCardPayment = async () => {
  try {
    setLoading(true);

    const customerData = {
      name: formData.name,
      surname: formData.surname,
      email: formData.email,
      gsmNumber: formData.gsmNumber,
      identityNumber: formData.identityNumber,
      registrationAddress: formData.address,
      city: formData.city,
      billingAddress: formData.address,
      billingCity: formData.city,
      billingZipCode: formData.zipCode,
      shippingAddress: formData.address,
      shippingCity: formData.city,
      shippingZipCode: formData.zipCode,
      customerType,
      companyName: customerType === "company" ? formData.companyName : "",
      taxNumber: customerType === "company" ? formData.taxNumber : "",
      taxOffice: customerType === "company" ? formData.taxOffice : ""
    };

    const subscriptionReferenceCode = getSubscriptionReferenceCode(selectedPackage.type);

    const { data, error } = await supabase.functions.invoke("create-iyzico-payment", {
      body: {
        packageType: selectedPackage.type,
        customerData,
        subscriptionReferenceCode,
        layout: "popup" // <-- BURAYI SABİTLEDİK
      },
    });

    if (error) throw new Error(`Payment service error: ${error.message}`);

    if (data?.status === "success" && data?.checkoutFormContent) {
      // Daha önce eklenmiş form varsa sil
      const existing = document.getElementById("iyzipay-checkout-form");
      if (existing) existing.remove();

      // Mobil uyumlu popup için CSS ekliyoruz
      const style = document.createElement('style');
      style.textContent = `
        #iyzipay-checkout-form {
          position: fixed !important;
          top: 50% !important;
          left: 50% !important;
          transform: translate(-50%, -50%) !important;
          z-index: 9999 !important;
          background: white !important;
          border-radius: 8px !important;
          box-shadow: 0 4px 20px rgba(0,0,0,0.3) !important;
          max-width: 90vw !important;
          max-height: 90vh !important;
          overflow: auto !important;
          padding: 20px !important;
        }
        
        @media (max-width: 768px) {
          #iyzipay-checkout-form {
            max-width: 95vw !important;
            max-height: 95vh !important;
            padding: 15px !important;
          }
        }
        
        #iyzipay-checkout-form::before {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0,0,0,0.5);
          z-index: -1;
        }
      `;
      document.head.appendChild(style);

      // Yeni container ekle
      const checkoutContainer = document.createElement("div");
      checkoutContainer.id = "iyzipay-checkout-form";
      checkoutContainer.innerHTML = data.checkoutFormContent;
      document.body.appendChild(checkoutContainer);

      // Script'leri yeniden çalıştır
      const scripts = checkoutContainer.querySelectorAll("script");
      scripts.forEach((script) => {
        const newScript = document.createElement("script");
        if (script.src) newScript.src = script.src;
        else newScript.textContent = script.textContent;
        document.head.appendChild(newScript);
      });
    } else if (data?.paymentPageUrl) {
      // Ayrı sekmede aç
      window.open(data.paymentPageUrl, "_blank");
    } else {
      throw new Error(data?.errorMessage || "Payment initialization failed");
    }
  } catch (error: any) {
    toast({
      title: "Ödeme Hatası",
      description: error.message || "Ödeme başlatılamadı. Lütfen tekrar deneyin.",
      variant: "destructive",
    });
  } finally {
    setLoading(false);
  }
};

  const saveOrder = async (paymentMethod: string) => {
    try {
      setLoading(true);
      
      const orderData = {
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
        amount: selectedPackage.price,
        payment_method: paymentMethod,
        status: 'pending',
        is_first_order: true,
        subscription_month: 1,
        contract_ip_address: clientIP
      };

      console.log('Mobile debug - Order data being saved:', orderData);
      console.log('Mobile debug - User agent:', navigator.userAgent);
      console.log('Mobile debug - Client IP:', clientIP);

      const { error } = await supabase
        .from('orders')
        .insert(orderData);

      if (error) {
        console.error('Mobile debug - Order save error:', error);
        console.error('Mobile debug - Error details:', JSON.stringify(error, null, 2));
        throw new Error(`Sipariş kaydedilemedi: ${error.message || 'Bilinmeyen hata'}`);
      }

      localStorage.setItem('lastOrder', JSON.stringify({
        id: null, // anonim kullanıcılar için SELECT izni yok; id dönmüyor
        orderNumber: `DRP-${Date.now()}`,
        package: selectedPackage.name,
        amount: selectedPackage.price,
        paymentMethod: paymentMethod,
        customerName: `${formData.name} ${formData.surname}`
      }));

      if (paymentMethod === 'bank_transfer') {
        navigate("/odeme-basarili");
      }

    } catch (error) {
      console.error('Save order error:', error);
      toast({
        title: "Hata",
        description: error.message || "Beklenmeyen bir hata oluştu.",
        variant: "destructive"
      });
    } finally {
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
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <Helmet>
        <title>Ödeme Sayfası - Doktorumol</title>
        <meta name="description" content="Güvenli ödeme sayfası" />
      </Helmet>

      <HorizontalNavigation />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate(-1)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Geri Dön
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Ödeme Sayfası</h1>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Sol Taraf - Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Müşteri Tipi Seçimi */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Müşteri Bilgileri
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex gap-4">
                    <Button
                      type="button"
                      variant={customerType === "individual" ? "default" : "outline"}
                      onClick={() => setCustomerType("individual")}
                      className={`flex-1 ${customerType === "individual" ? "bg-gray-900 hover:bg-gray-800 text-white" : "border-gray-300 hover:bg-gray-50"}`}
                    >
                      <User className="h-4 w-4 mr-2" />
                      Bireysel
                    </Button>
                    <Button
                      type="button"
                      variant={customerType === "company" ? "default" : "outline"}
                      onClick={() => setCustomerType("company")}
                      className={`flex-1 ${customerType === "company" ? "bg-gray-900 hover:bg-gray-800 text-white" : "border-gray-300 hover:bg-gray-50"}`}
                    >
                      <Building className="h-4 w-4 mr-2" />
                      Kurumsal
                    </Button>
                  </div>

                  {/* Kişisel Bilgiler */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Ad *</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Adınız"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="surname">Soyad *</Label>
                      <Input
                        id="surname"
                        name="surname"
                        value={formData.surname}
                        onChange={handleInputChange}
                        placeholder="Soyadınız"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">E-posta *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="ornek@email.com"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="gsmNumber">Telefon *</Label>
                      <Input
                        id="gsmNumber"
                        name="gsmNumber"
                        value={formData.gsmNumber}
                        onChange={handleInputChange}
                        placeholder="+905xxxxxxxxx"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="identityNumber">TC Kimlik No *</Label>
                      <Input
                        id="identityNumber"
                        name="identityNumber"
                        value={formData.identityNumber}
                        onChange={handleInputChange}
                        placeholder="12345678901"
                        maxLength={11}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="city">Şehir *</Label>
                      <Select value={formData.city} onValueChange={(value) => handleSelectChange('city', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Şehir seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          {turkishCities.map((city) => (
                            <SelectItem key={city} value={city}>
                              {city}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="zipCode">Posta Kodu</Label>
                      <Input
                        id="zipCode"
                        name="zipCode"
                        value={formData.zipCode}
                        onChange={handleInputChange}
                        placeholder="34100"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="address">Adres *</Label>
                    <Textarea
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="Adresinizi girin"
                      rows={2}
                      required
                    />
                  </div>

                  {/* Kurumsal Bilgiler */}
                  {customerType === "company" && (
                    <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                      <h4 className="font-semibold">Kurumsal Bilgiler</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="companyName">Firma Adı *</Label>
                          <Input
                            id="companyName"
                            name="companyName"
                            value={formData.companyName}
                            onChange={handleInputChange}
                            placeholder="Firma adı"
                            required={customerType === "company"}
                          />
                        </div>
                        <div>
                          <Label htmlFor="taxNumber">Vergi Numarası *</Label>
                          <Input
                            id="taxNumber"
                            name="taxNumber"
                            value={formData.taxNumber}
                            onChange={handleInputChange}
                            placeholder="1234567890"
                            required={customerType === "company"}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="taxOffice">Vergi Dairesi</Label>
                        <Input
                          id="taxOffice"
                          name="taxOffice"
                          value={formData.taxOffice}
                          onChange={handleInputChange}
                          placeholder="Vergi dairesi"
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Ödeme Yöntemi */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Ödeme Yöntemi
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button
                      type="button"
                      variant={paymentMethod === "credit_card" ? "default" : "outline"}
                      onClick={() => setPaymentMethod("credit_card")}
                      className={`h-auto p-4 justify-start ${paymentMethod === "credit_card" ? "bg-gray-900 hover:bg-gray-800 text-white" : "border-gray-300 hover:bg-gray-50"}`}
                    >
                      <CreditCard className="h-6 w-6 mr-3" />
                      <div className="text-left">
                        <div className="font-semibold">Kredi Kartı</div>
                        <div className="text-xs text-muted-foreground">Güvenli ödeme</div>
                      </div>
                    </Button>
                    <Button
                      type="button"
                      variant={paymentMethod === "bank_transfer" ? "default" : "outline"}
                      onClick={() => setPaymentMethod("bank_transfer")}
                      className={`h-auto p-4 justify-start ${paymentMethod === "bank_transfer" ? "bg-gray-900 hover:bg-gray-800 text-white" : "border-gray-300 hover:bg-gray-50"}`}
                    >
                      <Banknote className="h-6 w-6 mr-3" />
                      <div className="text-left">
                        <div className="font-semibold">Banka Havalesi</div>
                      </div>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sağ Taraf - Özet */}
            <div className="space-y-6">
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle>Sipariş Özeti</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold">{selectedPackage.name}</h4>
                    <div className="text-sm text-muted-foreground">
                      {selectedPackage.features?.slice(0, 3).map((feature: string, index: number) => (
                        <div key={index}>• {feature}</div>
                      ))}
                      {selectedPackage.features?.length > 3 && (
                        <div>... ve {selectedPackage.features.length - 3} özellik daha</div>
                      )}
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Paket Fiyatı:</span>
                      <span className="line-through text-muted-foreground">
                        ₺{selectedPackage.originalPrice?.toLocaleString('tr-TR')}
                      </span>
                    </div>
                    <div className="flex justify-between font-semibold text-lg">
                      <span>İndirimli Fiyat:</span>
                      <span className="text-primary">₺{selectedPackage.price.toLocaleString('tr-TR')}</span>
                    </div>
                    <div className="flex justify-between font-bold text-xl border-t pt-2">
                      <span>Toplam:</span>
                      <span>₺{selectedPackage.price.toLocaleString('tr-TR')}</span>
                    </div>
                  </div>

                  <Separator />

                  {/* Sözleşme Onay Kısmı - SABİT KALACAK */}
                  <div className="space-y-3">
                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id="contract-acceptance"
                        checked={contractAccepted}
                        onCheckedChange={(checked) => setContractAccepted(checked === true)}
                      />
                      <Label 
                        htmlFor="contract-acceptance" 
                        className="text-sm leading-relaxed cursor-pointer"
                      >
                        <button
                          type="button"
                          onClick={handlePreInfoLinkClick}
                          className="text-primary underline hover:no-underline"
                        >
                          Ön Bilgilendirme Formu
                        </button>
                        {" ve "}
                        <button
                          type="button"
                          onClick={handleDistanceSalesLinkClick}
                          className="text-primary underline hover:no-underline"
                        >
                          Mesafeli Satış Sözleşmesi
                        </button>
                        ni kabul ediyorum.
                      </Label>
                    </div>

                    <Button
                      onClick={handlePaymentProcess}
                      disabled={loading || !contractAccepted}
                      className="w-full"
                      size="lg"
                    >
                      {loading ? (
                        "İşleniyor..."
                      ) : paymentMethod === "credit_card" ? (
                        "Kredi Kartı ile Öde"
                      ) : (
                        "Banka Havalesi ile Öde"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

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
