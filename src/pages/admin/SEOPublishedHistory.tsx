import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ExternalLink, FileText, Calendar } from "lucide-react";
import { Helmet } from "react-helmet-async";

interface PublishedItem {
  id: string;
  main_keyword: string;
  generated_at: string;
  branch_name: string | null;
  post_slug: string | null;
  post_title: string | null;
}

const SEOPublishedHistory = () => {
  const [items, setItems] = useState<PublishedItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("seo_keywords")
      .select("id, main_keyword, generated_at, seo_branches(name), blog_posts(slug, title)")
      .eq("content_status", "published")
      .order("generated_at", { ascending: false })
      .limit(2000);
    if (error) {
      console.error(error);
      setItems([]);
    } else {
      const mapped: PublishedItem[] = (data || []).map((r: any) => ({
        id: r.id,
        main_keyword: r.main_keyword,
        generated_at: r.generated_at,
        branch_name: r.seo_branches?.name ?? null,
        post_slug: r.blog_posts?.slug ?? null,
        post_title: r.blog_posts?.title ?? null,
      }));
      setItems(mapped);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  // Group by date (YYYY-MM-DD in local TR time)
  const groups = items.reduce<Record<string, PublishedItem[]>>((acc, it) => {
    if (!it.generated_at) return acc;
    const d = new Date(it.generated_at);
    const key = d.toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      weekday: "long",
    });
    (acc[key] = acc[key] || []).push(it);
    return acc;
  }, {});

  const sortedDates = Object.keys(groups);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <Helmet><title>Yayınlanan SEO İçerikleri | Admin</title></Helmet>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Link to="/divan_paneli/seo-content">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-1" /> Geri Dön
              </Button>
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold">📅 Yayınlanan İçerikler</h1>
          </div>
          <Badge variant="secondary" className="text-sm">
            Toplam: {items.length}
          </Badge>
        </div>

        {loading ? (
          <Card className="p-8 animate-pulse text-center text-muted-foreground">Yükleniyor...</Card>
        ) : items.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">Henüz yayınlanan içerik yok.</Card>
        ) : (
          <div className="space-y-6">
            {sortedDates.map((date) => (
              <div key={date}>
                <div className="flex items-center gap-2 mb-3 sticky top-0 bg-background/95 backdrop-blur py-2 z-10">
                  <Calendar className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">{date}</h2>
                  <Badge variant="outline">{groups[date].length} içerik</Badge>
                </div>
                <div className="grid gap-2">
                  {groups[date].map((it) => (
                    <Card key={it.id} className="p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="font-medium truncate">
                              {it.post_title || it.main_keyword}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                            {it.branch_name && (
                              <Badge variant="secondary" className="text-xs">{it.branch_name}</Badge>
                            )}
                            <span>Anahtar: {it.main_keyword}</span>
                            <span>•</span>
                            <span>
                              {new Date(it.generated_at).toLocaleTimeString("tr-TR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>
                        {it.post_slug && (
                          <a
                            href={`/blog/${it.post_slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button variant="outline" size="sm">
                              Görüntüle <ExternalLink className="h-3 w-3 ml-1" />
                            </Button>
                          </a>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SEOPublishedHistory;
