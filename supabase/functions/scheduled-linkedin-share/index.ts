import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LINKEDIN_CLIENT_ID = Deno.env.get("LINKEDIN_CLIENT_ID")?.trim();
const LINKEDIN_CLIENT_SECRET = Deno.env.get("LINKEDIN_CLIENT_SECRET")?.trim();
const LINKEDIN_ACCESS_TOKEN = Deno.env.get("LINKEDIN_ACCESS_TOKEN")?.trim();

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  specialist_id: string | null;
  specialists?: {
    name: string;
    specialty: string;
  } | null;
}

async function getLinkedInProfile(accessToken: string): Promise<any> {
  const response = await fetch('https://api.linkedin.com/v2/userinfo', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('LinkedIn profile error:', errorText);
    throw new Error(`Failed to get LinkedIn profile: ${response.status}`);
  }
  
  return response.json();
}

async function shareToLinkedIn(accessToken: string, personUrn: string, content: string, url: string): Promise<any> {
  const postBody = {
    author: personUrn,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: {
          text: content,
        },
        shareMediaCategory: 'ARTICLE',
        media: [
          {
            status: 'READY',
            originalUrl: url,
          },
        ],
      },
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
    },
  };

  console.log('Posting to LinkedIn:', JSON.stringify(postBody));

  const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify(postBody),
  });

  const responseText = await response.text();
  console.log('LinkedIn response:', response.status, responseText);

  if (!response.ok) {
    throw new Error(`LinkedIn API error: ${response.status} - ${responseText}`);
  }

  return JSON.parse(responseText);
}

async function saveShareResult(
  supabase: any,
  blogId: string,
  platform: string,
  success: boolean,
  postId?: string,
  error?: string
) {
  const { error: dbError } = await supabase
    .from('social_shares')
    .upsert({
      blog_id: blogId,
      platform: platform,
      status: success ? 'success' : 'failed',
      shared_at: success ? new Date().toISOString() : null,
      post_id: postId || null,
      error_message: error || null,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'blog_id,platform',
    });

  if (dbError) {
    console.error('Error saving share result:', dbError);
  }
}

function createSpecialtySlug(specialty: string): string {
  return specialty
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function createDoctorSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting scheduled LinkedIn share...');
    
    if (!LINKEDIN_ACCESS_TOKEN) {
      console.error('LinkedIn access token not configured');
      return new Response(
        JSON.stringify({ error: 'LinkedIn access token not configured. Please set LINKEDIN_ACCESS_TOKEN secret.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get LinkedIn profile to get person URN
    const profile = await getLinkedInProfile(LINKEDIN_ACCESS_TOKEN);
    const personUrn = `urn:li:person:${profile.sub}`;
    console.log('LinkedIn person URN:', personUrn);

    // Get 1 published blog post that hasn't been shared to LinkedIn yet
    const { data: blogs, error: blogsError } = await supabase
      .from('blog_posts')
      .select(`
        id,
        title,
        slug,
        excerpt,
        specialist_id,
        specialists (
          name,
          specialty
        )
      `)
      .eq('status', 'published')
      .limit(1);

    if (blogsError) {
      console.error('Error fetching blogs:', blogsError);
      throw blogsError;
    }

    if (!blogs || blogs.length === 0) {
      console.log('No published blogs found');
      return new Response(
        JSON.stringify({ message: 'No blogs to share' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Filter out blogs that have already been shared to LinkedIn
    const { data: existingShares } = await supabase
      .from('social_shares')
      .select('blog_id')
      .eq('platform', 'linkedin')
      .eq('status', 'success');

    const sharedBlogIds = new Set((existingShares || []).map(s => s.blog_id));
    const unsharedBlogs = blogs.filter((blog: BlogPost) => !sharedBlogIds.has(blog.id));

    if (unsharedBlogs.length === 0) {
      console.log('All blogs have been shared to LinkedIn');
      return new Response(
        JSON.stringify({ message: 'All blogs already shared to LinkedIn' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results = [];

    // Share only 1 blog post
    const blog = unsharedBlogs[0];
    console.log(`Sharing blog to LinkedIn: ${blog.title}`);

    try {
      // Build blog URL
      let blogUrl = 'https://doktorumol.com.tr/blog';
      if (blog.specialists) {
        const specialtySlug = createSpecialtySlug(blog.specialists.specialty);
        const doctorSlug = createDoctorSlug(blog.specialists.name);
        blogUrl = `https://doktorumol.com.tr/${specialtySlug}/${doctorSlug}/blog/${blog.slug}`;
      }

      // Create post content (LinkedIn allows longer posts)
      let postContent = `📚 ${blog.title}`;
      
      if (blog.excerpt) {
        const maxExcerptLength = 200;
        const truncatedExcerpt = blog.excerpt.length > maxExcerptLength 
          ? blog.excerpt.substring(0, maxExcerptLength) + '...'
          : blog.excerpt;
        postContent += `\n\n${truncatedExcerpt}`;
      }

      if (blog.specialists) {
        postContent += `\n\n✍️ ${blog.specialists.name} - ${blog.specialists.specialty}`;
      }

      postContent += `\n\n#doktorumol #sağlık #uzman`;

      // Share to LinkedIn
      const linkedInResult = await shareToLinkedIn(LINKEDIN_ACCESS_TOKEN, personUrn, postContent, blogUrl);

      await saveShareResult(supabase, blog.id, 'linkedin', true, linkedInResult.id);

      results.push({
        blogId: blog.id,
        title: blog.title,
        platform: 'linkedin',
        success: true,
        postId: linkedInResult.id,
      });

      console.log(`Successfully shared to LinkedIn: ${blog.title}`);
    } catch (error: any) {
      console.error(`Error sharing blog ${blog.id} to LinkedIn:`, error);
      await saveShareResult(supabase, blog.id, 'linkedin', false, undefined, error.message);
      results.push({
        blogId: blog.id,
        title: blog.title,
        platform: 'linkedin',
        success: false,
        error: error.message,
      });
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Scheduled LinkedIn share error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
