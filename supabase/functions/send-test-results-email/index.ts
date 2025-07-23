import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TestResultEmailRequest {
  testResultId: string;
  specialistEmail: string;
  patientName: string;
  patientPhone: string;
  testTitle: string;
  answers: any;
  results: any;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const brevoApiKey = Deno.env.get('BREVO_API_KEY');
    
    if (!brevoApiKey) {
      console.error('BREVO_API_KEY not found');
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const {
      testResultId,
      specialistEmail,
      patientName,
      patientPhone,
      testTitle,
      answers,
      results
    }: TestResultEmailRequest = await req.json();

    console.log('Test result email request received:', {
      testResultId,
      specialistEmail,
      patientName,
      testTitle
    });

    // Format answers for display
    const formattedAnswers = Object.entries(answers).map(([questionId, answer]) => 
      `<li><strong>Soru ${questionId}:</strong> ${answer}</li>`
    ).join('');

    const emailContent = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
              Yeni Test Sonucu Bildirimi
            </h2>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #27ae60; margin-top: 0;">Hasta Bilgileri</h3>
              <p><strong>Hasta Adı:</strong> ${patientName}</p>
              <p><strong>Telefon:</strong> ${patientPhone}</p>
              <p><strong>Test:</strong> ${testTitle}</p>
            </div>

            <div style="background-color: #fff; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
              <h3 style="color: #2c3e50;">Test Cevapları</h3>
              <ul style="padding-left: 20px;">
                ${formattedAnswers}
              </ul>
            </div>

            <div style="margin-top: 30px; padding: 20px; background-color: #e8f4f8; border-radius: 8px;">
              <p style="margin: 0; font-size: 14px; color: #666;">
                Bu e-posta <strong>doktorumol.com.tr</strong> üzerinden otomatik olarak gönderilmiştir.
                Test sonucu ID: ${testResultId}
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send email using Brevo API
    const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': brevoApiKey,
      },
      body: JSON.stringify({
        sender: {
          email: 'info@doktorumol.com.tr',
          name: 'Doktor Umol'
        },
        to: [{
          email: specialistEmail,
          name: 'Uzman Doktor'
        }],
        subject: `Yeni Test Sonucu: ${testTitle} - ${patientName}`,
        htmlContent: emailContent
      })
    });

    if (!brevoResponse.ok) {
      const errorData = await brevoResponse.text();
      console.error('Brevo API error:', errorData);
      throw new Error(`Brevo API error: ${brevoResponse.status}`);
    }

    const brevoResult = await brevoResponse.json();
    console.log('Email sent successfully via Brevo:', brevoResult);

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: brevoResult.messageId 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error in send-test-results-email function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);