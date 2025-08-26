import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AkbankRequest {
  action: 'getTransactions' | 'getBalance';
  dateFrom?: string;
  dateTo?: string;
}

interface BankTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
  balance: number;
  reference: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, dateFrom, dateTo }: AkbankRequest = await req.json();

    // Initialize Akbank API credentials
    const akbankApiUrl = Deno.env.get('AKBANK_API_URL');
    const akbankClientId = Deno.env.get('AKBANK_CLIENT_ID');
    const akbankSecret = Deno.env.get('AKBANK_SECRET');
    const akbankAccountNumber = Deno.env.get('AKBANK_ACCOUNT_NUMBER');

    if (!akbankApiUrl || !akbankClientId || !akbankSecret || !akbankAccountNumber) {
      console.log('Akbank API credentials not configured, using mock data');
      
      // Return mock data for development/testing
      const mockTransactions: BankTransaction[] = [
        {
          id: `txn_${Date.now()}_1`,
          date: new Date().toISOString(),
          description: "Havale - Ahmet Yılmaz - DRP-1705314000000",
          amount: 2398,
          type: "credit",
          balance: 125750,
          reference: "DRP-1705314000000"
        },
        {
          id: `txn_${Date.now()}_2`,
          date: new Date(Date.now() - 86400000).toISOString(),
          description: "Havale - Mehmet Demir - DRP-1705327320000", 
          amount: 4999,
          type: "credit",
          balance: 123352,
          reference: "DRP-1705327320000"
        },
        {
          id: `txn_${Date.now()}_3`,
          date: new Date(Date.now() - 172800000).toISOString(),
          description: "Havale - Fatma Özkan - DRP-1705240700000",
          amount: 2398,
          type: "credit", 
          balance: 118353,
          reference: "DRP-1705240700000"
        }
      ];

      return new Response(JSON.stringify({
        transactions: mockTransactions,
        balance: {
          available: 125750.00,
          currency: "TRY",
          lastUpdate: new Date().toISOString()
        }
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get OAuth token from Akbank
    const tokenResponse = await fetch(`${akbankApiUrl}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${akbankClientId}:${akbankSecret}`)}`
      },
      body: 'grant_type=client_credentials&scope=account'
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to get Akbank access token');
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    let apiResponse;
    
    if (action === 'getTransactions') {
      // Get account transactions
      const transactionsUrl = `${akbankApiUrl}/v1/accounts/${akbankAccountNumber}/transactions`;
      const params = new URLSearchParams({
        from: dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        to: dateTo || new Date().toISOString().split('T')[0],
        limit: '100'
      });

      apiResponse = await fetch(`${transactionsUrl}?${params}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Request-ID': `req_${Date.now()}`
        }
      });
    } else if (action === 'getBalance') {
      // Get account balance
      apiResponse = await fetch(`${akbankApiUrl}/v1/accounts/${akbankAccountNumber}/balance`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Request-ID': `req_${Date.now()}`
        }
      });
    } else {
      throw new Error('Invalid action');
    }

    if (!apiResponse.ok) {
      throw new Error(`Akbank API error: ${apiResponse.status}`);
    }

    const bankData = await apiResponse.json();
    
    // Transform Akbank response to our format
    let transformedData = {};
    
    if (action === 'getTransactions') {
      const transactions: BankTransaction[] = bankData.transactions?.map((tx: any) => ({
        id: tx.id || `txn_${Date.now()}_${Math.random()}`,
        date: tx.transactionDate || tx.date,
        description: tx.description || tx.narrative,
        amount: Math.abs(parseFloat(tx.amount || '0')),
        type: parseFloat(tx.amount || '0') > 0 ? 'credit' : 'debit',
        balance: parseFloat(tx.balance || '0'),
        reference: tx.reference || tx.endToEndId || ''
      })) || [];

      transformedData = {
        transactions,
        balance: {
          available: parseFloat(bankData.balance?.available || '0'),
          currency: bankData.balance?.currency || 'TRY',
          lastUpdate: new Date().toISOString()
        }
      };
    } else {
      transformedData = {
        balance: {
          available: parseFloat(bankData.available || '0'),
          currency: bankData.currency || 'TRY',
          lastUpdate: new Date().toISOString()
        }
      };
    }

    // Log banking activity
    await supabase.from('website_analytics').insert({
      session_id: `banking_${Date.now()}`,
      page_url: '/admin/banking',
      user_agent: req.headers.get('user-agent') || '',
      ip_address: req.headers.get('x-forwarded-for') || 'unknown'
    });

    return new Response(JSON.stringify(transformedData), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Akbank integration error:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Akbank API integration failed'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};

serve(handler);