import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const verimoreUsername = Deno.env.get('VERIMOR_USERNAME');
    const verimorePassword = Deno.env.get('VERIMOR_PASSWORD');

    if (!verimoreUsername || !verimorePassword) {
      console.error('Verimor credentials not found');
      return new Response(
        JSON.stringify({ success: false, error: 'Verimor credentials not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log('Fetching contacts from Verimor...');

    // Verimor API'sine dahili numaraları almak için istek gönder
    const verimoreApiUrl = 'https://api.verimor.com.tr/v2/contacts';
    
    const response = await fetch(verimoreApiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${btoa(`${verimoreUsername}:${verimorePassword}`)}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Verimor API error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error details:', errorText);
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Verimor API error: ${response.status} ${response.statusText}`,
          details: errorText
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: response.status }
      );
    }

    const verimoreData = await response.json();
    console.log('Verimor response:', verimoreData);

    // Verimor'dan gelen verileri uygun formata çevir
    const contacts = verimoreData.contacts || verimoreData.data || [];
    
    const formattedContacts = contacts.map((contact: any) => ({
      id: contact.id || contact.contact_id,
      name: contact.name || contact.full_name || contact.title || 'İsimsiz',
      phone: contact.phone || contact.number || contact.gsm,
      specialty: 'Uzman', // Varsayılan uzmanlık
      is_active: true
    }));

    console.log(`Successfully fetched ${formattedContacts.length} contacts from Verimor`);

    return new Response(
      JSON.stringify({
        success: true,
        contacts: formattedContacts,
        total: formattedContacts.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching Verimor contacts:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to fetch contacts from Verimor',
        details: error.message
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});