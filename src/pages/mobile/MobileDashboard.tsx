import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Calendar, Clock, CheckCircle2, CheckCheck, FileSignature, ClipboardList,
  MessageSquare, FileText, CreditCard, Users, User, Bell, Settings,
  TrendingUp, Star, ChevronRight, Stethoscope, MapPin, Video, X, Check, Eye,
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
  const [weekly, setWeekly] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);

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

    // Weekly buckets (last 7 days incl today)
    const buckets = new Array(7).fill(0) as number[];
    const now = new Date();
    list.forEach((a) => {
      const d = new Date(a.appointment_date);
      const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
      if (diff >= 0 && diff < 7) buckets[6 - diff] += 1;
    });
    setWeekly(buckets);

    return { pending };
  };

  useEffect(() => {
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) { navigate("/mobile/login"); return; }

        const { data: s } = await supabase
          .from("specialists")
          .select("id, name, email, specialty, profile_picture, city, rating, reviews_count, experience")
          .or(`user_id.eq.${session.user.id},email.eq.${session.user.email}`)
          .maybeSingle();

        if (!s) { navigate("/mobile/login"); return; }
        setSpec(s);

        const result = await refreshAppts(s.id);

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
  const totalNotif = badges.appts + badges.blog + badges.support;

  // Goal — günlük randevu hedefi: 8
  const dailyGoal = 8;
  const todayCount = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return upcoming.filter((a) => a.appointment_date === today).length;
  }, [upcoming]);
  const goalPct = Math.min(100, Math.round((todayCount / dailyGoal) * 100));

  // SVG ring
  const ringR = 30;
  const ringC = 2 * Math.PI * ringR;
  const ringOffset = ringC - (goalPct / 100) * ringC;

  const maxWeekly = Math.max(1, ...weekly);
  const weekDays = ["P", "S", "Ç", "P", "C", "C", "P"];

  return (
    <div style={{ background: "hsl(var(--m-bg))", minHeight: "100vh", paddingBottom: 110 }}>
      {/* === Top bar === */}
      <div className="m-safe-top px-5 pt-4 pb-3 flex items-center justify-between">
        <button
          onClick={() => navigate("/mobile/specialist-profile")}
          className="m-pressable"
          aria-label="Profil"
        >
          {spec?.profile_picture ? (
            <img
              src={spec.profile_picture}
              alt={spec?.name}
              className="w-11 h-11 rounded-full object-cover"
              style={{ boxShadow: "var(--m-shadow-sm)" }}
            />
          ) : (
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center"
              style={{ background: "hsl(var(--m-accent-soft))", boxShadow: "var(--m-shadow-sm)" }}
            >
              <span className="text-[15px] font-bold" style={{ color: "hsl(var(--m-accent))" }}>{initial}</span>
            </div>
          )}
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/mobile/specialist-support")}
            className="relative w-11 h-11 rounded-full flex items-center justify-center m-pressable"
            style={{ background: "hsl(var(--m-surface))", boxShadow: "var(--m-shadow-sm)" }}
            aria-label="Bildirimler"
          >
            <Bell className="w-5 h-5" style={{ color: "hsl(var(--m-text-primary))" }} />
            {totalNotif > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center"
                style={{ background: "hsl(var(--m-danger))", color: "white" }}
              >
                {totalNotif}
              </span>
            )}
          </button>
          <button
            onClick={() => navigate("/mobile/specialist-profile")}
            className="w-11 h-11 rounded-full flex items-center justify-center m-pressable"
            style={{ background: "hsl(var(--m-surface))", boxShadow: "var(--m-shadow-sm)" }}
            aria-label="Ayarlar"
          >
            <Settings className="w-5 h-5" style={{ color: "hsl(var(--m-text-primary))" }} />
          </button>
        </div>
      </div>

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

      {/* === Stat chip cards (horizontal pastel cards) === */}
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
        <div className="flex gap-3 overflow-x-auto px-5 m-no-scrollbar pb-1">
          {[
            { value: stats.pending, ...TONE_PALETTE[0], icon: Clock },
            { value: stats.confirmed, ...TONE_PALETTE[1], icon: CheckCircle2 },
            { value: stats.completed, ...TONE_PALETTE[2], icon: CheckCheck },
            { value: stats.total, ...TONE_PALETTE[3], icon: Calendar },
          ].map((it, idx) => {
            const Icon = it.icon;
            return (
              <div
                key={idx}
                className="shrink-0 rounded-[22px] p-4 flex flex-col justify-between"
                style={{ background: `hsl(${it.bg})`, width: 138, height: 110 }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold" style={{ color: "hsl(var(--m-text-secondary))" }}>
                    {it.label}
                  </span>
                  <Icon className="w-4 h-4" style={{ color: "hsl(var(--m-text-primary))" }} />
                </div>
                <div>
                  <div className="text-[28px] font-bold leading-none" style={{ color: "hsl(var(--m-text-primary))", letterSpacing: "-0.02em" }}>
                    {it.value}
                  </div>
                  <div className="text-[11px] mt-1" style={{ color: "hsl(var(--m-text-secondary))" }}>
                    bu dönem
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* === Activity (weekly bars) + Daily goal ring === */}
      <div className="px-5 mb-6 grid grid-cols-5 gap-3">
        {/* Weekly bars */}
        <div
          className="col-span-3 rounded-[22px] p-4"
          style={{ background: "hsl(var(--m-surface))", boxShadow: "var(--m-shadow-sm)" }}
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "hsl(var(--m-text-tertiary))" }}>
                Haftalık
              </div>
              <div className="text-[15px] font-bold" style={{ color: "hsl(var(--m-text-primary))" }}>
                Aktivite
              </div>
            </div>
            <TrendingUp className="w-4 h-4" style={{ color: "hsl(var(--m-accent))" }} />
          </div>
          <div className="flex items-end justify-between h-20 gap-1.5">
            {weekly.map((v, i) => {
              const h = Math.max(8, (v / maxWeekly) * 70);
              const isToday = i === 6;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                  <div
                    className="w-full rounded-t-md rounded-b-md"
                    style={{
                      height: h,
                      background: isToday ? "hsl(var(--m-accent))" : "hsl(var(--m-surface-muted))",
                    }}
                  />
                  <span className="text-[10px] font-medium" style={{ color: "hsl(var(--m-text-tertiary))" }}>
                    {weekDays[i]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Daily goal ring */}
        <div
          className="col-span-2 rounded-[22px] p-4 flex flex-col items-center justify-center"
          style={{ background: "hsl(var(--m-ink))" }}
        >
          <div className="relative w-[80px] h-[80px]">
            <svg width="80" height="80" viewBox="0 0 80 80" className="-rotate-90">
              <circle cx="40" cy="40" r={ringR} fill="none" stroke="hsl(var(--m-bg) / 0.15)" strokeWidth="6" />
              <circle
                cx="40"
                cy="40"
                r={ringR}
                fill="none"
                stroke="hsl(var(--m-accent))"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={ringC}
                strokeDashoffset={ringOffset}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[18px] font-bold" style={{ color: "hsl(var(--m-bg))" }}>{todayCount}</span>
              <span className="text-[9px]" style={{ color: "hsl(var(--m-bg) / 0.6)" }}>/ {dailyGoal}</span>
            </div>
          </div>
          <div className="text-[11px] font-medium mt-2" style={{ color: "hsl(var(--m-bg) / 0.7)" }}>
            Bugünkü hedef
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
        <h3 className="text-[18px] font-bold mb-3" style={{ color: "hsl(var(--m-text-primary))" }}>Hızlı Erişim</h3>
        <div className="grid grid-cols-4 gap-3">
          {[
            { icon: User, label: "Profil", to: "/mobile/specialist-profile" },
            { icon: FileSignature, label: "Sözleşme", to: "/mobile/specialist-contracts" },
            { icon: ClipboardList, label: "Testler", to: "/mobile/tests" },
            { icon: MessageSquare, label: "Destek", to: "/mobile/specialist-support", badge: badges.support },
            { icon: FileText, label: "Blog", to: "/mobile/specialist-blog", badge: badges.blog },
            { icon: CreditCard, label: "Abonelik", to: "/mobile/specialist-subscription" },
            { icon: Users, label: "Danışan", to: "/mobile/specialist-clients" },
            { icon: Calendar, label: "Randevu", to: "/mobile/specialist-appointments", badge: badges.appts },
          ].map((it) => {
            const Icon = it.icon;
            return (
              <button
                key={it.label}
                onClick={() => navigate(it.to)}
                className="flex flex-col items-center gap-1.5 m-pressable"
              >
                <div
                  className="relative w-14 h-14 rounded-[18px] flex items-center justify-center"
                  style={{ background: "hsl(var(--m-surface))", boxShadow: "var(--m-shadow-sm)" }}
                >
                  <Icon className="w-5 h-5" style={{ color: "hsl(var(--m-accent))" }} />
                  {!!it.badge && it.badge > 0 && (
                    <span
                      className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center"
                      style={{ background: "hsl(var(--m-danger))", color: "white" }}
                    >
                      {it.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10.5px] font-semibold text-center" style={{ color: "hsl(var(--m-text-primary))" }}>
                  {it.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
