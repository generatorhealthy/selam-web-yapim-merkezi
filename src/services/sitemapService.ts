import { supabase } from "@/integrations/supabase/client";

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

export const generateSitemap = async (): Promise<string> => {
  try {
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
    ]);

    // Fetch active specialists
    const specialistsRes = await supabase
      .from('specialists')
      .select('name, specialty, updated_at')
      .eq('is_active', true);

    if (blogsRes.error || blogPostsRes.error || specialistsRes.error) {
      console.error('Error fetching data for sitemap:', {
        blogsError: blogsRes.error,
        blogPostsError: blogPostsRes.error,
        specialistsError: specialistsRes.error
      });
      throw new Error('Failed to fetch data for sitemap');
    }

    // Combine and deduplicate blog entries
    const blogEntries = new Map<string, BlogEntry>();
    
    // Add from blogs table
    (blogsRes.data || []).forEach((blog: any) => {
      blogEntries.set(blog.slug, {
        slug: blog.slug,
        updated_at: blog.updated_at,
        created_at: blog.created_at
      });
    });

    // Add from blog_posts table (merge if exists)
    (blogPostsRes.data || []).forEach((post: any) => {
      const existing = blogEntries.get(post.slug);
      if (!existing) {
        blogEntries.set(post.slug, {
          slug: post.slug,
          updated_at: post.published_at || post.created_at,
          created_at: post.published_at || post.created_at
        });
      } else {
        // Update with latest information
        blogEntries.set(post.slug, {
          ...existing,
          updated_at: post.published_at || existing.updated_at,
        });
      }
    });

    const specialists = specialistsRes.data || [];
    const blogs = Array.from(blogEntries.values());

    // Generate sitemap XML
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Ana Sayfalar -->
  <url>
    <loc>https://doktorumol.com.tr/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://doktorumol.com.tr/hakkimizda</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://doktorumol.com.tr/iletisim</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://doktorumol.com.tr/blog</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://doktorumol.com.tr/paketler</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://doktorumol.com.tr/uzmanlar</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>

  <!-- Uzman Kategorileri -->
  <url>
    <loc>https://doktorumol.com.tr/uzmanlik/aile-danismani</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://doktorumol.com.tr/uzmanlik/cildiye</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://doktorumol.com.tr/uzmanlik/dil-ve-konusma-terapisti</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://doktorumol.com.tr/uzmanlik/egitim-danismanligi</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://doktorumol.com.tr/uzmanlik/iliski-danismani</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://doktorumol.com.tr/uzmanlik/kadin-dogum</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://doktorumol.com.tr/uzmanlik/psikolog</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://doktorumol.com.tr/uzmanlik/psikolojik-danismanlik</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>

  <!-- Blog Yazıları -->
${blogs.map(blog => `  <url>
    <loc>https://doktorumol.com.tr/blog/${blog.slug}</loc>
    <lastmod>${new Date(blog.updated_at).toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`).join('\n')}

  <!-- Uzman Profilleri -->
${specialists.map((specialist: SpecialistEntry) => {
    // Convert specialist name and specialty to URL-friendly slugs
    const specialtySlug = specialist.specialty.toLowerCase()
      .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
      .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
      .replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    
    const nameSlug = specialist.name.toLowerCase()
      .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
      .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
      .replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    
    return `  <url>
    <loc>https://doktorumol.com.tr/${specialtySlug}/${nameSlug}</loc>
    <lastmod>${new Date(specialist.updated_at).toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`;
  }).join('\n')}

  <!-- Yasal Sayfalar -->
  <url>
    <loc>https://doktorumol.com.tr/gizlilik-politikasi</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>https://doktorumol.com.tr/aydinlatma-metni</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>https://doktorumol.com.tr/mesafeli-satis-sozlesmesi</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>https://doktorumol.com.tr/ziyaretci-danisan-sozlesmesi</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>https://doktorumol.com.tr/yorum-kurallari</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
</urlset>`;

    return sitemap;
  } catch (error) {
    console.error('Error generating sitemap:', error);
    throw error;
  }
};

export const downloadSitemap = async () => {
  try {
    const sitemapContent = await generateSitemap();
    
    // Create and download file
    const blob = new Blob([sitemapContent], { type: 'application/xml' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sitemap.xml';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading sitemap:', error);
    throw error;
  }
};