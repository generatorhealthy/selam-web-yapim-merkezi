import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const HASHNODE_TOKEN = Deno.env.get("HASHNODE_TOKEN")?.trim();
const HASHNODE_HOST = Deno.env.get("HASHNODE_HOST")?.trim() || "doktorumol.hashnode.dev";
let HASHNODE_PUBLICATION_ID = Deno.env.get("HASHNODE_PUBLICATION_ID")?.trim();
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")?.trim();
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const HASHNODE_API_URL = "https://gql.hashnode.com";
const SITE_URL = "https://doktorumol.com.tr";

// HTML'den düz metin çıkar
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

// AI ile içeriği yeniden yaz (özgün, başlığı benzer ama farklı)
async function rewriteWithAI(title: string, originalContent: string, blogUrl: string): Promise<{ title: string; markdown: string; subtitle: string }> {
  const cleanContent = stripHtml(originalContent).substring(0, 8000);

  const systemPrompt = `Sen profesyonel bir sağlık içerik editörüsün. Görevin: verilen blog yazısını TAMAMEN ÖZGÜN şekilde yeniden yazmak. Amaç duplicate content'i önlemek ama aynı bilgiyi farklı kelimelerle aktarmak. Tıbbi/psikolojik doğruluğu koru, Türkçe yaz, profesyonel ve samimi bir ton kullan.`;

  const userPrompt = `Aşağıdaki blog yazısını yeniden yaz:

ORİJİNAL BAŞLIK: ${title}

ORİJİNAL İÇERİK:
${cleanContent}

GÖREV:
1. Yeni başlık üret: orijinale BENZER konuda ama farklı kelimelerle (örn: "Depresyon Belirtileri" → "Depresyonun İlk İşaretleri Nelerdir?")
2. Kısa bir alt başlık (subtitle) yaz (max 150 karakter)
3. İçeriği MARKDOWN formatında yeniden yaz: minimum 600 kelime, ## başlıklarla bölümlendirilmiş, paragraflar farklı yapıda olmalı
4. Aynı bilgiyi içersin ama farklı cümle yapıları, farklı örnekler, farklı başlıklarla
5. Sonuna ASLA link/CTA ekleme (sistem otomatik ekleyecek)`;

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
      tools: [{
        type: "function",
        function: {
          name: "publish_rewritten_blog",
          description: "Yeniden yazılmış blog içeriği",
          parameters: {
            type: "object",
            properties: {
              title: { type: "string", description: "Yeni başlık" },
              subtitle: { type: "string", description: "Alt başlık (max 150 karakter)" },
              markdown: { type: "string", description: "Markdown formatında yeniden yazılmış içerik" },
            },
            required: ["title", "subtitle", "markdown"],
            additionalProperties: false,
          },
        },
      }],
      tool_choice: { type: "function", function: { name: "publish_rewritten_blog" } },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`AI rewrite failed [${response.status}]: ${errText}`);
  }

  const data = await response.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall) {
    throw new Error("AI did not return structured output");
  }

  const args = JSON.parse(toolCall.function.arguments);
  return {
    title: args.title,
    subtitle: args.subtitle?.substring(0, 150) || "",
    markdown: args.markdown,
  };
}

