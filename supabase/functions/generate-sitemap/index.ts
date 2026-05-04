import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BlogEntry {
  slug: string;
  updated_at: string;
  created_at: string;
}

interface SpecialistEntry {
  name: string;
  specialty: string;
  updated_at: string;
}

const PAGE_SIZE = 1000

async function fetchAllRows(
  supabase: any,
  table: string,
  columns: string,
  applyFilters: (query: any) => any,
) {
  const allRows: any[] = []
  let from = 0

  while (true) {
    const query = applyFilters(
      supabase
        .from(table)
        .select(columns)
        .range(from, from + PAGE_SIZE - 1),
    )

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to fetch ${table}: ${error.message}`)
    }

    allRows.push(...(data || []))

    if (!data || data.length < PAGE_SIZE) {
      break
    }

    from += PAGE_SIZE
  }

  return allRows
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check if XML format requested (for direct sitemap serving)
    const url = new URL(req.url)
    const format = url.searchParams.get('format')

    console.log('Starting sitemap generation...')

    // Fetch published blogs from both tables. Supabase returns max 1000 rows by default,
    // so paginate to keep sitemap complete as blog/test/specialist counts grow.
    const [blogsData, blogPostsData, specialistsData, testsData] = await Promise.all([
      fetchAllRows(supabase, 'blogs', 'slug, updated_at, created_at', (query) =>
        query.eq('status', 'published')
      ),
      fetchAllRows(supabase, 'blog_posts', 'slug, published_at, created_at, updated_at', (query) =>
        query.eq('status', 'published')
      ),
      fetchAllRows(supabase, 'specialists', 'name, specialty, slug, updated_at', (query) =>
        query.eq('is_active', true)
      ),
      fetchAllRows(supabase, 'tests', 'id, updated_at', (query) =>
        query.eq('is_active', true).eq('status', 'published')
      ),
    ])

    // Combine and deduplicate blog entries
    const blogEntries = new Map<string, BlogEntry>()
    
    ;(blogsData || []).forEach((blog: any) => {
      blogEntries.set(blog.slug, {
        slug: blog.slug,
        updated_at: blog.updated_at,
        created_at: blog.created_at
      })
    })

    ;(blogPostsData || []).forEach((post: any) => {
      const existing = blogEntries.get(post.slug)
      if (!existing) {
        blogEntries.set(post.slug, {
          slug: post.slug,
          updated_at: post.updated_at || post.published_at || post.created_at,
          created_at: post.published_at || post.created_at
        })
      } else {
        blogEntries.set(post.slug, {
          ...existing,
          updated_at: post.updated_at || post.published_at || existing.updated_at,
        })
      }
    })

    const specialists = specialistsData || []
    const blogs = Array.from(blogEntries.values())

    console.log(`Found ${blogs.length} blog posts and ${specialists.length} specialists`)

    const generateSlug = (text: string): string => {
      return text.toLowerCase()
        .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
        .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
        .replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
    }

    const currentDate = new Date().toISOString().split('T')[0]

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Ana Sayfalar -->
  <url>
    <loc>https://doktorumol.com.tr/</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://doktorumol.com.tr/hakkimizda</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://doktorumol.com.tr/iletisim</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://doktorumol.com.tr/blog</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://doktorumol.com.tr/paketler</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://doktorumol.com.tr/uzmanlar</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>

  <!-- Uzman Kategorileri -->
  <url>
    <loc>https://doktorumol.com.tr/uzmanlik/aile-danismani</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://doktorumol.com.tr/uzmanlik/cildiye</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://doktorumol.com.tr/uzmanlik/dil-ve-konusma-terapisti</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://doktorumol.com.tr/uzmanlik/diyetisyen</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://doktorumol.com.tr/uzmanlik/egitim-danismanligi</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://doktorumol.com.tr/uzmanlik/fizyoterapist</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://doktorumol.com.tr/uzmanlik/iliski-danismani</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://doktorumol.com.tr/uzmanlik/kadin-dogum</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://doktorumol.com.tr/uzmanlik/psikolog</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://doktorumol.com.tr/uzmanlik/psikolojik-danismanlik</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>

  <!-- Blog Yazıları -->
${blogs.map(blog => `  <url>
    <loc>https://doktorumol.com.tr/blog/${blog.slug}</loc>
    <lastmod>${new Date(blog.updated_at).toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`).join('\n')}

  <!-- Uzman Profilleri -->
${specialists.map((specialist: any) => {
    const specialtySlug = generateSlug(specialist.specialty)
    // DB'deki slug kolonu öncelikli (isim değişse bile sabit)
    const nameSlug = specialist.slug || generateSlug(specialist.name)
    
    return `  <url>
    <loc>https://doktorumol.com.tr/${specialtySlug}/${nameSlug}</loc>
    <lastmod>${new Date(specialist.updated_at).toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`
  }).join('\n')}

  <!-- Testler -->
${(testsRes.data || []).map((t: any) => `  <url>
    <loc>https://doktorumol.com.tr/test/${t.id}</loc>
    <lastmod>${new Date(t.updated_at).toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`).join('\n')}

  <!-- Yasal Sayfalar -->
  <url>
    <loc>https://doktorumol.com.tr/gizlilik-politikasi</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>https://doktorumol.com.tr/aydinlatma-metni</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>https://doktorumol.com.tr/mesafeli-satis-sozlesmesi</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>https://doktorumol.com.tr/ziyaretci-danisan-sozlesmesi</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>https://doktorumol.com.tr/yorum-kurallari</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
</urlset>`

    console.log('Generated sitemap with', blogs.length, 'blogs and', specialists.length, 'specialists')

    // If XML format requested, return XML directly (for crawlers)
    // Cache yok — yeni içerik anında yansısın
    if (format === 'xml') {
      return new Response(sitemap, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/xml; charset=utf-8',
          'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
        status: 200
      })
    }

    // Upload to storage bucket for backup
    const { error: uploadError } = await supabase.storage
      .from('legal-documents')
      .upload('sitemap.xml', new Blob([sitemap], { type: 'application/xml' }), {
        upsert: true,
        contentType: 'application/xml'
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
    }

    // IndexNow ile arama motorlarına haber ver (Google ping endpoint'i 2023'te kapatıldı,
    // sitemap güncellenince Google Search Console üzerinden zaten yeniden taranır.)
    ;(globalThis as any).EdgeRuntime?.waitUntil(
      (async () => {
        try {
          await fetch(`${supabaseUrl}/functions/v1/notify-search-engines`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({ urls: ['https://doktorumol.com.tr/sitemap.xml'] }),
          })
        } catch (error) {
          console.error('Failed to notify search engines:', error)
        }
      })()
    )

    return new Response(
      JSON.stringify({
        message: 'Sitemap generated successfully',
        sitemapXml: sitemap,
        stats: {
          blogs: blogs.length,
          specialists: specialists.length,
          totalUrls: blogs.length + specialists.length + 15
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Error generating sitemap:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
