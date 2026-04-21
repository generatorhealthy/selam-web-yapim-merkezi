import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { LogOut, Save, User, Phone, MapPin, FileText, GraduationCap, Award, Building2, Clock, CalendarDays, HelpCircle, Search, Plus, Trash2, Heart } from "lucide-react";
import { getSuggestedInterests, hasSuggestedInterests } from "@/lib/specialistInterests";

type FaqItem = { question: string; answer: string };

function parseFaq(raw: string): FaqItem[] {
  if (!raw) return [];
  const trimmed = raw.trim();
  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .filter((p) => p && (p.question || p.answer))
          .map((p) => ({ question: String(p.question || ""), answer: String(p.answer || "") }));
      }
    } catch {
      /* fall through */
    }
  }
  // Fallback: legacy plain text — treat as single answer
  return [{ question: "", answer: trimmed }];
}

const DAYS = [
  { key: "monday", label: "Pzt" },
  { key: "tuesday", label: "Sal" },
  { key: "wednesday", label: "Çar" },
  { key: "thursday", label: "Per" },
  { key: "friday", label: "Cum" },
  { key: "saturday", label: "Cmt" },
  { key: "sunday", label: "Paz" },
];

type Section = "basic" | "professional" | "interests" | "schedule" | "extra" | "seo";