// Hashnode'a yazıyı gönder
async function publishToHashnode(opts: {
  title: string;
  subtitle: string;
  markdown: string;
  canonicalUrl: string;
  coverImage?: string | null;
  tags?: string[];
}): Promise<any> {
  // Markdown'a footer ekle (orijinal kaynağa link)
  const markdownWithFooter = `${opts.markdown}

---

> **📌 Bu yazının orijinal ve güncel hâli için:** [${opts.canonicalUrl}](${opts.canonicalUrl})
>
> Daha fazla sağlık ve psikoloji içeriği için **[Doktorum Ol](${SITE_URL})** sitemizi ziyaret edin.`;

  // Hashnode tag formatı: { name, slug }
  const tagsInput = (opts.tags || []).slice(0, 5).map(t => ({
    slug: t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').substring(0, 50) || 'saglik',
    name: t.substring(0, 50),
  }));

  const mutation = `
    mutation PublishPost($input: PublishPostInput!) {
      publishPost(input: $input) {
        post {
          id
          slug
          url
        }
      }
    }
  `;

  const variables: any = {
    input: {
      title: opts.title.substring(0, 250),
      subtitle: opts.subtitle || undefined,
      publicationId: HASHNODE_PUBLICATION_ID,
      contentMarkdown: markdownWithFooter,
      tags: tagsInput.length > 0 ? tagsInput : [{ slug: 'health', name: 'Health' }],
      originalArticleURL: opts.canonicalUrl, // Hashnode'un canonical/orijinal URL alanı
    },
  };

  if (opts.coverImage) {
    variables.input.coverImageOptions = { coverImageURL: opts.coverImage };
  }

  const response = await fetch(HASHNODE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": HASHNODE_TOKEN!,
    },
    body: JSON.stringify({ query: mutation, variables }),
  });

  const result = await response.json();

  if (result.errors) {
    throw new Error(`Hashnode API error: ${JSON.stringify(result.errors)}`);
  }

  return result.data?.publishPost?.post;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('Scheduled Hashnode share started');

  try {
    if (!HASHNODE_TOKEN || !HASHNODE_PUBLICATION_ID) {
      return new Response(JSON.stringify({ error: 'Hashnode credentials not configured' }), {
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

    // Henüz Hashnode'a paylaşılmamış 1 blog bul
    const { data: allBlogs } = await supabase
      .from('blog_posts')
      .select('id, title, slug, content, keywords, featured_image')
      .eq('status', 'published')
      .order('created_at', { ascending: true });

    const { data: sharedBlogIds } = await supabase
      .from('social_shares')
      .select('blog_post_id')
      .eq('platform', 'hashnode')
      .eq('status', 'success');

    const sharedIds = new Set(sharedBlogIds?.map(s => s.blog_post_id) || []);
    const blogsToShare = (allBlogs || [])
      .filter(blog => !sharedIds.has(blog.id))
      .slice(0, 1);

    if (blogsToShare.length === 0) {
      console.log('No unshared blogs found for Hashnode');
      return new Response(JSON.stringify({ message: 'No unshared blogs found', shared: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let successCount = 0;
    let errorCount = 0;

    for (const blog of blogsToShare) {
      try {
        const blogUrl = `${SITE_URL}/blog/${blog.slug}`;
        console.log(`Rewriting and publishing to Hashnode: ${blog.title}`);

        // 1) AI ile yeniden yaz
        const rewritten = await rewriteWithAI(blog.title, blog.content || '', blogUrl);
        console.log(`AI rewrote title: ${rewritten.title}`);

        // 2) Etiketler
        const tags = blog.keywords
          ? blog.keywords.split(',').map((k: string) => k.trim()).filter(Boolean).slice(0, 5)
          : ['Saglik', 'Psikoloji'];

        // 3) Hashnode'a publish et
        const post = await publishToHashnode({
          title: rewritten.title,
          subtitle: rewritten.subtitle,
          markdown: rewritten.markdown,
          canonicalUrl: blogUrl,
          coverImage: blog.featured_image,
          tags,
        });

        console.log('Hashnode post published:', post?.url);

        await supabase
          .from('social_shares')
          .upsert({
            blog_post_id: blog.id,
            platform: 'hashnode',
            status: 'success',
            shared_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            error_message: null,
          }, {
            onConflict: 'blog_post_id,platform',
          });

        successCount++;
      } catch (err: any) {
        console.error(`Error sharing blog ${blog.id} to Hashnode:`, err.message);

        await supabase
          .from('social_shares')
          .upsert({
            blog_post_id: blog.id,
            platform: 'hashnode',
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
      message: 'Hashnode scheduled share completed',
      shared: successCount,
      errors: errorCount,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in scheduled-hashnode-share:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
