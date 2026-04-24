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

// Tumblr API credentials
const TUMBLR_CONSUMER_KEY = Deno.env.get("TUMBLR_CONSUMER_KEY")?.trim();
const TUMBLR_CONSUMER_SECRET = Deno.env.get("TUMBLR_CONSUMER_SECRET")?.trim();
const TUMBLR_TOKEN = Deno.env.get("TUMBLR_TOKEN")?.trim();
const TUMBLR_TOKEN_SECRET = Deno.env.get("TUMBLR_TOKEN_SECRET")?.trim();
const TUMBLR_BLOG_NAME = Deno.env.get("TUMBLR_BLOG_NAME")?.trim();

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
  console.log("Sending tweet...");

  const response = await fetch(url, {
    method: method,
    headers: {
      Authorization: oauthHeader,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text: tweetText }),
  });

  const responseText = await response.text();
  console.log("Twitter Response:", responseText);

  if (!response.ok) {
    throw new Error(`Twitter API error: ${response.status} - ${responseText}`);
  }

  return JSON.parse(responseText);
}

// ============= TUMBLR API =============
// RFC3986 percent-encoding (stricter than encodeURIComponent)
function rfc3986Encode(str: string): string {
  return encodeURIComponent(str)
    .replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());
}

function generateTumblrSignature(
  method: string,
  url: string,
  params: Record<string, string>,
  consumerSecret: string,
  tokenSecret: string
): string {
  // Encode each key and value separately, then sort, then join
  const encodedParams = Object.entries(params)
    .map(([k, v]) => [rfc3986Encode(k), rfc3986Encode(v)] as [string, string])
    .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : (a[1] < b[1] ? -1 : 1)))
    .map(([k, v]) => `${k}=${v}`)
    .join('&');

  const signatureBaseString = `${method}&${rfc3986Encode(url)}&${rfc3986Encode(encodedParams)}`;
  const signingKey = `${rfc3986Encode(consumerSecret)}&${rfc3986Encode(tokenSecret)}`;
  const hmacSha1 = createHmac("sha1", signingKey);
  return hmacSha1.update(signatureBaseString).digest("base64");
}

function generateTumblrOAuthHeader(
  method: string,
  url: string,
  bodyParams: Record<string, string> = {}
): string {
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: TUMBLR_CONSUMER_KEY!,
    oauth_nonce: Math.random().toString(36).substring(2) + Date.now().toString(36),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: TUMBLR_TOKEN!,
    oauth_version: "1.0",
  };

  const allParams = { ...oauthParams, ...bodyParams };
  const signature = generateTumblrSignature(
    method,
    url,
    allParams,
    TUMBLR_CONSUMER_SECRET!,
    TUMBLR_TOKEN_SECRET!
  );

  const signedOAuthParams: Record<string, string> = {
    ...oauthParams,
    oauth_signature: signature,
  };

  // Authorization header should only contain oauth_* params, sorted
  const entries = Object.entries(signedOAuthParams).sort((a, b) =>
    a[0].localeCompare(b[0])
  );

  return (
    "OAuth " +
    entries
      .map(([k, v]) => `${rfc3986Encode(k)}="${rfc3986Encode(v)}"`)
      .join(", ")
  );
}

