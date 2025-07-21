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
import jsPDF from "jspdf";

const packages = {
  basic: {
    name: "Basic Paket",
    type: "basic",
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
  premium: {
    name: "Premium Paket",
    type: "premium",
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
  full: {
    name: "Full Paket",
    type: "full", 
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
  const [paymentMethod, setPaymentMethod] = useState<"bank_transfer">("bank_transfer");
  const [clientIP, setClientIP] = useState<string>("");
  const [formData, setFormData] = useState({
    name: "",
    surname: "",
    email: "",
    phone: "",
    tcNo: "",
    address: "",
    city: "İstanbul",
    postalCode: "",
    companyName: "",
    taxNo: "",
    taxOffice: ""
  });

  const getSubscriptionReferenceCode = (packageType: string) => {
    const referenceCodeMap: { [key: string]: string } = {
      "campaign": "92feac6d-1181-4b78-b0c2-3b5d5742adff",
      "campaign-premium": "e01a059d-9392-4690-b030-0002064f9421",
      "discounted": "696f7277-d3b8-47c2-8a14-4efd3e7a31a1",
      "basic": "205eb35c-e122-401f-aef7-618daf3732f8", // 2998₺ package
      "premium": "4a9ab9e6-407f-4008-9a0d-6a31fac6fd94" // 4998₺ package
    };
    return referenceCodeMap[packageType] || referenceCodeMap["basic"];
  };

  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      
      const packageData = location.state?.packageData;
      console.log('Received package data:', packageData);
      
      if (packageData) {
        const convertedPackage = {
          name: packageData.name,
          type: packageData.id,
          price: packageData.price,
          originalPrice: packageData.originalPrice,
          features: packageData.features
        };
        console.log('Converted to:', convertedPackage);
        setSelectedPackage(convertedPackage);
      } else {
        console.log('No package data received, using default package');
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
  }, [packageId, navigate, location.state]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    let value = e.target.value;
    
    if (e.target.name === "tcNo") {
      value = value.replace(/\D/g, "").substring(0, 11);
    }

    setFormData({
      ...formData,
      [e.target.name]: value
    });
  };

  const handlePreInfoLinkClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowPreInfoDialog(true);
  };

  const handleDistanceSalesLinkClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowDistanceSalesDialog(true);
  };

  const handlePaymentSuccess = async () => {
    setShowBankInfo(true);
  };

  const handleCreditCardPayment = async () => {
    try {
      setLoading(true);
      
      const customerData = {
        name: formData.name,
        surname: formData.surname,
        email: formData.email,
        phone: formData.phone,
        tcNo: formData.tcNo,
        address: formData.address,
        city: formData.city,
        customerType,
        companyName: formData.companyName,
        taxNo: formData.taxNo,
        taxOffice: formData.taxOffice
      };

      const subscriptionReferenceCode = getSubscriptionReferenceCode(selectedPackage.type);

      console.log('Ödeme isteği gönderiliyor...', {
        packageType: selectedPackage.type,
        subscriptionReferenceCode
      });

      const { data, error } = await supabase.functions.invoke('create-iyzico-payment', {
        body: {
          packageType: selectedPackage.type,
          customerData,
          subscriptionReferenceCode
        }
      });

      if (error) {
        console.error('Supabase function hatası:', error);
        throw new Error(`Ödeme servisi hatası: ${error.message}`);
      }

      console.log('Ödeme yanıtı:', data);

      if (data?.success) {
        if (data.paymentPageUrl) {
          // İyzico ödeme sayfasına yönlendir
          window.location.href = data.paymentPageUrl;
        } else if (data.checkoutFormContent) {
          // Gömülü checkout form göster
          const checkoutContainer = document.createElement('div');
          checkoutContainer.innerHTML = data.checkoutFormContent;
          document.body.appendChild(checkoutContainer);
          
          // Checkout form'daki scriptleri çalıştır
          const scripts = checkoutContainer.querySelectorAll('script');
          scripts.forEach(script => {
            const newScript = document.createElement('script');
            newScript.textContent = script.textContent;
            document.head.appendChild(newScript);
          });
        }
      } else {
        const errorMessage = data?.error || 'Ödeme işlemi başlatılamadı';
        console.error('Ödeme hatası:', errorMessage);
        throw new Error(errorMessage);
      }

    } catch (error) {
      console.error('Kredi kartı ödeme hatası:', error);
      let errorMessage = "Kredi kartı ödemesi başlatılamadı. Lütfen tekrar deneyin.";
      
      if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Hata",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBankTransferComplete = async () => {
    await saveOrder('bank_transfer');
    navigate("/odeme-basarili");
  };

  const generatePreInfoPDF = (customerData: any, packageData: any, paymentMethod: string, customerType: string, clientIP: string) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('ÖN BİLGİLENDİRME FORMU', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    
    let yPos = 40;
    
    // Seller info
    doc.setFont(undefined, 'bold');
    doc.text('SATICI BİLGİLERİ:', 20, yPos);
    yPos += 10;
    
    doc.setFont(undefined, 'normal');
    doc.text('Unvan: SELAM WEB YAPIM MERKEZİ', 20, yPos);
    yPos += 5;
    doc.text('Adres: Küçükbakkalköy Mahallesi Selvili Sokak No:4 İç Kapı No: 20 Ataşehir / İstanbul', 20, yPos);
    yPos += 5;
    doc.text('Telefon: 0 216 706 06 11', 20, yPos);
    yPos += 5;
    doc.text('E-posta: info@doktorumol.com.tr', 20, yPos);
    yPos += 15;
    
    // Customer info
    doc.setFont(undefined, 'bold');
    doc.text('ALICI BİLGİLERİ:', 20, yPos);
    yPos += 10;
    
    doc.setFont(undefined, 'normal');
    doc.text(`Ad Soyad: ${customerData.name} ${customerData.surname}`, 20, yPos);
    yPos += 5;
    doc.text(`E-posta: ${customerData.email}`, 20, yPos);
    yPos += 5;
    if (customerData.phone) {
      doc.text(`Telefon: ${customerData.phone}`, 20, yPos);
      yPos += 5;
    }
    if (customerData.address) {
      doc.text(`Adres: ${customerData.address}`, 20, yPos);
      yPos += 5;
    }
    yPos += 10;
    
    // Package info
    doc.setFont(undefined, 'bold');
    doc.text('PAKET BİLGİLERİ:', 20, yPos);
    yPos += 10;
    
    doc.setFont(undefined, 'normal');
    doc.text(`Seçilen Paket: ${packageData.name}`, 20, yPos);
    yPos += 5;
    doc.text(`Fiyat: ${packageData.price.toLocaleString('tr-TR')} ₺`, 20, yPos);
    yPos += 5;
    doc.text('Ödeme Yöntemi: Banka Havalesi/EFT', 20, yPos);
    yPos += 15;
    
    // Terms
    doc.setFont(undefined, 'bold');
    doc.text('GENEL ŞARTLAR:', 20, yPos);
    yPos += 10;
    
    doc.setFont(undefined, 'normal');
    const terms = [
      '1. Bu form, 6502 sayılı Tüketicinin Korunması Hakkında Kanun gereği düzenlenmiştir.',
      '2. Hizmet bedeli ön ödeme olarak tahsil edilmektedir.',
      '3. Hizmet süresi paket tipine göre değişmektedir.',
      '4. Cayma hakkı 14 gün olup, hizmetin ifasına başlanması durumunda geçersizdir.',
      '5. Tüm iletişim elektronik ortamda gerçekleştirilecektir.'
    ];
    
    terms.forEach(term => {
      doc.text(term, 20, yPos, { maxWidth: 170 });
      yPos += 10;
    });
    
    yPos += 10;
    doc.text(`Tarih: ${new Date().toLocaleDateString('tr-TR')}`, 20, yPos);
    yPos += 5;
    doc.text(`IP Adresi: ${clientIP}`, 20, yPos);
    
    return doc;
  };

  const generateDistanceSalesPDF = (customerData: any, packageData: any, paymentMethod: string, customerType: string, clientIP: string) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('MESAFELİ SATIŞ SÖZLEŞMESİ', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    
    let yPos = 40;
    
    // Contract parties
    doc.setFont(undefined, 'bold');
    doc.text('TARAFLAR:', 20, yPos);
    yPos += 10;
    
    doc.setFont(undefined, 'normal');
    doc.text('SATICI:', 20, yPos);
    yPos += 5;
    doc.text('SELAM WEB YAPIM MERKEZİ', 30, yPos);
    yPos += 5;
    doc.text('Küçükbakkalköy Mahallesi Selvili Sokak No:4 İç Kapı No: 20 Ataşehir / İstanbul', 30, yPos);
    yPos += 5;
    doc.text('Tel: 0 216 706 06 11 | E-posta: info@doktorumol.com.tr', 30, yPos);
    yPos += 10;
    
    doc.text('ALICI:', 20, yPos);
    yPos += 5;
    doc.text(`${customerData.name} ${customerData.surname}`, 30, yPos);
    yPos += 5;
    doc.text(`E-posta: ${customerData.email}`, 30, yPos);
    yPos += 5;
    if (customerData.phone) {
      doc.text(`Telefon: ${customerData.phone}`, 30, yPos);
      yPos += 5;
    }
    yPos += 10;
    
    // Contract subject
    doc.setFont(undefined, 'bold');
    doc.text('SÖZLEŞMENİN KONUSU:', 20, yPos);
    yPos += 10;
    
    doc.setFont(undefined, 'normal');
    doc.text(`Hizmet: ${packageData.name}`, 20, yPos);
    yPos += 5;
    doc.text(`Bedel: ${packageData.price.toLocaleString('tr-TR')} ₺`, 20, yPos);
    yPos += 5;
    doc.text('Ödeme Şekli: Banka Havalesi/EFT', 20, yPos);
    yPos += 15;
    
    // General terms
    doc.setFont(undefined, 'bold');
    doc.text('GENEL HÜKÜMLER:', 20, yPos);
    yPos += 10;
    
    doc.setFont(undefined, 'normal');
    const contractTerms = [
      '1. Bu sözleşme, 6502 sayılı Tüketicinin Korunması Hakkında Kanun kapsamında düzenlenmiştir.',
      '2. Hizmet bedeli peşin olarak tahsil edilir.',
      '3. Hizmet süresi seçilen pakete göre belirlenir.',
      '4. Taraflar bu sözleşmeyi kabul etmiş sayılır.',
      '5. Uyuşmazlıklar İstanbul mahkemelerinde çözülür.'
    ];
    
    contractTerms.forEach(term => {
      doc.text(term, 20, yPos, { maxWidth: 170 });
      yPos += 8;
    });
    
    yPos += 15;
    doc.text(`Sözleşme Tarihi: ${new Date().toLocaleDateString('tr-TR')}`, 20, yPos);
    yPos += 5;
    doc.text(`IP Adresi: ${clientIP}`, 20, yPos);
    
    return doc;
  };

  const saveOrder = async (paymentMethod: string) => {
    try {
      setLoading(true);
      
      // Generate PDFs with current timestamp
      const customerDataForPDF = {
        name: formData.name,
        surname: formData.surname,
        email: formData.email,
        phone: formData.phone,
        tcNo: formData.tcNo,
        address: formData.address,
        city: formData.city,
        customerType: customerType,
        companyName: formData.companyName,
        taxNo: formData.taxNo,
        taxOffice: formData.taxOffice
      };

      const packageDataForPDF = {
        name: selectedPackage.name,
        price: selectedPackage.price,
        originalPrice: selectedPackage.originalPrice || selectedPackage.price
      };

      // Generate PDFs that the customer is approving right now
      const preInfoPDF = generatePreInfoPDF(customerDataForPDF, packageDataForPDF, paymentMethod, customerType, clientIP);
      const distanceSalesPDF = generateDistanceSalesPDF(customerDataForPDF, packageDataForPDF, paymentMethod, customerType, clientIP);
      
      // Convert PDFs to base64 for storage
      const preInfoBase64 = preInfoPDF.output('datauristring').split(',')[1];
      const distanceSalesBase64 = distanceSalesPDF.output('datauristring').split(',')[1];
      
      const orderData = {
        customer_name: `${formData.name} ${formData.surname}`,
        customer_email: formData.email,
        customer_phone: formData.phone || null,
        customer_tc_no: formData.tcNo || null,
        customer_address: formData.address || null,
        customer_city: formData.city,
        customer_type: customerType,
        company_name: customerType === 'company' ? formData.companyName || null : null,
        company_tax_no: customerType === 'company' ? formData.taxNo || null : null,
        company_tax_office: customerType === 'company' ? formData.taxOffice || null : null,
        package_name: selectedPackage.name,
        package_type: selectedPackage.type,
        amount: selectedPackage.price,
        payment_method: paymentMethod,
        status: 'pending',
        is_first_order: true,
        subscription_month: 1,
        pre_info_pdf_content: preInfoBase64,
        distance_sales_pdf_content: distanceSalesBase64,
        contract_generated_at: new Date().toISOString(),
        contract_ip_address: clientIP
      };

      const { data, error } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (error) {
        console.error('Sipariş kaydedilirken hata:', error);
        toast({
          title: "Hata",
          description: "Sipariş kaydedilirken bir hata oluştu. Lütfen destek ile iletişime geçin.",
          variant: "destructive"
        });
        return;
      }

      // Send contract emails automatically
      try {
        const customerDataForEmail = {
          name: formData.name,
          surname: formData.surname,
          email: formData.email,
          phone: formData.phone,
          tcNo: formData.tcNo,
          address: formData.address,
          city: formData.city,
          customerType: customerType,
          companyName: formData.companyName,
          taxNo: formData.taxNo,
          taxOffice: formData.taxOffice
        };

        const packageDataForEmail = {
          name: selectedPackage.name,
          price: selectedPackage.price,
          originalPrice: selectedPackage.originalPrice || selectedPackage.price
        };

        console.log('Sending contract emails...');
        
        const { error: emailError } = await supabase.functions.invoke('send-contract-emails', {
          body: {
            orderId: data.id,
            customerData: customerDataForEmail,
            packageData: packageDataForEmail,
            paymentMethod: paymentMethod,
            clientIP: clientIP
          }
        });

        if (emailError) {
          console.error('Contract email sending failed:', emailError);
          // Don't block the order completion, just log the error
        } else {
          console.log('Contract emails sent successfully');
        }
      } catch (emailError) {
        console.error('Email sending error:', emailError);
        // Don't block the order completion
      }

      localStorage.setItem('lastOrder', JSON.stringify({
        id: data.id,
        orderNumber: `DRP-${Date.now()}`,
        package: selectedPackage.name,
        amount: selectedPackage.price,
        paymentMethod: paymentMethod,
        customerName: `${formData.name} ${formData.surname}`
      }));

      toast({
        title: "Başarılı",
        description: "Siparişiniz başarıyla kaydedildi! Sözleşme belgeleri e-posta adresinize gönderildi.",
        variant: "default"
      });

    } catch (error) {
      console.error('Beklenmeyen hata:', error);
      toast({
        title: "Hata",
        description: "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  const customerData = {
    ...formData,
    customerType
  };

  return (
    <>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="googlebot" content="noindex, nofollow" />
        <title>Ödeme Sayfası - Doktorum Ol</title>
      </Helmet>
      
      <HorizontalNavigation />
      
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate("/paketler")}
              className="flex items-center gap-2 mb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Geri Dön
            </Button>
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-semibold text-gray-900">Ödeme</h1>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              {!showBankInfo ? (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle>Teslimat Bilgileri</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="email">E-Posta *</Label>
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
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Teslimat Adresi</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="name">İsim *</Label>
                          <Input
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            placeholder="İsim"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="surname">Soyisim *</Label>
                          <Input
                            id="surname"
                            name="surname"
                            value={formData.surname}
                            onChange={handleInputChange}
                            placeholder="Soyisim"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="tcNo">TC Kimlik Numarası</Label>
                        <Input
                          id="tcNo"
                          name="tcNo"
                          value={formData.tcNo}
                          onChange={handleInputChange}
                          placeholder="TC Kimlik Numarası"
                          maxLength={11}
                        />
                      </div>

                      <div>
                        <Label htmlFor="phone">Cep Telefon Numarası</Label>
                        <Input
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="Cep Telefon Numarası"
                        />
                      </div>

                      <div>
                        <Label htmlFor="city">Şehir</Label>
                        <Select value={formData.city} onValueChange={(value) => setFormData({...formData, city: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Şehir seçin" />
                          </SelectTrigger>
                          <SelectContent>
                            {turkishCities.map((city) => (
                              <SelectItem key={city} value={city}>{city}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="address">Adres</Label>
                        <Textarea
                          id="address"
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          placeholder="Adres"
                          rows={3}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex gap-4">
                        <label className={`flex-1 p-3 border rounded-lg cursor-pointer transition-colors ${
                          customerType === "individual" ? "border-blue-500 bg-blue-50" : "border-gray-200"
                        }`}>
                          <input
                            type="radio"
                            name="customerType"
                            value="individual"
                            checked={customerType === "individual"}
                            onChange={(e) => setCustomerType(e.target.value as "individual")}
                            className="sr-only"
                          />
                          <div className="text-center">
                            <User className="w-5 h-5 mx-auto mb-1 text-gray-600" />
                            <div className="text-sm font-medium">Bireysel</div>
                          </div>
                        </label>
                        <label className={`flex-1 p-3 border rounded-lg cursor-pointer transition-colors ${
                          customerType === "company" ? "border-blue-500 bg-blue-50" : "border-gray-200"
                        }`}>
                          <input
                            type="radio"
                            name="customerType"
                            value="company"
                            checked={customerType === "company"}
                            onChange={(e) => setCustomerType(e.target.value as "company")}
                            className="sr-only"
                          />
                          <div className="text-center">
                            <Building className="w-5 h-5 mx-auto mb-1 text-gray-600" />
                            <div className="text-sm font-medium">Kurumsal</div>
                          </div>
                        </label>
                      </div>

                      {customerType === "company" && (
                        <div className="space-y-3 p-4 bg-blue-50 rounded-lg mt-4">
                          <h4 className="font-medium text-blue-900">Kurumsal Bilgiler</h4>
                          <div className="space-y-3">
                            <Input
                              name="companyName"
                              value={formData.companyName}
                              onChange={handleInputChange}
                              placeholder="Firma Adı"
                            />
                            <div className="grid grid-cols-2 gap-3">
                              <Input
                                name="taxNo"
                                value={formData.taxNo}
                                onChange={handleInputChange}
                                placeholder="Vergi No"
                              />
                              <Input
                                name="taxOffice"
                                value={formData.taxOffice}
                                onChange={handleInputChange}
                                placeholder="Vergi Dairesi"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Ödeme Detayları</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <label className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                          paymentMethod === "bank_transfer" ? "border-blue-500 bg-blue-50" : "border-gray-200"
                        }`}>
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="bank_transfer"
                            checked={paymentMethod === "bank_transfer"}
                            onChange={(e) => setPaymentMethod(e.target.value as "bank_transfer")}
                            className="mr-3"
                          />
                          <Banknote className="w-5 h-5 mr-3 text-green-600" />
                          <div>
                            <div className="font-medium">Bankadan Havale/EFT</div>
                          </div>
                        </label>
                        
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-3">
                        <Checkbox 
                          id="contractTerms"
                          checked={contractAccepted}
                          onCheckedChange={(checked) => setContractAccepted(checked as boolean)}
                          className="mt-1"
                        />
                        <Label htmlFor="contractTerms" className="text-sm text-gray-700 leading-relaxed">
                          <a 
                            href="#" 
                            onClick={handlePreInfoLinkClick}
                            className="text-blue-600 hover:underline"
                          >
                            Ön Bilgilendirme Formu
                          </a>
                          {" ve "}
                          <a 
                            href="#" 
                            onClick={handleDistanceSalesLinkClick}
                            className="text-blue-600 hover:underline"
                          >
                            Mesafeli Satış Sözleşmesi
                          </a>
                          {'ni kabul ediyorum.'}
                        </Label>
                      </div>
                    </CardContent>
                  </Card>

                  <Button 
                    onClick={handlePaymentSuccess}
                    disabled={loading || !contractAccepted}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white py-4 text-lg font-semibold"
                  >
                    Siparişi Onayla
                  </Button>
                </>
              ) : (
                <BankTransferInfo
                  amount={selectedPackage.price}
                  customerName={`${formData.name} ${formData.surname}`}
                  onComplete={handleBankTransferComplete}
                />
              )}
            </div>

            <div className="lg:pl-8">
              <div className="bg-gray-50 rounded-lg p-6 sticky top-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Sipariş Özeti</h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium text-gray-900">{selectedPackage.name}</div>
                      <div className="text-sm text-gray-600">Aylık abonelik</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900">
                        {selectedPackage.price.toLocaleString('tr-TR')} ₺
                      </div>
                      <div className="text-sm text-gray-500 line-through">
                        {selectedPackage.originalPrice.toLocaleString('tr-TR')} ₺
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between items-center font-medium text-gray-900 text-lg">
                    <span>Toplam</span>
                    <span>{selectedPackage.price.toLocaleString('tr-TR')} ₺</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <ContractDialog
          open={showPreInfoDialog}
          onClose={() => setShowPreInfoDialog(false)}
          contractType="preInfo"
          formData={formData}
          selectedPackage={selectedPackage}
          paymentMethod="bank_transfer"
          customerType={customerType}
          clientIP={clientIP}
        />

        <ContractDialog
          open={showDistanceSalesDialog}
          onClose={() => setShowDistanceSalesDialog(false)}
          contractType="distanceSales"
          formData={formData}
          selectedPackage={selectedPackage}
          paymentMethod="bank_transfer"
          customerType={customerType}
          clientIP={clientIP}
        />
      </div>
    </>
  );
};

export default Checkout;
