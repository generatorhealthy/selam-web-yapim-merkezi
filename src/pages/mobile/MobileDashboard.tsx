import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { MobileSection } from "@/components/mobile/MobileSection";
import { MobileStatCard } from "@/components/mobile/MobileStatCard";
import { MobileListRow } from "@/components/mobile/MobileListRow";
import { MobileEmptyState } from "@/components/mobile/MobileEmptyState";
import { Calendar, Users, FileText, Brain, ChevronRight, ClipboardList, CalendarClock } from "lucide-react";

export default function MobileDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [todayCount, setTodayCount] = useState(0);
  const [weekCount, setWeekCount] = useState(0);
  const [clientCount, setClientCount] = useState(0);
  const [testCount, setTestCount] = useState(0);
  const [todayList, setTodayList] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          navigate("/mobile/login");
          return;
        }

        const { data: spec } = await supabase
          .from("specialists")
          .select("id, name, email")
          .or(`user_id.eq.${session.user.id},email.eq.${session.user.email}`)
          .maybeSingle();

        if (!spec) {
          navigate("/mobile/login");
          return;
        }

        setName(spec.name?.split(" ")[0] || "Uzman");

        const today = new Date().toISOString().slice(0, 10);
        const weekFromNow = new Date();
        weekFromNow.setDate(weekFromNow.getDate() + 7);
        const weekEnd = weekFromNow.toISOString().slice(0, 10);

        const { data: appts } = await supabase
          .from("appointments")
          .select("*")
          .eq("specialist_id", spec.id)
          .order("appointment_time", { ascending: true });

        const todays = (appts || []).filter((a) => a.appointment_date === today && a.status !== "cancelled");
        setTodayCount(todays.length);
        setTodayList(todays.slice(0, 5));

        const upcoming = (appts || []).filter(
          (a) => a.appointment_date >= today && a.appointment_date <= weekEnd && a.status !== "cancelled",
        );
        setWeekCount(upcoming.length);

        // Unique clients (Danışanlar)
        const uniqueEmails = new Set((appts || []).map((a) => a.patient_email));
        setClientCount(uniqueEmails.size);

        // Test cevapları sayısı
        const { count } = await supabase
          .from("test_results")
          .select("*", { count: "exact", head: true })
          .eq("specialist_id", spec.id);
        setTestCount(count || 0);
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  return (
    <div style={{ background: "hsl(var(--m-bg))", minHeight: "100vh", paddingBottom: 100 }}>
      <MobileHeader largeTitle={`Merhaba, ${name || "..."}`} subtitle="Bugün için özet" />

      {/* Stats grid */}
      <div className="px-5 grid grid-cols-2 gap-3 mb-6">
        <MobileStatCard label="Bugün" value={todayCount} icon={Calendar} tone="accent" />
        <MobileStatCard label="Bu Hafta" value={weekCount} icon={CalendarClock} />
        <MobileStatCard label="Danışanlar" value={clientCount} icon={Users} />
        <MobileStatCard label="Test Cevapları" value={testCount} icon={ClipboardList} />
      </div>

      {/* Bugünkü randevular */}
      <MobileSection
        label="Bugün"
        title="Randevular"
        action={{ label: "Tümü", onClick: () => navigate("/mobile/specialist-appointments") }}
        className="mb-6"
      >
        {loading ? (
          <div className="m-card p-4 text-[14px]" style={{ color: "hsl(var(--m-text-secondary))" }}>Yükleniyor…</div>
        ) : todayList.length === 0 ? (
          <MobileEmptyState icon={Calendar} title="Bugün için randevu yok" />
        ) : (
          <div className="m-card overflow-hidden">
            {todayList.map((a) => (
              <button
                key={a.id}
                onClick={() => navigate("/mobile/specialist-appointments")}
                className="w-full flex items-center gap-3 px-4 py-3 m-pressable text-left"
                style={{ borderBottom: "1px solid hsl(var(--m-divider))" }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex flex-col items-center justify-center text-[11px] font-bold"
                  style={{ background: "hsl(var(--m-accent-soft))", color: "hsl(var(--m-accent))" }}
                >
                  {a.appointment_time?.slice(0, 5)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[15px] truncate" style={{ color: "hsl(var(--m-text-primary))" }}>{a.patient_name}</div>
                  <div className="text-[12px] truncate" style={{ color: "hsl(var(--m-text-secondary))" }}>
                    {a.appointment_type === "online" ? "Online" : "Yüz yüze"} · {a.consultation_topic || "Görüşme"}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5" style={{ color: "hsl(var(--m-text-secondary))" }} />
              </button>
            ))}
          </div>
        )}
      </MobileSection>

      {/* Hızlı erişim */}
      <MobileSection label="Yönetim" className="mb-6">
        <div className="m-card overflow-hidden">
          <MobileListRow icon={Calendar} title="Randevular" subtitle="Düzenle ve yönet" onClick={() => navigate("/mobile/specialist-appointments")} />
          <MobileListRow icon={Users} title="Danışanlar" subtitle="Danışan listesi" onClick={() => navigate("/mobile/specialist-clients")} />
          <MobileListRow icon={Brain} title="Test Cevapları" subtitle="Danışan cevapları" onClick={() => navigate("/mobile/tests")} />
          <MobileListRow icon={FileText} title="Blog Yazıları" subtitle="Yeni yazı oluştur" onClick={() => navigate("/mobile/specialist-blog")} />
        </div>
      </MobileSection>
    </div>
  );
}
