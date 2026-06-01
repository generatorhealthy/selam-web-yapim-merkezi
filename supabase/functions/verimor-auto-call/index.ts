import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UnpaidCustomer {
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  monthly_payment_day: number;
  current_month: number | null;
  paid_months: number[];
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('VERIMOR_BULUTSANTRAL_API_KEY');
    if (!apiKey) {
      throw new Error('VERIMOR_BULUTSANTRAL_API_KEY is not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get request body (optional filters)
    let requestBody: any = {};
    try {
      requestBody = await req.json();
    } catch {
      // No body is fine
    }

    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth() + 1; // 1-based

    let unpaidCustomers: UnpaidCustomer[] = [];

    // Test mode: directly call a specific number
    if (requestBody.test_mode && requestBody.test_phone) {
      unpaidCustomers = [{
        customer_name: requestBody.test_name || 'Test Müşteri',
        customer_phone: requestBody.test_phone,
        customer_email: requestBody.test_email || '',
        monthly_payment_day: requestBody.test_payment_day || currentDay,
        current_month: null,
        paid_months: []
      }];
      console.log('TEST MODE: Calling', requestBody.test_phone);
    } else {
      // Find unpaid customers: payment day has passed but current month not in paid_months
      const { data: customers, error: fetchError } = await supabase
        .from('automatic_orders')
        .select('customer_name, customer_phone, customer_email, monthly_payment_day, current_month, paid_months')
        .eq('is_active', true);

      if (fetchError) {
        throw new Error(`Failed to fetch customers: ${fetchError.message}`);
      }

      // Filter unpaid customers
      unpaidCustomers = (customers || []).filter((c: any) => {
        const paidMonths = c.paid_months || [];
        const customerCurrentMonth = c.current_month || 1;
        
        if (c.monthly_payment_day <= currentDay) {
          return !paidMonths.includes(customerCurrentMonth);
        }
        return false;
      });
    }

    if (unpaidCustomers.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No unpaid customers found for today',
        called_count: 0
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // ===== ElevenLabs personalized announcement mode =====
    // If `tts_text` is provided, we generate a per-customer voice with ElevenLabs,
    // upload it to Verimor as an announcement, and use the returned announcement id.
    // "{name}" inside tts_text is replaced with the customer name.
    const ttsTemplate: string | null = requestBody.tts_text ? String(requestBody.tts_text) : null;
    // Default voice: "George" (multilingual, natural). Can be overridden with `voice_id`.
    const VOICE_ID: string = requestBody.voice_id ? String(requestBody.voice_id) : "JBFqnCBsd6RMkjVDRZzb";
    const STATIC_ANNOUNCEMENT_ID = requestBody.test_phrase ? String(requestBody.test_phrase) : "#131901";

    const elevenLabsKey = Deno.env.get('ELEVENLABS_API_KEY');

    // Cache so identical names don't get regenerated within one run
    const announcementCache = new Map<string, string>();

    const generateAndUploadAnnouncement = async (customerName: string): Promise<string> => {
      const text = (ttsTemplate as string).replace(/\{name\}/g, customerName || "");
      if (announcementCache.has(text)) return announcementCache.get(text)!;

      if (!elevenLabsKey) throw new Error('ELEVENLABS_API_KEY is not configured');

      // 1) Generate speech with ElevenLabs as raw PCM (16-bit, 8kHz, mono) for telephony
      const ttsResp = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}?output_format=pcm_8000`,
        {
          method: 'POST',
          headers: { 'xi-api-key': elevenLabsKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text,
            model_id: 'eleven_multilingual_v2',
            voice_settings: { stability: 0.6, similarity_boost: 0.75, use_speaker_boost: true },
          }),
        }
      );
      if (!ttsResp.ok) {
        const errText = await ttsResp.text();
        throw new Error(`ElevenLabs TTS error (${ttsResp.status}): ${errText}`);
      }
      const pcmBuffer = await ttsResp.arrayBuffer();

      // Wrap raw PCM into a proper WAV container (PCM 16-bit, 8kHz, mono)
      const sampleRate = 8000;
      const numChannels = 1;
      const bitsPerSample = 16;
      const pcmBytes = new Uint8Array(pcmBuffer);
      const blockAlign = numChannels * (bitsPerSample / 8);
      const byteRate = sampleRate * blockAlign;
      const wav = new Uint8Array(44 + pcmBytes.length);
      const dv = new DataView(wav.buffer);
      const writeStr = (off: number, s: string) => { for (let i = 0; i < s.length; i++) dv.setUint8(off + i, s.charCodeAt(i)); };
      writeStr(0, 'RIFF');
      dv.setUint32(4, 36 + pcmBytes.length, true);
      writeStr(8, 'WAVE');
      writeStr(12, 'fmt ');
      dv.setUint32(16, 16, true);
      dv.setUint16(20, 1, true); // PCM
      dv.setUint16(22, numChannels, true);
      dv.setUint32(24, sampleRate, true);
      dv.setUint32(28, byteRate, true);
      dv.setUint16(32, blockAlign, true);
      dv.setUint16(34, bitsPerSample, true);
      writeStr(36, 'data');
      dv.setUint32(40, pcmBytes.length, true);
      wav.set(pcmBytes, 44);

      // base64 encode the WAV (chunked to avoid stack overflow)
      let binary = '';
      const chunkSize = 0x8000;
      for (let i = 0; i < wav.length; i += chunkSize) {
        binary += String.fromCharCode.apply(null, Array.from(wav.subarray(i, i + chunkSize)));
      }
      const base64Audio = btoa(binary);

      // 2) Upload to Verimor as an announcement
      const annName = `DO Anons ${customerName} ${Date.now()}`.slice(0, 60);
      const uploadResp = await fetch(
        `https://api.bulutsantralim.com/announcements.json?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: annName, data: base64Audio }),
        }
      );
      const uploadText = await uploadResp.text();
      console.log('Verimor announcement upload status:', uploadResp.status, 'body:', uploadText);
      if (!uploadResp.ok) {
        throw new Error(`Verimor announcement upload error (${uploadResp.status}): ${uploadText}`);
      }

      // Response is the announcement id (number or JSON)
      let annId = uploadText.trim();
      try {
        const parsed = JSON.parse(uploadText);
        annId = String(parsed.id ?? parsed.announcement_id ?? annId);
      } catch { /* plain id */ }

      const phrase = `#${annId}`;
      announcementCache.set(text, phrase);
      return phrase;
    };

    const buildPhrase = async (customerName: string): Promise<string> => {
      if (ttsTemplate) return await generateAndUploadAnnouncement(customerName);
      return STATIC_ANNOUNCEMENT_ID;
    };
    // Transfer target used after the announcement (e.g. forward caller to a specialist extension).
    // Verimor expects targets like "extension/1168" or "number/905xxxxxxxxx". Default: hangup.
    const TRANSFER_TARGET = requestBody.test_transfer_target ? String(requestBody.test_transfer_target) : "hangup/hangup";

    // Office/default numbers to skip - these are not real customer phones
    const OFFICE_NUMBERS = ['02167060611', '2167060611'];

    const preparedCustomers = unpaidCustomers
      .filter(c => {
        if (!c.customer_phone || c.customer_phone.trim() === '') return false;
        // Strip non-digits to compare
        const digits = c.customer_phone.replace(/\D/g, '');
        // Skip office/default numbers
        if (OFFICE_NUMBERS.some(office => digits.endsWith(office) || digits === office)) {
          console.log(`Skipping ${c.customer_name}: office/default phone number`);
          return false;
        }
        // Only allow mobile numbers (starting with 5 after country code)
        const normalized = digits.startsWith('90') ? digits.substring(2) : (digits.startsWith('0') ? digits.substring(1) : digits);
        if (!normalized.startsWith('5')) {
          console.log(`Skipping ${c.customer_name}: not a mobile number (${c.customer_phone})`);
          return false;
        }
        return true;
      })
      .map(c => {
        let phone = c.customer_phone.replace(/\D/g, '');
        if (phone.startsWith('0')) {
          phone = '90' + phone.substring(1);
        } else if (!phone.startsWith('90') && phone.startsWith('5')) {
          phone = '90' + phone;
        }

        return {
          customer_name: c.customer_name,
          phone,
        };
      });

    if (preparedCustomers.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No valid phone numbers found for unpaid customers',
        called_count: 0
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const isTestMode = requestBody.test_mode === true;
    const campaignResults: Array<{ customer_name: string; campaign_id: string }> = [];

    for (const customer of preparedCustomers) {
      const phrase = await buildPhrase(customer.customer_name);
      const campaignData: any = {
        call_type: "ivr",
        name: `Odeme Hatirlatma - ${customer.customer_name} - ${today.toISOString().split('T')[0]}`,
        date_range_begin: today.toISOString().split('T')[0],
        date_range_end: today.toISOString().split('T')[0],
        time_range_begin: isTestMode ? "00:00" : "10:00",
        time_range_end: isTestMode ? "23:59" : "18:00",
        active_days: isTestMode ? [1, 2, 3, 4, 5, 6, 7] : [1, 2, 3, 4, 5],
        max_thread_count: 1,
        ring_timeout: 30,
        cli: requestBody.test_cli ? String(requestBody.test_cli).replace(/\D/g, '').replace(/^0/, '90') : "902167060611",
        call_retries: isTestMode ? 0 : 2,
        digit_retries: 0,
        digit_timeout: 1,
        digit_target_1: TRANSFER_TARGET,
        timeout_target: TRANSFER_TARGET,
        invalid_target: TRANSFER_TARGET,
        phone_list: [{ phone: customer.phone, phrase }],
        is_commercial: false,
        recording_enabled: true
      };

      console.log('Creating IVR campaign for', customer.customer_name, customer.phone);
      console.log('Campaign data:', JSON.stringify(campaignData, null, 2));

      const verimorResponse = await fetch(
        `https://api.bulutsantralim.com/ivr_campaigns.json?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(campaignData)
        }
      );

      const responseText = await verimorResponse.text();
      console.log('Verimor IVR response status:', verimorResponse.status);
      console.log('Verimor IVR response:', responseText);

      if (!verimorResponse.ok) {
        throw new Error(`Verimor IVR API error for ${customer.customer_name} (${verimorResponse.status}): ${responseText}`);
      }

      campaignResults.push({
        customer_name: customer.customer_name,
        campaign_id: responseText.trim(),
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: `IVR campaign created successfully for ${campaignResults.length} unpaid customers`,
      called_count: campaignResults.length,
      called_customers: campaignResults.map(c => c.customer_name),
      campaign_id: campaignResults[0]?.campaign_id ?? null,
      campaign_ids: campaignResults.map(c => c.campaign_id),
      campaign_date: today.toISOString().split('T')[0]
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error: any) {
    console.error('Error creating IVR campaign:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
};

serve(handler);
