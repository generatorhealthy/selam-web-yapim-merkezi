import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DEVTO_API_KEY = Deno.env.get("DEVTO_API_KEY")?.trim();
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")?.trim();
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const DEVTO_API_URL = "https://dev.to/api/articles";
const SITE_URL = "https://doktorumol.com.tr";

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

// AI ile yeniden yaz: benzer ama farklı başlık + tamamen özgün markdown
async function rewriteWithAI(title: string, originalContent: string): Promise<{ title: string; markdown: string; description: string }> {
  const cleanContent = stripHtml(originalContent).substring(0, 8000);

  const systemPrompt = `Sen profesyonel bir sağlık içerik editörüsün. Görevin: verilen blog yazısını TAMAMEN ÖZGÜN şekilde yeniden yazmak. Amaç duplicate content'i önlemek ama aynı bilgiyi farklı kelimelerle aktarmak. Tıbbi/psikolojik doğruluğu koru, Türkçe yaz, profesyonel ve samimi bir ton kullan.`;

  const userPrompt = `Aşağıdaki blog yazısını yeniden yaz:

ORİJİNAL BAŞLIK: ${title}

ORİJİNAL İÇERİK:
${cleanContent}

GÖREV:
1. Yeni başlık üret: orijinale BENZER konuda ama farklı kelimelerle
2. Kısa bir açıklama (description, max 200 karakter)
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
              description: { type: "string", description: "Kısa açıklama (max 200 karakter)" },
              markdown: { type: "string", description: "Markdown formatında yeniden yazılmış içerik" },
            },
            required: ["title", "description", "markdown"],
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
    description: args.description?.substring(0, 200) || "",
    markdown: args.markdown,
  };
}

// DEV.to'ya yayınla
async function publishToDevto(opts: {
  title: string;
  description: string;
  markdown: string;
  canonicalUrl: string;
  coverImage?: string | null;
  tags?: string[];
}): Promise<any> {
  // Markdown'a footer ekle (orijinal kaynağa link / CTA)
  const markdownWithFooter = `${opts.markdown}

---

> **📌 Bu yazının orijinal ve güncel hâli için:** [${opts.canonicalUrl}](${opts.canonicalUrl})
>
> Daha fazla sağlık ve psikoloji içeriği için **[Doktorum Ol](${SITE_URL})** sitemizi ziyaret edin.`;

  // DEV.to tag kuralları: lowercase, alphanumeric, max 4 tag, her biri max 25 karakter
  const cleanTags = (opts.tags || [])
    .map(t => t.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 25))
    .filter(t => t.length > 0)
    .slice(0, 4);
  const finalTags = cleanTags.length > 0 ? cleanTags : ['health', 'wellness'];

  const body: any = {
    article: {
      title: opts.title.substring(0, 250),
      description: opts.description || undefined,
      body_markdown: markdownWithFooter,
      published: true,
      tags: finalTags,
      canonical_url: opts.canonicalUrl,
    },
  };

  if (opts.coverImage) {
    body.article.main_image = opts.coverImage;
  }

  const response = await fetch(DEVTO_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": DEVTO_API_KEY!,
    },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`DEV.to API error [${response.status}]: ${text}`);
  }
  return JSON.parse(text);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('Scheduled DEV.to share started');

  try {
    if (!DEVTO_API_KEY) {
      return new Response(JSON.stringify({ error: 'DEVTO_API_KEY not configured' }), {
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

    const { data: allBlogs } = await supabase
      .from('blog_posts')
      .select('id, title, slug, content, keywords, featured_image')
      .eq('status', 'published')
      .order('created_at', { ascending: true });

    const { data: sharedBlogIds } = await supabase
      .from('social_shares')
      .select('blog_post_id')
      .eq('platform', 'devto')
      .eq('status', 'success');

    const sharedIds = new Set(sharedBlogIds?.map(s => s.blog_post_id) || []);
    const blogsToShare = (allBlogs || [])
      .filter(blog => !sharedIds.has(blog.id))
      .slice(0, 1);

    if (blogsToShare.length === 0) {
      console.log('No unshared blogs found for DEV.to');
      return new Response(JSON.stringify({ message: 'No unshared blogs found', shared: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let successCount = 0;
    let errorCount = 0;

    for (const blog of blogsToShare) {
      try {
        const blogUrl = `${SITE_URL}/blog/${blog.slug}`;
        console.log(`Rewriting and publishing to DEV.to: ${blog.title}`);

        const rewritten = await rewriteWithAI(blog.title, blog.content || '');
        console.log(`AI rewrote title: ${rewritten.title}`);

        const tags = blog.keywords
          ? blog.keywords.split(',').map((k: string) => k.trim()).filter(Boolean).slice(0, 4)
          : ['health', 'wellness'];

        const post = await publishToDevto({
          title: rewritten.title,
          description: rewritten.description,
          markdown: rewritten.markdown,
          canonicalUrl: blogUrl,
          coverImage: blog.featured_image,
          tags,
        });

        console.log('DEV.to post published:', post?.url);

        await supabase
          .from('social_shares')
          .upsert({
            blog_post_id: blog.id,
            platform: 'devto',
            status: 'success',
            shared_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            error_message: null,
          }, {
            onConflict: 'blog_post_id,platform',
          });

        successCount++;
      } catch (err: any) {
        console.error(`Error sharing blog ${blog.id} to DEV.to:`, err.message);

        await supabase
          .from('social_shares')
          .upsert({
            blog_post_id: blog.id,
            platform: 'devto',
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
      message: 'DEV.to scheduled share completed',
      shared: successCount,
      errors: errorCount,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in scheduled-devto-share:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
