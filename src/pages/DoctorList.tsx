import { useState, useEffect, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { MapPin, Search, MessageCircle, Phone, CheckCircle, SlidersHorizontal, Video, Users, Clock, Star, CalendarDays, BadgeCheck, ChevronDown } from "lucide-react";
import "@/components/home/home.css";
import "./doctor-list.css";
import { Link, useNavigate } from "react-router-dom";
import { resolveCallNumber } from "@/utils/callNumber";
import { createSpecialtySlug } from "@/utils/doctorUtils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { HorizontalNavigation } from "@/components/HorizontalNavigation";
import LocalPagesLinks from "@/components/LocalPagesLinks";
import { matchesAppointmentType, matchesSpecialty } from "@/lib/specialtyFilter";

interface Specialist {
  id: string;
  name: string;
  specialty: string;
  city: string;
  experience?: number;
  rating?: number;
  reviews_count?: number;
  bio?: string;
  profile_picture?: string;
  online_consultation?: boolean;
  face_to_face_consultation?: boolean;
  phone?: string;
  referral_count?: number;
  slug?: string;
}

const DoctorList = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [filteredSpecialists, setFilteredSpecialists] = useState<Specialist[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedAppointmentType, setSelectedAppointmentType] = useState("");
  const PAGE_SIZE = 10;
  const [listPage, setListPage] = useState(1);
  const [sortBy, setSortBy] = useState("onerilen");
  
  const specialties = [
    "Aile Danışmanı", "Cildiye", "Dil ve Konuşma Terapisti", 
    "Eğitim Danışmanlığı", "İlişki Danışmanı", "Kadın Doğum ve Hastalıkları", "Kadın Hastalıkları ve Doğum",
    "Diş Hekimi", "Psikolog", "Klinik Psikolog", "Psikolojik Danışmanlık", "Doktor", "Uzman",
    "Psikolojik Danışman", "Diyetisyen", "Psikiyatri", "Romatoloji", "Genel Cerrahi", "Tıbbi Onkoloji"
  ];

  const cities = [
    "Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Amasya", "Ankara", "Antalya", "Artvin",
    "Aydın", "Balıkesir", "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur", "Bursa",
    "Çanakkale", "Çankırı", "Çorum", "Denizli", "Diyarbakır", "Edirne", "Elazığ", "Erzincan",
    "Erzurum", "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane", "Hakkâri", "Hatay", "Isparta",
    "Mersin", "İstanbul", "İzmir", "Kars", "Kastamonu", "Kayseri", "Kırklareli", "Kırşehir",
    "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa", "Kahramanmaraş", "Mardin", "Muğla",
    "Muş", "Nevşehir", "Niğde", "Ordu", "Rize", "Sakarya", "Samsun", "Siirt", "Sinop",
    "Sivas", "Tekirdağ", "Tokat", "Trabzon", "Tunceli", "Şanlıurfa", "Uşak", "Van",
    "Yozgat", "Zonguldak", "Aksaray", "Bayburt", "Karaman", "Kırıkkale", "Batman", "Şırnak",
    "Bartın", "Ardahan", "Iğdır", "Yalova", "Karabük", "Kilis", "Osmaniye", "Düzce"
  ];

  useEffect(() => {
    fetchSpecialists();
    
    // Read URL parameters and set initial filters
    const urlParams = new URLSearchParams(window.location.search);
    const search = urlParams.get('search');
    const city = urlParams.get('city');
    const specialty = urlParams.get('specialty');
    const appointmentType = urlParams.get('appointmentType');
    
    if (search) setSearchTerm(search);
    if (city) setSelectedCity(city);
    if (specialty) setSelectedSpecialty(specialty);
    if (appointmentType === 'online' || appointmentType === 'yüzyüze') setSelectedAppointmentType(appointmentType);
  }, []);

  useEffect(() => {
    filterSpecialists();
  }, [specialists, searchTerm, selectedSpecialty, selectedCity, selectedAppointmentType]);



  const fetchSpecialists = async () => {
    try {
      setLoading(true);

      // SECURITY: Use secure function to get specialists without personal contact info
      // Yavaş mobil bağlantılarda tek denemede kopabildiği için 3 kez denenir
      let specialistsData: any[] | null = null;
      let specialistsError: any = null;

      for (let attempt = 0; attempt < 3; attempt++) {
        const result = await supabase.rpc('get_public_specialists');
        if (!result.error) {
          specialistsData = (result.data as any[]) || [];
          specialistsError = null;
          break;
        }
        specialistsError = result.error;
        console.warn(`Uzman listesi denemesi ${attempt + 1} başarısız:`, result.error.message);
        if (attempt < 2) {
          await new Promise((resolve) => setTimeout(resolve, 800 * (attempt + 1)));
        }
      }

      if (specialistsError || !specialistsData) {
        console.error('Uzmanlar çekilirken hata:', specialistsError);
        toast({
          title: "Hata",
          description: "Uzmanlar yüklenirken bir hata oluştu.",
          variant: "destructive"
        });
        return;
      }

      // Liste hemen gösterilir: rastgele sırayla ekrana bas, bekletme yok
      const shuffled = [...(specialistsData || [])]
        .map((s) => ({ ...s, referral_count: 0 }))
        .sort(() => Math.random() - 0.5);
      setSpecialists(shuffled);
      setLoading(false);

      // Yönlendirme sayıları yalnızca giriş yapmış kullanıcılar için ve arka planda
      void (async () => {
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          if (!sessionData.session) return;

          const currentYear = new Date().getFullYear();
          const currentMonth = new Date().getMonth() + 1;

          const { data: referralData, error: referralError } = await supabase
            .from('client_referrals')
            .select('specialist_id, referral_count, is_referred')
            .eq('year', currentYear)
            .eq('month', currentMonth);

          if (referralError || !referralData) return;

          const counts = new Map<string, number>();
          for (const r of referralData as any[]) {
            const inc = r.referral_count || (r.is_referred ? 1 : 0) || 0;
            counts.set(r.specialist_id, (counts.get(r.specialist_id) || 0) + inc);
          }

          setSpecialists((prev) => {
            const withCounts = prev.map((s) => ({ ...s, referral_count: counts.get(s.id) || 0 }));
            const zero = withCounts.filter((s) => (s.referral_count || 0) === 0);
            const nonZero = withCounts
              .filter((s) => (s.referral_count || 0) > 0)
              .sort((a, b) => (a.referral_count || 0) - (b.referral_count || 0));
            return [...zero, ...nonZero];
          });
        } catch {
          // sessizce yoksay
        }
      })();

    } catch (error) {
      console.error('Beklenmeyen hata:', error);
      toast({
        title: "Hata",
        description: "Beklenmeyen bir hata oluştu.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };


  const filterSpecialists = () => {
    let filtered = [...specialists];

    // Arama filtresi
    if (searchTerm && searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(specialist =>
        specialist.name.toLowerCase().includes(searchLower) ||
        specialist.specialty.toLowerCase().includes(searchLower) ||
        specialist.city?.toLowerCase().includes(searchLower)
      );
    }

    // Uzmanlık alanı filtresi
    if (selectedSpecialty && selectedSpecialty !== "all" && selectedSpecialty.trim()) {
      filtered = filtered.filter(specialist => 
        matchesSpecialty(specialist.specialty, selectedSpecialty)
      );
    }

    // Şehir filtresi
    if (selectedCity && selectedCity !== "all" && selectedCity.trim()) {
      filtered = filtered.filter(specialist => 
        specialist.city && specialist.city.toLowerCase() === selectedCity.toLowerCase()
      );
    }

    // Ana sayfa ve randevu sihirbazından gelen görüşme türü filtresi
    filtered = filtered.filter(specialist => matchesAppointmentType(specialist, selectedAppointmentType));

    setFilteredSpecialists(filtered);
    setListPage(1);
  };

  const getAppointmentTypes = (specialist: Specialist) => {
    const types = [];
    if (specialist.online_consultation) types.push('Online');
    if (specialist.face_to_face_consultation !== false) types.push('Yüz Yüze');
    return types.length > 0 ? types : ['Yüz Yüze'];
  };

  const handleWhatsAppClick = (phone?: string) => {
    const whatsappUrl = `https://wa.me/905055566556`;
    window.open(whatsappUrl, '_blank');
  };

  const handleCallClick = (phone?: string) => {
    window.location.href = `tel:${resolveCallNumber(phone)}`;
  };

  const handleProfileClick = (specialist: Specialist) => {
    const specialtySlug = createSpecialtySlug(specialist.specialty);
    navigate(`/${specialtySlug}/${specialist.slug}`);
  };

  const seoHead = (
    <Helmet>
      <title>Uzmanlar - Psikolog ve Aile Danışmanı Randevusu | Doktorum Ol</title>
      <meta name="description" content="Doktorum Ol uzmanlarının profillerini inceleyin: psikolog, klinik psikolog, aile danışmanı ve psikolojik danışmanlar. Online veya yüz yüze randevu alın." />
      <link rel="canonical" href="https://doktorumol.com.tr/uzmanlar" />
      <meta property="og:url" content="https://doktorumol.com.tr/uzmanlar" />
    </Helmet>
  );

  const sortedSpecialists = (() => {
    const list = [...filteredSpecialists];
    if (sortBy === "deneyim") list.sort((a, b) => (b.experience || 0) - (a.experience || 0));
    if (sortBy === "puan") list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    return list;
  })();
  const pageItems = (() => {
    const n = sortedSpecialists.length;
    if (n === 0) return [] as { s: typeof sortedSpecialists[number]; k: string }[];
    const out: { s: typeof sortedSpecialists[number]; k: string }[] = [];
    const count = listPage * PAGE_SIZE;
    for (let i = 0; i < count; i++) {
      const round = Math.floor(i / n);
      let item = sortedSpecialists[i % n];
      if (round > 0) {
        // deterministic shuffle per round so repeats come in a different order
        const order = sortedSpecialists.map((x, idx) => ({ x, r: Math.sin((idx + 1) * (round + 7) * 9301) }))
          .sort((p, q) => p.r - q.r).map((o) => o.x);
        item = order[i % n];
      }
      out.push({ s: item, k: `${item.id}-${round}` });
    }
    return out;
  })();
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el || loading || sortedSpecialists.length === 0) return;
    const obs = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) setListPage((p) => p + 1);
    }, { rootMargin: "600px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, [loading, sortedSpecialists.length, listPage]);

  const typeFilter = (
    <div className="ex-panel">
      <div className="ex-panel-title"><SlidersHorizontal className="h-5 w-5" /> Görüşme türü</div>
      <div className="ex-segment">
        {[{ v: "", l: "Tümü", I: Users }, { v: "online", l: "Online", I: Video }, { v: "yüzyüze", l: "Yüz yüze", I: Users }].map(({ v, l, I }) => (
          <button key={l} type="button" onClick={() => setSelectedAppointmentType(v)} className={`ex-segment-btn ${selectedAppointmentType === v ? "ex-segment-btn-active" : ""}`}>
            {v === "online" ? <Video className="h-4 w-4" /> : v ? <Users className="h-4 w-4" /> : null}{l}
          </button>
        ))}
      </div>
      <div className="mt-4 grid gap-3">
        <label className="ex-field"><Search className="h-4 w-4" />
          <input placeholder="Uzman adı, branş veya şehir" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </label>
        <select className="ex-select" aria-label="Uzmanlık alanı" value={selectedSpecialty || "all"} onChange={(e) => setSelectedSpecialty(e.target.value)}>
          <option value="all">Tüm uzmanlık alanları</option>
          {specialties.map((sp) => <option key={sp} value={sp}>{sp}</option>)}
        </select>
        <select className="ex-select" aria-label="Şehir" value={selectedCity || "all"} onChange={(e) => setSelectedCity(e.target.value)}>
          <option value="all">Tüm şehirler</option>
          {cities.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        {(searchTerm || selectedSpecialty || selectedCity || selectedAppointmentType) && (
          <button type="button" className="ex-clear" onClick={() => { setSearchTerm(""); setSelectedSpecialty(""); setSelectedCity(""); setSelectedAppointmentType(""); }}>
            Filtreleri temizle
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="home-page ex-page min-h-screen">
      {seoHead}
      <HorizontalNavigation />

      <section className="ex-hero">
        <div className="home-container relative z-10 text-center">
          <p className="ex-eyebrow">Uzmanlar</p>
          <h1 className="ex-title">Size en uygun <span>uzmanı</span> keşfedin</h1>
          <p className="ex-lead">Online veya yüz yüze görüşme seçin; doğrulanmış profilleri inceleyip hemen randevu oluşturun.</p>
        </div>
      </section>

      <div className="home-container ex-layout" id="uzman-listesi">
        <aside className="ex-aside">
          {typeFilter}
          <div className="ex-cta">
            <p className="ex-cta-kicker">Uzman mısınız?</p>
            <p className="ex-cta-text">Profilinizi oluşturun, danışanlarla buluşun.</p>
            <Link to="/kayit-ol" className="home-button home-button-primary w-full">Uzman olarak katılın</Link>
          </div>
        </aside>

        <main className="min-w-0">
          <div className="ex-toolbar">
            <p><strong>Uzmanlarımız</strong> listeleniyor</p>
            <label className="ex-sort">Sırala:
              <select value={sortBy} onChange={(e) => { setSortBy(e.target.value); setListPage(1); }}>
                <option value="onerilen">Önerilen</option>
                <option value="deneyim">Deneyim</option>
                <option value="puan">Puan</option>
              </select>
              <ChevronDown className="h-4 w-4" />
            </label>
          </div>

          {loading ? (
            <div className="grid gap-5">{[0, 1, 2].map((i) => <div key={i} className="ex-card h-64 animate-pulse" />)}</div>
          ) : pageItems.length === 0 ? (
            <div className="ex-card text-center text-[hsl(var(--home-copy))]">Arama kriterlerinize uygun uzman bulunamadı.</div>
          ) : (
            <div className="grid gap-5">
              {pageItems.map(({ s: specialist, k: itemKey }) => {
                const specialtySlug = createSpecialtySlug(specialist.specialty);
                const profileUrl = `/${specialtySlug}/${specialist.slug}`;
                const initials = specialist.name.split(" ").filter(Boolean).slice(-2).map((w) => w[0]).join("").toLocaleUpperCase("tr-TR");
                const types = getAppointmentTypes(specialist);
                return (
                  <article key={itemKey} className="ex-card">
                    <div className="ex-card-body">
                      <Link to={profileUrl} className="ex-photo" aria-label={`${specialist.name} profili`}>
                        {specialist.profile_picture ? (
                          <img src={specialist.profile_picture} alt={specialist.name} loading="eager" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                        ) : null}
                        <span className="ex-photo-fallback">{initials}</span>
                        <span className="ex-photo-badge"><BadgeCheck className="h-5 w-5" /></span>
                      </Link>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          <h2 className="ex-name"><Link to={profileUrl}>{specialist.name}</Link></h2>
                          <span className="ex-verified"><CheckCircle className="h-4 w-4" /> Onaylı profil</span>
                        </div>
                        <div className="ex-meta">
                          <span className="ex-chip">{specialist.specialty}</span>
                          {specialist.city && <span><MapPin className="h-4 w-4" />{specialist.city}</span>}
                          {specialist.experience ? <span><Clock className="h-4 w-4" />{specialist.experience} yıl deneyim</span> : null}
                          {specialist.rating ? <span><Star className="h-4 w-4 fill-current text-[hsl(var(--home-star))]" />{Number(specialist.rating).toFixed(1)}</span> : null}
                        </div>
                        {specialist.bio && <p className="ex-bio">{specialist.bio}</p>}
                        <div className="flex flex-wrap gap-2">
                          {types.map((t) => (
                            <span key={t} className={t === "Online" ? "ex-type ex-type-online" : "ex-type ex-type-face"}>
                              {t === "Online" ? <Video className="h-4 w-4" /> : <Users className="h-4 w-4" />}{t === "Online" ? "Online" : "Yüz yüze"}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="ex-actions">
                      <Link to={`/randevu-al/${specialtySlug}/${specialist.slug}`} className="home-button home-button-primary"><CalendarDays className="h-4 w-4" /> Randevu al</Link>
                      <Link to={profileUrl} className="home-button home-button-outline">Profili incele</Link>
                      {specialist.phone && (
                        <>
                          <button type="button" className="ex-icon-btn" title="WhatsApp" aria-label="WhatsApp" onClick={() => handleWhatsAppClick(specialist.phone)}><MessageCircle className="h-5 w-5" /></button>
                          <button type="button" className="ex-icon-btn" title="Ara" aria-label="Ara" onClick={() => handleCallClick(specialist.phone)}><Phone className="h-5 w-5" /></button>
                        </>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {!loading && sortedSpecialists.length > 0 && <div ref={loadMoreRef} aria-hidden="true" className="h-10" />}

          <LocalPagesLinks specialists={specialists} className="mt-8" />

          <div className="ex-cta ex-cta-mobile">
            <p className="ex-cta-kicker">Uzman mısınız?</p>
            <p className="ex-cta-text">Profilinizi oluşturun, danışanlarla buluşun.</p>
            <Link to="/kayit-ol" className="home-button home-button-primary w-full">Uzman olarak katılın</Link>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DoctorList;
