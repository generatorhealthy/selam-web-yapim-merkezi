import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SubscriptionRequest {
  packageType: string;
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
}

const PACKAGE_CONFIG = {
  'kampanyali_paket': {
    price: 2398,
    pricingPlanReferenceCode: 'KAMPANYALI_2398',
    name: 'Doktorum Ol Kampanyalı Paket',
    returnUrl: 'https://doktorumol.com.tr/kampanyali-paket'
  },
  'standard_paket': {
    price: 2998,
    pricingPlanReferenceCode: 'STANDARD_2998',
    name: 'Doktorum Ol Standard Paket',
    returnUrl: 'https://doktorumol.com.tr/paketler'
  },
  'premium_paket': {
    price: 4998,
    pricingPlanReferenceCode: 'PREMIUM_4998',
    name: 'Doktorum Ol Premium Paket',
    returnUrl: 'https://doktorumol.com.tr/paketler'
  },
  'kampanyali_premium_paket': {
    price: 3600,
    pricingPlanReferenceCode: 'KAMPANYALI_PREMIUM_3600',
    name: 'Doktorum Ol Kampanyalı Premium Paket',
    returnUrl: 'https://doktorumol.com.tr/kampanyali-premium-paket'
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { packageType, customerData }: SubscriptionRequest = await req.json();

    const packageConfig = PACKAGE_CONFIG[packageType as keyof typeof PACKAGE_CONFIG];
    if (!packageConfig) {
      throw new Error('Invalid package type');
    }

    const apiKey = Deno.env.get('IYZICO_API_KEY');
    const secretKey = Deno.env.get('IYZICO_SECRET_KEY');
    
    if (!apiKey || !secretKey) {
      throw new Error('Iyzico API keys not configured');
    }

    // Create Supabase client to save order
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Save pending order
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_name: `${customerData.name} ${customerData.surname}`,
        customer_email: customerData.email,
        customer_phone: customerData.phone,
        customer_tc_no: customerData.tcNo,
        customer_address: customerData.address,
        customer_city: customerData.city,
        customer_type: customerData.customerType,
        company_name: customerData.companyName,
        company_tax_no: customerData.taxNo,
        company_tax_office: customerData.taxOffice,
        package_name: packageConfig.name,
        package_type: packageType,
        amount: packageConfig.price,
        status: 'pending',
        payment_method: 'iyzico_subscription'
      })
      .select()
      .single();

    if (orderError) {
      console.error('Order creation error:', orderError);
      throw new Error('Failed to create order');
    }

    // Prepare Iyzico request
    const iyzicoRequest = {
      locale: 'tr',
      conversationId: orderData.id,
      pricingPlanReferenceCode: packageConfig.pricingPlanReferenceCode,
      subscriptionInitialStatus: 'PENDING',
      callbackUrl: 'https://doktorumol.com.tr/api/iyzico/webhook',
      customer: {
        name: customerData.name,
        surname: customerData.surname,
        email: customerData.email,
        gsmNumber: customerData.phone,
        identityNumber: customerData.tcNo,
        city: customerData.city,
        country: 'Turkey',
        ...(customerData.customerType === 'individual' 
          ? { 
              registrationAddress: customerData.address,
              ip: '127.0.0.1'
            }
          : {
              registrationAddress: customerData.address,
              ip: '127.0.0.1'
            })
      }
    };

    // Generate authorization header
    const randomString = Math.random().toString(36).substring(2, 15);
    const authString = `${apiKey}:${secretKey}:${randomString}`;
    const authHash = await crypto.subtle.digest(
      'SHA-1',
      new TextEncoder().encode(authString)
    );
    const authToken = Array.from(new Uint8Array(authHash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Make request to Iyzico
    const iyzicoResponse = await fetch('https://sandbox-api.iyzipay.com/v2/subscription/initialize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `IYZWSv2 ${authToken}`,
        'x-iyzi-rnd': randomString
      },
      body: JSON.stringify(iyzicoRequest)
    });

    const iyzicoData = await iyzicoResponse.json();

    if (iyzicoData.status === 'success') {
      // Update order with Iyzico data
      await supabase
        .from('orders')
        .update({
          payment_transaction_id: iyzicoData.token
        })
        .eq('id', orderData.id);

      return new Response(
        JSON.stringify({
          success: true,
          checkoutFormContent: iyzicoData.checkoutFormContent,
          token: iyzicoData.token
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    } else {
      throw new Error(iyzicoData.errorMessage || 'Iyzico request failed');
    }

  } catch (error) {
    console.error('Subscription initialization error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});