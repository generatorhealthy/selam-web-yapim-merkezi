import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CustomerData {
  name: string;
  surname: string;
  email: string;
  phone?: string;
  tcNo?: string;
  address?: string;
  city?: string;
  customerType: string;
  companyName?: string;
  taxNo?: string;
  taxOffice?: string;
}

interface PackageData {
  name: string;
  price: number;
  originalPrice: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { customerData, packageData, paymentMethod, clientIP } = await req.json();

    console.log('Order confirmation email request received:', { 
      customerEmail: customerData.email,
      packageName: packageData.name 
    });

    // Send email with Brevo (only order confirmation, no attachments)
    const emailResponse = await sendEmailWithBrevo(
      customerData,
      packageData,
      paymentMethod
    );

    console.log('Email sent successfully:', emailResponse);

    return new Response(
      JSON.stringify({ success: true, message: 'Order confirmation email sent successfully' }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );

  } catch (error) {
    console.error('Error in send-contract-emails function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );
  }
});

async function sendEmailWithBrevo(
  customerData: CustomerData,
  packageData: PackageData,
  paymentMethod: string
) {
  const brevoApiKey = Deno.env.get('BREVO_API_KEY');
  
  if (!brevoApiKey) {
    throw new Error('BREVO_API_KEY not found in environment variables');
  }

  const emailTemplate = createOrderCompletionEmailTemplate(customerData, packageData, paymentMethod);

  const emailData = {
    sender: {
      name: "Doktorum Ol",
      email: "info@doktorumol.com.tr"
    },
    to: [
      {
        email: customerData.email,
        name: `${customerData.name} ${customerData.surname}`
      }
    ],
    bcc: [
      {
        email: "info@doktorumol.com.tr",
        name: "Doktorum Ol"
      }
    ],
    subject: "Siparişiniz Tamamlandı",
    htmlContent: emailTemplate
  };

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'api-key': brevoApiKey
    },
    body: JSON.stringify(emailData)
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Brevo API error: ${response.status} ${errorData}`);
  }

  return await response.json();
}


function createOrderCompletionEmailTemplate(customerData: CustomerData, packageData: PackageData, paymentMethod: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
      <div style="background: linear-gradient(135deg, #0369a1, #0284c7); padding: 30px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 28px; font-weight: bold;">Siparişiniz Tamamlandı!</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Doktorum Ol - Profesyonel Doktor Platformu</p>
      </div>
      
      <div style="padding: 30px; line-height: 1.6; color: #333333;">
        <p style="font-size: 16px; margin-bottom: 20px;">
          Sayın <strong>${customerData.name} ${customerData.surname}</strong>,
        </p>
        
        <p style="font-size: 14px; color: #666666; margin-bottom: 25px;">
          Siparişiniz başarıyla tamamlanmıştır. Aşağıda sipariş detaylarınızı bulabilirsiniz:
        </p>
        
        <div style="background-color: #f8fafc; border-left: 4px solid #0369a1; padding: 20px; margin: 20px 0;">
          <h3 style="color: #0369a1; margin-top: 0;">PAKET BİLGİLERİ:</h3>
          <p><strong>Seçilen Paket:</strong> ${packageData.name}</p>
          <p><strong>Fiyat:</strong> ${packageData.price.toLocaleString('tr-TR')} ₺</p>
          <p><strong>Ödeme Yöntemi:</strong> Banka Havalesi/EFT</p>
        </div>
        
        
        <div style="background-color: #f0f9ff; border: 1px solid #0369a1; border-radius: 6px; padding: 15px; margin: 20px 0;">
          <h4 style="color: #0369a1; margin-top: 0;">Sonraki Adımlar:</h4>
          <ul style="margin: 10px 0; padding-left: 20px;">
            <li>Ödeme işleminizi banka havalesi ile gerçekleştiriniz</li>
            <li>Ödeme onayı sonrası 24 saat içinde hizmetiniz aktif edilecektir</li>
            <li>Profil oluşturma sürecinde size yardımcı olacağız</li>
          </ul>
        </div>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        
        <div style="text-align: center; color: #666666; font-size: 12px;">
          <p>Bu e-posta otomatik olarak gönderilmiştir.</p>
          <p>
            <strong>Doktorum Ol</strong><br>
            📍 Yenişehir, Atatürk Cd. No:621/1, 34912 Pendik/İstanbul<br>
            📞 0 216 706 06 11 | ✉️ info@doktorumol.com.tr
          </p>
        </div>
      </div>
    </div>
  `;
}