export default function MobileSpecialistProfile() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [spec, setSpec] = useState<any>(null);
  const [section, setSection] = useState<Section>("basic");

  const [form, setForm] = useState({
    name: "", phone: "", city: "", bio: "", address: "",
    education: "", university: "", certifications: "", hospital: "", experience: "",
    working_hours_start: "09:00", working_hours_end: "18:00",
    available_days: [] as string[],
    online_consultation: false, face_to_face_consultation: false,
    faq: "",
    seo_title: "", seo_description: "", seo_keywords: "",
    interests: [] as string[],
  });

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { navigate("/mobile/login"); return; }
      const { data } = await supabase
        .from("specialists")
        .select("*")
        .or(`user_id.eq.${session.user.id},email.eq.${session.user.email}`)
        .maybeSingle();
      if (!data) { navigate("/mobile/login"); return; }
      setSpec(data);
      setForm({
        name: data.name || "",
        phone: data.phone || "",
        city: data.city || "",
        bio: data.bio || "",
        address: data.address || "",
        education: data.education || "",
        university: data.university || "",
        certifications: data.certifications || "",
        hospital: data.hospital || "",
        experience: String(data.experience || ""),
        working_hours_start: data.working_hours_start || "09:00",
        working_hours_end: data.working_hours_end || "18:00",
        available_days: data.available_days || [],
        online_consultation: !!data.online_consultation,
        face_to_face_consultation: !!data.face_to_face_consultation,
        faq: data.faq || "",
        seo_title: data.seo_title || "",
        seo_description: data.seo_description || "",
        seo_keywords: data.seo_keywords || "",
        interests: Array.isArray((data as any).interests) ? (data as any).interests : [],
      });
      setLoading(false);
    })();
  }, [navigate]);

  const toggleDay = (key: string) => {
    setForm((f) => ({
      ...f,
      available_days: f.available_days.includes(key)
        ? f.available_days.filter((d) => d !== key)
        : [...f.available_days, key],
    }));
  };

  const save = async () => {
    if (!spec) return;
    setSaving(true);
    const { error } = await supabase
      .from("specialists")
      .update({
        name: form.name,
        phone: form.phone,
        city: form.city,
        bio: form.bio,
        address: form.address,
        education: form.education,
        university: form.university,
        certifications: form.certifications,
        hospital: form.hospital,
        experience: Number(form.experience) || null,
        working_hours_start: form.working_hours_start,
        working_hours_end: form.working_hours_end,
        available_days: form.available_days,
        online_consultation: form.online_consultation,
        face_to_face_consultation: form.face_to_face_consultation,
        faq: form.faq,
        seo_title: form.seo_title,
        seo_description: form.seo_description,
        seo_keywords: form.seo_keywords,
        interests: form.interests,
      } as any)
      .eq("id", spec.id);
    setSaving(false);
    if (error) {
      toast({ title: "Hata", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Profil güncellendi" });
  };

  const logout = async () => {
    await supabase.auth.signOut();
    navigate("/mobile/login");
  };

  if (loading) {
    return (
      <div style={{ background: "hsl(var(--m-bg))", minHeight: "100vh" }}>
        <MobileHeader showBack largeTitle="Profil" />
        <div className="px-5"><div className="m-card p-4 text-[14px]" style={{ color: "hsl(var(--m-text-secondary))" }}>Yükleniyor…</div></div>
      </div>
    );
  }

  const initial = (form.name || spec?.email || "?").charAt(0).toUpperCase();

  const Field = ({ icon: Icon, label, value, onChange, type = "text", multiline = false, rows = 4 }: any) => (
    <div>
      <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "hsl(var(--m-text-secondary))" }}>{label}</label>
      <div className="mt-1.5 relative">
        {Icon && <Icon className="w-4 h-4 absolute left-3 top-3.5" style={{ color: "hsl(var(--m-text-secondary))" }} />}
        {multiline ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={rows}
            className={`w-full pr-3 py-3 rounded-xl text-[14px] outline-none resize-none ${Icon ? "pl-10" : "pl-3"}`}
            style={{ background: "hsl(var(--m-bg))", color: "hsl(var(--m-text-primary))" }}
          />
        ) : (
          <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full h-11 pr-3 rounded-xl text-[14px] outline-none ${Icon ? "pl-10" : "pl-3"}`}
            style={{ background: "hsl(var(--m-bg))", color: "hsl(var(--m-text-primary))" }}
          />
        )}
      </div>
    </div>
  );

  const tabs: { id: Section; label: string }[] = [
    { id: "basic", label: "Temel" },
    { id: "professional", label: "Mesleki" },
    { id: "schedule", label: "Çalışma" },
    { id: "extra", label: "SSS" },
    { id: "seo", label: "SEO" },
  ];

  return (
    <div style={{ background: "hsl(var(--m-bg))", minHeight: "100vh", paddingBottom: 120 }}>
      <MobileHeader showBack largeTitle="Profil" subtitle={spec?.specialty} />

      {/* Avatar */}
      <div className="px-5 mb-4">
        <div className="m-card p-5 flex items-center gap-4">
          {spec?.profile_picture ? (
            <img src={spec.profile_picture} alt={form.name} className="w-16 h-16 rounded-full object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: "hsl(var(--m-accent-soft))" }}
            >
              <span className="text-2xl font-bold" style={{ color: "hsl(var(--m-accent))" }}>{initial}</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-[17px] truncate" style={{ color: "hsl(var(--m-text-primary))" }}>{form.name}</h2>
            <p className="text-[13px] truncate" style={{ color: "hsl(var(--m-text-secondary))" }}>{spec?.email}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-5 mb-4">
        <div className="flex gap-1 p-1 rounded-2xl overflow-x-auto" style={{ background: "hsl(var(--m-surface))" }}>
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setSection(t.id)}
              className="flex-shrink-0 px-3 h-9 rounded-xl text-[12px] font-semibold m-pressable"
              style={{
                background: section === t.id ? "hsl(var(--m-ink))" : "transparent",
                color: section === t.id ? "hsl(var(--m-bg))" : "hsl(var(--m-text-secondary))",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sections */}
      <div className="px-5 mb-4">
        <div className="m-card p-5 space-y-4">
          {section === "basic" && (
            <>
              <Field icon={User} label="Ad Soyad" value={form.name} onChange={(v: string) => setForm({ ...form, name: v })} />
              <Field icon={Phone} label="Telefon" value={form.phone} onChange={(v: string) => setForm({ ...form, phone: v })} type="tel" />
              <Field icon={MapPin} label="Şehir" value={form.city} onChange={(v: string) => setForm({ ...form, city: v })} />
              <Field icon={MapPin} label="Adres" value={form.address} onChange={(v: string) => setForm({ ...form, address: v })} multiline rows={2} />
              <Field icon={FileText} label="Hakkımda" value={form.bio} onChange={(v: string) => setForm({ ...form, bio: v })} multiline rows={5} />
            </>
          )}

          {section === "professional" && (
            <>
              <Field icon={GraduationCap} label="Eğitim" value={form.education} onChange={(v: string) => setForm({ ...form, education: v })} multiline />
              <Field icon={GraduationCap} label="Üniversite" value={form.university} onChange={(v: string) => setForm({ ...form, university: v })} />
              <Field icon={Award} label="Sertifikalar" value={form.certifications} onChange={(v: string) => setForm({ ...form, certifications: v })} multiline />
              <Field icon={Building2} label="Hastane / Klinik" value={form.hospital} onChange={(v: string) => setForm({ ...form, hospital: v })} />
              <Field label="Deneyim (yıl)" value={form.experience} onChange={(v: string) => setForm({ ...form, experience: v })} type="number" />
            </>
          )}

          {section === "schedule" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Field icon={Clock} label="Başlangıç" value={form.working_hours_start} onChange={(v: string) => setForm({ ...form, working_hours_start: v })} type="time" />
                <Field icon={Clock} label="Bitiş" value={form.working_hours_end} onChange={(v: string) => setForm({ ...form, working_hours_end: v })} type="time" />
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "hsl(var(--m-text-secondary))" }}>
                  <CalendarDays className="w-3 h-3 inline mr-1" /> Müsait Günler
                </label>
                <div className="mt-2 grid grid-cols-7 gap-1.5">
                  {DAYS.map((d) => {
                    const active = form.available_days.includes(d.key);
                    return (
                      <button
                        key={d.key}
                        onClick={() => toggleDay(d.key)}
                        className="h-10 rounded-xl text-[12px] font-bold m-pressable"
                        style={{
                          background: active ? "hsl(var(--m-ink))" : "hsl(var(--m-bg))",
                          color: active ? "hsl(var(--m-bg))" : "hsl(var(--m-text-secondary))",
                        }}
                      >
                        {d.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-3 rounded-xl cursor-pointer" style={{ background: "hsl(var(--m-bg))" }}>
                  <input
                    type="checkbox"
                    checked={form.online_consultation}
                    onChange={(e) => setForm({ ...form, online_consultation: e.target.checked })}
                    className="w-5 h-5"
                  />
                  <span className="text-[14px] font-medium" style={{ color: "hsl(var(--m-text-primary))" }}>Online Görüşme</span>
                </label>
                <label className="flex items-center gap-3 p-3 rounded-xl cursor-pointer" style={{ background: "hsl(var(--m-bg))" }}>
                  <input
                    type="checkbox"
                    checked={form.face_to_face_consultation}
                    onChange={(e) => setForm({ ...form, face_to_face_consultation: e.target.checked })}
                    className="w-5 h-5"
                  />
                  <span className="text-[14px] font-medium" style={{ color: "hsl(var(--m-text-primary))" }}>Yüz Yüze Görüşme</span>
                </label>
              </div>
            </>
          )}

          {section === "extra" && (() => {
            const faqs = parseFaq(form.faq);
            const updateFaqs = (next: FaqItem[]) =>
              setForm({ ...form, faq: JSON.stringify(next.filter((f) => f.question || f.answer)) });
            return (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide" style={{ color: "hsl(var(--m-text-secondary))" }}>
                  <HelpCircle className="w-4 h-4" /> Sıkça Sorulan Sorular
                </div>
                {faqs.length === 0 && (
                  <p className="text-[13px]" style={{ color: "hsl(var(--m-text-secondary))" }}>
                    Henüz soru eklenmedi. Aşağıdan ekleyebilirsiniz.
                  </p>
                )}
                {faqs.map((item, idx) => (
                  <div key={idx} className="p-3 rounded-2xl space-y-2" style={{ background: "hsl(var(--m-bg))" }}>
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] font-semibold" style={{ color: "hsl(var(--m-text-secondary))" }}>
                        Soru {idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateFaqs(faqs.filter((_, i) => i !== idx))}
                        className="p-1.5 rounded-lg m-pressable"
                        style={{ background: "hsl(var(--m-danger-soft))", color: "hsl(var(--m-danger))" }}
                        aria-label="Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <input
                      value={item.question}
                      onChange={(e) => {
                        const next = [...faqs];
                        next[idx] = { ...next[idx], question: e.target.value };
                        updateFaqs(next);
                      }}
                      placeholder="Soru"
                      className="w-full h-11 px-3 rounded-xl text-[14px] outline-none"
                      style={{ background: "hsl(var(--m-surface))", color: "hsl(var(--m-text-primary))" }}
                    />
                    <textarea
                      value={item.answer}
                      onChange={(e) => {
                        const next = [...faqs];
                        next[idx] = { ...next[idx], answer: e.target.value };
                        updateFaqs(next);
                      }}
                      placeholder="Cevap"
                      rows={3}
                      className="w-full px-3 py-2 rounded-xl text-[14px] outline-none resize-none"
                      style={{ background: "hsl(var(--m-surface))", color: "hsl(var(--m-text-primary))" }}
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => updateFaqs([...faqs, { question: "", answer: "" }])}
                  className="w-full h-11 rounded-2xl flex items-center justify-center gap-2 text-[14px] font-semibold m-pressable"
                  style={{ background: "hsl(var(--m-surface-muted))", color: "hsl(var(--m-text-primary))" }}
                >
                  <Plus className="w-4 h-4" /> Soru Ekle
                </button>
              </div>
            );
          })()}

          {section === "seo" && (
            <>
              <Field icon={Search} label="SEO Başlığı" value={form.seo_title} onChange={(v: string) => setForm({ ...form, seo_title: v })} />
              <Field label="SEO Açıklaması" value={form.seo_description} onChange={(v: string) => setForm({ ...form, seo_description: v })} multiline rows={3} />
              <Field label="Anahtar Kelimeler" value={form.seo_keywords} onChange={(v: string) => setForm({ ...form, seo_keywords: v })} />
            </>
          )}
        </div>
      </div>

      <div className="px-5 mb-4">
        <button
          onClick={save}
          disabled={saving}
          className="w-full h-12 rounded-2xl font-semibold flex items-center justify-center gap-2 m-pressable disabled:opacity-60"
          style={{ background: "hsl(var(--m-accent))", color: "white" }}
        >
          <Save className="w-5 h-5" /> {saving ? "Kaydediliyor…" : "Tüm Değişiklikleri Kaydet"}
        </button>
      </div>

      <div className="px-5">
        <button
          onClick={logout}
          className="w-full h-12 rounded-2xl font-semibold flex items-center justify-center gap-2 m-pressable"
          style={{ background: "hsl(var(--m-danger-soft))", color: "hsl(var(--m-danger))" }}
        >
          <LogOut className="w-5 h-5" /> Çıkış Yap
        </button>
      </div>
    </div>
  );
}
