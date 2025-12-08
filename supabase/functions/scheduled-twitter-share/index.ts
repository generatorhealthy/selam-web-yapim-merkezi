import { createHmac } from "node:crypto";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Twitter API credentials
const API_KEY = Deno.env.get("TWITTER_API_KEY")?.trim();
const API_SECRET = Deno.env.get("TWITTER_API_SECRET")?.trim();
const ACCESS_TOKEN = Deno.env.get("TWITTER_ACCESS_TOKEN")?.trim();
const ACCESS_TOKEN_SECRET = Deno.env.get("TWITTER_ACCESS_TOKEN_SECRET")?.trim();

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

function generateOAuthSignature(
  method: string,
  url: string,
  params: Record<string, string>,
  consumerSecret: string,
  tokenSecret: string
): string {
  const signatureBaseString = `${method}&${encodeURIComponent(url)}&${encodeURIComponent(
    Object.entries(params)
      .sort()
      .map(([k, v]) => `${k}=${v}`)
      .join("&")
  )}`;
  const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret)}`;
  const hmacSha1 = createHmac("sha1", signingKey);
  const signature = hmacSha1.update(signatureBaseString).digest("base64");
  return signature;
}

function generateOAuthHeader(method: string, url: string): string {
  const oauthParams = {
    oauth_consumer_key: API_KEY!,
    oauth_nonce: Math.random().toString(36).substring(2),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: ACCESS_TOKEN!,
    oauth_version: "1.0",
  };

  const signature = generateOAuthSignature(
    method,
    url,
    oauthParams,
    API_SECRET!,
    ACCESS_TOKEN_SECRET!
  );

  const signedOAuthParams = {
    ...oauthParams,
    oauth_signature: signature,
  };

  const entries = Object.entries(signedOAuthParams).sort((a, b) =>
    a[0].localeCompare(b[0])
  );

  return (
    "OAuth " +
    entries
      .map(([k, v]) => `${encodeURIComponent(k)}="${encodeURIComponent(v)}"`)
      .join(", ")
  );
}

async function sendTweet(tweetText: string): Promise<any> {
  const url = "https://api.x.com/2/tweets";
  const method = "POST";

  const oauthHeader = generateOAuthHeader(method, url);

  const response = await fetch(url, {
    method: method,
    headers: {
      Authorization: oauthHeader,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text: tweetText }),
  });

  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(`Twitter API error: ${response.status} - ${responseText}`);
  }

  return JSON.parse(responseText);
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('Scheduled Twitter share started');

  try {
    // Validate Twitter credentials
    if (!API_KEY || !API_SECRET || !ACCESS_TOKEN || !ACCESS_TOKEN_SECRET) {
      console.error('Twitter API credentials not configured');
      return new Response(JSON.stringify({ error: 'Twitter API credentials not configured' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get blogs that haven't been shared to Twitter yet (limit 3 per hour)
    const { data: unsharedBlogs, error: fetchError } = await supabase
      .from('blog_posts')
      .select('id, title, slug, keywords, featured_image')
      .eq('status', 'published')
      .not('id', 'in', 
        supabase
          .from('social_shares')
          .select('blog_post_id')
          .eq('platform', 'twitter')
          .eq('status', 'success')
      )
      .order('created_at', { ascending: true })
      .limit(3);

    if (fetchError) {
      console.error('Error fetching unshared blogs:', fetchError);
      
      // Alternative query without subquery
      const { data: allBlogs } = await supabase
        .from('blog_posts')
        .select('id, title, slug, keywords, featured_image')
        .eq('status', 'published')
        .order('created_at', { ascending: true });

      const { data: sharedBlogIds } = await supabase
        .from('social_shares')
        .select('blog_post_id')
        .eq('platform', 'twitter')
        .eq('status', 'success');

      const sharedIds = new Set(sharedBlogIds?.map(s => s.blog_post_id) || []);
      const blogsToShare = (allBlogs || [])
        .filter(blog => !sharedIds.has(blog.id))
        .slice(0, 3);

      if (blogsToShare.length === 0) {
        console.log('No unshared blogs found');
        return new Response(JSON.stringify({ message: 'No unshared blogs found', shared: 0 }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      let successCount = 0;
      let errorCount = 0;

      for (const blog of blogsToShare) {
        try {
          // Create tweet text
          const blogUrl = `https://doktorumol.com.tr/blog/${blog.slug}`;
          let tweetText = blog.title;
          if (tweetText.length > 200) {
            tweetText = tweetText.substring(0, 197) + '...';
          }
          
          const hashtags = blog.keywords 
            ? blog.keywords.split(',').slice(0, 2).map((k: string) => `#${k.trim().replace(/\s+/g, '')}`).join(' ') 
            : '';
          tweetText = `${tweetText}\n\n${blogUrl}${hashtags ? '\n\n' + hashtags : ''}`;
          
          if (tweetText.length > 280) {
            const titleLength = 280 - blogUrl.length - 10;
            tweetText = `${blog.title.substring(0, titleLength)}...\n\n${blogUrl}`;
          }

          console.log(`Sharing blog: ${blog.title}`);
          
          const result = await sendTweet(tweetText);
          console.log('Tweet sent successfully:', result);

          // Save share result
          await supabase
            .from('social_shares')
            .upsert({
              blog_post_id: blog.id,
              platform: 'twitter',
              status: 'success',
              shared_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'blog_post_id,platform'
            });

          successCount++;

          // Wait 5 seconds between tweets to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 5000));
        } catch (tweetError: any) {
          console.error(`Error sharing blog ${blog.id}:`, tweetError.message);
          
          await supabase
            .from('social_shares')
            .upsert({
              blog_post_id: blog.id,
              platform: 'twitter',
              status: 'failed',
              error_message: tweetError.message,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'blog_post_id,platform'
            });

          errorCount++;
        }
      }

      return new Response(JSON.stringify({ 
        message: 'Scheduled share completed', 
        shared: successCount, 
        errors: errorCount 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!unsharedBlogs || unsharedBlogs.length === 0) {
      console.log('No unshared blogs found');
      return new Response(JSON.stringify({ message: 'No unshared blogs found', shared: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let successCount = 0;
    let errorCount = 0;

    for (const blog of unsharedBlogs) {
      try {
        const blogUrl = `https://doktorumol.com.tr/blog/${blog.slug}`;
        let tweetText = blog.title;
        if (tweetText.length > 200) {
          tweetText = tweetText.substring(0, 197) + '...';
        }
        
        const hashtags = blog.keywords 
          ? blog.keywords.split(',').slice(0, 2).map((k: string) => `#${k.trim().replace(/\s+/g, '')}`).join(' ') 
          : '';
        tweetText = `${tweetText}\n\n${blogUrl}${hashtags ? '\n\n' + hashtags : ''}`;
        
        if (tweetText.length > 280) {
          const titleLength = 280 - blogUrl.length - 10;
          tweetText = `${blog.title.substring(0, titleLength)}...\n\n${blogUrl}`;
        }

        console.log(`Sharing blog: ${blog.title}`);
        
        const result = await sendTweet(tweetText);
        console.log('Tweet sent successfully:', result);

        await supabase
          .from('social_shares')
          .upsert({
            blog_post_id: blog.id,
            platform: 'twitter',
            status: 'success',
            shared_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'blog_post_id,platform'
          });

        successCount++;
        await new Promise(resolve => setTimeout(resolve, 5000));
      } catch (tweetError: any) {
        console.error(`Error sharing blog ${blog.id}:`, tweetError.message);
        
        await supabase
          .from('social_shares')
          .upsert({
            blog_post_id: blog.id,
            platform: 'twitter',
            status: 'failed',
            error_message: tweetError.message,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'blog_post_id,platform'
          });

        errorCount++;
      }
    }

    return new Response(JSON.stringify({ 
      message: 'Scheduled share completed', 
      shared: successCount, 
      errors: errorCount 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in scheduled-twitter-share:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
