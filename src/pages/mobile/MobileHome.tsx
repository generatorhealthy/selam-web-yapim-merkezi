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
  Clock,
  Send,
  MessageCircle,
  BookOpen,
} from "lucide-react";
import { getRecentlyViewed, type RecentSpecialist } from "@/components/RecentlyViewedSpecialists";
import testAnxiety from "@/assets/test-anxiety.jpg";
import testDepression from "@/assets/test-depression.jpg";
import testGrief from "@/assets/test-grief.jpg";
import testTrauma from "@/assets/test-trauma.jpg";
import testSocial from "@/assets/test-social.jpg";
import testAddiction from "@/assets/test-addiction.jpg";
import testRelationship from "@/assets/test-relationship.jpg";
import testSelfesteem from "@/assets/test-selfesteem.jpg";

const TEST_IMAGES = [
  testAnxiety,
  testDepression,
  testGrief,
  testTrauma,
  testSocial,
  testAddiction,
  testRelationship,
  testSelfesteem,
];

const pickTestImage = (test: { title: string; category: string | null; image_url: string | null }, idx: number) => {
  if (test.image_url) return test.image_url;
  const text = `${test.title} ${test.category || ""}`.toLowerCase();
  if (/(anksiyete|kayg[ıi]|panik|stres)/.test(text)) return testAnxiety;
  if (/(depres|mutsuz|umutsuz)/.test(text)) return testDepression;
  if (/(yas|kay[ıi]p|matem)/.test(text)) return testGrief;
  if (/(travma|tssb|ptsd)/.test(text)) return testTrauma;
  if (/(sosyal|fobi|utan)/.test(text)) return testSocial;
  if (/(alkol|ba[ğg][ıi]ml|madde|sigara)/.test(text)) return testAddiction;
  if (/(ili[şs]ki|evlilik|ç?ift|a[şs]k|ayr[ıi]l)/.test(text)) return testRelationship;
  if (/(öz ?güven|özsayg|farkındal|mindful|motivasyon)/.test(text)) return testSelfesteem;
  return TEST_IMAGES[idx % TEST_IMAGES.length];
};

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

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featured_image: string | null;
  author_name: string | null;
  published_at: string | null;
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
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState("Hepsi");
  const [authedUserId, setAuthedUserId] = useState<string | null>(null);
  const [authedEmail, setAuthedEmail] = useState<string | null>(null);
  const [upcoming, setUpcoming] = useState<any | null>(null);
  const [recentSpecialist, setRecentSpecialist] = useState<RecentSpecialist | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setAuthedUserId(data.session?.user?.id ?? null);
      setAuthedEmail(data.session?.user?.email ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setAuthedUserId(s?.user?.id ?? null);
      setAuthedEmail(s?.user?.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const list = getRecentlyViewed();
    if (list.length > 0) setRecentSpecialist(list[0]);
  }, []);

  useEffect(() => {
    if (!authedUserId && !authedEmail) { setUpcoming(null); return; }
    (async () => {
      try {
        const today = new Date().toISOString().split("T")[0];
        const orFilter = [
          authedUserId ? `patient_user_id.eq.${authedUserId}` : null,
          authedEmail ? `patient_email.eq.${authedEmail}` : null,
        ].filter(Boolean).join(",");
        const { data } = await supabase
          .from("appointments")
          .select("id,appointment_date,appointment_time,appointment_type,status,specialist_id")
          .or(orFilter)
          .gte("appointment_date", today)
          .in("status", ["pending", "confirmed"])
          .order("appointment_date", { ascending: true })
          .order("appointment_time", { ascending: true })
          .limit(1);
        const apt = data?.[0];
        if (!apt) { setUpcoming(null); return; }
        let spec: any = null;
        if (apt.specialist_id) {
          const { data: s } = await supabase
            .from("public_specialists")
            .select("id,name,specialty,profile_picture,slug")
            .eq("id", apt.specialist_id)
            .maybeSingle();
          spec = s;
        }
        setUpcoming({ ...apt, specialist: spec });
      } catch (e) {
        console.error("Upcoming appointment fetch error", e);
      }
    })();
  }, [authedUserId, authedEmail]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [testsRes, reviewsRes, specialistsRes, blogsRes] = await Promise.all([
          supabase
            .from("tests")
            .select("id,title,category,image_url")
            .eq("is_active", true)
            .eq("status", "approved")
            .limit(40),
          supabase.rpc("get_public_reviews", { p_limit: 30 }),
          supabase
            .from("public_specialists")
            .select("id,name,specialty,profile_picture,rating,experience,city,reviews_count")
            .limit(500),
          supabase
            .from("blog_posts")
            .select("id,title,slug,excerpt,featured_image,author_name,published_at")
            .eq("status", "published")
            .order("published_at", { ascending: false })
            .limit(60),
        ]);

        let specialistRows = (specialistsRes.data || []) as Specialist[];

        if (specialistsRes.error || specialistRows.length === 0) {
          const { data: rpcSpecialists, error: rpcSpecialistsError } = await supabase.rpc("get_public_specialists");
          if (rpcSpecialistsError) {
            console.error("MobileHome specialists fallback error:", rpcSpecialistsError);
          } else {
            specialistRows = (rpcSpecialists || []) as Specialist[];
          }
        }

        if (cancelled) return;
        if (testsRes.data) {
          const shuffledTests = [...testsRes.data].sort(() => Math.random() - 0.5);
          setTests(shuffledTests.slice(0, 6) as Test[]);
        }
        if (reviewsRes.data) {
          const shuffledReviews = [...reviewsRes.data].sort(() => Math.random() - 0.5);
          setReviews(shuffledReviews.slice(0, 5) as Review[]);
        }
        if (specialistRows.length > 0) {
          // Tüm aktif uzmanları al, fotoğrafı olanları öne çıkar, her yenilemede karıştır
          const all = [...specialistRows] as Specialist[];
          const withPhoto = all.filter((s) => s.profile_picture);
          const withoutPhoto = all.filter((s) => !s.profile_picture);
          const shuffled = [
            ...withPhoto.sort(() => Math.random() - 0.5),
            ...withoutPhoto.sort(() => Math.random() - 0.5),
          ];
          setSpecialists(shuffled);
        }
        if (blogsRes.data) {
          // Her sayfa yenilemesinde rastgele 8 blog göster (farklı uzmanlardan)
          const shuffledBlogs = [...blogsRes.data].sort(() => Math.random() - 0.5);
          setBlogs(shuffledBlogs.slice(0, 8) as BlogPost[]);
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
      {/* Top safe area spacer */}
      <div className="m-safe-top pt-2" />

      {/* Search bar — Zocdoc style */}
      <div className="px-5 mt-3 mb-5">
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

      {/* Patient hero card: upcoming appointment OR recently viewed specialist */}
      {(upcoming || recentSpecialist) && (
        <section className="px-5 mb-6">
          {upcoming ? (
            <div
              className="rounded-[24px] p-5 relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg, hsl(217 91% 60%) 0%, hsl(224 82% 54%) 100%)",
                boxShadow: "0 12px 28px -8px hsl(217 91% 60% / 0.45)",
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[12px] font-bold uppercase tracking-wider text-white/85">
                  Yaklaşan Randevunuz
                </span>
                <button
                  onClick={() => navigate("/mobile/patient-appointments")}
                  className="text-[12px] font-semibold text-white/90 m-pressable"
                >
                  Tümü
                </button>
              </div>

              <div className="flex items-center gap-2 text-white mb-1.5">
                <Calendar className="w-4 h-4" strokeWidth={2.4} />
                <span className="text-[15px] font-bold">
                  {new Date(upcoming.appointment_date).toLocaleDateString("tr-TR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2 text-white/90 mb-4">
                <Clock className="w-4 h-4" strokeWidth={2.4} />
                <span className="text-[14px] font-semibold">
                  {String(upcoming.appointment_time).slice(0, 5)}
                </span>
              </div>

              <button
                onClick={() => upcoming.specialist?.id && navigate(`/mobile/specialist/${upcoming.specialist.id}`)}
                className="w-full bg-white/95 rounded-[16px] p-3 flex items-center gap-3 m-pressable text-left"
              >
                {upcoming.specialist?.profile_picture ? (
                  <img
                    src={upcoming.specialist.profile_picture}
                    alt={upcoming.specialist.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ background: "hsl(217 91% 60%)" }}
                  >
                    {upcoming.specialist?.name?.charAt(0) ?? "?"}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-bold truncate" style={{ color: "hsl(var(--m-text-primary))" }}>
                    {upcoming.specialist?.name ?? "Uzman"}
                  </div>
                  <div className="text-[12px] truncate" style={{ color: "hsl(var(--m-text-secondary))" }}>
                    {upcoming.specialist?.specialty ?? ""}
                  </div>
                </div>
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: "hsl(217 91% 60%)" }}
                >
                  <MessageCircle className="w-4 h-4 text-white" strokeWidth={2.4} />
                </div>
              </button>
            </div>
          ) : recentSpecialist ? (
            <div
              className="rounded-[24px] p-5 relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg, hsl(217 91% 60%) 0%, hsl(224 82% 54%) 100%)",
                boxShadow: "0 12px 28px -8px hsl(217 91% 60% / 0.45)",
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-[12px] font-bold uppercase tracking-wider text-white/85">
                  Son İncelediğiniz
                </span>
                <button
                  onClick={() => navigate("/mobile/search")}
                  className="text-[12px] font-semibold text-white/90 m-pressable"
                >
                  Tümü
                </button>
              </div>
              <button
                onClick={() => navigate(`/mobile/specialist/${recentSpecialist.id}`)}
                className="w-full bg-white/95 rounded-[16px] p-3 flex items-center gap-3 m-pressable text-left"
              >
                {recentSpecialist.profile_picture ? (
                  <img
                    src={recentSpecialist.profile_picture}
                    alt={recentSpecialist.name}
                    className="w-14 h-14 rounded-full object-cover"
                  />
                ) : (
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg"
                    style={{ background: "hsl(217 91% 60%)" }}
                  >
                    {recentSpecialist.name.charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-bold truncate" style={{ color: "hsl(var(--m-text-primary))" }}>
                    {recentSpecialist.name}
                  </div>
                  <div className="text-[12px] truncate" style={{ color: "hsl(var(--m-text-secondary))" }}>
                    {recentSpecialist.specialty}
                  </div>
                </div>
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: "hsl(217 91% 60%)" }}
                >
                  <Send className="w-4 h-4 text-white" strokeWidth={2.4} />
                </div>
              </button>
            </div>
          ) : null}
        </section>
      )}

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
          onClick={() => navigate("/mobile/register")}
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

      {/* Specialist bubbles — small round avatars, all active specialists */}
      {specialists.length > 0 && (
        <section className="mb-7">
          <div className="flex items-end justify-between px-5 mb-4">
            <h2 className="m-title">Uzmanlarımız</h2>
            <button
              onClick={() => navigate("/mobile/search")}
              className="text-[14px] font-semibold m-pressable"
              style={{ color: "hsl(var(--m-text-secondary))" }}
            >
              Tümü
            </button>
          </div>
          <div className="flex gap-4 px-5 overflow-x-auto m-no-scrollbar pb-2">
            {specialists.map((s, idx) => {
              // Title'ları temizle (Dr., Uzm., Prof., Doç., Dan.)
              const cleanName = (s.name || "")
                .replace(/(Prof\.?|Doç\.?|Dr\.?|Uzm\.?|Dan\.?|Op\.?)\s*/gi, "")
                .replace(/\s+/g, " ")
                .trim();
              const parts = cleanName.split(" ");
              const firstName = parts[0] || "";
              const lastName = parts.length > 1 ? parts.slice(1).join(" ") : "";
              return (
                <button
                  key={s.id}
                  onClick={() => navigate(`/mobile/specialist/${s.id}`)}
                  className="shrink-0 flex flex-col items-center gap-2 m-pressable"
                  style={{ width: 72 }}
                >
                  <div
                    className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center ring-2"
                    style={{
                      background: `hsl(${PASTEL_TINTS[idx % PASTEL_TINTS.length]})`,
                      boxShadow: "var(--m-shadow-sm)",
                      // @ts-ignore - CSS custom prop for ring color
                      "--tw-ring-color": "hsl(var(--m-surface))",
                    } as React.CSSProperties}
                  >
                    {s.profile_picture ? (
                      <img src={s.profile_picture} alt={s.name} loading="lazy" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[18px] font-bold" style={{ color: "hsl(var(--m-ink))" }}>
                        {cleanName.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="w-full text-center leading-tight">
                    <div
                      className="text-[11px] font-semibold truncate"
                      style={{ color: "hsl(var(--m-text-primary))" }}
                    >
                      {firstName}
                    </div>
                    {lastName && (
                      <div
                        className="text-[11px] font-semibold truncate"
                        style={{ color: "hsl(var(--m-text-primary))" }}
                      >
                        {lastName}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
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
              Uzman Desteği
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
          {tests.map((test, idx) => {
              const fallbackImg = TEST_IMAGES[idx % TEST_IMAGES.length];
              const img = pickTestImage(test, idx);
              return (
                <button
                  key={test.id}
                  onClick={() => navigate(`/mobile/tests/${test.id}`)}
                  className="shrink-0 w-[170px] rounded-[22px] overflow-hidden text-left m-pressable flex flex-col"
                  style={{
                    background: "hsl(var(--m-surface))",
                    boxShadow: "var(--m-shadow)",
                  }}
                >
                  <div
                    className="w-full h-[110px] overflow-hidden"
                    style={{ background: `hsl(${PASTEL_TINTS[(idx + 2) % PASTEL_TINTS.length]})` }}
                  >
                    <img
                      src={img}
                      alt={test.title}
                      loading="lazy"
                      width={340}
                      height={220}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (target.src !== fallbackImg && !target.src.endsWith(fallbackImg)) {
                          target.src = fallbackImg;
                        }
                      }}
                    />
                  </div>
                  <div className="p-3 flex-1 flex flex-col">
                    <p
                      className="text-[13px] font-bold leading-tight line-clamp-2"
                      style={{ color: "hsl(var(--m-text-primary))" }}
                    >
                      {test.title}
                    </p>
                    <span
                      className="mt-2 inline-flex items-center justify-center text-[11px] font-semibold rounded-full px-3 py-1.5 self-start"
                      style={{ background: "hsl(var(--m-surface-muted))", color: "hsl(var(--m-text-primary))" }}
                    >
                      Teste Başlayın
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

        </section>
      )}

      {/* Blog Posts — Random uzman blogları, her yenilemede değişir */}
      {blogs.length > 0 && (
        <section className="mb-7">
          <div className="flex items-end justify-between px-5 mb-4">
            <h2 className="m-title">Uzman Yazıları</h2>
            <button
              onClick={() => navigate("/mobile/blog")}
              className="text-[14px] font-semibold m-pressable"
              style={{ color: "hsl(var(--m-text-secondary))" }}
            >
              Tümü
            </button>
          </div>
          <div className="flex gap-3 px-5 overflow-x-auto m-no-scrollbar pb-2">
            {blogs.map((post, idx) => (
              <button
                key={post.id}
                onClick={() => navigate(`/mobile/blog/${post.slug}`)}
                className="shrink-0 w-[260px] rounded-[22px] overflow-hidden text-left m-pressable flex flex-col"
                style={{
                  background: "hsl(var(--m-surface))",
                  boxShadow: "var(--m-shadow)",
                }}
              >
                <div
                  className="w-full h-[140px] overflow-hidden relative"
                  style={{ background: `hsl(${PASTEL_TINTS[idx % PASTEL_TINTS.length]})` }}
                >
                  {post.featured_image ? (
                    <img
                      src={post.featured_image}
                      alt={post.title}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="w-10 h-10" style={{ color: "hsl(var(--m-ink) / 0.3)" }} strokeWidth={1.5} />
                    </div>
                  )}
                  <div
                    className="absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 h-6 rounded-full"
                    style={{ background: "hsl(var(--m-bg) / 0.92)" }}
                  >
                    <BookOpen className="w-3 h-3" style={{ color: "hsl(var(--m-ink))" }} strokeWidth={2.4} />
                    <span className="text-[10px] font-bold" style={{ color: "hsl(var(--m-ink))" }}>
                      Blog
                    </span>
                  </div>
                </div>
                <div className="p-3 flex-1 flex flex-col gap-2">
                  <p
                    className="text-[13.5px] font-bold leading-snug line-clamp-2"
                    style={{ color: "hsl(var(--m-text-primary))" }}
                  >
                    {post.title}
                  </p>
                  {post.excerpt && (
                    <p
                      className="text-[11.5px] leading-relaxed line-clamp-2"
                      style={{ color: "hsl(var(--m-text-secondary))" }}
                    >
                      {post.excerpt}
                    </p>
                  )}
                  {post.author_name && (
                    <div
                      className="flex items-center gap-1.5 mt-auto pt-2 border-t"
                      style={{ borderColor: "hsl(var(--m-divider))" }}
                    >
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold"
                        style={{ background: "hsl(var(--m-ink))", color: "hsl(var(--m-bg))" }}
                      >
                        {post.author_name.charAt(0).toUpperCase()}
                      </div>
                      <span
                        className="text-[11px] font-semibold truncate"
                        style={{ color: "hsl(var(--m-text-secondary))" }}
                      >
                        {post.author_name}
                      </span>
                    </div>
                  )}
                </div>
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
