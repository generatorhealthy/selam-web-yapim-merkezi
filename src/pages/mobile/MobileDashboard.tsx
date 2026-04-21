import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import {
  Calendar, Clock, CheckCircle2, CheckCheck, FileSignature, ClipboardList,
  MessageSquare, FileText, CreditCard, Users, User, Bell, Settings,
  TrendingUp, Star, ChevronRight, Stethoscope, MapPin, Video, X, Check, Eye,
  Share2, Copy, MessageCircle, Gift, Sparkles,
} from "lucide-react";

interface UpcomingAppt {
  id: string;
  patient_name: string;
  patient_phone?: string | null;
  patient_email?: string | null;
  appointment_date: string;
  appointment_time: string;
  appointment_type: string;
  status: string;
  consultation_topic?: string | null;
}

const TONE_PALETTE = [
  { bg: "var(--m-tint-peach)", label: "Bekleyen" },
  { bg: "var(--m-tint-sand)",  label: "Onaylanan" },
  { bg: "var(--m-tint-mint)",  label: "Tamamlanan" },
  { bg: "var(--m-tint-lilac)", label: "Toplam" },
];

export default function MobileDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [spec, setSpec] = useState<any>(null);
  const [stats, setStats] = useState({ total: 0, pending: 0, confirmed: 0, completed: 0 });
  const [badges, setBadges] = useState({ appts: 0, blog: 0, support: 0 });
  const [upcoming, setUpcoming] = useState<UpcomingAppt[]>([]);
  const [pendingReqs, setPendingReqs] = useState<UpcomingAppt[]>([]);
  const [actingId, setActingId] = useState<string | null>(null);
  const [referral, setReferral] = useState<{
    code: string | null;
    total_referrals: number;
    qualified_referrals: number;
    granted_referrals: number;
    total_bonus_months: number;
    pending_bonus_months: number;
  }>({ code: null, total_referrals: 0, qualified_referrals: 0, granted_referrals: 0, total_bonus_months: 0, pending_bonus_months: 0 });

  const refreshAppts = async (specialistId: string) => {
    const { data: appts } = await supabase
      .from("appointments")
      .select("id, patient_name, patient_phone, patient_email, appointment_date, appointment_time, appointment_type, status, consultation_topic")
      .eq("specialist_id", specialistId);

    const list = appts || [];
    const total = list.length;
    const pending = list.filter((a) => a.status === "pending").length;
    const confirmed = list.filter((a) => a.status === "confirmed").length;
    const completed = list.filter((a) => a.status === "completed").length;
    setStats({ total, pending, confirmed, completed });

    const todayStr = new Date().toISOString().slice(0, 10);
    const sortKey = (a: any) => `${a.appointment_date}T${a.appointment_time}`;

    // Pending requests (any date), newest opportunity first
    const pendings = list
      .filter((a) => a.status === "pending")
      .sort((a, b) => sortKey(a).localeCompare(sortKey(b)))
      .slice(0, 6);
    setPendingReqs(pendings as UpcomingAppt[]);

    // Upcoming confirmed only (today onwards)
    const up = list
      .filter((a) => a.appointment_date >= todayStr && (a.status === "confirmed" || a.status === "completed"))
      .sort((a, b) => sortKey(a).localeCompare(sortKey(b)))
      .slice(0, 6);
    setUpcoming(up as UpcomingAppt[]);

    return { pending };
  };

  useEffect(() => {
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) { navigate("/mobile/login"); return; }

        const { data: s } = await supabase
          .from("specialists")
          .select("id, name, email, specialty, profile_picture, city, rating, reviews_count, experience, slug")
          .or(`user_id.eq.${session.user.id},email.eq.${session.user.email}`)
          .maybeSingle();

        if (!s) { navigate("/mobile/login"); return; }
        setSpec(s);

        const result = await refreshAppts(s.id);

        // Referral summary
        try {
          const { data: refSummary } = await supabase.rpc("get_my_referral_summary");
          if (refSummary && refSummary.length > 0) {
            const r = refSummary[0];
            setReferral({
              code: r.code ?? null,
              total_referrals: r.total_referrals ?? 0,
              qualified_referrals: r.qualified_referrals ?? 0,
              granted_referrals: r.granted_referrals ?? 0,
              total_bonus_months: r.total_bonus_months ?? 0,
              pending_bonus_months: r.pending_bonus_months ?? 0,
            });
          }
        } catch (e) {
          console.warn("referral summary load failed", e);
        }

        const { count: openTickets } = await supabase
          .from("support_tickets" as any)
          .select("*", { count: "exact", head: true })
          .eq("specialist_id", s.id)
          .eq("status", "open");

        const { count: unreadBlog } = await supabase
          .from("blog_notifications" as any)
          .select("*", { count: "exact", head: true })
          .eq("specialist_id", s.id)
          .eq("read", false);

        setBadges({ appts: result?.pending || 0, blog: unreadBlog || 0, support: openTickets || 0 });
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  const handleAct = async (id: string, action: "confirmed" | "cancelled") => {
    if (actingId) return;
    setActingId(id);
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ status: action })
        .eq("id", id);
      if (error) throw error;
      toast({
        title: action === "confirmed" ? "Randevu onaylandı" : "Randevu reddedildi",
      });
      if (spec?.id) await refreshAppts(spec.id);
    } catch (e: any) {
      toast({ title: "Hata", description: e?.message || "İşlem yapılamadı", variant: "destructive" });
    } finally {
      setActingId(null);
    }
  };

  const initial = (spec?.name || "U").charAt(0).toUpperCase();

  const profileUrl = "https://doktorumol.com.tr";
  const referralShareMessage = referral.code
    ? `Merhaba 👋\n\nDoktorumol.com.tr platformunu sana öneriyorum. Aşağıdaki davet kodumu kullanarak kayıt olabilirsin:\n\n🎁 Davet kodum: ${referral.code}\n\nKayıt linki: ${profileUrl}/kayit-ol?ref=${referral.code}\n\nGörüşmek üzere!`
    : "";
  const refWa = referral.code ? `https://wa.me/?text=${encodeURIComponent(referralShareMessage)}` : "#";
  const refSms = referral.code ? `sms:?&body=${encodeURIComponent(referralShareMessage)}` : "#";
  const copyRefCode = async () => {
    if (!referral.code) return;
    try {
      await navigator.clipboard.writeText(referral.code);
      toast({ title: "Davet kodu kopyalandı", description: referral.code });
    } catch {
      toast({ title: "Kopyalanamadı", variant: "destructive" });
    }
  };
  const nativeShareReferral = async () => {
    if (!referral.code) return;
    if ((navigator as any).share) {
      try {
        await (navigator as any).share({
          title: "Doktorumol davet kodum",
          text: referralShareMessage,
          url: `${profileUrl}/kayit-ol?ref=${referral.code}`,
        });
        return;
      } catch {}
    }
    copyRefCode();
  };

  return (
    <div style={{ background: "hsl(var(--m-bg))", minHeight: "100vh", paddingBottom: 110 }} className="w-full max-w-full overflow-x-hidden">
      <div className="m-safe-top" />

      {/* === Profile hero card === */}
      <div className="px-5 mb-5">
        <div
          className="rounded-[28px] p-5 flex items-center gap-4"
          style={{ background: "hsl(var(--m-surface))", boxShadow: "var(--m-shadow-md)" }}
        >
          {spec?.profile_picture ? (
            <img
              src={spec.profile_picture}
              alt={spec?.name}
              className="w-20 h-20 rounded-[22px] object-cover"
              style={{ boxShadow: "var(--m-shadow-sm)" }}
            />
          ) : (
            <div
              className="w-20 h-20 rounded-[22px] flex items-center justify-center"
              style={{ background: "hsl(var(--m-accent-soft))" }}
            >
              <span className="text-[28px] font-bold" style={{ color: "hsl(var(--m-accent))" }}>{initial}</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-[18px] leading-tight truncate" style={{ color: "hsl(var(--m-text-primary))" }}>
              {loading ? "..." : spec?.name}
            </h2>
            <div className="flex items-center gap-1.5 mt-1">
              <Stethoscope className="w-3.5 h-3.5" style={{ color: "hsl(var(--m-text-secondary))" }} />
              <span className="text-[12.5px] font-medium truncate" style={{ color: "hsl(var(--m-text-secondary))" }}>
                {spec?.specialty || "Uzman"}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-2">
              {spec?.city && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" style={{ color: "hsl(var(--m-text-tertiary))" }} />
                  <span className="text-[11px]" style={{ color: "hsl(var(--m-text-tertiary))" }}>{spec.city}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3" style={{ color: "hsl(var(--m-warning))", fill: "hsl(var(--m-warning))" }} />
                <span className="text-[11px] font-semibold" style={{ color: "hsl(var(--m-text-primary))" }}>
                  {spec?.rating ? Number(spec.rating).toFixed(1) : "—"}
                </span>
                <span className="text-[11px]" style={{ color: "hsl(var(--m-text-tertiary))" }}>
                  ({spec?.reviews_count || 0})
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* === Stat cards — modern pastel === */}
      <div className="mb-6">
        <div className="flex items-center justify-between px-5 mb-3">
          <h3 className="text-[18px] font-bold" style={{ color: "hsl(var(--m-text-primary))" }}>Randevular</h3>
          <button
            onClick={() => navigate("/mobile/specialist-appointments")}
            className="text-[12px] font-semibold m-pressable"
            style={{ color: "hsl(var(--m-text-secondary))" }}
          >
            Tümü
          </button>
        </div>
        <div className="px-5 grid grid-cols-3 gap-2.5">
          {[
            {
              value: stats.pending,
              label: "Bekleyen",
              icon: Clock,
              iconBg: "hsl(38 95% 92%)",
              iconColor: "hsl(28 85% 45%)",
            },
            {
              value: stats.confirmed,
              label: "Onaylanan",
              icon: CheckCircle2,
              iconBg: "hsl(217 91% 95%)",
              iconColor: "hsl(217 91% 50%)",
            },
            {
              value: stats.completed,
              label: "Tamamlanan",
              icon: CheckCheck,
              iconBg: "hsl(142 65% 92%)",
              iconColor: "hsl(142 65% 35%)",
            },
          ].map((it, idx) => {
            const Icon = it.icon;
            return (
              <button
                key={idx}
                onClick={() => navigate("/mobile/specialist-appointments")}
                className="rounded-[20px] p-3.5 flex flex-col items-start gap-2.5 m-pressable text-left"
                style={{
                  background: "hsl(var(--m-surface))",
                  boxShadow: "var(--m-shadow-sm)",
                  border: "1px solid hsl(var(--m-text-primary) / 0.04)",
                }}
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ background: it.iconBg }}
                >
                  <Icon className="w-4 h-4" style={{ color: it.iconColor }} strokeWidth={2.4} />
                </div>
                <div className="w-full">
                  <div
                    className="text-[24px] font-bold leading-none"
                    style={{ color: "hsl(var(--m-text-primary))", letterSpacing: "-0.02em" }}
                  >
                    {it.value}
                  </div>
                  <div
                    className="text-[11.5px] font-semibold mt-1.5"
                    style={{ color: "hsl(var(--m-text-secondary))" }}
                  >
                    {it.label}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* === Yorum İste — paylaşım kartı === */}
      {spec && (() => {
        const profileUrl = `https://doktorumol.com.tr/${spec.slug || spec.id}`;
        const message = `Merhaba, ${spec.name} ile yaptığınız görüşme hakkında değerli yorumunuzu bekliyorum. Aşağıdaki linkten profilime ulaşıp yorum bırakabilirsiniz:\n\n${profileUrl}\n\nTeşekkür ederim 🙏`;
        const wa = `https://wa.me/?text=${encodeURIComponent(message)}`;
        const sms = `sms:?&body=${encodeURIComponent(message)}`;
        const copyLink = async () => {
          try {
            await navigator.clipboard.writeText(profileUrl);
            toast({ title: "Profil linki kopyalandı" });
          } catch {
            toast({ title: "Kopyalanamadı", variant: "destructive" });
          }
        };
        const nativeShare = async () => {
          if ((navigator as any).share) {
            try {
              await (navigator as any).share({
                title: `${spec.name} — Yorum bırakın`,
                text: message,
                url: profileUrl,
              });
              return;
            } catch {}
          }
          copyLink();
        };
        return (
          <div className="px-5 mb-6">
            <div
              className="rounded-[24px] p-5 relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg, hsl(263 70% 58%) 0%, hsl(217 91% 60%) 100%)",
                boxShadow: "0 14px 32px -10px hsl(263 70% 50% / 0.5)",
              }}
            >
              <div
                className="absolute -top-6 -right-6 w-28 h-28 rounded-full"
                style={{ background: "hsl(0 0% 100% / 0.08)" }}
              />
              <div
                className="absolute -bottom-8 -left-4 w-20 h-20 rounded-full"
                style={{ background: "hsl(0 0% 100% / 0.06)" }}
              />

              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: "hsl(0 0% 100% / 0.2)" }}
                  >
                    <Star className="w-4 h-4 text-white" fill="white" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-white/85">
                    Danışan Yorumu Topla
                  </span>
                </div>
                <h3 className="text-[18px] font-bold text-white leading-tight mb-1.5">
                  Profilinizi danışanlarınızla paylaşın
                </h3>
                <p className="text-[12.5px] text-white/80 mb-4 leading-snug">
                  Daha fazla yorum, daha fazla güven ve daha çok danışan demektir.
                </p>

                <div className="grid grid-cols-3 gap-2">
                  <a
                    href={wa}
                    target="_blank"
                    rel="noreferrer"
                    className="h-11 rounded-full flex items-center justify-center gap-1.5 m-pressable"
                    style={{ background: "white" }}
                  >
                    <MessageCircle className="w-4 h-4" style={{ color: "hsl(142 70% 35%)" }} strokeWidth={2.5} />
                    <span className="text-[12px] font-bold" style={{ color: "hsl(var(--m-text-primary))" }}>
                      WhatsApp
                    </span>
                  </a>
                  <a
                    href={sms}
                    className="h-11 rounded-full flex items-center justify-center gap-1.5 m-pressable"
                    style={{ background: "hsl(0 0% 100% / 0.18)" }}
                  >
                    <MessageSquare className="w-4 h-4 text-white" strokeWidth={2.5} />
                    <span className="text-[12px] font-bold text-white">SMS</span>
                  </a>
                  <button
                    onClick={copyLink}
                    className="h-11 rounded-full flex items-center justify-center gap-1.5 m-pressable"
                    style={{ background: "hsl(0 0% 100% / 0.18)" }}
                  >
                    <Copy className="w-4 h-4 text-white" strokeWidth={2.5} />
                    <span className="text-[12px] font-bold text-white">Kopyala</span>
                  </button>
                </div>

                <button
                  onClick={nativeShare}
                  className="w-full mt-2.5 h-10 rounded-full flex items-center justify-center gap-1.5 m-pressable"
                  style={{ background: "hsl(0 0% 0% / 0.18)" }}
                >
                  <Share2 className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
                  <span className="text-[12px] font-semibold text-white">Diğer uygulamalarla paylaş</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* === Referans / Davet Kodu kartı === */}
      <div className="px-5 mb-6">
        <div
          className="rounded-[24px] p-5 relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, hsl(28 92% 58%) 0%, hsl(12 90% 55%) 100%)",
            boxShadow: "0 14px 32px -10px hsl(20 90% 50% / 0.45)",
          }}
        >
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full" style={{ background: "hsl(0 0% 100% / 0.10)" }} />
          <div className="absolute -bottom-10 -left-6 w-24 h-24 rounded-full" style={{ background: "hsl(0 0% 100% / 0.07)" }} />

          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: "hsl(0 0% 100% / 0.22)" }}
              >
                <Gift className="w-4 h-4 text-white" strokeWidth={2.4} />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-white/85">
                Meslektaşını Davet Et
              </span>
            </div>

            <h3 className="text-[18px] font-bold text-white leading-tight mb-1.5">
              Her başarılı davet için <span className="underline decoration-white/60">+2 ay ücretsiz</span>
            </h3>
            <p className="text-[12.5px] text-white/85 mb-3 leading-snug">
              Davet kodunu paylaş. Davet ettiğin uzman kayıt olup ödeme yaptığında 12 aylık taahhüt sonunda aboneliğine 2 ay eklenir.
            </p>

            {/* Code box */}
            <button
              onClick={copyRefCode}
              className="w-full flex items-center justify-between gap-2 mb-3 m-pressable rounded-2xl px-4 py-3"
              style={{ background: "hsl(0 0% 100% / 0.18)", border: "1px dashed hsl(0 0% 100% / 0.45)" }}
            >
              <div className="text-left">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-white/70">Davet Kodun</div>
                <div className="text-[20px] font-bold text-white tracking-[0.18em] leading-tight">
                  {referral.code || "—"}
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: "white" }}>
                <Copy className="w-3.5 h-3.5" style={{ color: "hsl(20 85% 50%)" }} strokeWidth={2.6} />
                <span className="text-[11px] font-bold" style={{ color: "hsl(20 85% 50%)" }}>Kopyala</span>
              </div>
            </button>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="rounded-xl px-2 py-2 text-center" style={{ background: "hsl(0 0% 100% / 0.14)" }}>
                <div className="text-[16px] font-bold text-white leading-none">{referral.qualified_referrals}</div>
                <div className="text-[10px] text-white/75 mt-1">Başarılı Davet</div>
              </div>
              <div className="rounded-xl px-2 py-2 text-center" style={{ background: "hsl(0 0% 100% / 0.14)" }}>
                <div className="text-[16px] font-bold text-white leading-none">+{referral.total_bonus_months}</div>
                <div className="text-[10px] text-white/75 mt-1">Ay Bonus</div>
              </div>
              <div className="rounded-xl px-2 py-2 text-center" style={{ background: "hsl(0 0% 100% / 0.14)" }}>
                <div className="text-[16px] font-bold text-white leading-none">{referral.granted_referrals}</div>
                <div className="text-[10px] text-white/75 mt-1">Tanımlanan</div>
              </div>
            </div>

            {/* Share buttons */}
            <div className="grid grid-cols-3 gap-2">
              <a
                href={refWa}
                target="_blank"
                rel="noreferrer"
                className="h-11 rounded-full flex items-center justify-center gap-1.5 m-pressable"
                style={{ background: "white" }}
                onClick={(e) => { if (!referral.code) { e.preventDefault(); } }}
              >
                <MessageCircle className="w-4 h-4" style={{ color: "hsl(142 70% 35%)" }} strokeWidth={2.5} />
                <span className="text-[12px] font-bold" style={{ color: "hsl(var(--m-text-primary))" }}>WhatsApp</span>
              </a>
              <a
                href={refSms}
                className="h-11 rounded-full flex items-center justify-center gap-1.5 m-pressable"
                style={{ background: "hsl(0 0% 100% / 0.18)" }}
                onClick={(e) => { if (!referral.code) { e.preventDefault(); } }}
              >
                <MessageSquare className="w-4 h-4 text-white" strokeWidth={2.5} />
                <span className="text-[12px] font-bold text-white">SMS</span>
              </a>
              <button
                onClick={nativeShareReferral}
                className="h-11 rounded-full flex items-center justify-center gap-1.5 m-pressable"
                style={{ background: "hsl(0 0% 0% / 0.18)" }}
              >
                <Share2 className="w-4 h-4 text-white" strokeWidth={2.5} />
                <span className="text-[12px] font-bold text-white">Paylaş</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* === Upcoming appointments === */}
      {/* === Pending Booking Requests === */}
      {pendingReqs.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between px-5 mb-3">
            <h3 className="text-[18px] font-bold" style={{ color: "hsl(var(--m-text-primary))" }}>
              Randevu Talepleri
            </h3>
            <button
              onClick={() => navigate("/mobile/specialist-appointments")}
              className="text-[12px] font-semibold px-3 py-1.5 rounded-full m-pressable"
              style={{ background: "hsl(var(--m-accent))", color: "hsl(var(--m-bg))" }}
            >
              Tümü
            </button>
          </div>

          <div className="px-5 flex gap-3 overflow-x-auto m-no-scrollbar pb-1 snap-x snap-mandatory">
            {pendingReqs.map((a) => {
              const d = new Date(a.appointment_date);
              const dateLabel = d.toLocaleDateString("tr-TR", { weekday: "short", day: "numeric", month: "short" });
              const isOnline = a.appointment_type === "online";
              const acting = actingId === a.id;
              return (
                <div
                  key={a.id}
                  className="snap-start shrink-0 w-[78%] rounded-[24px] p-3"
                  style={{ background: "hsl(var(--m-ink))", boxShadow: "var(--m-shadow-md)" }}
                >
                  <div
                    className="flex items-center gap-2 h-11 px-4 rounded-2xl"
                    style={{ background: "hsl(var(--m-tint-mint))" }}
                  >
                    <Clock className="w-4 h-4" style={{ color: "hsl(var(--m-ink))" }} />
                    <span className="text-[13.5px] font-bold" style={{ color: "hsl(var(--m-ink))" }}>
                      {dateLabel}
                    </span>
                    <span style={{ color: "hsl(var(--m-accent))" }}>•</span>
                    <span className="text-[13.5px] font-bold" style={{ color: "hsl(var(--m-ink))" }}>
                      {a.appointment_time?.slice(0, 5)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mt-3 px-1">
                    <div
                      className="relative w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: "hsl(var(--m-tint-lilac))" }}
                    >
                      <span className="text-[16px] font-bold" style={{ color: "hsl(var(--m-ink))" }}>
                        {(a.patient_name || "?").charAt(0).toUpperCase()}
                      </span>
                      <div
                        className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ background: "hsl(var(--m-tint-mint))", border: "2px solid hsl(var(--m-ink))" }}
                      >
                        {isOnline ? (
                          <Video className="w-2.5 h-2.5" style={{ color: "hsl(var(--m-ink))" }} />
                        ) : (
                          <User className="w-2.5 h-2.5" style={{ color: "hsl(var(--m-ink))" }} />
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[15px] font-bold truncate" style={{ color: "hsl(var(--m-bg))" }}>
                        {a.patient_name}
                      </div>
                      <div className="text-[11.5px] truncate" style={{ color: "hsl(var(--m-bg) / 0.6)" }}>
                        {a.consultation_topic || (isOnline ? "Online görüşme" : "Yüz yüze görüşme")}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-3">
                    <button
                      disabled={acting}
                      onClick={() => handleAct(a.id, "cancelled")}
                      className="flex-1 h-11 rounded-full flex items-center justify-center gap-1.5 m-pressable disabled:opacity-50"
                      style={{
                        background: "transparent",
                        border: "1px solid hsl(var(--m-bg) / 0.2)",
                        color: "hsl(var(--m-bg))",
                      }}
                    >
                      <X className="w-4 h-4" />
                      <span className="text-[13px] font-semibold">Reddet</span>
                    </button>
                    <button
                      disabled={acting}
                      onClick={() => handleAct(a.id, "confirmed")}
                      className="flex-1 h-11 rounded-full flex items-center justify-center gap-1.5 m-pressable disabled:opacity-50"
                      style={{ background: "hsl(var(--m-accent))", color: "hsl(var(--m-bg))" }}
                    >
                      <Check className="w-4 h-4" />
                      <span className="text-[13px] font-semibold">Kabul Et</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* === Upcoming appointments === */}
      <div className="mb-6">
        <div className="flex items-center justify-between px-5 mb-3">
          <h3 className="text-[18px] font-bold" style={{ color: "hsl(var(--m-text-primary))" }}>Yaklaşan Randevular</h3>
          <button
            onClick={() => navigate("/mobile/specialist-appointments")}
            className="text-[12px] font-semibold m-pressable flex items-center gap-0.5"
            style={{ color: "hsl(var(--m-accent))" }}
          >
            Tümü <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="px-5 space-y-2.5">
          {upcoming.length === 0 ? (
            <div
              className="rounded-[20px] p-5 text-center"
              style={{ background: "hsl(var(--m-surface))", boxShadow: "var(--m-shadow-sm)" }}
            >
              <Calendar className="w-7 h-7 mx-auto mb-2" style={{ color: "hsl(var(--m-text-tertiary))" }} />
              <div className="text-[13px] font-medium" style={{ color: "hsl(var(--m-text-secondary))" }}>
                Yaklaşan randevunuz yok
              </div>
            </div>
          ) : (
            upcoming.slice(0, 4).map((a) => {
              const d = new Date(a.appointment_date);
              const day = d.getDate();
              const monthLabel = d.toLocaleDateString("tr-TR", { month: "short" }).toUpperCase();
              const isOnline = a.appointment_type === "online";
              return (
                <button
                  key={a.id}
                  onClick={() => navigate("/mobile/specialist-appointments")}
                  className="w-full rounded-[20px] p-3.5 flex items-center gap-3 m-pressable"
                  style={{ background: "hsl(var(--m-surface))", boxShadow: "var(--m-shadow-sm)" }}
                >
                  <div
                    className="w-12 h-12 rounded-2xl flex flex-col items-center justify-center shrink-0"
                    style={{ background: "hsl(var(--m-accent-soft))" }}
                  >
                    <span className="text-[15px] font-bold leading-none" style={{ color: "hsl(var(--m-accent))" }}>{day}</span>
                    <span className="text-[8.5px] font-bold leading-none mt-0.5" style={{ color: "hsl(var(--m-accent))" }}>{monthLabel}</span>
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="text-[14px] font-bold truncate" style={{ color: "hsl(var(--m-text-primary))" }}>
                      {a.patient_name}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11.5px]" style={{ color: "hsl(var(--m-text-secondary))" }}>
                        {a.appointment_time?.slice(0, 5)}
                      </span>
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{
                          background: isOnline ? "hsl(var(--m-info-soft))" : "hsl(var(--m-tint-mint))",
                          color: isOnline ? "hsl(var(--m-info))" : "hsl(var(--m-success))",
                        }}
                      >
                        {isOnline ? "Online" : "Yüz Yüze"}
                      </span>
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{
                          background:
                            a.status === "pending" ? "hsl(var(--m-warning-soft))" :
                            a.status === "confirmed" ? "hsl(var(--m-success-soft))" :
                            "hsl(var(--m-surface-muted))",
                          color:
                            a.status === "pending" ? "hsl(var(--m-warning))" :
                            a.status === "confirmed" ? "hsl(var(--m-success))" :
                            "hsl(var(--m-text-secondary))",
                        }}
                      >
                        {a.status === "pending" ? "Bekliyor" : a.status === "confirmed" ? "Onaylı" : a.status}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4" style={{ color: "hsl(var(--m-text-tertiary))" }} />
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* === Quick Actions Grid === */}
      <div className="px-5 mb-2">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[18px] font-bold" style={{ color: "hsl(var(--m-text-primary))" }}>Hızlı Erişim</h3>
          <span className="text-[11px] font-medium" style={{ color: "hsl(var(--m-text-tertiary))" }}>
            Tüm araçlar
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Calendar, label: "Randevu", desc: "Takvim", to: "/mobile/specialist-appointments", badge: badges.appts, hue: 220, gradFrom: "hsl(220 90% 60%)", gradTo: "hsl(232 88% 52%)" },
            { icon: Users, label: "Danışan", desc: "Liste", to: "/mobile/specialist-clients", hue: 280, gradFrom: "hsl(280 75% 60%)", gradTo: "hsl(265 80% 55%)" },
            { icon: MessageSquare, label: "Destek", desc: "Talepler", to: "/mobile/specialist-support", badge: badges.support, hue: 12, gradFrom: "hsl(12 90% 60%)", gradTo: "hsl(355 85% 55%)" },
            { icon: FileText, label: "Blog", desc: "Yazılarım", to: "/mobile/specialist-blog", badge: badges.blog, hue: 35, gradFrom: "hsl(35 95% 58%)", gradTo: "hsl(20 92% 52%)" },
            { icon: ClipboardList, label: "Testler", desc: "Yönet", to: "/mobile/tests", hue: 160, gradFrom: "hsl(160 70% 45%)", gradTo: "hsl(175 75% 40%)" },
            { icon: FileSignature, label: "Sözleşme", desc: "Belgeler", to: "/mobile/specialist-contracts", hue: 200, gradFrom: "hsl(200 80% 55%)", gradTo: "hsl(212 85% 48%)" },
            { icon: CreditCard, label: "Abonelik", desc: "Ödemeler", to: "/mobile/specialist-subscription", hue: 145, gradFrom: "hsl(145 65% 45%)", gradTo: "hsl(160 70% 40%)" },
            { icon: Eye, label: "Profilim", desc: "Önizle", to: spec?.id ? `/mobile/specialist/${spec.id}` : "/mobile/specialist-profile", hue: 250, gradFrom: "hsl(250 80% 65%)", gradTo: "hsl(265 75% 58%)" },
            { icon: User, label: "Profil", desc: "Düzenle", to: "/mobile/specialist-profile", hue: 320, gradFrom: "hsl(330 75% 60%)", gradTo: "hsl(310 70% 52%)" },
          ].map((it) => {
            const Icon = it.icon;
            return (
              <button
                key={it.label}
                onClick={() => navigate(it.to)}
                className="relative overflow-hidden rounded-[20px] p-3 flex flex-col items-start text-left m-pressable"
                style={{
                  background: "hsl(var(--m-surface))",
                  boxShadow: "var(--m-shadow-sm)",
                  minHeight: 96,
                }}
              >
                {/* decorative gradient blob */}
                <div
                  aria-hidden
                  className="absolute -top-6 -right-6 w-20 h-20 rounded-full opacity-90"
                  style={{ background: `linear-gradient(135deg, ${it.gradFrom}, ${it.gradTo})`, filter: "blur(0.5px)" }}
                />
                <div
                  aria-hidden
                  className="absolute -bottom-8 -left-8 w-16 h-16 rounded-full opacity-10"
                  style={{ background: it.gradFrom }}
                />

                <div
                  className="relative w-9 h-9 rounded-xl flex items-center justify-center mb-auto"
                  style={{
                    background: `linear-gradient(135deg, ${it.gradFrom}, ${it.gradTo})`,
                    boxShadow: `0 6px 14px -4px ${it.gradFrom}`,
                  }}
                >
                  <Icon className="w-[18px] h-[18px]" style={{ color: "white" }} />
                  {!!it.badge && it.badge > 0 && (
                    <span
                      className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center"
                      style={{ background: "hsl(var(--m-danger))", color: "white", border: "2px solid hsl(var(--m-surface))" }}
                    >
                      {it.badge}
                    </span>
                  )}
                </div>

                <div className="relative mt-2">
                  <div className="text-[13px] font-bold leading-tight" style={{ color: "hsl(var(--m-text-primary))" }}>
                    {it.label}
                  </div>
                  <div className="text-[10.5px] font-medium mt-0.5" style={{ color: "hsl(var(--m-text-secondary))" }}>
                    {it.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
