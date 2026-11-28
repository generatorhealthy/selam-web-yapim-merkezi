import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronDown, MapPin, Monitor, Search, Users } from "lucide-react";
import { cities, popularSpecialties } from "./data";

export default function SearchCard() {
  const [type, setType] = useState<"online" | "yüzyüze">("online");
  const [specialty, setSpecialty] = useState("");
  const [city, setCity] = useState("");

  const href = useMemo(() => {
    const params = new URLSearchParams({ appointmentType: type });
    if (specialty) params.set("specialty", specialty);
    if (city) params.set("city", city);
    return `/uzmanlar?${params.toString()}`;
  }, [type, specialty, city]);

  return (
    <div id="randevu-ara" className="home-search-card scroll-mt-28">
      <div className="mb-6 flex w-fit rounded-full bg-home-page p-1.5" role="group" aria-label="Görüşme türü">
        <button type="button" onClick={() => setType("online")} aria-pressed={type === "online"} className={`home-search-tab ${type === "online" ? "home-search-tab-active" : ""}`}>
          <Monitor size={17} /> Online
        </button>
        <button type="button" onClick={() => setType("yüzyüze")} aria-pressed={type === "yüzyüze"} className={`home-search-tab ${type === "yüzyüze" ? "home-search-tab-active" : ""}`}>
          <Users size={17} /> Yüz yüze
        </button>
      </div>
      <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
        <label className="home-search-field">
          <span>Uzmanlık alanı</span>
          <span className="relative flex items-center">
            <Search className="absolute left-0 text-home-copy" size={19} />
            <select value={specialty} onChange={(event) => setSpecialty(event.target.value)} aria-label="Uzmanlık alanı seçin" className="home-select pl-7">
              <option value="">Branş seçin</option>
              {popularSpecialties.map((item) => <option key={item.slug} value={item.name}>{item.name}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-0 text-home-copy" size={17} />
          </span>
        </label>
        <label className="home-search-field">
          <span>Konum</span>
          <span className="relative flex items-center">
            <MapPin className="absolute left-0 text-home-copy" size={19} />
            <select value={city} onChange={(event) => setCity(event.target.value)} aria-label="Şehir seçin" className="home-select pl-7">
              <option value="">Tüm Türkiye</option>
              {cities.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-0 text-home-copy" size={17} />
          </span>
        </label>
        <a href={href} className="home-button home-button-primary min-h-[58px] self-end px-7" aria-label="Seçili kriterlerle randevu ara">
          Randevu ara <ArrowRight size={19} />
        </a>
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <span className="mr-1 text-xs font-medium text-home-copy">Popüler aramalar:</span>
        {popularSpecialties.map((item) => (
          <Link key={item.slug} to={`/uzmanlik/${item.slug}`} className="home-popular-pill">{item.name}</Link>
        ))}
      </div>
    </div>
  );
}
