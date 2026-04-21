import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import {
  Star, MapPin, Video, Users, GraduationCap, Briefcase, Calendar,
  Heart, Award, Clock, Building2, Phone, BookOpen, ChevronDown, ChevronRight,
  CheckCircle2, MessageCircle, PencilLine, Send,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getCachedPublicSpecialists, setCachedPublicSpecialists } from "@/lib/mobileSpecialistsCache";
import WhatsAppContactDialog from "@/components/WhatsAppContactDialog";

interface Specialist {
  id: string;
  name: string;
  specialty: string;
  bio: string | null;
  profile_picture: string | null;
  rating: number | null;
  reviews_count: number | null;
  city: string | null;
  experience: number | null;
  education: string | null;
  hospital: string | null;
  university?: string | null;
  certifications?: string | null;
  online_consultation: boolean | null;
  face_to_face_consultation: boolean | null;
  address?: string | null;
  phone?: string | null;
  working_hours_start?: string | null;
  working_hours_end?: string | null;
  available_days?: string[] | null;
  faq?: string | null;
  slug?: string | null;
  interests?: string[] | null;
}

interface Review {
  id: string;
  reviewer_display_name?: string;
  reviewer_name?: string;
  comment: string;
  rating: number;
  created_at: string;
}

interface BlogPost {
  id: string;
  title: string;
  excerpt: string | null;
  slug: string;
  featured_image: string | null;
  published_at: string | null;
}

const DAY_LABEL: Record<string, string> = {
  monday: "Pzt", tuesday: "Sal", wednesday: "Çar", thursday: "Per",
  friday: "Cum", saturday: "Cmt", sunday: "Paz",
  pazartesi: "Pzt", sali: "Sal", carsamba: "Çar", persembe: "Per",
  cuma: "Cum", cumartesi: "Cmt", pazar: "Paz",
};

