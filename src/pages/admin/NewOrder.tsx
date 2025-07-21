
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import AdminBackButton from "@/components/AdminBackButton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { ShoppingCart, User, CreditCard, Package, FileText } from "lucide-react";
import jsPDF from "jspdf";

const NewOrder = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    customerTckn: "",
    customerAddress: "",
    amount: "",
    paymentMethod: "credit_card",
    packageName: "",
    packageType: "basic"
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const generatePreInfoPDF = (customerData: any, packageData: any, paymentMethod: string, customerType: string, clientIP: string, formContent?: string) => {
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

  const generateDistanceSalesPDF = (customerData: any, packageData: any, paymentMethod: string, customerType: string, clientIP: string, formContent?: string) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log("Yeni sipariş oluşturuluyor:", formData);

      // Generate PDFs for the contract
      const nameParts = formData.customerName.split(' ');
      const customerDataForPDF = {
        name: nameParts[0] || '',
        surname: nameParts.slice(1).join(' ') || '',
        email: formData.customerEmail,
        phone: formData.customerPhone,
        tcNo: formData.customerTckn,
        address: formData.customerAddress,
        city: 'İstanbul',
        customerType: 'individual',
        companyName: '',
        taxNo: '',
        taxOffice: ''
      };

      const packageDataForPDF = {
        name: formData.packageName,
        price: parseFloat(formData.amount),
        originalPrice: parseFloat(formData.amount)
      };

      // Get dynamic form content first  
      const { data: formContent } = await supabase
        .from('form_contents')
        .select('content')
        .eq('form_type', 'pre_info')
        .single();

      // Generate PDFs that are being created right now
      const preInfoPDF = generatePreInfoPDF(customerDataForPDF, packageDataForPDF, formData.paymentMethod, 'individual', '127.0.0.1', formContent?.content);
      const distanceSalesPDF = generateDistanceSalesPDF(customerDataForPDF, packageDataForPDF, formData.paymentMethod, 'individual', '127.0.0.1', formContent?.content);
      
      // Convert PDFs to base64 for storage
      const preInfoBase64 = preInfoPDF.output('datauristring').split(',')[1];
      const distanceSalesBase64 = distanceSalesPDF.output('datauristring').split(',')[1];

      const orderData = {
        customer_name: formData.customerName,
        customer_email: formData.customerEmail,
        customer_phone: formData.customerPhone,
        customer_tc_no: formData.customerTckn,
        customer_address: formData.customerAddress,
        amount: parseFloat(formData.amount),
        payment_method: formData.paymentMethod,
        package_name: formData.packageName,
        package_type: formData.packageType,
        status: 'pending',
        customer_type: 'individual',
        customer_city: 'İstanbul',
        is_first_order: true,
        subscription_month: 1,
        pre_info_pdf_content: preInfoBase64,
        distance_sales_pdf_content: distanceSalesBase64,
        contract_generated_at: new Date().toISOString(),
        contract_ip_address: '127.0.0.1'
      };

      console.log("Inserting order data:", orderData);

      const { data, error } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      console.log("Order saved successfully:", data);

      // Send contract emails automatically
      try {
        const customerDataForEmail = {
          name: nameParts[0] || '',
          surname: nameParts.slice(1).join(' ') || '',
          email: formData.customerEmail,
          phone: formData.customerPhone,
          tcNo: formData.customerTckn,
          address: formData.customerAddress,
          city: 'İstanbul',
          customerType: 'individual',
          companyName: '',
          taxNo: '',
          taxOffice: ''
        };

        const packageDataForEmail = {
          name: formData.packageName,
          price: parseFloat(formData.amount),
          originalPrice: parseFloat(formData.amount)
        };

        console.log('Sending contract emails for new order...');
        
        const { error: emailError } = await supabase.functions.invoke('send-contract-emails', {
          body: {
            orderId: data.id,
            customerData: customerDataForEmail,
            packageData: packageDataForEmail,
            paymentMethod: formData.paymentMethod,
            clientIP: '127.0.0.1'
          }
        });

        if (emailError) {
          console.error('Contract email sending failed:', emailError);
        } else {
          console.log('Contract emails sent successfully');
        }
      } catch (emailError) {
        console.error('Email sending error:', emailError);
      }

      toast({
        title: "Başarılı",
        description: "Sipariş başarıyla oluşturuldu ve sözleşme belgeleri müşteriye gönderildi"
      });

      // Redirect to orders page
      navigate("/divan_paneli/payments");

    } catch (error) {
      console.error('Sipariş oluşturulurken hata:', error);
      toast({
        title: "Hata",
        description: "Sipariş oluşturulurken bir hata oluştu",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <AdminBackButton />
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Yeni Sipariş Oluştur
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Müşteri Bilgileri */}
            <div className="grid gap-4">
              <div className="flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold">Müşteri Bilgileri</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customerName">Ad Soyad *</Label>
                  <Input
                    id="customerName"
                    value={formData.customerName}
                    onChange={(e) => handleInputChange("customerName", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="customerEmail">E-posta *</Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    value={formData.customerEmail}
                    onChange={(e) => handleInputChange("customerEmail", e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customerPhone">Telefon</Label>
                  <Input
                    id="customerPhone"
                    value={formData.customerPhone}
                    onChange={(e) => handleInputChange("customerPhone", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="customerTckn">TC Kimlik No</Label>
                  <Input
                    id="customerTckn"
                    value={formData.customerTckn}
                    onChange={(e) => handleInputChange("customerTckn", e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="customerAddress">Adres</Label>
                <Textarea
                  id="customerAddress"
                  value={formData.customerAddress}
                  onChange={(e) => handleInputChange("customerAddress", e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            {/* Paket Bilgileri */}
            <div className="grid gap-4">
              <div className="flex items-center gap-2 mb-4">
                <Package className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-semibold">Paket Bilgileri</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="packageName">Paket Adı *</Label>
                  <Input
                    id="packageName"
                    value={formData.packageName}
                    onChange={(e) => handleInputChange("packageName", e.target.value)}
                    placeholder="Örn: Premium Paket"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="packageType">Paket Tipi</Label>
                  <Select value={formData.packageType} onValueChange={(value) => handleInputChange("packageType", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Paket tipi seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Temel</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Ödeme Bilgileri */}
            <div className="grid gap-4">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-semibold">Ödeme Bilgileri</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount">Tutar (₺) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => handleInputChange("amount", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label>Ödeme Yöntemi *</Label>
                  <RadioGroup 
                    value={formData.paymentMethod} 
                    onValueChange={(value) => handleInputChange("paymentMethod", value)}
                    className="flex flex-col space-y-2 mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="credit_card" id="credit_card" />
                      <Label htmlFor="credit_card">Kredi Kartı</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="bank_transfer" id="bank_transfer" />
                      <Label htmlFor="bank_transfer">Banka Havalesi</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => navigate("/divan_paneli/payments")}
              >
                İptal
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
                className="min-w-[120px]"
              >
                {loading ? "Oluşturuluyor..." : "Sipariş Oluştur"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default NewOrder;
