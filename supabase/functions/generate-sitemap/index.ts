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

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('Starting sitemap generation...')

    // Fetch published blogs from both tables
    const [blogsRes, blogPostsRes] = await Promise.all([
      supabase
        .from('blogs')
        .select('slug, updated_at, created_at')
        .eq('status', 'published'),
      supabase
        .from('blog_posts')
        .select('slug, published_at, created_at')
        .eq('status', 'published')
    ])

    // Fetch active specialists
    const specialistsRes = await supabase
      .from('specialists')
      .select('name, specialty, updated_at')
      .eq('is_active', true)

    if (blogsRes.error || blogPostsRes.error || specialistsRes.error) {
      console.error('Error fetching data:', {
        blogsError: blogsRes.error,
        blogPostsError: blogPostsRes.error,
        specialistsError: specialistsRes.error
      })
      throw new Error('Failed to fetch data for sitemap')
    }

    // Combine and deduplicate blog entries
    const blogEntries = new Map<string, BlogEntry>()
    
    // Add from blogs table
    ;(blogsRes.data || []).forEach((blog: any) => {
      blogEntries.set(blog.slug, {
        slug: blog.slug,
        updated_at: blog.updated_at,
        created_at: blog.created_at
      })
    })

    // Add from blog_posts table (merge if exists)
    ;(blogPostsRes.data || []).forEach((post: any) => {
      const existing = blogEntries.get(post.slug)
      if (!existing) {
        blogEntries.set(post.slug, {
          slug: post.slug,
          updated_at: post.published_at || post.created_at,
          created_at: post.published_at || post.created_at
        })
      } else {
        // Update with latest information
        blogEntries.set(post.slug, {
          ...existing,
          updated_at: post.published_at || existing.updated_at,
        })
      }
    })

    const specialists = specialistsRes.data || []
    const blogs = Array.from(blogEntries.values())

    console.log(`Found ${blogs.length} blog posts and ${specialists.length} specialists`)

    // Generate Turkish slug helper
    const generateSlug = (text: string): string => {
      return text.toLowerCase()
        .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
        .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
        .replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
    }

    const currentDate = new Date().toISOString().split('T')[0]

    // Generate sitemap XML
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
    <changefreq>weekly</changefreq>
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
    <loc>https://doktorumol.com.tr/uzmanlik/egitim-danismanligi</loc>
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
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://doktorumol.com.tr/yazilar/${blog.slug}</loc>
    <lastmod>${new Date(blog.updated_at).toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`).join('\n')}

  <!-- Uzman Profilleri -->
${specialists.map((specialist: SpecialistEntry) => {
    const specialtySlug = generateSlug(specialist.specialty)
    const nameSlug = generateSlug(specialist.name)
    
    return `  <url>
    <loc>https://doktorumol.com.tr/${specialtySlug}/${nameSlug}</loc>
    <lastmod>${new Date(specialist.updated_at).toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`
  }).join('\n')}

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

    console.log('Generated sitemap, uploading to storage...')

    // Upload to storage bucket
    const { error: uploadError } = await supabase.storage
      .from('legal-documents')
      .upload('sitemap.xml', new Blob([sitemap], { type: 'application/xml' }), {
        upsert: true,
        contentType: 'application/xml'
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      throw uploadError
    }

    console.log('Sitemap uploaded successfully')

    // Background task to ping Google to update sitemap
    EdgeRuntime.waitUntil(
      (async () => {
        try {
          // Ping Google Search Console about sitemap update
          const pingUrl = `https://www.google.com/ping?sitemap=https://doktorumol.com.tr/sitemap.xml`
          const response = await fetch(pingUrl)
          console.log('Google ping response:', response.status)
        } catch (error) {
          console.error('Failed to ping Google:', error)
        }
      })()
    )

    return new Response(
      JSON.stringify({
        message: 'Sitemap generated and uploaded successfully',
        stats: {
          blogs: blogs.length,
          specialists: specialists.length,
          totalUrls: blogs.length * 2 + specialists.length + 13 // 2 per blog + specialists + static pages
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
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})