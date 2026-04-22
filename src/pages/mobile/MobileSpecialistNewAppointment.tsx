import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { Calendar, User, Phone, Mail, Video, Users, Save } from "lucide-react";

export default function MobileSpecialistNewAppointment() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [specialistId, setSpecialistId] = useState<string | null>(null);

  const [form, setForm] = useState({
    patient_name: "",
    patient_phone: "",
    patient_email: "",
    appointment_date: "",
    appointment_time: "",
    appointment_type: "online",
    consultation_topic: "",
    notes: "",
  });

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { navigate("/mobile/login"); return; }
      const { data: spec } = await supabase
        .from("specialists")
        .select("id")
        .or(`user_id.eq.${session.user.id},email.eq.${session.user.email}`)
        .maybeSingle();
      if (!spec) { navigate("/mobile/login"); return; }
      setSpecialistId(spec.id);
    })();
  }, []);

  const onChange = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!specialistId) return;
    if (!form.patient_name || !form.patient_phone || !form.appointment_date || !form.appointment_time) {
      toast({ title: "Eksik bilgi", description: "Ad, telefon, tarih ve saat zorunlu", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("appointments").insert({
      specialist_id: specialistId,
      patient_name: form.patient_name,
      patient_phone: form.patient_phone,
      patient_email: form.patient_email || `${form.patient_phone}@noemail.local`,
      appointment_date: form.appointment_date,
      appointment_time: form.appointment_time,
      appointment_type: form.appointment_type,
      consultation_topic: form.consultation_topic || null,
      notes: form.notes || null,
      status: "confirmed",
      created_by_specialist: true,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Hata", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Randevu eklendi" });
    navigate("/mobile/specialist-appointments");
  };

  const inputCls = "w-full h-12 px-4 rounded-xl text-[15px] outline-none";
  const inputStyle = {
    background: "hsl(var(--m-surface))",
    color: "hsl(var(--m-text-primary))",
    border: "1px solid hsl(var(--m-border))",
  } as const;

  return (
    <div style={{ background: "hsl(var(--m-bg))", minHeight: "100vh", paddingBottom: 120 }}>
      <MobileHeader largeTitle="Yeni Randevu" subtitle="Danışan randevusu oluştur" />

      <div className="px-5 space-y-4">
        {/* Danışan */}
        <div className="m-card p-4 space-y-3">
          <div className="flex items-center gap-2 text-[13px] font-bold" style={{ color: "hsl(var(--m-text-secondary))" }}>
            <User className="w-4 h-4" /> DANIŞAN BİLGİLERİ
          </div>
          <input className={inputCls} style={inputStyle} placeholder="Ad Soyad *" value={form.patient_name} onChange={(e) => onChange("patient_name", e.target.value)} />
          <input className={inputCls} style={inputStyle} placeholder="Telefon *" value={form.patient_phone} onChange={(e) => onChange("patient_phone", e.target.value)} type="tel" />
          <input className={inputCls} style={inputStyle} placeholder="E-posta (opsiyonel)" value={form.patient_email} onChange={(e) => onChange("patient_email", e.target.value)} type="email" />
        </div>

        {/* Randevu */}
        <div className="m-card p-4 space-y-3">
          <div className="flex items-center gap-2 text-[13px] font-bold" style={{ color: "hsl(var(--m-text-secondary))" }}>
            <Calendar className="w-4 h-4" /> RANDEVU
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input className={inputCls} style={inputStyle} value={form.appointment_date} onChange={(e) => onChange("appointment_date", e.target.value)} type="date" />
            <input className={inputCls} style={inputStyle} value={form.appointment_time} onChange={(e) => onChange("appointment_time", e.target.value)} type="time" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {([["online", "Online", Video], ["face-to-face", "Yüz yüze", Users]] as const).map(([val, label, Icon]) => (
              <button
                key={val}
                onClick={() => onChange("appointment_type", val)}
                className="h-12 rounded-xl text-[14px] font-semibold flex items-center justify-center gap-2 m-pressable"
                style={{
                  background: form.appointment_type === val ? "hsl(var(--m-accent))" : "hsl(var(--m-surface))",
                  color: form.appointment_type === val ? "white" : "hsl(var(--m-text-primary))",
                  border: "1px solid hsl(var(--m-border))",
                }}
              ><Icon className="w-4 h-4" />{label}</button>
            ))}
          </div>
          <input className={inputCls} style={inputStyle} placeholder="Danışmanlık konusu" value={form.consultation_topic} onChange={(e) => onChange("consultation_topic", e.target.value)} />
          <textarea className="w-full p-4 rounded-xl text-[15px] outline-none min-h-[80px]" style={inputStyle} placeholder="Notlar" value={form.notes} onChange={(e) => onChange("notes", e.target.value)} />
        </div>

        <button
          onClick={submit}
          disabled={loading}
          className="w-full h-14 rounded-2xl text-[15px] font-bold flex items-center justify-center gap-2 m-pressable disabled:opacity-60"
          style={{ background: "hsl(var(--m-accent))", color: "white" }}
        >
          <Save className="w-5 h-5" /> {loading ? "Kaydediliyor..." : "Randevuyu Kaydet"}
        </button>
      </div>
    </div>
  );
}
