import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { Calendar, Clock, Video, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  appointment_type: string;
  status: string;
  consultation_topic: string | null;
  specialist_id: string | null;
  specialists?: { name: string; specialty: string; profile_picture: string | null } | null;
}

export default function MobilePatientAppointments() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.auth.getSession();
      const user = s.session?.user;
      if (!user) { navigate("/mobile/login"); return; }

      const { data } = await supabase
        .from("appointments")
        .select("id,appointment_date,appointment_time,appointment_type,status,consultation_topic,specialist_id,specialists(name,specialty,profile_picture)")
        .or(`patient_user_id.eq.${user.id},patient_email.eq.${user.email}`)
        .order("appointment_date", { ascending: false });
      setItems((data as any) ?? []);
      setLoading(false);
    })();
  }, [navigate]);

  const statusColor = (s: string) => ({
    confirmed: "hsl(160 70% 40%)",
    pending: "hsl(35 90% 50%)",
    cancelled: "hsl(0 75% 50%)",
    completed: "hsl(220 15% 45%)",
  } as Record<string, string>)[s] || "hsl(220 15% 45%)";

  const statusLabel = (s: string) => ({
    confirmed: "Onaylandı", pending: "Bekliyor", cancelled: "İptal", completed: "Tamamlandı",
  } as Record<string, string>)[s] || s;

  return (
    <div style={{ background: "hsl(var(--m-bg))", minHeight: "100vh", paddingBottom: 120 }}>
      <MobileHeader showBack largeTitle="Randevularım" />
      <div className="px-5 mt-4 space-y-3">
        {loading ? (
          <div className="text-center py-12 text-[14px]" style={{ color: "hsl(var(--m-text-secondary))" }}>Yükleniyor...</div>
        ) : items.length === 0 ? (
          <div className="m-card p-8 text-center">
            <Calendar className="w-12 h-12 mx-auto mb-3" style={{ color: "hsl(var(--m-text-secondary))" }} />
            <p className="text-[14px]" style={{ color: "hsl(var(--m-text-secondary))" }}>Henüz randevunuz yok</p>
          </div>
        ) : items.map((a) => (
          <div key={a.id} className="m-card p-4">
            <div className="flex items-start gap-3">
              {a.specialists?.profile_picture ? (
                <img src={a.specialists.profile_picture} alt="" className="w-12 h-12 rounded-full object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "hsl(var(--m-accent-soft))" }}>
                  <span className="font-semibold" style={{ color: "hsl(var(--m-accent))" }}>{a.specialists?.name?.[0] ?? "?"}</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-semibold truncate" style={{ color: "hsl(var(--m-text-primary))" }}>{a.specialists?.name ?? "Uzman"}</div>
                <div className="text-[12px]" style={{ color: "hsl(var(--m-text-secondary))" }}>{a.specialists?.specialty}</div>
              </div>
              <span className="text-[11px] font-semibold px-2 py-1 rounded-full" style={{ background: `${statusColor(a.status)}15`, color: statusColor(a.status) }}>
                {statusLabel(a.status)}
              </span>
            </div>
            <div className="flex items-center gap-4 mt-3 text-[12px]" style={{ color: "hsl(var(--m-text-secondary))" }}>
              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{new Date(a.appointment_date).toLocaleDateString("tr-TR")}</span>
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{a.appointment_time?.slice(0, 5)}</span>
              <span className="flex items-center gap-1">
                {a.appointment_type === "online" ? <Video className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}
                {a.appointment_type === "online" ? "Online" : "Yüz yüze"}
              </span>
            </div>
            {a.consultation_topic && (
              <div className="mt-2 text-[12px] px-3 py-2 rounded-lg" style={{ background: "hsl(var(--m-bg))", color: "hsl(var(--m-text-primary))" }}>
                {a.consultation_topic}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
