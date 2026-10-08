import { Link } from "react-router-dom";
import { MapPin, Video } from "lucide-react";
import { buildLocalPages, localHeading, type LocalPage } from "@/lib/localSeo";

type LocalSpecialist = {
  specialty?: string;
  city?: string;
  online_consultation?: boolean | string;
};

/**
 * Şehir + branş ve online açılış sayfalarına giden bağlantılar.
 * Adresler src/lib/localSeo.js üzerinden üretilir; ön-render edilen HTML ile birebir aynı kalır.
 */
const LocalPagesLinks = <T extends LocalSpecialist>({
  specialists,
  heading = "Şehre göre uzmanlar",
  className = "",
}: {
  specialists: T[];
  heading?: string;
  className?: string;
}) => {
  const pages = buildLocalPages(specialists || []).filter((p) => p.list.length > 0);
  if (pages.length < 2) return null;

  const group = (kind: LocalPage["kind"]) =>
    pages
      .filter((p) => p.kind === kind)
      .sort((a, b) => b.list.length - a.list.length || localHeading(a).localeCompare(localHeading(b), "tr"));

  const online = group("online");
  const cities = group("city");

  const chip = (p: LocalPage) => (
    <Link
      key={p.slug}
      to={`/uzmanlik/${p.slug}`}
      className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1 text-xs text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
    >
      {localHeading(p)}
      <span className="text-muted-foreground">({p.list.length})</span>
    </Link>
  );

  return (
    <section className={`rounded-2xl border border-border bg-card p-4 md:p-5 ${className}`}>
      <h2 className="mb-3 text-sm font-semibold text-foreground">{heading}</h2>
      {online.length > 0 && (
        <div className="mb-4">
          <div className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <Video className="h-3.5 w-3.5" /> Online
          </div>
          <div className="flex flex-wrap gap-2">{online.map(chip)}</div>
        </div>
      )}
      <div>
        <div className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" /> Şehirler
        </div>
        <div className="flex flex-wrap gap-2">{cities.map(chip)}</div>
      </div>
    </section>
  );
};

export default LocalPagesLinks;