export default function MobileSpecialistDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [specialist, setSpecialist] = useState<Specialist | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [bioExpanded, setBioExpanded] = useState(false);
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [waOpen, setWaOpen] = useState(false);

  const loadReviews = async (specId: string) => {
    const { data: rev } = await supabase.rpc("get_public_reviews", {
      p_limit: 20, p_specialist_id: specId,
    });
    if (rev) setReviews(rev as Review[]);
  };

  useEffect(() => {
    let cancelled = false;
    const cachedSummary = id
      ? getCachedPublicSpecialists()?.find((item) => item.id === id) ?? null
      : null;

    if (cachedSummary) {
      setSpecialist(cachedSummary as Specialist);
      setLoading(false);
    }

    (async () => {
      try {
        let summary = cachedSummary;

        if (!summary) {
          setLoading(true);
          const { data: list, error } = await supabase.rpc("get_public_specialists");
          if (error) throw error;

          const nextList = ((list as any[]) || []) as Specialist[];
          setCachedPublicSpecialists(nextList);
          summary = nextList.find((s) => s.id === id) ?? null;
        }

        if (!summary) {
          if (!cancelled) {
            setSpecialist(null);
            setLoading(false);
          }
          return;
        }

        if (!cancelled) {
          setSpecialist(summary as Specialist);
          setLoading(false);
        }

        const reviewsPromise = supabase.rpc("get_public_reviews", {
          p_limit: 10, p_specialist_id: id,
        });
        const fullPromise = summary.slug
          ? supabase.rpc("get_public_specialist_by_slug", { p_slug: summary.slug })
          : Promise.resolve({ data: null });

        const [{ data: rev }, { data: bySlug }] = await Promise.all([reviewsPromise, fullPromise]);

        let full: any = summary;
        if (bySlug && (bySlug as any[]).length > 0) {
          full = { ...summary, ...(bySlug as any[])[0] };
        }

        if (!cancelled) {
          setSpecialist(full as Specialist);
          if (rev) setReviews(rev as Review[]);
        }

        if (full?.user_id || full?.id) {
          const { data: blog } = await supabase
            .from("blog_posts")
            .select("id,title,excerpt,slug,featured_image,published_at")
            .eq("status", "published")
            .or(`specialist_id.eq.${full.id}${full.user_id ? `,author_id.eq.${full.user_id}` : ""}`)
            .order("published_at", { ascending: false })
            .limit(3);
          if (!cancelled && blog) setPosts(blog as BlogPost[]);
        }
      } catch (e) {
        console.error(e);
        toast({ title: "Hata", description: "Uzman bilgileri yüklenemedi", variant: "destructive" });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id, toast]);

  if (loading) {
    return (
      <div style={{ background: "hsl(var(--m-bg))", minHeight: "100vh" }}>
        <MobileHeader showBack />
        <div className="px-5 space-y-3">
          <div className="h-[360px] rounded-[28px] animate-pulse" style={{ background: "hsl(var(--m-surface-muted))" }} />
        </div>
      </div>
    );
  }

  if (!specialist) {
    return (
      <div style={{ background: "hsl(var(--m-bg))", minHeight: "100vh" }}>
        <MobileHeader showBack title="Uzman" />
        <p className="px-5 text-center py-12" style={{ color: "hsl(var(--m-text-secondary))" }}>
          Uzman bulunamadı
        </p>
      </div>
    );
  }

  const avgRating = specialist.rating ? Number(specialist.rating).toFixed(1) : null;
  const bioPreview = specialist.bio && specialist.bio.length > 220 && !bioExpanded
    ? specialist.bio.slice(0, 220) + "…"
    : specialist.bio;

  return (
    <div style={{ background: "hsl(var(--m-bg))", minHeight: "100vh", paddingBottom: 140 }} className="w-full max-w-full overflow-x-hidden">
      <MobileHeader
        showBack
        trailing={
          <button
            className="w-10 h-10 rounded-full flex items-center justify-center m-pressable"
            style={{ background: "hsl(var(--m-surface))", boxShadow: "var(--m-shadow)" }}
            aria-label="Favorilere ekle"
          >
            <Heart className="w-5 h-5" style={{ color: "hsl(var(--m-ink))" }} />
          </button>
        }
      />

      {/* Specialty + name */}
      <div className="px-5 pt-2">
        <p className="text-[13px] font-medium" style={{ color: "hsl(var(--m-text-secondary))" }}>
          {specialist.specialty}
        </p>
        <h1
          className="mt-1 font-extrabold leading-[1.15] break-words"
          style={{
            color: "hsl(var(--m-text-primary))",
            fontSize: "clamp(20px, 6vw, 26px)",
            letterSpacing: "-0.02em",
          }}
        >
          {specialist.name}
        </h1>
      </div>

      {/* Hero image — image-only, no padding/background fill */}
      <div className="px-5 mt-4">
        <div
          className="relative rounded-[24px] overflow-hidden w-full aspect-[4/5]"
          style={{
            background: "hsl(var(--m-surface-muted))",
            boxShadow: "var(--m-shadow-md)",
          }}
        >
          {specialist.profile_picture ? (
            <img
              src={specialist.profile_picture}
              alt={specialist.name}
              className="absolute inset-0 w-full h-full object-cover object-center"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[120px] font-bold" style={{ color: "hsl(var(--m-text-tertiary))" }}>
                {specialist.name.charAt(0)}
              </span>
            </div>
          )}

          {avgRating && (
            <div
              className="absolute top-3 right-3 rounded-full px-3 h-8 flex items-center gap-1.5"
              style={{ background: "hsl(var(--m-ink))" }}
            >
              <Star className="w-3.5 h-3.5" style={{ color: "hsl(var(--m-warning))", fill: "hsl(var(--m-warning))" }} />
              <span className="text-[13px] font-bold" style={{ color: "hsl(var(--m-bg))" }}>
                {avgRating}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Quick stats row */}
      <div className="px-5 mt-4 grid grid-cols-3 gap-2">
        <StatPill
          icon={Briefcase}
          value={specialist.experience ? `${specialist.experience}+` : "—"}
          label="yıl deneyim"
        />
        <StatPill
          icon={CheckCircle2}
          value="✓"
          label="Onaylı Profil"
        />
        <StatPill
          icon={Star}
          value={avgRating || "—"}
          label="puan"
        />
      </div>

      {/* Consultation type pills */}
      <div className="px-5 mt-4 flex gap-2">
        {specialist.online_consultation && (
          <div
            className="flex-1 h-12 rounded-full flex items-center justify-center gap-2 text-[14px] font-bold"
            style={{ background: "hsl(var(--m-tint-sky))", color: "hsl(var(--m-text-primary))" }}
          >
            <Video className="w-4 h-4" /> Online
          </div>
        )}
        {specialist.face_to_face_consultation && (
          <div
            className="flex-1 h-12 rounded-full flex items-center justify-center gap-2 text-[14px] font-bold"
            style={{ background: "hsl(var(--m-tint-mint))", color: "hsl(var(--m-text-primary))" }}
          >
            <Users className="w-4 h-4" /> Yüz Yüze
          </div>
        )}
      </div>

      {/* Hakkında */}
      {specialist.bio && (
        <Section title="Hakkında">
          <p
            className="text-[15px] leading-relaxed whitespace-pre-line"
            style={{ color: "hsl(var(--m-text-secondary))" }}
          >
            {bioPreview}
          </p>
          {specialist.bio.length > 220 && (
            <button
              onClick={() => setBioExpanded((v) => !v)}
              className="mt-2 text-[14px] font-semibold flex items-center gap-1"
              style={{ color: "hsl(var(--m-ink))" }}
            >
              {bioExpanded ? "Daha az göster" : "Devamını oku"}
              <ChevronDown className={`w-4 h-4 transition-transform ${bioExpanded ? "rotate-180" : ""}`} />
            </button>
          )}
        </Section>
      )}

      {/* İlgi Alanları */}
      {specialist.interests && specialist.interests.length > 0 && (
        <Section title="İlgi Alanları">
          <div className="flex flex-wrap gap-2">
            {specialist.interests.map((item) => (
              <span
                key={item}
                className="inline-flex items-center px-3 py-1.5 rounded-full text-[12px] font-semibold"
                style={{
                  background: "hsl(var(--m-accent))",
                  color: "hsl(var(--m-bg))",
                }}
              >
                {item}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* Eğitim & Mesleki Bilgiler */}
      {(specialist.education || specialist.university || specialist.certifications) && (
        <Section title="Eğitim & Sertifikalar">
          <div className="space-y-3">
            {specialist.university && (
              <DetailRow icon={GraduationCap} label="Üniversite" value={specialist.university} />
            )}
            {specialist.education && (
              <DetailRow icon={BookOpen} label="Eğitim" value={specialist.education} multiline />
            )}
            {specialist.certifications && (
              <DetailRow icon={Award} label="Sertifikalar" value={specialist.certifications} multiline />
            )}
          </div>
        </Section>
      )}

      {/* İletişim & Çalışma Yeri */}
      {(specialist.hospital || specialist.address || specialist.city) && (
        <Section title="İletişim & Konum">
          <div className="space-y-3">
            {specialist.hospital && (
              <DetailRow icon={Building2} label="Çalıştığı Yer" value={specialist.hospital} />
            )}
            {specialist.address && (
              <DetailRow icon={MapPin} label="Adres" value={specialist.address} multiline />
            )}
            {specialist.city && !specialist.address && (
              <DetailRow icon={MapPin} label="Şehir" value={specialist.city} />
            )}
          </div>
        </Section>
      )}

      {/* Çalışma Saatleri */}
      {(specialist.working_hours_start || (specialist.available_days && specialist.available_days.length > 0)) && (
        <Section title="Çalışma Saatleri">
          <div
            className="rounded-[20px] p-5"
            style={{ background: "hsl(var(--m-surface))", boxShadow: "var(--m-shadow)" }}
          >
            {specialist.working_hours_start && specialist.working_hours_end && (
              <div className="flex items-center gap-3 mb-4 pb-4 border-b" style={{ borderColor: "hsl(var(--m-divider))" }}>
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center"
                  style={{ background: "hsl(var(--m-tint-mint))" }}
                >
                  <Clock className="w-5 h-5" style={{ color: "hsl(var(--m-ink))" }} />
                </div>
                <div>
                  <div className="text-[12px] font-medium" style={{ color: "hsl(var(--m-text-secondary))" }}>
                    Saatler
                  </div>
                  <div className="text-[16px] font-bold" style={{ color: "hsl(var(--m-text-primary))" }}>
                    {specialist.working_hours_start} – {specialist.working_hours_end}
                  </div>
                </div>
              </div>
            )}
            {specialist.available_days && specialist.available_days.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {specialist.available_days.map((d) => (
                  <span
                    key={d}
                    className="px-3 h-8 rounded-full inline-flex items-center text-[13px] font-semibold"
                    style={{ background: "hsl(var(--m-tint-sky))", color: "hsl(var(--m-text-primary))" }}
                  >
                    {DAY_LABEL[String(d).toLowerCase()] || d}
                  </span>
                ))}
              </div>
            )}
          </div>
        </Section>
      )}

      {/* SSS / FAQ */}
      {specialist.faq && (
        <Section title="Sıkça Sorulan Sorular">
          <FaqList raw={specialist.faq} openIdx={openFaqIdx} setOpenIdx={setOpenFaqIdx} />
        </Section>
      )}

      {/* Blog Yazıları */}
      {posts.length > 0 && (
        <Section title="Blog Yazıları">
          <div className="space-y-3">
            {posts.map((p) => (
              <button
                key={p.id}
                onClick={() => navigate(`/blog/${p.slug}`)}
                className="w-full flex items-center gap-3 p-3 rounded-[20px] text-left m-pressable"
                style={{ background: "hsl(var(--m-surface))", boxShadow: "var(--m-shadow)" }}
              >
                {p.featured_image ? (
                  <img
                    src={p.featured_image}
                    alt={p.title}
                    className="w-16 h-16 rounded-2xl object-cover flex-shrink-0"
                  />
                ) : (
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "hsl(var(--m-tint-lilac))" }}
                  >
                    <BookOpen className="w-6 h-6" style={{ color: "hsl(var(--m-ink))" }} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-bold line-clamp-2" style={{ color: "hsl(var(--m-text-primary))" }}>
                    {p.title}
                  </div>
                  {p.excerpt && (
                    <div className="text-[12px] mt-1 line-clamp-1" style={{ color: "hsl(var(--m-text-secondary))" }}>
                      {p.excerpt}
                    </div>
                  )}
                </div>
                <ChevronRight className="w-5 h-5 flex-shrink-0" style={{ color: "hsl(var(--m-text-tertiary))" }} />
              </button>
            ))}
          </div>
        </Section>
      )}

      {/* Danışan Yorumları */}
      {reviews.length > 0 && (
        <Section title={`Danışan Yorumları (${reviews.length})`}>
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
                  className="text-[14px] leading-relaxed"
                  style={{ color: "hsl(var(--m-text-primary))" }}
                >
                  {r.comment}
                </p>
                <div className="text-[12px] font-semibold mt-3" style={{ color: "hsl(var(--m-text-secondary))" }}>
                  {r.reviewer_display_name || r.reviewer_name || "Anonim"}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Sticky CTA */}
      <div
        className="fixed bottom-0 left-0 right-0 px-5 pt-3"
        style={{
          paddingBottom: "calc(96px + var(--m-safe-bottom))",
          background: "linear-gradient(to top, hsl(var(--m-bg)) 60%, hsl(var(--m-bg) / 0))",
        }}
      >
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/mobile/booking/${specialist.id}`)}
            className="flex-1 h-12 rounded-full font-bold text-[14px] flex items-center justify-center gap-2 m-pressable"
            style={{
              background: "hsl(var(--m-ink))",
              color: "hsl(var(--m-bg))",
              boxShadow: "0 8px 24px -6px hsl(220 30% 10% / 0.35)",
            }}
          >
            <Calendar className="w-4 h-4" /> Randevu Al
          </button>
          <button
            onClick={() => setReviewOpen(true)}
            aria-label="Değerlendirme yaz"
            className="w-12 h-12 rounded-full flex items-center justify-center m-pressable shrink-0"
            style={{
              background: "hsl(var(--m-tint-peach))",
              color: "hsl(var(--m-text-primary))",
              boxShadow: "var(--m-shadow)",
            }}
          >
            <PencilLine className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setWaOpen(true)}
            aria-label="WhatsApp"
            className="w-12 h-12 rounded-full flex items-center justify-center m-pressable shrink-0"
            style={{
              background: "hsl(var(--m-tint-mint))",
              color: "hsl(var(--m-text-primary))",
              boxShadow: "var(--m-shadow)",
            }}
          >
            <MessageCircle className="w-4 h-4" />
          </button>
          <a
            href={`tel:${specialist.phone || "02167060611"}`}
            aria-label="Ara"
            className="w-12 h-12 rounded-full flex items-center justify-center m-pressable shrink-0"
            style={{
              background: "hsl(var(--m-tint-sky))",
              color: "hsl(var(--m-text-primary))",
              boxShadow: "var(--m-shadow)",
            }}
          >
            <Phone className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Review Dialog */}
      <ReviewDialog
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        specialistId={specialist.id}
        specialistName={specialist.name}
        onSubmitted={() => loadReviews(specialist.id)}
      />

      {/* WhatsApp Contact Dialog */}
      <WhatsAppContactDialog
        open={waOpen}
        onOpenChange={setWaOpen}
        specialistName={specialist.name}
        specialistSpecialty={specialist.specialty}
        specialistUrl={typeof window !== "undefined" ? window.location.href : ""}
      />
    </div>
  );
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="px-5 mt-7">
    <h2 className="m-title mb-3" style={{ fontSize: 20 }}>{title}</h2>
    {children}
  </section>
);

const StatPill = ({ icon: Icon, value, label }: { icon: any; value: string; label: string }) => (
  <div
    className="rounded-[20px] p-4 text-center flex flex-col items-center justify-center gap-1.5"
    style={{
      background: "hsl(var(--m-surface))",
      boxShadow: "0 4px 16px -4px hsl(220 30% 15% / 0.08)",
      border: "1px solid hsl(var(--m-text-primary) / 0.04)",
    }}
  >
    <div
      className="w-9 h-9 rounded-full flex items-center justify-center"
      style={{ background: "hsl(var(--m-surface-muted))" }}
    >
      <Icon className="w-4 h-4" style={{ color: "hsl(var(--m-ink))" }} strokeWidth={2.2} />
    </div>
    <div className="text-[18px] font-extrabold leading-none tracking-tight" style={{ color: "hsl(var(--m-text-primary))" }}>
      {value}
    </div>
    <div className="text-[11px] font-semibold leading-tight" style={{ color: "hsl(var(--m-text-secondary))" }}>
      {label}
    </div>
  </div>
);

const DetailRow = ({
  icon: Icon, label, value, multiline,
}: { icon: any; label: string; value: string; multiline?: boolean }) => (
  <div
    className="flex items-start gap-4 p-4 rounded-[20px]"
    style={{ background: "hsl(var(--m-surface))", boxShadow: "var(--m-shadow)" }}
  >
    <div
      className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
      style={{ background: "hsl(var(--m-surface-muted))" }}
    >
      <Icon className="w-5 h-5" style={{ color: "hsl(var(--m-ink))" }} />
    </div>
    <div className="flex-1 min-w-0">
      <div className="text-[12px] font-medium" style={{ color: "hsl(var(--m-text-secondary))" }}>{label}</div>
      <div
        className={`text-[14px] font-semibold mt-0.5 ${multiline ? "whitespace-pre-line" : ""}`}
        style={{ color: "hsl(var(--m-text-primary))" }}
      >
        {value}
      </div>
    </div>
  </div>
);

// FAQ accordion — supports JSON array [{question,answer}] or plain text
const FaqList = ({
  raw, openIdx, setOpenIdx,
}: { raw: string; openIdx: number | null; setOpenIdx: (i: number | null) => void }) => {
  let items: { question: string; answer: string }[] = [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      items = parsed
        .map((it: any) => ({
          question: String(it?.question || it?.q || "").trim(),
          answer: String(it?.answer || it?.a || "").trim(),
        }))
        .filter((it) => it.question && it.answer);
    }
  } catch {
    // not JSON — try splitting "Q: ... A: ..." patterns or just show raw
  }

  if (items.length === 0) {
    return (
      <div
        className="rounded-[20px] p-5 text-[15px] leading-relaxed whitespace-pre-line"
        style={{
          background: "hsl(var(--m-surface))",
          boxShadow: "var(--m-shadow)",
          color: "hsl(var(--m-text-secondary))",
        }}
      >
        {raw}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((it, idx) => {
        const open = openIdx === idx;
        return (
          <div
            key={idx}
            className="rounded-[18px] overflow-hidden"
            style={{ background: "hsl(var(--m-surface))", boxShadow: "var(--m-shadow)" }}
          >
            <button
              onClick={() => setOpenIdx(open ? null : idx)}
              className="w-full flex items-center justify-between gap-3 p-4 text-left m-pressable"
            >
              <span
                className="text-[14px] font-bold flex-1"
                style={{ color: "hsl(var(--m-text-primary))" }}
              >
                {it.question}
              </span>
              <ChevronDown
                className={`w-4 h-4 transition-transform flex-shrink-0 ${open ? "rotate-180" : ""}`}
                style={{ color: "hsl(var(--m-text-secondary))" }}
              />
            </button>
            {open && (
              <div
                className="px-4 pb-4 text-[14px] leading-relaxed whitespace-pre-line"
                style={{ color: "hsl(var(--m-text-secondary))" }}
              >
                {it.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// Review submission dialog
const ReviewDialog = ({
  open, onOpenChange, specialistId, specialistName, onSubmitted,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  specialistId: string;
  specialistName: string;
  onSubmitted: () => void;
}) => {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (rating === 0) {
      toast({ title: "Puan gerekli", description: "Lütfen 1-5 arası puan verin", variant: "destructive" });
      return;
    }
    if (!name.trim() || !email.trim() || !comment.trim()) {
      toast({ title: "Eksik bilgi", description: "Tüm alanları doldurun", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("reviews").insert({
        specialist_id: specialistId,
        reviewer_name: name.trim(),
        reviewer_email: email.trim(),
        comment: comment.trim(),
        rating,
        status: "pending",
      });
      if (error) throw error;
      toast({ title: "Teşekkürler", description: "Yorumunuz onaya gönderildi" });
      setName(""); setEmail(""); setComment(""); setRating(0);
      onOpenChange(false);
      onSubmitted();
    } catch (e: any) {
      toast({ title: "Hata", description: e.message || "Gönderilemedi", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Değerlendirme Yaz</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground -mt-2">
          {specialistName} için deneyiminizi paylaşın.
        </p>
        <div className="flex items-center gap-1 my-2">
          {Array.from({ length: 5 }).map((_, i) => {
            const v = i + 1;
            return (
              <button key={i} type="button" onClick={() => setRating(v)} aria-label={`${v} yıldız`}>
                <Star
                  className="w-8 h-8 transition-colors"
                  style={{
                    color: v <= rating ? "hsl(var(--m-warning))" : "hsl(var(--m-divider))",
                    fill: v <= rating ? "hsl(var(--m-warning))" : "transparent",
                  }}
                />
              </button>
            );
          })}
        </div>
        <Input placeholder="Ad Soyad" value={name} onChange={(e) => setName(e.target.value)} />
        <Input placeholder="E-posta" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Textarea
          placeholder="Yorumunuz..."
          rows={4}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        <button
          onClick={submit}
          disabled={submitting}
          className="w-full h-12 rounded-full font-bold flex items-center justify-center gap-2 mt-2"
          style={{ background: "hsl(var(--m-ink))", color: "hsl(var(--m-bg))" }}
        >
          <Send className="w-4 h-4" />
          {submitting ? "Gönderiliyor..." : "Gönder"}
        </button>
      </DialogContent>
    </Dialog>
  );
};
