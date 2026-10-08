import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { MapPin, Video, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { createSpecialtySlug } from "@/utils/doctorUtils";
import { buildLocalPages, localDescription, localFaq, localHeading, localTitle, type LocalPage } from "@/lib/localSeo";
import { HorizontalNavigation } from "@/components/HorizontalNavigation";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type S = {
  id: string; name: string; specialty: string; city: string; slug?: string; bio?: string;
  profile_picture?: string; online_consultation?: boolean; face_to_face_consultation?: boolean;
};
const SITE = "https://doktorumol.com.tr";

const LocalSpecialtyPage = () => {
  const { specialty: slug = "" } = useParams();
  const [all, setAll] = useState<S[] | null>(null);

  useEffect(() => {
    supabase.rpc("get_public_specialists").then(({ data }) => setAll((data as S[]) || []));
  }, []);

  const pages = useMemo(() => (all ? buildLocalPages<S>(all) : []), [all]);
  const page = pages.find((p) => p.slug === slug) as LocalPage<S> | undefined;
  const url = `${SITE}/uzmanlik/${slug}`;

  if (!all) {
    return (
      <div className="min-h-screen bg-background">
        <HorizontalNavigation />
        <div className="container mx-auto px-4 py-12 space-y-4">
          <div className="h-8 w-64 bg-muted rounded animate-pulse" />
          <div className="h-24 bg-muted rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="min-h-screen bg-background">
        <Helmet><title>Uzman bulunamadı | Doktorum Ol</title><meta name="robots" content="noindex, follow" /></Helmet>
        <HorizontalNavigation />
        <div className="container mx-auto px-4 py-16 text-center">
          <p className="text-muted-foreground mb-4">Bu bölgede şu an uzman bulunmuyor.</p>
          <Button asChild><Link to="/uzmanlar">Tüm uzmanları gör</Link></Button>
        </div>
        <Footer />
      </div>
    );
  }

  const title = localTitle(page);
  const description = localDescription(page);
  const faq = localFaq(page);
  const sameBranch = pages.filter((p) => p.branch.slug === page.branch.slug && p.slug !== page.slug);
  const sameCity = page.city ? pages.filter((p) => p.city?.slug === page.city!.slug && p.slug !== page.slug) : [];
  const online = page.kind === "city" ? pages.find((p) => p.slug === `online-${page.branch.slug}`) : undefined;

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={url} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={url} />
      </Helmet>
      <HorizontalNavigation />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <nav className="text-sm text-muted-foreground mb-4">
          <Link to="/">Ana Sayfa</Link> › <Link to="/uzmanlar">Uzmanlar</Link> ›{" "}
          <Link to={`/uzmanlik/${page.branch.slug}`}>{page.branch.name}</Link> › {localHeading(page)}
        </nav>
        <h1 className="text-3xl font-bold text-foreground mb-3">{localHeading(page)}</h1>
        <p className="text-muted-foreground mb-2">{description}</p>
        <p className="text-foreground/80 mb-8">{page.branch.about}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {page.list.map((s) => (
            <Card key={s.id}>
              <CardContent className="p-5">
                <Link to={`/${createSpecialtySlug(s.specialty)}/${s.slug}`} className="flex gap-4">
                  {s.profile_picture && <img src={s.profile_picture} alt={s.name} loading="lazy" className="w-16 h-16 rounded-lg object-cover" />}
                  <div>
                    <h2 className="font-semibold text-lg text-foreground">{s.name}</h2>
                    <Badge variant="secondary" className="text-xs my-1">{s.specialty}</Badge>
                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                      {s.city && <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{s.city}</span>}
                      {s.online_consultation && <span className="flex items-center gap-1"><Video className="w-4 h-4" />Online</span>}
                      {s.face_to_face_consultation !== false && <span className="flex items-center gap-1"><Users className="w-4 h-4" />Yüz yüze</span>}
                    </div>
                  </div>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Sıkça Sorulan Sorular</h2>
          <div className="space-y-4">
            {faq.map(([q, a]) => (
              <div key={q}><h3 className="font-medium text-foreground">{q}</h3><p className="text-muted-foreground">{a}</p></div>
            ))}
          </div>
        </section>

        {(online || sameCity.length > 0 || sameBranch.length > 0) && (
          <section className="mb-8 text-sm">
            {online && <p className="mb-3">Şehir fark etmeksizin: <Link className="text-primary underline" to={`/uzmanlik/${online.slug}`}>Online {page.branch.name}</Link></p>}
            {sameCity.length > 0 && (
              <p className="mb-3">{page.city!.name} şehrindeki diğer branşlar:{" "}
                {sameCity.map((p, i) => <span key={p.slug}>{i > 0 && ", "}<Link className="text-primary underline" to={`/uzmanlik/${p.slug}`}>{p.branch.name}</Link></span>)}</p>
            )}
            {sameBranch.length > 0 && (
              <p>Diğer şehirlerde {page.branch.name.toLocaleLowerCase("tr")}:{" "}
                {sameBranch.map((p, i) => <span key={p.slug}>{i > 0 && ", "}<Link className="text-primary underline" to={`/uzmanlik/${p.slug}`}>{localHeading(p)}</Link></span>)}</p>
            )}
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default LocalSpecialtyPage;
