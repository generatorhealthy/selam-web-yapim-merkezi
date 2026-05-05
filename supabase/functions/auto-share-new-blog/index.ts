import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

/**
 * Yeni blog yayınlandığında 4 platforma paralel paylaşım yapar:
 * - LinkedIn (share-blog-to-social)
 * - Tumblr   (share-blog-to-social)
 * - Mastodon (scheduled-mastodon-share, blog_post_id ile)
 * - Hashnode (scheduled-hashnode-share, blog_post_id ile)
 *
 * Hızlı SEO indeksleme için tetiklenir (DB trigger ile).
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const blogId = body?.blog_post_id || body?.blogId;

    if (!blogId) {
      return new Response(JSON.stringify({ error: 'blog_post_id required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[auto-share-new-blog] Triggered for blog: ${blogId}`);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Blog verisini çek
    const { data: blog, error: blogErr } = await supabase
      .from('blog_posts')
      .select('id, title, slug, content, keywords, featured_image, status')
      .eq('id', blogId)
      .maybeSingle();

    if (blogErr || !blog) {
      console.error('Blog not found:', blogErr);
      return new Response(JSON.stringify({ error: 'Blog not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (blog.status !== 'published') {
      console.log(`Blog ${blogId} is not published (status=${blog.status}), skipping`);
      return new Response(JSON.stringify({ message: 'Not published, skipped' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const sharePayload = {
      blogId: blog.id,
      blogTitle: blog.title,
      blogSlug: blog.slug,
      blogContent: blog.content,
      featuredImage: blog.featured_image,
      keywords: blog.keywords,
    };

    // 4 platforma paralel istek (fire-and-forget değil; sonuçları topla)
    const tasks = [
      // LinkedIn
      supabase.functions.invoke('share-blog-to-social', {
        body: { ...sharePayload, platform: 'linkedin' },
      }).then(r => ({ platform: 'linkedin', ok: !r.error, error: r.error?.message }))
        .catch(e => ({ platform: 'linkedin', ok: false, error: String(e) })),

      // Tumblr
      supabase.functions.invoke('share-blog-to-social', {
        body: { ...sharePayload, platform: 'tumblr' },
      }).then(r => ({ platform: 'tumblr', ok: !r.error, error: r.error?.message }))
        .catch(e => ({ platform: 'tumblr', ok: false, error: String(e) })),

      // Mastodon
      supabase.functions.invoke('scheduled-mastodon-share', {
        body: { blog_post_id: blog.id },
      }).then(r => ({ platform: 'mastodon', ok: !r.error, error: r.error?.message }))
        .catch(e => ({ platform: 'mastodon', ok: false, error: String(e) })),

      // Hashnode
      supabase.functions.invoke('scheduled-hashnode-share', {
        body: { blog_post_id: blog.id },
      }).then(r => ({ platform: 'hashnode', ok: !r.error, error: r.error?.message }))
        .catch(e => ({ platform: 'hashnode', ok: false, error: String(e) })),
    ];

    const results = await Promise.all(tasks);
    console.log('[auto-share-new-blog] Results:', JSON.stringify(results));

    return new Response(JSON.stringify({ success: true, blog_id: blog.id, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('[auto-share-new-blog] Error:', e);
    return new Response(JSON.stringify({ error: e?.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
