import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { MobileEmptyState } from "@/components/mobile/MobileEmptyState";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, Video, Users, X } from "lucide-react";

interface Appt {
  id: string;
  appointment_date: string;
  appointment_time: string;
  appointment_type: string;
  status: string;
  patient_name: string;
  patient_email: string;
  consultation_topic: string | null;
  specialist_id: string | null;
}

export default function MobileAppointments() {
  const [appts, setAppts] = useState<Appt[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const { toast } = useToast();
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    let query = supabase.from("appointments").select("*").order("appointment_date", { ascending: false }).limit(100);
    if (session?.user?.email) {
      query = query.eq("patient_email", session.user.email);
    }
    const { data, error } = await query;
    if (error) {
      toast({ title: "Hata", description: error.message, variant: "destructive" });
    } else {
      setAppts((data as Appt[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const today = new Date().toISOString().slice(0, 10);
  const filtered = appts.filter((a) =>
    tab === "upcoming" ? a.appointment_date >= today && a.status !== "cancelled" : a.appointment_date < today || a.status === "cancelled"
  );

  const cancel = async (id: string) => {
    if (!confirm("Randevuyu iptal etmek istediğinize emin misiniz?")) return;
    const { error } = await supabase.from("appointments").update({ status: "cancelled" }).eq("id", id);
    if (error) {
      toast({ title: "Hata", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "İptal edildi" });
      load();
    }
  };

  return (
    <div style={{ background: "hsl(var(--m-bg))", minHeight: "100vh" }}>
      <MobileHeader largeTitle="Randevularım" />

      {/* Tabs */}
      <div className="px-5 mb-4">
        <div className="flex p-1 rounded-2xl" style={{ background: "hsl(var(--m-surface-muted))" }}>
          {(["upcoming", "past"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 h-9 rounded-xl text-[13px] font-semibold m-pressable transition-colors"
              style={{
                background: tab === t ? "hsl(var(--m-surface))" : "transparent",
                color: tab === t ? "hsl(var(--m-text-primary))" : "hsl(var(--m-text-secondary))",
                boxShadow: tab === t ? "var(--m-shadow-sm)" : undefined,
              }}
            >
              {t === "upcoming" ? "Yaklaşan" : "Geçmiş"}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 pb-8 space-y-2">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ background: "hsl(var(--m-surface-muted))" }} />
          ))
        ) : filtered.length === 0 ? (
          <MobileEmptyState
            icon={Calendar}
            title={tab === "upcoming" ? "Yaklaşan randevu yok" : "Geçmiş randevu yok"}
            description="Yeni bir randevu almak için Keşfet sekmesine gidin"
            action={{ label: "Keşfet", onClick: () => navigate("/mobile/search") }}
          />
        ) : (
          filtered.map((a) => (
            <div key={a.id} className="m-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide" style={{ color: "hsl(var(--m-accent))" }}>
                    {a.appointment_type === "online" ? <Video className="w-3.5 h-3.5" /> : <Users className="w-3.5 h-3.5" />}
                    {a.appointment_type === "online" ? "Online" : "Yüz Yüze"}
                  </div>
                  <h3 className="font-semibold text-[15px] mt-1" style={{ color: "hsl(var(--m-text-primary))" }}>
                    {a.consultation_topic || "Genel Görüşme"}
                  </h3>
                  <div className="flex items-center gap-3 mt-1.5 text-[13px]" style={{ color: "hsl(var(--m-text-secondary))" }}>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(a.appointment_date).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {a.appointment_time?.slice(0, 5)}
                    </span>
                  </div>
                </div>
                <StatusBadge status={a.status} />
              </div>
              {tab === "upcoming" && a.status !== "cancelled" && (
                <button
                  onClick={() => cancel(a.id)}
                  className="mt-3 w-full h-9 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-1.5 m-pressable"
                  style={{ background: "hsl(var(--m-danger-soft))", color: "hsl(var(--m-danger))" }}
                >
                  <X className="w-4 h-4" /> İptal Et
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    pending: { label: "Bekliyor", bg: "var(--m-warning-soft)", color: "var(--m-warning)" },
    approved: { label: "Onaylı", bg: "var(--m-success-soft)", color: "var(--m-success)" },
    confirmed: { label: "Onaylı", bg: "var(--m-success-soft)", color: "var(--m-success)" },
    completed: { label: "Tamamlandı", bg: "var(--m-info-soft)", color: "var(--m-info)" },
    cancelled: { label: "İptal", bg: "var(--m-danger-soft)", color: "var(--m-danger)" },
  };
  const s = map[status] || map.pending;
  return (
    <span className="px-2.5 h-6 inline-flex items-center rounded-full text-[11px] font-semibold flex-shrink-0"
      style={{ background: `hsl(${s.bg})`, color: `hsl(${s.color})` }}>
      {s.label}
    </span>
  );
};
