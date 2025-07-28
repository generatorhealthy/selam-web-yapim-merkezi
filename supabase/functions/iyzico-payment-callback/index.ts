import { createClient } from '@supabase/supabase-js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  console.log('🎯 Iyzico Payment Callback Handler - V1')
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get the callback parameters
    const url = new URL(req.url)
    const token = url.searchParams.get('token')
    const status = url.searchParams.get('status')
    
    console.log('📥 Callback parameters:', { token, status })

    if (!token) {
      throw new Error('Token parameter is missing')
    }

    // Get Iyzico credentials
    const iyzicoApiKey = Deno.env.get('IYZICO_API_KEY')
    const iyzicoSecretKey = Deno.env.get('IYZICO_SECRET_KEY')
    const iyzicoBaseUrl = Deno.env.get('IYZIPAY_URI') || 'https://sandbox-api.iyzipay.com'

    if (!iyzicoApiKey || !iyzicoSecretKey) {
      throw new Error('Iyzico credentials not found')
    }

    // Retrieve checkout form result from Iyzico
    const retrieveRequest = {
      locale: "tr",
      token: token
    }

    const jsonString = JSON.stringify(retrieveRequest)
    console.log('📋 Retrieve request:', jsonString)

    // Create hash for authentication
    const randomString = Math.random().toString(36).substring(2, 15)
    const hashString = `${iyzicoApiKey}${randomString}${iyzicoSecretKey}${jsonString}`
    
    const encoder = new TextEncoder()
    const data = encoder.encode(hashString)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = new Uint8Array(hashBuffer)
    const authorization = btoa(String.fromCharCode.apply(null, Array.from(hashArray)))

    console.log('🔐 Authorization hash created')

    // Call Iyzico retrieve API
    const iyzicoResponse = await fetch(`${iyzicoBaseUrl}/payment/iyzipos/checkoutform/auth/ecom/detail`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `IYZWS ${iyzicoApiKey}:${authorization}`,
        'x-iyzi-rnd': randomString
      },
      body: jsonString
    })

    const iyzicoResult = await iyzicoResponse.json()
    console.log('📊 Iyzico retrieve result:', iyzicoResult)

    // Check if payment is successful
    if (iyzicoResult.status === 'success' && iyzicoResult.paymentStatus === 'SUCCESS') {
      // Extract customer email to find the order
      const customerEmail = iyzicoResult.buyer?.email
      
      console.log('🔍 Looking for order with email:', customerEmail)

      if (!customerEmail) {
        throw new Error('Customer email not found in payment result')
      }

      // Find and update the most recent pending order for this email
      const { data: updateData, error: updateError } = await supabase
        .from('orders')
        .update({ 
          payment_method: 'credit_card',
          status: 'approved' // Mark as approved since payment is successful
        })
        .eq('customer_email', customerEmail)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)

      if (updateError) {
        console.error('❌ Order update error:', updateError)
        throw updateError
      }

      console.log('✅ Order updated successfully:', updateData)

      // Redirect to success page
      return Response.redirect('https://doktorumol.com.tr/odeme-basarili', 302)
    } else {
      console.log('❌ Payment failed or not successful:', iyzicoResult)
      // Redirect to failure page or checkout page
      return Response.redirect('https://doktorumol.com.tr/odeme-sayfasi?error=payment_failed', 302)
    }

  } catch (error) {
    console.error('💥 Callback handler error:', error)
    
    // Redirect to error page
    return Response.redirect('https://doktorumol.com.tr/odeme-sayfasi?error=callback_error', 302)
  }
})
