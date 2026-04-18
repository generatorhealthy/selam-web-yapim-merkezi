import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { MobileSection } from "@/components/mobile/MobileSection";
import {
  Calendar, Clock, CheckCircle2, CheckCheck, FileSignature, ClipboardList,
  MessageSquare, FileText, CreditCard, Users, User, ChevronRight,
} from "lucide-react";

const StatTile = ({ icon: Icon, value, label, tone = "default" }: any) => {
  const palette: Record<string, { bg: string; fg: string }> = {
    default: { bg: "var(--m-tint-sky)", fg: "var(--m-ink)" },
    warning: { bg: "var(--m-tint-sand)", fg: "var(--m-ink)" },
    success: { bg: "var(--m-tint-mint)", fg: "var(--m-ink)" },
    info: { bg: "var(--m-tint-lilac)", fg: "var(--m-ink)" },
  };
  const c = palette[tone];
  return (
    <div className="rounded-[20px] p-4" style={{ background: `hsl(${c.bg})` }}>
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center mb-3"
        style={{ background: "hsl(var(--m-surface))" }}
      >
        <Icon className="w-4.5 h-4.5" style={{ color: `hsl(${c.fg})`, width: 18, height: 18 }} />
      </div>
      <div className="text-[26px] font-bold leading-none" style={{ color: `hsl(${c.fg})`, letterSpacing: "-0.02em" }}>
        {value}
      </div>
      <div className="text-[11px] font-medium mt-1.5" style={{ color: "hsl(var(--m-text-secondary))" }}>{label}</div>
    </div>
  );
};

const MenuTile = ({ icon: Icon, title, subtitle, badge, onClick }: any) => (
  <button
    onClick={onClick}
    className="m-card p-4 m-pressable text-left flex flex-col h-full relative"
  >
    <div
      className="w-10 h-10 rounded-2xl flex items-center justify-center mb-3"
      style={{ background: "hsl(var(--m-accent-soft))" }}
    >
      <Icon className="w-5 h-5" style={{ color: "hsl(var(--m-accent))" }} />
    </div>
    <div className="font-bold text-[15px] leading-tight" style={{ color: "hsl(var(--m-text-primary))" }}>
      {title}
    </div>
    {subtitle && (
      <div className="text-[12px] mt-0.5" style={{ color: "hsl(var(--m-text-secondary))" }}>
        {subtitle}
      </div>
    )}
    {badge > 0 && (
      <span
        className="absolute top-3 right-3 min-w-[22px] h-[22px] px-1.5 rounded-full text-[11px] font-bold flex items-center justify-center"
        style={{ background: "hsl(var(--m-danger))", color: "white" }}
      >
        {badge}
      </span>
    )}
  </button>
);

export default function MobileDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [stats, setStats] = useState({
    total: 0, pending: 0, confirmed: 0, completed: 0,
  });
  const [badges, setBadges] = useState({
    appts: 0, blog: 0, support: 0,
  });

  useEffect(() => {
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) { navigate("/mobile/login"); return; }

        const { data: spec } = await supabase
          .from("specialists")
          .select("id, name, email")
          .or(`user_id.eq.${session.user.id},email.eq.${session.user.email}`)
          .maybeSingle();

        if (!spec) { navigate("/mobile/login"); return; }
        setName(spec.name || "Uzman");

        const { data: appts } = await supabase
          .from("appointments")
          .select("status")
          .eq("specialist_id", spec.id);

        const total = appts?.length || 0;
        const pending = appts?.filter((a) => a.status === "pending").length || 0;
        const confirmed = appts?.filter((a) => a.status === "confirmed").length || 0;
        const completed = appts?.filter((a) => a.status === "completed").length || 0;
        setStats({ total, pending, confirmed, completed });

        // Support tickets open count
        const { count: openTickets } = await supabase
          .from("support_tickets" as any)
          .select("*", { count: "exact", head: true })
          .eq("specialist_id", spec.id)
          .eq("status", "open");

        // Blog notifications unread
        const { count: unreadBlog } = await supabase
          .from("blog_notifications" as any)
          .select("*", { count: "exact", head: true })
          .eq("specialist_id", spec.id)
          .eq("read", false);

        setBadges({
          appts: pending,
          blog: unreadBlog || 0,
          support: openTickets || 0,
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  return (
    <div style={{ background: "hsl(var(--m-bg))", minHeight: "100vh", paddingBottom: 100 }}>
      <MobileHeader largeTitle={`Hoş geldiniz`} subtitle={loading ? "..." : name} />

      {/* 4 stat tiles like web */}
      <div className="px-5 grid grid-cols-2 gap-3 mb-6">
        <StatTile icon={Calendar} value={stats.total} label="Toplam Randevu" tone="default" />
        <StatTile icon={Clock} value={stats.pending} label="Bekleyen" tone="warning" />
        <StatTile icon={CheckCircle2} value={stats.confirmed} label="Onaylanan" tone="success" />
        <StatTile icon={CheckCheck} value={stats.completed} label="Tamamlanan" tone="info" />
      </div>

      {/* All 8 dashboard tabs as a grid */}
      <MobileSection label="Yönetim" title="Panelim" className="mb-6">
        <div className="grid grid-cols-2 gap-3">
          <MenuTile
            icon={Calendar} title="Randevular" subtitle="Yaklaşan görüşmeler"
            badge={badges.appts}
            onClick={() => navigate("/mobile/specialist-appointments")}
          />
          <MenuTile
            icon={FileSignature} title="Sözleşmeler" subtitle="Belgelerim"
            onClick={() => navigate("/mobile/specialist-contracts")}
          />
          <MenuTile
            icon={ClipboardList} title="Test Cevapları" subtitle="Danışan cevapları"
            onClick={() => navigate("/mobile/tests")}
          />
          <MenuTile
            icon={MessageSquare} title="Destek Talebi" subtitle="Yardım al"
            badge={badges.support}
            onClick={() => navigate("/mobile/specialist-support")}
          />
          <MenuTile
            icon={FileText} title="Blog Yönetimi" subtitle="Yazılarım"
            badge={badges.blog}
            onClick={() => navigate("/mobile/specialist-blog")}
          />
          <MenuTile
            icon={CreditCard} title="Aboneliğim" subtitle="Ödeme durumu"
            onClick={() => navigate("/mobile/specialist-subscription")}
          />
          <MenuTile
            icon={Users} title="Danışan Portföyü" subtitle="Danışanlarım"
            onClick={() => navigate("/mobile/specialist-clients")}
          />
          <MenuTile
            icon={User} title="Profil Düzenle" subtitle="Bilgilerim"
            onClick={() => navigate("/mobile/specialist-profile")}
          />
        </div>
      </MobileSection>
    </div>
  );
}
