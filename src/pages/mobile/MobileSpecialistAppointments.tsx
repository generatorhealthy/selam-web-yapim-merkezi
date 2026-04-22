import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { MobileEmptyState } from "@/components/mobile/MobileEmptyState";
import { Calendar, Phone, Mail, CheckCircle2, XCircle, Clock, Plus } from "lucide-react";

type Tab = "upcoming" | "past" | "all";

const STATUS_LABEL: Record<string, string> = {
  pending: "Beklemede",
  confirmed: "Onaylandı",
  completed: "Tamamlandı",
  cancelled: "İptal",
};

export default function MobileSpecialistAppointments() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("upcoming");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      navigate("/mobile/login");
      return;
    }
    const { data: spec } = await supabase
      .from("specialists")
      .select("id")
      .or(`user_id.eq.${session.user.id},email.eq.${session.user.email}`)
      .maybeSingle();
    if (!spec) {
      navigate("/mobile/login");
      return;
    }
    const { data } = await supabase
      .from("appointments")
      .select("*")
      .eq("specialist_id", spec.id)
      .order("appointment_date", { ascending: false })
      .order("appointment_time", { ascending: false });
    setItems(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const today = new Date().toISOString().slice(0, 10);
  const filtered = items.filter((a) => {
    if (tab === "upcoming") return a.appointment_date >= today && a.status !== "cancelled";
    if (tab === "past") return a.appointment_date < today || a.status === "cancelled";
    return true;
  });

  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("appointments").update({ status }).eq("id", id);
    if (error) {
      toast({ title: "Hata", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Güncellendi" });
    load();
  };

  const statusColor = (s: string) => {
    if (s === "confirmed") return "hsl(var(--m-accent))";
    if (s === "completed") return "hsl(var(--m-success))";
    if (s === "cancelled") return "hsl(var(--m-danger))";
    return "hsl(var(--m-text-secondary))";
  };

  return (
    <div style={{ background: "hsl(var(--m-bg))", minHeight: "100vh", paddingBottom: 100 }}>
      <MobileHeader
        largeTitle="Randevular"
        subtitle="Tüm danışan randevularınız"
        trailing={
          <button
            onClick={() => navigate("/mobile/specialist-appointments/new")}
            className="w-10 h-10 rounded-full flex items-center justify-center m-pressable"
            style={{ background: "hsl(var(--m-accent))", color: "white" }}
            aria-label="Yeni randevu ekle"
            title="Yeni randevu ekle"
          >
            <Plus className="w-5 h-5" strokeWidth={2.6} />
          </button>
        }
      />

      {/* Tabs */}
      <div className="px-5 mb-4">
        <div className="m-card p-1 grid grid-cols-3 gap-1">
          {([
            ["upcoming", "Yaklaşan"],
            ["past", "Geçmiş"],
            ["all", "Tümü"],
          ] as [Tab, string][]).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className="h-10 rounded-xl text-[13px] font-semibold m-pressable"
              style={{
                background: tab === k ? "hsl(var(--m-accent))" : "transparent",
                color: tab === k ? "white" : "hsl(var(--m-text-secondary))",
              }}
            >{label}</button>
          ))}
        </div>
      </div>

      <div className="px-5 space-y-3">
        {loading ? (
          <div className="m-card p-4 text-[14px]" style={{ color: "hsl(var(--m-text-secondary))" }}>Yükleniyor…</div>
        ) : filtered.length === 0 ? (
          <MobileEmptyState icon={Calendar} title="Randevu yok" description="Bu sekmede gösterilecek kayıt yok" />
        ) : (
          filtered.map((a) => (
            <div key={a.id} className="m-card p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-[16px] truncate" style={{ color: "hsl(var(--m-text-primary))" }}>{a.patient_name}</div>
                  <div className="text-[12px] mt-0.5" style={{ color: "hsl(var(--m-text-secondary))" }}>
                    {new Date(a.appointment_date).toLocaleDateString("tr-TR", { day: "2-digit", month: "long" })} · {a.appointment_time?.slice(0, 5)}
                  </div>
                </div>
                <span
                  className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                  style={{ background: "hsl(var(--m-bg))", color: statusColor(a.status) }}
                >
                  {STATUS_LABEL[a.status] || a.status}
                </span>
              </div>

              <div className="space-y-1.5 text-[13px]" style={{ color: "hsl(var(--m-text-secondary))" }}>
                <div className="flex items-center gap-2"><Clock className="w-4 h-4" />{a.appointment_type === "online" ? "Online görüşme" : "Yüz yüze görüşme"}</div>
                {a.patient_phone && <a href={`tel:${a.patient_phone}`} className="flex items-center gap-2 m-pressable"><Phone className="w-4 h-4" />{a.patient_phone}</a>}
                {a.patient_email && <a href={`mailto:${a.patient_email}`} className="flex items-center gap-2 m-pressable truncate"><Mail className="w-4 h-4" />{a.patient_email}</a>}
                {a.consultation_topic && <div className="pt-1">{a.consultation_topic}</div>}
              </div>

              {a.status === "pending" && (
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <button
                    onClick={() => setStatus(a.id, "confirmed")}
                    className="h-10 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-1.5 m-pressable"
                    style={{ background: "hsl(var(--m-accent))", color: "white" }}
                  ><CheckCircle2 className="w-4 h-4" /> Onayla</button>
                  <button
                    onClick={() => setStatus(a.id, "cancelled")}
                    className="h-10 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-1.5 m-pressable"
                    style={{ background: "hsl(var(--m-danger-soft))", color: "hsl(var(--m-danger))" }}
                  ><XCircle className="w-4 h-4" /> İptal</button>
                </div>
              )}
              {a.status === "confirmed" && a.appointment_date <= today && (
                <button
                  onClick={() => setStatus(a.id, "completed")}
                  className="w-full h-10 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-1.5 m-pressable mt-3"
                  style={{ background: "hsl(var(--m-success) / 0.15)", color: "hsl(var(--m-success))" }}
                ><CheckCircle2 className="w-4 h-4" /> Tamamlandı işaretle</button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
