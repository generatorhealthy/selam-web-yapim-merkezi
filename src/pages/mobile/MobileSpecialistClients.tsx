import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { MobileEmptyState } from "@/components/mobile/MobileEmptyState";
import { Search, Users, Phone, Mail, Calendar, UserPlus } from "lucide-react";

interface Client {
  key: string;
  name: string;
  email?: string;
  phone?: string;
  appointmentCount: number;
  lastDate: string;
  source: "appointment" | "referral";
}

export default function MobileSpecialistClients() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
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

      const map = new Map<string, Client>();

      // 1) Appointments — actual booked clients
      const { data: appts } = await supabase
        .from("appointments")
        .select("patient_name, patient_email, patient_phone, appointment_date")
        .eq("specialist_id", spec.id)
        .order("appointment_date", { ascending: false });

      (appts || []).forEach((a) => {
        const key = (a.patient_email || a.patient_phone || a.patient_name || "").toLowerCase();
        if (!key) return;
        const existing = map.get(key);
        if (existing) {
          existing.appointmentCount++;
        } else {
          map.set(key, {
            key,
            name: a.patient_name,
            email: a.patient_email,
            phone: a.patient_phone,
            appointmentCount: 1,
            lastDate: a.appointment_date,
            source: "appointment",
          });
        }
      });

      // 2) Client referrals — admin-yönlendirilen danışanlar (web ile aynı)
      const { data: refs } = await supabase
        .from("client_referrals")
        .select("client_name, client_surname, client_contact, referred_at, created_at, year, month")
        .eq("specialist_id", spec.id)
        .order("year", { ascending: false })
        .order("month", { ascending: false });

      (refs || []).forEach((r: any) => {
        const fullName = [r.client_name, r.client_surname].filter(Boolean).join(" ").trim();
        if (!fullName && !r.client_contact) return;
        const key = (r.client_contact || fullName).toLowerCase();
        if (map.has(key)) return;
        const phone = r.client_contact && /\d/.test(r.client_contact) ? r.client_contact : undefined;
        const email = r.client_contact && r.client_contact.includes("@") ? r.client_contact : undefined;
        map.set(key, {
          key,
          name: fullName || "Danışan",
          email,
          phone,
          appointmentCount: 0,
          lastDate: r.referred_at || r.created_at || `${r.year}-${String(r.month).padStart(2, "0")}-01`,
          source: "referral",
        });
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
      (c.email || "").toLowerCase().includes(s) ||
      (c.phone || "").includes(s),
    );
  }, [clients, q]);

  return (
    <div style={{ background: "hsl(var(--m-bg))", minHeight: "100vh", paddingBottom: 100 }}>
      <MobileHeader showBack largeTitle="Danışanlar" subtitle={`${clients.length} kişi`} />

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
          <MobileEmptyState icon={Users} title="Danışan yok" />
        ) : (
          filtered.map((c) => (
            <div key={c.key} className="m-card p-4 flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center font-bold"
                style={{ background: "hsl(var(--m-accent-soft))", color: "hsl(var(--m-accent))" }}
              >
                {c.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-[15px] truncate" style={{ color: "hsl(var(--m-text-primary))" }}>{c.name}</span>
                  {c.source === "referral" && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "hsl(var(--m-tint-mint))", color: "hsl(var(--m-ink))" }}>
                      <UserPlus className="w-2.5 h-2.5" /> Yönlendirildi
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-[12px] mt-0.5" style={{ color: "hsl(var(--m-text-secondary))" }}>
                  {c.appointmentCount > 0 && (
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{c.appointmentCount}</span>
                  )}
                  <span className="truncate">{new Date(c.lastDate).toLocaleDateString("tr-TR")}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {c.phone && (
                  <a href={`tel:${c.phone}`} className="w-9 h-9 rounded-full flex items-center justify-center m-pressable"
                    style={{ background: "hsl(var(--m-accent-soft))", color: "hsl(var(--m-accent))" }}
                  ><Phone className="w-4 h-4" /></a>
                )}
                {c.email && (
                  <a href={`mailto:${c.email}`} className="w-9 h-9 rounded-full flex items-center justify-center m-pressable"
                    style={{ background: "hsl(var(--m-bg))", color: "hsl(var(--m-text-secondary))" }}
                  ><Mail className="w-4 h-4" /></a>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
