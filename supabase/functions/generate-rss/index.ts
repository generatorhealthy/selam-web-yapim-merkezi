import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const SITE_URL = 'https://doktorumol.com.tr';

function escapeXml(unsafe: string): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function stripHtml(html: string): string {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

function formatRfc822Date(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toUTCString();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Son 100 yayınlanmış blog yazısını çek
    const { data: posts, error } = await supabase
      .from('blog_posts')
      .select('id, title, slug, excerpt, content, featured_image, published_at, created_at, keywords, author_name')
      .eq('status', 'published')
      .order('published_at', { ascending: false, nullsFirst: false })
      .limit(100);

    if (error) {
      console.error('Error fetching blog posts:', error);
      throw error;
    }

    const buildDate = formatRfc822Date(new Date());
    const items = (posts || []).map((post: any) => {
      const url = `${SITE_URL}/blog/${post.slug}`;
      const pubDate = formatRfc822Date(post.published_at || post.created_at);
      const description = post.excerpt || stripHtml(post.content || '').substring(0, 300);
      const imageUrl = post.featured_image
        ? (post.featured_image.startsWith('http') ? post.featured_image : `${SITE_URL}${post.featured_image}`)
        : '';
      const categories = (post.keywords || '')
        .split(',')
        .map((k: string) => k.trim())
        .filter(Boolean)
        .map((k: string) => `      <category>${escapeXml(k)}</category>`)
        .join('\n');

      return `    <item>
      <title>${escapeXml(post.title || '')}</title>
      <link>${escapeXml(url)}</link>
      <guid isPermaLink="true">${escapeXml(url)}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXml(description)}</description>
      ${imageUrl ? `<enclosure url="${escapeXml(imageUrl)}" type="image/jpeg" />
      <media:content url="${escapeXml(imageUrl)}" medium="image" />` : ''}
      ${post.author_name ? `<dc:creator>${escapeXml(post.author_name)}</dc:creator>` : ''}
${categories}
    </item>`;
    }).join('\n');

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>Doktorum Ol - Sağlık Blog</title>
    <link>${SITE_URL}</link>
    <atom:link href="${SITE_URL}/feed/" rel="self" type="application/rss+xml" />
    <description>Uzmanlarımızdan sağlık, psikoloji ve danışmanlık üzerine güncel yazılar</description>
    <language>tr-TR</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
    <generator>Doktorum Ol RSS Generator</generator>
    <image>
      <url>${SITE_URL}/logo.webp</url>
      <title>Doktorum Ol</title>
      <link>${SITE_URL}</link>
    </image>
${items}
  </channel>
</rss>`;

    return new Response(rss, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
      status: 200,
    });
  } catch (error: any) {
    console.error('Error generating RSS:', error);
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><error>${escapeXml(error.message || 'Unknown error')}</error>`,
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/xml' },
      }
    );
  }
});
