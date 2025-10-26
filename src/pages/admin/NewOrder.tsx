
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log("Yeni sipariş oluşturuluyor:", formData);

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
        subscription_month: 1
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

      // Yeni sipariş SMS bildirimi gönder
      try {
        await supabase.functions.invoke('send-new-order-sms', {
          body: {
            customerName: formData.customerName,
            packageName: formData.packageName,
            amount: parseFloat(formData.amount),
            paymentMethod: formData.paymentMethod === 'bank_transfer' ? 'Banka Havalesi' : 'Kredi Kartı',
            orderDate: new Date().toLocaleDateString('tr-TR')
          }
        });
        console.log('Order notification SMS sent');
      } catch (smsError) {
        console.error('Failed to send order notification SMS:', smsError);
        // SMS hatası sipariş oluşturmayı engellemez
      }

      toast({
        title: "Başarılı",
        description: "Sipariş başarıyla oluşturuldu"
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
