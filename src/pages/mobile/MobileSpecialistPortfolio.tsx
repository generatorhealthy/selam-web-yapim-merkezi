import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { MobileEmptyState } from "@/components/mobile/MobileEmptyState";
import { Search, Users, Calendar, Phone, Mail } from "lucide-react";

interface Client {
  email: string;
  name: string;
  phone?: string;
  count: number;
  lastDate: string;
  topics: Set<string>;
}

export default function MobileSpecialistPortfolio() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [q, setQ] = useState("");

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

      const { data } = await supabase
        .from("appointments")
        .select("patient_name, patient_email, patient_phone, appointment_date, consultation_topic")
        .eq("specialist_id", spec.id)
        .order("appointment_date", { ascending: false });

      const map = new Map<string, Client>();
      (data || []).forEach((a) => {
        const existing = map.get(a.patient_email);
        if (existing) {
          existing.count++;
          if (a.consultation_topic) existing.topics.add(a.consultation_topic);
        } else {
          map.set(a.patient_email, {
            email: a.patient_email,
            name: a.patient_name,
            phone: a.patient_phone,
            count: 1,
            lastDate: a.appointment_date,
            topics: new Set(a.consultation_topic ? [a.consultation_topic] : []),
          });
        }
      });
      setClients(Array.from(map.values()));
      setLoading(false);
    })();
  }, [navigate]);

  const filtered = useMemo(() => {
    if (!q.trim()) return clients;
    const s = q.toLowerCase();
    return clients.filter((c) =>
      c.name.toLowerCase().includes(s) ||
      c.email.toLowerCase().includes(s) ||
      (c.phone || "").includes(s),
    );
  }, [clients, q]);

  return (
    <div style={{ background: "hsl(var(--m-bg))", minHeight: "100vh", paddingBottom: 100 }}>
      <MobileHeader showBack largeTitle="Danışan Portföyü" subtitle={`${clients.length} danışan`} />

      <div className="px-5 mb-4">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "hsl(var(--m-text-secondary))" }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ara: isim, e-posta, telefon"
            className="w-full h-12 pl-11 pr-3 rounded-2xl text-[15px] outline-none m-card"
            style={{ color: "hsl(var(--m-text-primary))" }}
          />
        </div>
      </div>

      <div className="px-5 space-y-3">
        {loading ? (
          <div className="m-card p-4 text-[14px]" style={{ color: "hsl(var(--m-text-secondary))" }}>Yükleniyor…</div>
        ) : filtered.length === 0 ? (
          <MobileEmptyState icon={Users} title="Danışan bulunamadı" />
        ) : (
          filtered.map((c) => (
            <div key={c.email} className="m-card p-4">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center font-bold"
                  style={{ background: "hsl(var(--m-accent-soft))", color: "hsl(var(--m-accent))" }}
                >
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-[15px] truncate" style={{ color: "hsl(var(--m-text-primary))" }}>{c.name}</div>
                  <div className="flex items-center gap-3 text-[12px] mt-0.5" style={{ color: "hsl(var(--m-text-secondary))" }}>
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{c.count} görüşme</span>
                    <span>{new Date(c.lastDate).toLocaleDateString("tr-TR")}</span>
                  </div>
                </div>
              </div>

              {c.topics.size > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {Array.from(c.topics).slice(0, 3).map((t, i) => (
                    <span
                      key={i}
                      className="text-[11px] px-2 py-1 rounded-full font-medium"
                      style={{ background: "hsl(var(--m-bg))", color: "hsl(var(--m-text-secondary))" }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2">
                {c.phone && (
                  <a
                    href={`tel:${c.phone}`}
                    className="flex-1 h-10 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-1.5 m-pressable"
                    style={{ background: "hsl(var(--m-accent-soft))", color: "hsl(var(--m-accent))" }}
                  >
                    <Phone className="w-4 h-4" /> Ara
                  </a>
                )}
                <a
                  href={`mailto:${c.email}`}
                  className="flex-1 h-10 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-1.5 m-pressable"
                  style={{ background: "hsl(var(--m-bg))", color: "hsl(var(--m-text-primary))" }}
                >
                  <Mail className="w-4 h-4" /> E-posta
                </a>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
