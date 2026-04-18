import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { useToast } from "@/hooks/use-toast";
import { Video, Users, Check, ChevronRight } from "lucide-react";
import { getAvailableSlotsForDate, formatDateKey } from "@/utils/availabilityUtils";

type Step = 1 | 2 | 3 | 4;

export default function MobileBooking() {
  const { specialistId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>(1);
  const [specialist, setSpecialist] = useState<any>(null);
  const [appointmentType, setAppointmentType] = useState<"online" | "face-to-face" | "">("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState("");
  const [topic, setTopic] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Generate next 14 days
  const days = useMemo(() => {
    const arr: Date[] = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      arr.push(d);
    }
    return arr;
  }, []);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.rpc("get_public_specialists");
      const found = (data as any[])?.find((s) => s.id === specialistId);
      setSpecialist(found);
      // Fetch full specialist for time slots
      if (found?.slug) {
        const { data: full } = await supabase.rpc("get_public_specialist_by_slug", { p_slug: found.slug });
        if (full && (full as any[])[0]) setSpecialist({ ...found, ...(full as any[])[0] });
      }
    })();
  }, [specialistId]);

  useEffect(() => {
    if (!selectedDate || !specialistId) return;
    (async () => {
      const dateStr = formatDateKey(selectedDate);
      const { data } = await supabase
        .from("appointments")
        .select("appointment_time")
        .eq("specialist_id", specialistId)
        .eq("appointment_date", dateStr)
        .neq("status", "cancelled");
      setBookedSlots((data || []).map((a: any) => a.appointment_time?.slice(0, 5)));
    })();
  }, [selectedDate, specialistId]);

  const availableSlots = useMemo(() => {
    if (!selectedDate || !specialist) return [];
    return getAvailableSlotsForDate(specialist.available_time_slots, formatDateKey(selectedDate));
  }, [selectedDate, specialist]);

  const submit = async () => {
    if (!appointmentType || !selectedDate || !selectedTime || !name || !email || !phone) {
      toast({ title: "Eksik bilgi", description: "Tüm alanları doldurun", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("appointments").insert([
        {
          specialist_id: specialistId,
          appointment_date: formatDateKey(selectedDate),
          appointment_time: selectedTime,
          appointment_type: appointmentType,
          consultation_topic: topic || "Genel",
          patient_name: name,
          patient_email: email,
          patient_phone: phone,
          status: "pending",
        },
      ]);
      if (error) throw error;
      toast({ title: "Randevu alındı", description: "Yakında onay alacaksınız" });
      navigate("/mobile/appointments");
    } catch (e: any) {
      toast({ title: "Hata", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ background: "hsl(var(--m-bg))", minHeight: "100vh", paddingBottom: 120 }}>
      <MobileHeader
        showBack
        title="Randevu"
        largeTitle={`Adım ${step}/4`}
        subtitle={
          step === 1 ? "Görüşme türü" :
          step === 2 ? "Tarih seçin" :
          step === 3 ? "Saat seçin" :
          "Bilgileriniz"
        }
      />

      {/* Progress */}
      <div className="px-5 mb-4 flex gap-1.5">
        {[1, 2, 3, 4].map((n) => (
          <div
            key={n}
            className="flex-1 h-1 rounded-full"
            style={{ background: n <= step ? "hsl(var(--m-accent))" : "hsl(var(--m-divider))" }}
          />
        ))}
      </div>

      <div className="px-5 space-y-3">
        {step === 1 && (
          <>
            {specialist?.online_consultation && (
              <TypeCard
                active={appointmentType === "online"}
                icon={Video}
                title="Online Görüşme"
                desc="Video görüntülü görüşme"
                onClick={() => setAppointmentType("online")}
              />
            )}
            {specialist?.face_to_face_consultation && (
              <TypeCard
                active={appointmentType === "face-to-face"}
                icon={Users}
                title="Yüz Yüze"
                desc="Klinikte görüşme"
                onClick={() => setAppointmentType("face-to-face")}
              />
            )}
          </>
        )}

        {step === 2 && (
          <div className="grid grid-cols-4 gap-2">
            {days.map((d) => {
              const isSel = selectedDate && formatDateKey(d) === formatDateKey(selectedDate);
              return (
                <button
                  key={d.toISOString()}
                  onClick={() => setSelectedDate(d)}
                  className="aspect-square rounded-2xl flex flex-col items-center justify-center m-pressable"
                  style={{
                    background: isSel ? "hsl(var(--m-accent))" : "hsl(var(--m-surface))",
                    color: isSel ? "white" : "hsl(var(--m-text-primary))",
                    boxShadow: isSel ? undefined : "var(--m-shadow)",
                  }}
                >
                  <span className="text-[11px] font-medium opacity-70">
                    {d.toLocaleDateString("tr-TR", { weekday: "short" })}
                  </span>
                  <span className="text-[20px] font-bold">{d.getDate()}</span>
                  <span className="text-[10px] opacity-70">
                    {d.toLocaleDateString("tr-TR", { month: "short" })}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {step === 3 && (
          <div className="grid grid-cols-3 gap-2">
            {availableSlots.length === 0 ? (
              <p className="col-span-3 text-center py-8" style={{ color: "hsl(var(--m-text-secondary))" }}>
                Bu güne uygun saat yok
              </p>
            ) : (
              availableSlots.map((t) => {
                const taken = bookedSlots.includes(t);
                const sel = selectedTime === t;
                return (
                  <button
                    key={t}
                    disabled={taken}
                    onClick={() => setSelectedTime(t)}
                    className="h-12 rounded-xl text-[14px] font-semibold m-pressable disabled:opacity-30"
                    style={{
                      background: sel ? "hsl(var(--m-accent))" : "hsl(var(--m-surface))",
                      color: sel ? "white" : "hsl(var(--m-text-primary))",
                      textDecoration: taken ? "line-through" : undefined,
                      boxShadow: sel ? undefined : "var(--m-shadow)",
                    }}
                  >
                    {t}
                  </button>
                );
              })
            )}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-3">
            <Input label="Ad Soyad" value={name} onChange={setName} placeholder="Adınız" />
            <Input label="E-posta" value={email} onChange={setEmail} placeholder="email@ornek.com" type="email" />
            <Input label="Telefon" value={phone} onChange={setPhone} placeholder="05XX XXX XX XX" type="tel" />
            <Input label="Konu (opsiyonel)" value={topic} onChange={setTopic} placeholder="Görüşme konusu" />
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <div
        className="fixed bottom-0 left-0 right-0 m-glass px-5 pt-3 flex gap-2"
        style={{
          paddingBottom: "calc(12px + var(--m-safe-bottom))",
          borderTop: "1px solid hsl(var(--m-divider))",
        }}
      >
        {step > 1 && (
          <button
            onClick={() => setStep((s) => (s - 1) as Step)}
            className="flex-1 h-12 rounded-2xl font-semibold m-pressable"
            style={{ background: "hsl(var(--m-surface-muted))", color: "hsl(var(--m-text-primary))" }}
          >
            Geri
          </button>
        )}
        <button
          disabled={
            (step === 1 && !appointmentType) ||
            (step === 2 && !selectedDate) ||
            (step === 3 && !selectedTime) ||
            submitting
          }
          onClick={() => (step === 4 ? submit() : setStep((s) => (s + 1) as Step))}
          className="flex-[2] h-12 rounded-2xl font-semibold m-pressable disabled:opacity-40 flex items-center justify-center gap-2"
          style={{ background: "hsl(var(--m-accent))", color: "white" }}
        >
          {step === 4 ? (submitting ? "Gönderiliyor..." : "Randevu Al") : "Devam"}
          {step !== 4 && <ChevronRight className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
}

const TypeCard = ({ active, icon: Icon, title, desc, onClick }: any) => (
  <button
    onClick={onClick}
    className="w-full m-card p-4 flex items-center gap-3 m-pressable"
    style={{
      borderWidth: 2,
      borderStyle: "solid",
      borderColor: active ? "hsl(var(--m-accent))" : "transparent",
    }}
  >
    <div
      className="w-12 h-12 rounded-2xl flex items-center justify-center"
      style={{ background: "hsl(var(--m-accent-soft))" }}
    >
      <Icon className="w-6 h-6" style={{ color: "hsl(var(--m-accent))" }} />
    </div>
    <div className="flex-1 text-left">
      <div className="font-semibold text-[15px]" style={{ color: "hsl(var(--m-text-primary))" }}>{title}</div>
      <div className="text-[13px]" style={{ color: "hsl(var(--m-text-secondary))" }}>{desc}</div>
    </div>
    {active && <Check className="w-5 h-5" style={{ color: "hsl(var(--m-accent))" }} />}
  </button>
);

const Input = ({ label, value, onChange, placeholder, type = "text" }: any) => (
  <div>
    <label className="block text-[13px] font-medium mb-1.5 px-1" style={{ color: "hsl(var(--m-text-secondary))" }}>
      {label}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full h-12 px-4 rounded-2xl text-[15px] outline-none"
      style={{ background: "hsl(var(--m-surface))", color: "hsl(var(--m-text-primary))", boxShadow: "var(--m-shadow)" }}
    />
  </div>
);
