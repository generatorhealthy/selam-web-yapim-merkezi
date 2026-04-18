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
    if (session?.user?.email) query = query.eq("patient_email", session.user.email);
    const { data, error } = await query;
    if (error) toast({ title: "Hata", description: error.message, variant: "destructive" });
    else setAppts((data as Appt[]) || []);
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
    if (error) toast({ title: "Hata", description: error.message, variant: "destructive" });
    else { toast({ title: "İptal edildi" }); load(); }
  };

  return (
    <div style={{ background: "hsl(var(--m-bg))", minHeight: "100vh" }}>
      <MobileHeader largeTitle="Randevularım" />

      {/* Premium pill tabs */}
      <div className="px-5 mb-5">
        <div className="inline-flex p-1.5 rounded-full" style={{ background: "hsl(var(--m-surface))", boxShadow: "var(--m-shadow)" }}>
          {(["upcoming", "past"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="h-10 px-6 rounded-full text-[14px] font-bold m-pressable transition-all"
              style={{
                background: tab === t ? "hsl(var(--m-ink))" : "transparent",
                color: tab === t ? "hsl(var(--m-bg))" : "hsl(var(--m-text-secondary))",
              }}
            >
              {t === "upcoming" ? "Yaklaşan" : "Geçmiş"}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 space-y-3">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="h-32 rounded-[24px] animate-pulse" style={{ background: "hsl(var(--m-surface-muted))" }} />
          ))
        ) : filtered.length === 0 ? (
          <MobileEmptyState
            icon={Calendar}
            title={tab === "upcoming" ? "Yaklaşan randevu yok" : "Geçmiş randevu yok"}
            description="Yeni bir randevu için Keşfet sekmesine gidin"
            action={
              <button
                onClick={() => navigate("/mobile/search")}
                className="px-6 h-12 rounded-full font-bold m-pressable"
                style={{ background: "hsl(var(--m-ink))", color: "hsl(var(--m-bg))" }}
              >
                Uzman Bul
              </button>
            }
          />
        ) : (
          filtered.map((a, idx) => {
            const tints = ["var(--m-tint-mint)", "var(--m-tint-lilac)", "var(--m-tint-sky)", "var(--m-tint-peach)"];
            return (
              <div
                key={a.id}
                className="rounded-[24px] p-5"
                style={{ background: `hsl(${tints[idx % tints.length]})` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider" style={{ color: "hsl(var(--m-text-secondary))" }}>
                      {a.appointment_type === "online" ? <Video className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                      {a.appointment_type === "online" ? "Online" : "Yüz Yüze"}
                    </div>
                    <h3 className="font-bold text-[17px] mt-1.5" style={{ color: "hsl(var(--m-text-primary))", letterSpacing: "-0.01em" }}>
                      {a.consultation_topic || "Genel Görüşme"}
                    </h3>
                    <div className="flex items-center gap-3 mt-3 text-[13px] font-medium" style={{ color: "hsl(var(--m-text-primary))" }}>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(a.appointment_date).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> {a.appointment_time?.slice(0, 5)}
                      </span>
                    </div>
                  </div>
                  <StatusBadge status={a.status} />
                </div>
                {tab === "upcoming" && a.status !== "cancelled" && (
                  <button
                    onClick={() => cancel(a.id)}
                    className="mt-4 w-full h-10 rounded-full text-[13px] font-bold flex items-center justify-center gap-1.5 m-pressable"
                    style={{ background: "hsl(0 0% 100% / 0.6)", color: "hsl(var(--m-danger))" }}
                  >
                    <X className="w-4 h-4" /> İptal Et
                  </button>
                )}
              </div>
            );
          })
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
    <span className="px-3 h-7 inline-flex items-center rounded-full text-[11px] font-bold flex-shrink-0"
      style={{ background: `hsl(${s.bg})`, color: `hsl(${s.color})` }}>
      {s.label}
    </span>
  );
};
