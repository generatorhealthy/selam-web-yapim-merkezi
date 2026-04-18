import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import {
  Search,
  Calendar,
  Brain,
  Heart,
  Star,
  Sparkles,
  Stethoscope,
  ArrowRight,
  Mic,
} from "lucide-react";

interface Test {
  id: string;
  title: string;
  category: string | null;
  image_url: string | null;
}

interface Specialist {
  id: string;
  name: string;
  specialty: string;
  profile_picture: string | null;
  rating: number | null;
  experience: number | null;
  city: string | null;
  reviews_count: number | null;
}

interface Review {
  id: string;
  reviewer_display_name?: string;
  reviewer_name?: string;
  comment: string;
  rating: number;
  specialist_name?: string;
  specialist_specialty?: string;
}

const PASTEL_TINTS = [
  "var(--m-tint-mint)",
  "var(--m-tint-lilac)",
  "var(--m-tint-sky)",
  "var(--m-tint-peach)",
  "var(--m-tint-sand)",
];

export default function MobileHome() {
  const navigate = useNavigate();
  const { userProfile } = useUserRole();
  const [tests, setTests] = useState<Test[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState("Hepsi");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [testsRes, reviewsRes, specialistsRes] = await Promise.all([
          supabase
            .from("tests")
            .select("id,title,category,image_url")
            .eq("is_active", true)
            .eq("status", "approved")
            .limit(6),
          supabase.rpc("get_public_reviews", { p_limit: 3 }),
          supabase
            .from("specialists")
            .select("id,name,specialty,profile_picture,rating,experience,city,reviews_count")
            .eq("is_active", true)
            .not("profile_picture", "is", null)
            .limit(30),
        ]);

        if (cancelled) return;
        if (testsRes.data) setTests(testsRes.data as Test[]);
        if (reviewsRes.data) setReviews(reviewsRes.data as Review[]);
        if (specialistsRes.data) {
          const shuffled = [...specialistsRes.data].sort(() => Math.random() - 0.5);
          setSpecialists(shuffled.slice(0, 6) as Specialist[]);
        }
      } catch (err) {
        console.error("MobileHome data error:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 6) return "İyi geceler";
    if (h < 12) return "Günaydın";
    if (h < 18) return "İyi günler";
    return "İyi akşamlar";
  })();

  const firstName = userProfile?.name?.split(" ")[0] || "Hoş geldiniz";
  const initial = (userProfile?.name || "?").charAt(0).toUpperCase();

  const categories = [
    "Hepsi",
    "Psikolog",
    "Aile Danışmanı",
    "Psikolojik Danışman",
    "Pedagog",
  ];

  const heroSpecialist = specialists[0];
  const otherSpecialists = specialists.slice(1, 4);

  return (
    <div style={{ background: "hsl(var(--m-bg))", minHeight: "100vh" }}>
      {/* Top greeting bar */}
      <div className="m-safe-top px-5 pt-4 pb-2 flex items-center justify-between">
        <button
          onClick={() => navigate("/mobile/profile")}
          className="w-11 h-11 rounded-full overflow-hidden m-pressable flex items-center justify-center"
          style={{ background: "hsl(var(--m-surface))", boxShadow: "var(--m-shadow)" }}
        >
          <span className="text-[15px] font-bold" style={{ color: "hsl(var(--m-ink))" }}>
            {initial}
          </span>
        </button>
        <button
          onClick={() => navigate("/mobile/profile")}
          className="w-11 h-11 rounded-full flex items-center justify-center m-pressable"
          style={{ background: "hsl(var(--m-ink))" }}
          aria-label="Sesli ara"
        >
          <Mic className="w-5 h-5" style={{ color: "hsl(var(--m-bg))" }} strokeWidth={2.2} />
        </button>
      </div>

      {/* Hero greeting */}
      <div className="px-5 pt-2 pb-6">
        <p className="text-[15px] font-medium" style={{ color: "hsl(var(--m-text-secondary))" }}>
          {greeting}
        </p>
        <h1 className="m-headline mt-1">{firstName}</h1>
        <p className="text-[15px] mt-2" style={{ color: "hsl(var(--m-text-secondary))" }}>
          Bugün size nasıl yardımcı olabiliriz?
        </p>
      </div>

      {/* Search bar — Zocdoc style */}
      <div className="px-5 mb-5">
        <button
          onClick={() => navigate("/mobile/search")}
          className="w-full h-14 rounded-full flex items-center gap-3 px-5 m-pressable"
          style={{ background: "hsl(var(--m-surface))", boxShadow: "var(--m-shadow)" }}
        >
          <Search className="w-5 h-5" style={{ color: "hsl(var(--m-text-secondary))" }} />
          <span className="text-[15px] font-medium" style={{ color: "hsl(var(--m-text-secondary))" }}>
            Uzman, branş veya şehir ara
          </span>
        </button>
      </div>

      {/* Category pills + filter */}
      <div className="mb-7">
        <div className="flex items-center gap-2 px-5 overflow-x-auto m-no-scrollbar">
          <button
            onClick={() => navigate("/mobile/search")}
            className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 m-pressable"
            style={{ background: "hsl(var(--m-ink))" }}
            aria-label="Filtrele"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--m-bg))" strokeWidth="2.2" strokeLinecap="round">
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="4" y1="12" x2="14" y2="12" />
              <line x1="4" y1="18" x2="9" y2="18" />
            </svg>
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => {
                setActiveCat(c);
                if (c !== "Hepsi") navigate(`/mobile/search?specialty=${encodeURIComponent(c)}`);
              }}
              className={`m-chip m-pressable ${activeCat === c ? "m-chip--active" : ""}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Hero specialist card — Zocdoc signature look */}
      {heroSpecialist && (
        <section className="px-5 mb-7">
          <div className="flex items-end justify-between mb-4">
            <h2 className="m-title">Uzmanlarımız</h2>
            <button
              onClick={() => navigate("/mobile/search")}
              className="text-[14px] font-semibold m-pressable"
              style={{ color: "hsl(var(--m-text-secondary))" }}
            >
              Tümü
            </button>
          </div>

          <button
            onClick={() => navigate(`/mobile/specialist/${heroSpecialist.id}`)}
            className="relative w-full text-left rounded-[28px] overflow-hidden m-pressable"
            style={{
              background: `hsl(${PASTEL_TINTS[0]})`,
              boxShadow: "var(--m-shadow-md)",
              minHeight: 360,
            }}
          >
            {/* Online dot */}
            <div className="absolute top-5 left-5 z-10 flex items-center gap-2 px-3 h-8 rounded-full bg-white/80 backdrop-blur">
              <span className="w-2 h-2 rounded-full" style={{ background: "hsl(var(--m-success))" }} />
              <span className="text-[12px] font-semibold" style={{ color: "hsl(var(--m-text-primary))" }}>
                Online
              </span>
            </div>

            {/* Heart */}
            <div className="absolute top-5 right-5 z-10 w-10 h-10 rounded-full bg-white/80 backdrop-blur flex items-center justify-center">
              <Heart className="w-5 h-5" style={{ color: "hsl(var(--m-text-primary))" }} />
            </div>

            {/* Doctor image — overflows card bottom */}
            <div className="absolute bottom-0 right-0 w-[70%] h-[88%] flex items-end justify-end overflow-hidden">
              <img
                src={heroSpecialist.profile_picture || ""}
                alt={heroSpecialist.name}
                className="h-full w-auto object-cover object-top"
                style={{ filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.12))" }}
              />
            </div>

            {/* Text overlay */}
            <div className="relative p-6 pt-16 pb-6 max-w-[60%]">
              <p className="text-[13px] font-medium" style={{ color: "hsl(var(--m-text-secondary))" }}>
                {heroSpecialist.specialty}
              </p>
              <h3
                className="text-[24px] font-bold leading-tight mt-1"
                style={{ color: "hsl(var(--m-text-primary))", letterSpacing: "-0.02em" }}
              >
                {heroSpecialist.name}
              </h3>
              {heroSpecialist.rating ? (
                <div className="flex items-center gap-1 mt-3">
                  <Star className="w-4 h-4" style={{ color: "hsl(var(--m-warning))", fill: "hsl(var(--m-warning))" }} />
                  <span className="text-[14px] font-bold" style={{ color: "hsl(var(--m-text-primary))" }}>
                    {Number(heroSpecialist.rating).toFixed(1)}
                  </span>
                  {heroSpecialist.reviews_count ? (
                    <span className="text-[12px]" style={{ color: "hsl(var(--m-text-secondary))" }}>
                      ({heroSpecialist.reviews_count})
                    </span>
                  ) : null}
                </div>
              ) : null}
              {heroSpecialist.experience ? (
                <p className="text-[12px] mt-2" style={{ color: "hsl(var(--m-text-secondary))" }}>
                  {heroSpecialist.experience} yıl deneyim
                </p>
              ) : null}
            </div>

            {/* Floating CTA */}
            <div className="absolute bottom-5 left-5 right-5 z-10">
              <div
                className="h-12 rounded-full flex items-center justify-center gap-2 backdrop-blur"
                style={{ background: "hsl(0 0% 100% / 0.7)" }}
              >
                <span className="text-[14px] font-bold" style={{ color: "hsl(var(--m-text-primary))" }}>
                  Profili İncele
                </span>
                <ArrowRight className="w-4 h-4" style={{ color: "hsl(var(--m-text-primary))" }} />
              </div>
            </div>
          </button>
        </section>
      )}

      {/* Other specialists — pastel mini cards horizontal scroll */}
      {otherSpecialists.length > 0 && (
        <section className="mb-7">
          <h2 className="m-title px-5 mb-4">Sizin için</h2>
          <div className="flex gap-3 px-5 overflow-x-auto m-no-scrollbar pb-2">
            {otherSpecialists.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => navigate(`/mobile/specialist/${s.id}`)}
                className="relative shrink-0 w-[180px] h-[240px] rounded-[24px] overflow-hidden text-left m-pressable"
                style={{
                  background: `hsl(${PASTEL_TINTS[(idx + 1) % PASTEL_TINTS.length]})`,
                  boxShadow: "var(--m-shadow)",
                }}
              >
                {s.profile_picture && (
                  <div className="absolute bottom-0 right-0 w-full h-[70%] flex items-end justify-center overflow-hidden">
                    <img
                      src={s.profile_picture}
                      alt={s.name}
                      className="h-full w-auto object-cover object-top"
                    />
                  </div>
                )}
                <div className="relative p-4">
                  <p className="text-[11px] font-medium" style={{ color: "hsl(var(--m-text-secondary))" }}>
                    {s.specialty}
                  </p>
                  <h4
                    className="text-[15px] font-bold leading-tight mt-0.5 line-clamp-2"
                    style={{ color: "hsl(var(--m-text-primary))" }}
                  >
                    {s.name}
                  </h4>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Quick actions */}
      <section className="px-5 mb-7 grid grid-cols-2 gap-3">
        <button
          onClick={() => navigate("/mobile/search")}
          className="rounded-[22px] p-5 text-left m-pressable"
          style={{ background: "hsl(var(--m-ink))" }}
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center mb-4"
            style={{ background: "hsl(var(--m-bg) / 0.15)" }}
          >
            <Calendar className="w-5 h-5" style={{ color: "hsl(var(--m-bg))" }} />
          </div>
          <div className="text-[15px] font-bold" style={{ color: "hsl(var(--m-bg))" }}>
            Randevu Al
          </div>
          <div className="text-[12px] mt-1" style={{ color: "hsl(var(--m-bg) / 0.7)" }}>
            Hemen oluştur
          </div>
        </button>
        <button
          onClick={() => navigate("/packages")}
          className="rounded-[22px] p-5 text-left m-pressable"
          style={{ background: "hsl(var(--m-surface))", boxShadow: "var(--m-shadow)" }}
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center mb-4"
            style={{ background: `hsl(${PASTEL_TINTS[3]})` }}
          >
            <Stethoscope className="w-5 h-5" style={{ color: "hsl(var(--m-ink))" }} />
          </div>
          <div className="text-[15px] font-bold" style={{ color: "hsl(var(--m-text-primary))" }}>
            Uzman Ol
          </div>
          <div className="text-[12px] mt-1" style={{ color: "hsl(var(--m-text-secondary))" }}>
            Platforma katıl
          </div>
        </button>
      </section>

      {/* Branches with specialist photos */}
      {specialists.length > 0 && (
        <section className="mb-7">
          <div className="flex items-end justify-between px-5 mb-4">
            <h2 className="m-title">Branşları Keşfet</h2>
            <button
              onClick={() => navigate("/mobile/search")}
              className="text-[14px] font-semibold m-pressable"
              style={{ color: "hsl(var(--m-text-secondary))" }}
            >
              Tümü
            </button>
          </div>
          <div className="flex gap-4 px-5 overflow-x-auto m-no-scrollbar pb-2">
            {Array.from(
              specialists.reduce((map, s) => {
                if (!map.has(s.specialty)) map.set(s.specialty, s);
                return map;
              }, new Map<string, Specialist>()).values()
            ).slice(0, 8).map((s, idx) => (
              <button
                key={s.specialty}
                onClick={() => navigate(`/mobile/search?specialty=${encodeURIComponent(s.specialty)}`)}
                className="shrink-0 flex flex-col items-center gap-2 m-pressable"
                style={{ width: 84 }}
              >
                <div
                  className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center"
                  style={{
                    background: `hsl(${PASTEL_TINTS[idx % PASTEL_TINTS.length]})`,
                    boxShadow: "var(--m-shadow)",
                  }}
                >
                  {s.profile_picture ? (
                    <img src={s.profile_picture} alt={s.specialty} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[28px] font-bold" style={{ color: "hsl(var(--m-ink))" }}>
                      {s.specialty.charAt(0)}
                    </span>
                  )}
                </div>
                <span
                  className="text-[12px] font-semibold text-center leading-tight line-clamp-2"
                  style={{ color: "hsl(var(--m-text-primary))" }}
                >
                  {s.specialty}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Visual feature banner */}
      <section className="px-5 mb-7">
        <button
          onClick={() => navigate("/mobile/search")}
          className="w-full relative overflow-hidden rounded-[24px] text-left m-pressable"
          style={{
            background: "linear-gradient(135deg, hsl(var(--m-tint-lilac)) 0%, hsl(var(--m-tint-sky)) 100%)",
            minHeight: 160,
          }}
        >
          <div className="relative p-6 max-w-[60%]">
            <div className="inline-flex items-center gap-1.5 px-3 h-7 rounded-full bg-white/80 mb-3">
              <Sparkles className="w-3.5 h-3.5" style={{ color: "hsl(var(--m-ink))" }} />
              <span className="text-[11px] font-bold" style={{ color: "hsl(var(--m-text-primary))" }}>
                Yeni
              </span>
            </div>
            <h3 className="text-[20px] font-bold leading-tight" style={{ color: "hsl(var(--m-text-primary))" }}>
              Online görüşme ile evinden destek al
            </h3>
            <p className="text-[12px] mt-2" style={{ color: "hsl(var(--m-text-secondary))" }}>
              7/24 uzman desteği
            </p>
          </div>
          {/* Stacked specialist avatars on right */}
          <div className="absolute right-4 bottom-4 flex -space-x-3">
            {specialists.slice(0, 4).map((s) => (
              <div
                key={s.id}
                className="w-12 h-12 rounded-full overflow-hidden border-2"
                style={{ borderColor: "hsl(var(--m-bg))", background: "hsl(var(--m-surface-muted))" }}
              >
                {s.profile_picture && (
                  <img src={s.profile_picture} alt={s.name} className="w-full h-full object-cover" />
                )}
              </div>
            ))}
          </div>
        </button>
      </section>

      {/* Tests */}
      {tests.length > 0 && (
        <section className="mb-7">
          <div className="flex items-end justify-between px-5 mb-4">
            <h2 className="m-title">Psikolojik Testler</h2>
            <button
              onClick={() => navigate("/mobile/tests")}
              className="text-[14px] font-semibold m-pressable"
              style={{ color: "hsl(var(--m-text-secondary))" }}
            >
              Tümü
            </button>
          </div>
          <div className="flex gap-3 px-5 overflow-x-auto m-no-scrollbar pb-2">
            {tests.map((test, idx) => (
              <button
                key={test.id}
                onClick={() => navigate(`/test/${test.id}`)}
                className="shrink-0 w-[160px] rounded-[20px] p-4 text-left m-pressable"
                style={{
                  background: `hsl(${PASTEL_TINTS[(idx + 2) % PASTEL_TINTS.length]})`,
                  minHeight: 140,
                }}
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center mb-3"
                  style={{ background: "hsl(var(--m-surface) / 0.7)" }}
                >
                  <Brain className="w-4 h-4" style={{ color: "hsl(var(--m-ink))" }} />
                </div>
                <p
                  className="text-[13px] font-bold leading-tight line-clamp-3"
                  style={{ color: "hsl(var(--m-text-primary))" }}
                >
                  {test.title}
                </p>
                {test.category && (
                  <p className="text-[11px] mt-2" style={{ color: "hsl(var(--m-text-secondary))" }}>
                    {test.category}
                  </p>
                )}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Reviews */}
      {reviews.length > 0 && (
        <section className="px-5 mb-7">
          <h2 className="m-title mb-4">Danışan Yorumları</h2>
          <div className="space-y-3">
            {reviews.map((r) => (
              <div
                key={r.id}
                className="rounded-[20px] p-5"
                style={{ background: "hsl(var(--m-surface))", boxShadow: "var(--m-shadow)" }}
              >
                <div className="flex items-center gap-1 mb-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className="w-3.5 h-3.5"
                      style={{
                        color: i < r.rating ? "hsl(var(--m-warning))" : "hsl(var(--m-divider))",
                        fill: i < r.rating ? "hsl(var(--m-warning))" : "hsl(var(--m-divider))",
                      }}
                    />
                  ))}
                </div>
                <p
                  className="text-[14px] leading-relaxed line-clamp-3"
                  style={{ color: "hsl(var(--m-text-primary))" }}
                >
                  {r.comment}
                </p>
                <div className="flex items-center justify-between mt-3 pt-3 border-t" style={{ borderColor: "hsl(var(--m-divider))" }}>
                  <span className="text-[13px] font-semibold" style={{ color: "hsl(var(--m-text-primary))" }}>
                    {r.reviewer_display_name || r.reviewer_name || "Anonim"}
                  </span>
                  {r.specialist_name && (
                    <span className="text-[12px]" style={{ color: "hsl(var(--m-text-secondary))" }}>
                      {r.specialist_name}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {loading && (
        <div className="px-5 mb-7">
          <div className="h-[360px] rounded-[28px] animate-pulse" style={{ background: "hsl(var(--m-surface-muted))" }} />
        </div>
      )}

      <div className="px-5 pb-4 flex items-center justify-center gap-2 text-[11px]" style={{ color: "hsl(var(--m-text-tertiary))" }}>
        <Sparkles className="w-3 h-3" />
        doktorumol.com.tr
      </div>
    </div>
  );
}
