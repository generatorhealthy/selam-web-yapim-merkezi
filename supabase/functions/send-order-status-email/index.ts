import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OrderStatusEmailRequest {
  customerName: string;
  customerEmail: string;
  orderId: string;
  packageName: string;
  amount: string;
  paymentMethod: string;
  status: 'pending' | 'completed';
  orderDate: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // EMAIL FUNCTIONALITY IS DISABLED - Return early
    console.log('Order status email function called but disabled');
    return new Response(
      JSON.stringify({ message: 'Email functionality is currently disabled' }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

    // The below code will be activated when needed
    /*
    const {
      customerName,
      customerEmail,
      orderId,
      packageName,
      amount,
      paymentMethod,
      status,
      orderDate
    }: OrderStatusEmailRequest = await req.json();

    console.log('Order status email request received:', {
      customerName,
      customerEmail,
      orderId,
      status
    });

    const statusText = status === 'completed' ? 'Tamamlandı' : 'Beklemede';
    const statusColor = status === 'completed' ? '#22c55e' : '#f59e0b';
    
    // Email template for customer
    const customerEmailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Sipariş Durumu - Doktorum Ol</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; text-align: center; padding: 40px 20px;">
              <h1 style="margin: 0; font-size: 28px; font-weight: bold;">Sipariş Durumu Güncellendi! 📧</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Doktorum Ol - Profesyonel Doktor Platformu</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 30px;">
              <p style="font-size: 16px; color: #333; margin-bottom: 25px;">
                Sayın <strong>${customerName}</strong>,
              </p>
              
              <p style="font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 30px;">
                Siparişinizin durumu güncellenmiştir. Aşağıda sipariş detaylarınızı bulabilirsiniz:
              </p>

              <!-- Order Status Badge -->
              <div style="text-align: center; margin: 30px 0;">
                <span style="background-color: ${statusColor}; color: white; padding: 12px 24px; border-radius: 25px; font-size: 18px; font-weight: bold; display: inline-block;">
                  📦 Sipariş ${statusText}
                </span>
              </div>
              
              <!-- Order Details -->
              <div style="background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 25px; margin: 30px 0; border-radius: 8px;">
                <h3 style="color: #1e40af; margin: 0 0 20px 0; font-size: 18px;">📋 SİPARİŞ BİLGİLERİ:</h3>
                <div style="space-y: 12px;">
                  <p style="margin: 8px 0; color: #374151;"><strong>Sipariş No:</strong> ${orderId}</p>
                  <p style="margin: 8px 0; color: #374151;"><strong>Seçilen Paket:</strong> ${packageName}</p>
                  <p style="margin: 8px 0; color: #374151;"><strong>Fiyat:</strong> ${amount}</p>
                  <p style="margin: 8px 0; color: #374151;"><strong>Ödeme Yöntemi:</strong> ${paymentMethod}</p>
                  <p style="margin: 8px 0; color: #374151;"><strong>Sipariş Tarihi:</strong> ${orderDate}</p>
                </div>
              </div>

              ${status === 'completed' ? `
                <!-- Next Steps for Completed Orders -->
                <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 25px; border-radius: 12px; margin: 30px 0;">
                  <h3 style="margin: 0 0 15px 0; font-size: 18px;">🎉 Sonraki Adımlar:</h3>
                  <ul style="margin: 0; padding-left: 20px; line-height: 1.8;">
                    <li>Ödeme işleminiz başarıyla tamamlanmıştır</li>
                    <li>Profil oluşturma sürecinde size yardımcı olacağız</li>
                    <li>24 saat içinde hesabınız aktif edilecektir</li>
                    <li>Müşteri temsilcimiz sizinle iletişime geçecektir</li>
                  </ul>
                </div>
              ` : `
                <!-- Next Steps for Pending Orders -->
                <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 25px; border-radius: 12px; margin: 30px 0;">
                  <h3 style="margin: 0 0 15px 0; font-size: 18px;">⏳ Sonraki Adımlar:</h3>
                  <ul style="margin: 0; padding-left: 20px; line-height: 1.8;">
                    <li>Ödeme işleminizi bank havalesi ile gerçekleştirin</li>
                    <li>Ödeme onayı sonrası 24 saat içinde hizmetiniz aktif edilecektir</li>
                    <li>Profil oluşturma sürecinde size yardımcı olacağız</li>
                  </ul>
                </div>
              `}
              
              <div style="text-align: center; margin: 40px 0 20px 0;">
                <p style="color: #6b7280; font-size: 14px;">Bu e-posta otomatik olarak gönderilmiştir.</p>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #1f2937; color: white; text-align: center; padding: 30px;">
              <h3 style="margin: 0 0 10px 0; font-size: 18px;">Doktorum Ol</h3>
              <p style="margin: 5px 0; font-size: 14px;">📍 Yenişehir, Atatürk Cd. No:621/1, 34912 Pendik/İstanbul</p>
              <p style="margin: 5px 0; font-size: 14px;">📞 0 216 706 06 11</p>
              <p style="margin: 5px 0; font-size: 14px;">✉️ info@doktorumol.com.tr</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Email template for admin
    const adminEmailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Sipariş Durumu Güncellendi - Admin</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); color: white; text-align: center; padding: 40px 20px;">
              <h1 style="margin: 0; font-size: 28px; font-weight: bold;">🔔 Sipariş Durumu Güncellendi</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Admin Bildirimi - Doktorum Ol</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 30px;">
              <h2 style="color: #1f2937; margin: 0 0 20px 0;">Sipariş Detayları:</h2>
              
              <!-- Order Status -->
              <div style="text-align: center; margin: 20px 0;">
                <span style="background-color: ${statusColor}; color: white; padding: 12px 24px; border-radius: 25px; font-size: 18px; font-weight: bold; display: inline-block;">
                  Durum: ${statusText}
                </span>
              </div>
              
              <!-- Order Info -->
              <div style="background-color: #f8fafc; border: 1px solid #e5e7eb; padding: 25px; border-radius: 8px; margin: 20px 0;">
                <div style="grid-template-columns: 1fr 1fr; gap: 15px;">
                  <p style="margin: 8px 0; color: #374151;"><strong>Sipariş No:</strong> ${orderId}</p>
                  <p style="margin: 8px 0; color: #374151;"><strong>Müşteri:</strong> ${customerName}</p>
                  <p style="margin: 8px 0; color: #374151;"><strong>E-posta:</strong> ${customerEmail}</p>
                  <p style="margin: 8px 0; color: #374151;"><strong>Paket:</strong> ${packageName}</p>
                  <p style="margin: 8px 0; color: #374151;"><strong>Tutar:</strong> ${amount}</p>
                  <p style="margin: 8px 0; color: #374151;"><strong>Ödeme:</strong> ${paymentMethod}</p>
                  <p style="margin: 8px 0; color: #374151;"><strong>Tarih:</strong> ${orderDate}</p>
                </div>
              </div>
              
              <div style="text-align: center; margin-top: 30px;">
                <p style="color: #6b7280; font-size: 14px;">Bu bildirim otomatik olarak gönderilmiştir.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    // Here you would integrate with your email service (Resend, etc.)
    // For now, just log the emails
    console.log('Customer email would be sent to:', customerEmail);
    console.log('Admin email would be sent to: info@doktorumol.com.tr');

    return new Response(
      JSON.stringify({ 
        message: 'Order status emails sent successfully',
        orderId,
        status 
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
    */

  } catch (error: any) {
    console.error('Error in send-order-status-email function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);