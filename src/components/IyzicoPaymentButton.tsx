import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CreditCard, Loader2 } from 'lucide-react';

interface IyzicoPaymentButtonProps {
  packageType: string;
  packageName: string;
  price: number;
  customerData: {
    name: string;
    surname: string;
    email: string;
    phone?: string;
    tcNo?: string;
    address?: string;
    city?: string;
    customerType: 'individual' | 'corporate';
    companyName?: string;
    taxNo?: string;
    taxOffice?: string;
  };
  className?: string;
  disabled?: boolean;
}

const IyzicoPaymentButton = ({ 
  packageType, 
  packageName, 
  price, 
  customerData,
  className = '',
  disabled = false
}: IyzicoPaymentButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handlePayment = async () => {
    if (disabled || isLoading) return;

    // Validate customer data
    if (!customerData.name || !customerData.surname || !customerData.email) {
      toast.error('Lütfen gerekli müşteri bilgilerini doldurun');
      return;
    }

    setIsLoading(true);

    try {
      // Store order details in localStorage for success page
      const orderDetails = {
        packageName,
        packageType,
        amount: price,
        email: customerData.email,
        customerName: `${customerData.name} ${customerData.surname}`
      };
      localStorage.setItem('currentOrder', JSON.stringify(orderDetails));

      // Call the initialize subscription function
      const { data, error } = await supabase.functions.invoke('initialize-subscription', {
        body: {
          packageType,
          customerData
        }
      });

      if (error) {
        console.error('Subscription initialization error:', error);
        throw new Error(error.message);
      }

      if (!data?.success || !data?.checkoutFormContent) {
        throw new Error('Ödeme formu oluşturulamadı');
      }

      // Create and append the checkout form
      const formContainer = document.createElement('div');
      formContainer.innerHTML = data.checkoutFormContent;
      formContainer.style.position = 'fixed';
      formContainer.style.top = '0';
      formContainer.style.left = '0';
      formContainer.style.width = '100%';
      formContainer.style.height = '100%';
      formContainer.style.zIndex = '9999';
      formContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
      formContainer.style.display = 'flex';
      formContainer.style.alignItems = 'center';
      formContainer.style.justifyContent = 'center';

      document.body.appendChild(formContainer);

      // Add close button
      const closeButton = document.createElement('button');
      closeButton.innerHTML = '✕';
      closeButton.style.position = 'absolute';
      closeButton.style.top = '20px';
      closeButton.style.right = '20px';
      closeButton.style.backgroundColor = 'white';
      closeButton.style.border = '2px solid #ccc';
      closeButton.style.borderRadius = '50%';
      closeButton.style.width = '40px';
      closeButton.style.height = '40px';
      closeButton.style.fontSize = '20px';
      closeButton.style.cursor = 'pointer';
      closeButton.style.zIndex = '10000';
      
      closeButton.onclick = () => {
        document.body.removeChild(formContainer);
        setIsLoading(false);
      };
      
      formContainer.appendChild(closeButton);

      toast.success('Ödeme formu açılıyor...');

    } catch (error: any) {
      console.error('Payment initialization error:', error);
      toast.error(error.message || 'Ödeme başlatılırken hata oluştu');
      localStorage.removeItem('currentOrder');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handlePayment}
      disabled={disabled || isLoading}
      className={`w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 ${className}`}
      size="lg"
    >
      {isLoading ? (
        <>
          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          İşlem Başlatılıyor...
        </>
      ) : (
        <>
          <CreditCard className="w-5 h-5 mr-2" />
          Güvenli Ödeme - {price?.toLocaleString('tr-TR')} TL
        </>
      )}
    </Button>
  );
};

export default IyzicoPaymentButton;