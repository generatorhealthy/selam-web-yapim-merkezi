import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MASTODON_ACCESS_TOKEN = Deno.env.get("MASTODON_ACCESS_TOKEN")?.trim();
const MASTODON_INSTANCE_URL = Deno.env.get("MASTODON_INSTANCE_URL")?.trim()?.replace(/\/+$/, '');
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")?.trim();
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const SITE_URL = "https://doktorumol.com.tr";
const MASTODON_MAX_CHARS = 500;

function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

// AI ile özgün, kısa Mastodon postu üret
async function generateMastodonPost(
  title: string,
  content: string,
  blogUrl: string,
  keywords: string[]
): Promise<string> {
  const cleanContent = stripHtml(content).substring(0, 3000);
  const linkLength = blogUrl.length + 2;
  const reservedForHashtags = 80;
  const maxTextChars = MASTODON_MAX_CHARS - linkLength - reservedForHashtags;

  const systemPrompt = `Sen sağlık ve psikoloji alanında deneyimli, gerçek bir sosyal medya editörüsün — yapay zekâ değil. Konuşur gibi, samimi, doğal yazıyorsun. Klişelere ve yapay AI üslubuna karşısın. Türkçe yazıyorsun.`;

  const userPrompt = `Aşağıdaki blog yazısını Mastodon postu hâline getir:

BAŞLIK: ${title}

İÇERİK ÖZETİ:
${cleanContent}

KURALLAR:
1. POST METNİ MAX ${maxTextChars} KARAKTER (boşluklar dahil — çok önemli!)
2. Kişisel bir gözlem, küçük bir an veya merak uyandırıcı bir soru ile BAŞLA (klişe başlangıç YOK)
3. Konuyu 2-3 doğal, akıcı cümleyle anlat — madde işareti veya liste YOK
4. Şu klişeleri ASLA kullanma: "Sonuç olarak", "Önemlidir ki", "Unutmayın ki", "Özetle", "Kısacası", "Günümüz dünyasında"
5. Sonu okuyucuya yöneltilmiş bir SORU ile bitir (etkileşim için)
6. SONUNA LİNK VEYA HASHTAG EKLEME (sistem otomatik ekleyecek)
7. Sadece düz metin, markdown KULLANMA
8. Başlığı aynen kopyalama, yeniden ifade et`;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`AI generation failed [${response.status}]: ${errText}`);
  }

  const data = await response.json();
  let postText = (data.choices?.[0]?.message?.content || '').trim();

  // Güvenlik: AI limit aşarsa kes
  if (postText.length > maxTextChars) {
    postText = postText.substring(0, maxTextChars - 3) + '...';
  }

  // Hashtag'leri hazırla
  const hashtagPool = ['#sağlık', '#psikoloji', '#doktor', '#terapi', '#wellness', '#sağlıklıyaşam'];
  const userHashtags = keywords
    .map(k => '#' + k.trim().toLowerCase().replace(/[^a-zçğıöşü0-9]/gi, ''))
    .filter(h => h.length > 2 && h.length < 25)
    .slice(0, 2);

  const finalHashtags = [...new Set([...userHashtags, ...hashtagPool])].slice(0, 4).join(' ');

  return `${postText}\n\n🔗 ${blogUrl}\n\n${finalHashtags}`.substring(0, MASTODON_MAX_CHARS);
}

// Mastodon'a post gönder
async function publishToMastodon(status: string): Promise<any> {
  const response = await fetch(`${MASTODON_INSTANCE_URL}/api/v1/statuses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${MASTODON_ACCESS_TOKEN}`,
      "Idempotency-Key": crypto.randomUUID(),
    },
    body: JSON.stringify({
      status,
      visibility: 'public',
      language: 'tr',
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Mastodon API error [${response.status}]: ${errText}`);
  }

  return await response.json();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('Scheduled Mastodon share started');

  try {
    if (!MASTODON_ACCESS_TOKEN || !MASTODON_INSTANCE_URL) {
      return new Response(JSON.stringify({ error: 'Mastodon credentials not configured' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Manuel paylaşım için body'den blog ID al (opsiyonel)
    let specificBlogId: string | null = null;
    if (req.method === 'POST') {
      try {
        const body = await req.json();
        specificBlogId = body?.blog_post_id || null;
      } catch { /* body yok, normal cron çalışması */ }
    }

    let blogsToShare: any[] = [];

    if (specificBlogId) {
      const { data } = await supabase
        .from('blog_posts')
        .select('id, title, slug, content, keywords, featured_image')
        .eq('id', specificBlogId)
        .eq('status', 'published')
        .limit(1);
      blogsToShare = data || [];
    } else {
      const { data: allBlogs } = await supabase
        .from('blog_posts')
        .select('id, title, slug, content, keywords, featured_image')
        .eq('status', 'published')
        .order('created_at', { ascending: true });

      const { data: sharedBlogIds } = await supabase
        .from('social_shares')
        .select('blog_post_id')
        .eq('platform', 'mastodon')
        .eq('status', 'success');

      const sharedIds = new Set(sharedBlogIds?.map(s => s.blog_post_id) || []);
      blogsToShare = (allBlogs || [])
        .filter(blog => !sharedIds.has(blog.id))
        .slice(0, 1);
    }

    if (blogsToShare.length === 0) {
      console.log('No unshared blogs found for Mastodon');
      return new Response(JSON.stringify({ message: 'No unshared blogs found', shared: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let successCount = 0;
    let errorCount = 0;

    for (const blog of blogsToShare) {
      try {
        const blogUrl = `${SITE_URL}/blog/${blog.slug}`;
        console.log(`Generating Mastodon post for: ${blog.title}`);

        const keywords = blog.keywords
          ? blog.keywords.split(',').map((k: string) => k.trim()).filter(Boolean)
          : [];

        const postText = await generateMastodonPost(blog.title, blog.content || '', blogUrl, keywords);
        console.log(`Generated post (${postText.length} chars)`);

        const result = await publishToMastodon(postText);
        console.log('Mastodon post published:', result?.url);

        await supabase
          .from('social_shares')
          .upsert({
            blog_post_id: blog.id,
            platform: 'mastodon',
            status: 'success',
            shared_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            error_message: null,
          }, {
            onConflict: 'blog_post_id,platform',
          });

        successCount++;
      } catch (err: any) {
        console.error(`Error sharing blog ${blog.id} to Mastodon:`, err.message);

        await supabase
          .from('social_shares')
          .upsert({
            blog_post_id: blog.id,
            platform: 'mastodon',
            status: 'failed',
            error_message: err.message?.substring(0, 500) || 'Unknown error',
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'blog_post_id,platform',
          });

        errorCount++;
      }
    }

    return new Response(JSON.stringify({
      message: 'Mastodon scheduled share completed',
      shared: successCount,
      errors: errorCount,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in scheduled-mastodon-share:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