async function postToTumblr(
  blogTitle: string,
  blogUrl: string,
  blogContent: string,
  featuredImage: string | null,
  tags: string[]
): Promise<any> {
  const blogName = TUMBLR_BLOG_NAME!.replace(/\.tumblr\.com$/i, '').replace(/^https?:\/\//, '');
  const url = `https://api.tumblr.com/v2/blog/${blogName}.tumblr.com/post`;
  const method = "POST";

  const cleanContent = blogContent
    ? blogContent.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 500) + '...'
    : blogTitle;

  const captionHtml = `<p>${cleanContent}</p><p><a href="${blogUrl}">Devamını oku: ${blogTitle}</a></p>`;

  const bodyParams: Record<string, string> = {
    type: featuredImage ? 'photo' : 'text',
    state: 'published',
    tags: tags.join(','),
  };

  if (featuredImage) {
    bodyParams.source = featuredImage;
    bodyParams.caption = captionHtml;
    bodyParams.link = blogUrl;
  } else {
    bodyParams.title = blogTitle;
    bodyParams.body = captionHtml;
  }

  const oauthHeader = generateTumblrOAuthHeader(method, url, bodyParams);
  console.log("Posting to Tumblr blog:", blogName);

  const formBody = Object.entries(bodyParams)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');

  const response = await fetch(url, {
    method: method,
    headers: {
      Authorization: oauthHeader,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formBody,
  });

  const responseText = await response.text();
  console.log("Tumblr Response:", responseText);

  if (!response.ok) {
    throw new Error(`Tumblr API error: ${response.status} - ${responseText}`);
  }

  return JSON.parse(responseText);
}

async function saveShareResult(
  supabase: any,
  blogId: string,
  platform: string,
  status: 'success' | 'failed',
  errorMessage?: string
) {
  try {
    // Check if record exists
    const { data: existing } = await supabase
      .from('social_shares')
      .select('id')
      .eq('blog_post_id', blogId)
      .eq('platform', platform)
      .single();

    if (existing) {
      // Update existing record
      await supabase
        .from('social_shares')
        .update({
          status,
          shared_at: status === 'success' ? new Date().toISOString() : null,
          error_message: errorMessage || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);
    } else {
      // Insert new record
      await supabase
        .from('social_shares')
        .insert({
          blog_post_id: blogId,
          platform,
          status,
          shared_at: status === 'success' ? new Date().toISOString() : null,
          error_message: errorMessage || null
        });
    }
    console.log(`Share result saved for ${platform}: ${status}`);
  } catch (error) {
    console.error('Error saving share result:', error);
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { blogId, blogTitle, blogSlug, blogContent, featuredImage, keywords, platform } = await req.json();

    console.log(`Processing share request for blog: ${blogTitle}, platform: ${platform}`);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Only Twitter is implemented for now
    if (platform === 'twitter') {
      // Validate Twitter credentials
      if (!API_KEY || !API_SECRET || !ACCESS_TOKEN || !ACCESS_TOKEN_SECRET) {
        const error = 'Twitter API credentials not configured';
        console.error(error);
        await saveShareResult(supabase, blogId, platform, 'failed', error);
        return new Response(JSON.stringify({ error }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Create tweet text (max 280 characters)
      const blogUrl = `https://doktorumol.com.tr/blog/${blogSlug}`;
      
      // Create a short excerpt from title
      let tweetText = blogTitle;
      if (tweetText.length > 200) {
        tweetText = tweetText.substring(0, 197) + '...';
      }
      
      // Add URL and hashtags
      const hashtags = keywords ? keywords.split(',').slice(0, 2).map((k: string) => `#${k.trim().replace(/\s+/g, '')}`).join(' ') : '';
      tweetText = `${tweetText}\n\n${blogUrl}${hashtags ? '\n\n' + hashtags : ''}`;
      
      // Ensure within 280 char limit
      if (tweetText.length > 280) {
        const titleLength = 280 - blogUrl.length - 10;
        tweetText = `${blogTitle.substring(0, titleLength)}...\n\n${blogUrl}`;
      }

      console.log('Tweet text:', tweetText);

      try {
        const result = await sendTweet(tweetText);
        console.log('Tweet sent successfully:', result);
        
        await saveShareResult(supabase, blogId, platform, 'success');
        
        return new Response(JSON.stringify({ success: true, data: result }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (twitterError: any) {
        console.error('Twitter error:', twitterError);
        await saveShareResult(supabase, blogId, platform, 'failed', twitterError.message);
        
        return new Response(JSON.stringify({ error: twitterError.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } else if (platform === 'tumblr') {
      // Validate Tumblr credentials
      if (!TUMBLR_CONSUMER_KEY || !TUMBLR_CONSUMER_SECRET || !TUMBLR_TOKEN || !TUMBLR_TOKEN_SECRET || !TUMBLR_BLOG_NAME) {
        const error = 'Tumblr API credentials not configured';
        console.error(error);
        await saveShareResult(supabase, blogId, platform, 'failed', error);
        return new Response(JSON.stringify({ error }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const blogUrl = `https://doktorumol.com.tr/blog/${blogSlug}`;
      const tags = keywords
        ? keywords.split(',').map((k: string) => k.trim()).filter(Boolean).slice(0, 10)
        : ['sağlık', 'doktor', 'doktorumol'];

      try {
        const result = await postToTumblr(blogTitle, blogUrl, blogContent || '', featuredImage || null, tags);
        console.log('Tumblr post sent successfully:', result);

        await saveShareResult(supabase, blogId, platform, 'success');

        return new Response(JSON.stringify({ success: true, data: result }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (tumblrError: any) {
        console.error('Tumblr error:', tumblrError);
        await saveShareResult(supabase, blogId, platform, 'failed', tumblrError.message);

        return new Response(JSON.stringify({ error: tumblrError.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } else {
      // Other platforms not implemented yet
      const message = `${platform} platformu henüz desteklenmiyor`;
      console.log(message);
      await saveShareResult(supabase, blogId, platform, 'failed', message);
      
      return new Response(JSON.stringify({ error: message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error: any) {
    console.error('Error in share-blog-to-social:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
