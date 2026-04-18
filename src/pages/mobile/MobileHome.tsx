import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import {
  Search,
  Calendar,
  TestTube2,
  Brain,
  Heart,
  Star,
  UserPlus,
  Sparkles,
  ChevronRight,
  Quote,
} from "lucide-react";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { MobileSection } from "@/components/mobile/MobileSection";
import { MobileCard } from "@/components/mobile/MobileCard";
import { MobileListRow } from "@/components/mobile/MobileListRow";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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

export default function MobileHome() {
  const navigate = useNavigate();
  const { userProfile } = useUserRole();
  const [tests, setTests] = useState<Test[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [loading, setLoading] = useState(true);

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
            .limit(4),
          supabase.rpc("get_public_reviews", { p_limit: 3 }),
          supabase
            .from("specialists")
            .select("id,name,specialty,profile_picture,rating,experience,city")
            .eq("is_active", true)
            .limit(20),
        ]);

        if (cancelled) return;
        if (testsRes.data) setTests(testsRes.data as Test[]);
        if (reviewsRes.data) setReviews(reviewsRes.data as Review[]);
        if (specialistsRes.data) {
          const shuffled = [...specialistsRes.data].sort(() => Math.random() - 0.5);
          setSpecialists(shuffled.slice(0, 4) as Specialist[]);
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

  const categories = [
    { name: "Psikolog", icon: Brain, tone: "accent" as const },
    { name: "Aile Danışmanı", icon: Heart, tone: "pink" as const },
    { name: "Psikolojik Danışman", icon: Star, tone: "purple" as const },
  ];

  return (
    <div style={{ background: "hsl(var(--m-bg))" }}>
      <MobileHeader
        title={greeting}
        largeTitle={firstName}
        subtitle="Bugün size nasıl yardımcı olabiliriz?"
      />

      <div className="space-y-7 pb-8">
        {/* Quick actions row — Apple Health "summary" feel */}
        <MobileSection>
          <div className="grid grid-cols-2 gap-3">
            <MobileCard onClick={() => navigate("/mobile/search")} padding="md">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center mb-3"
                style={{ background: "hsl(var(--m-accent-soft))" }}
              >
                <Search className="w-5 h-5" style={{ color: "hsl(var(--m-accent))" }} />
              </div>
              <div
                className="text-[15px] font-semibold"
                style={{ color: "hsl(var(--m-text-primary))" }}
              >
                Uzman Ara
              </div>
              <div
                className="text-[13px] mt-0.5"
                style={{ color: "hsl(var(--m-text-secondary))" }}
              >
                Size en uygun uzmanı bulun
              </div>
            </MobileCard>

            <MobileCard onClick={() => navigate("/mobile/search")} padding="md">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center mb-3"
                style={{ background: "hsl(var(--m-success-soft))" }}
              >
                <Calendar className="w-5 h-5" style={{ color: "hsl(var(--m-success))" }} />
              </div>
              <div
                className="text-[15px] font-semibold"
                style={{ color: "hsl(var(--m-text-primary))" }}
              >
                Randevu Al
              </div>
              <div
                className="text-[13px] mt-0.5"
                style={{ color: "hsl(var(--m-text-secondary))" }}
              >
                Hemen oluştur
              </div>
            </MobileCard>
          </div>
        </MobileSection>

        {/* Specialist registration banner */}
        <MobileSection>
          <MobileCard onClick={() => navigate("/packages")} padding="md" showChevron>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                style={{ background: "hsl(var(--m-warning-soft))" }}
              >
                <UserPlus className="w-5 h-5" style={{ color: "hsl(var(--m-warning))" }} />
              </div>
              <div className="flex-1 min-w-0">
                <div
                  className="text-[15px] font-semibold"
                  style={{ color: "hsl(var(--m-text-primary))" }}
                >
                  Uzman Olarak Kayıt Ol
                </div>
                <div
                  className="text-[13px] mt-0.5"
                  style={{ color: "hsl(var(--m-text-secondary))" }}
                >
                  Platformumuza katılın
                </div>
              </div>
            </div>
          </MobileCard>
        </MobileSection>

        {/* Featured tests */}
        <MobileSection
          label="Sağlığınız"
          title="Psikolojik Testler"
          action={{ label: "Tümü", onClick: () => navigate("/mobile/search") }}
        >
          {loading ? (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-36 rounded-[16px] animate-pulse"
                  style={{ background: "hsl(var(--m-surface-muted))" }}
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {tests.map((test) => (
                <MobileCard
                  key={test.id}
                  onClick={() => navigate(`/test/${test.id}`)}
                  padding="md"
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center mb-3"
                    style={{ background: "hsl(var(--m-purple-soft))" }}
                  >
                    {test.image_url ? (
                      <img src={test.image_url} alt="" className="w-6 h-6 object-contain" />
                    ) : (
                      <TestTube2
                        className="w-5 h-5"
                        style={{ color: "hsl(var(--m-purple))" }}
                      />
                    )}
                  </div>
                  <div
                    className="text-[14px] font-semibold leading-tight line-clamp-2"
                    style={{ color: "hsl(var(--m-text-primary))" }}
                  >
                    {test.title}
                  </div>
                  {test.category && (
                    <div
                      className="text-[12px] mt-1"
                      style={{ color: "hsl(var(--m-text-secondary))" }}
                    >
                      {test.category}
                    </div>
                  )}
                </MobileCard>
              ))}
            </div>
          )}
        </MobileSection>

        {/* Specialists */}
        <MobileSection
          label="Topluluk"
          title="Uzmanlarımız"
          action={{ label: "Tümü", onClick: () => navigate("/mobile/search") }}
        >
          <div className="m-card divide-y" style={{ borderColor: "hsl(var(--m-divider))" }}>
            {loading
              ? [1, 2, 3].map((i) => (
                  <div key={i} className="h-16 animate-pulse" />
                ))
              : specialists.map((s) => (
                  <MobileListRow
                    key={s.id}
                    leading={
                      <Avatar className="w-11 h-11">
                        <AvatarImage src={s.profile_picture || undefined} alt={s.name} />
                        <AvatarFallback
                          style={{
                            background: "hsl(var(--m-accent-soft))",
                            color: "hsl(var(--m-accent))",
                          }}
                          className="font-semibold"
                        >
                          {s.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    }
                    title={s.name}
                    subtitle={`${s.specialty}${s.experience ? ` • ${s.experience} yıl` : ""}`}
                    trailing={
                      s.rating ? (
                        <div
                          className="flex items-center gap-1 text-[13px] font-semibold"
                          style={{ color: "hsl(var(--m-text-secondary))" }}
                        >
                          <Star
                            className="w-3.5 h-3.5"
                            style={{ color: "hsl(var(--m-warning))", fill: "hsl(var(--m-warning))" }}
                          />
                          {Number(s.rating).toFixed(1)}
                        </div>
                      ) : undefined
                    }
                    onClick={() => navigate(`/mobile/specialist/${s.id}`)}
                  />
                ))}
          </div>
        </MobileSection>

        {/* Categories */}
        <MobileSection label="Keşfet" title="Popüler Kategoriler">
          <div className="m-card divide-y" style={{ borderColor: "hsl(var(--m-divider))" }}>
            {categories.map((c) => (
              <MobileListRow
                key={c.name}
                icon={c.icon}
                iconTone={c.tone}
                title={c.name}
                onClick={() =>
                  navigate(`/mobile/search?specialty=${encodeURIComponent(c.name)}`)
                }
              />
            ))}
          </div>
        </MobileSection>

        {/* Reviews */}
        {reviews.length > 0 && (
          <MobileSection label="Geri bildirim" title="Danışan Yorumları">
            <div className="space-y-3">
              {reviews.map((r) => (
                <MobileCard key={r.id} padding="md">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: "hsl(var(--m-info-soft))" }}
                    >
                      <Quote className="w-4 h-4" style={{ color: "hsl(var(--m-info))" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-[14px] font-semibold"
                          style={{ color: "hsl(var(--m-text-primary))" }}
                        >
                          {r.reviewer_display_name || r.reviewer_name || "Anonim"}
                        </span>
                        <div className="flex">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className="w-3 h-3"
                              style={{
                                color:
                                  i < r.rating
                                    ? "hsl(var(--m-warning))"
                                    : "hsl(var(--m-divider))",
                                fill:
                                  i < r.rating
                                    ? "hsl(var(--m-warning))"
                                    : "hsl(var(--m-divider))",
                              }}
                            />
                          ))}
                        </div>
                      </div>
                      <p
                        className="text-[14px] mt-1.5 line-clamp-3"
                        style={{ color: "hsl(var(--m-text-secondary))" }}
                      >
                        {r.comment}
                      </p>
                      {r.specialist_name && (
                        <p
                          className="text-[12px] mt-2 font-medium"
                          style={{ color: "hsl(var(--m-accent))" }}
                        >
                          {r.specialist_name}
                          {r.specialist_specialty ? ` · ${r.specialist_specialty}` : ""}
                        </p>
                      )}
                    </div>
                  </div>
                </MobileCard>
              ))}
            </div>
          </MobileSection>
        )}

        {/* Footer hint */}
        <MobileSection>
          <div
            className="flex items-center justify-center gap-2 py-2 text-[12px]"
            style={{ color: "hsl(var(--m-text-tertiary))" }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            doktorumol.com.tr · Mobil
          </div>
        </MobileSection>
      </div>
    </div>
  );
}
