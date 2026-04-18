import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { MobileSection } from "@/components/mobile/MobileSection";
import { MobileListRow } from "@/components/mobile/MobileListRow";
import { LogOut, Save, User, Phone, Mail, MapPin, Briefcase, FileText, Bell } from "lucide-react";

export default function MobileSpecialistProfile() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [spec, setSpec] = useState<any>(null);
  const [form, setForm] = useState({
    name: "", phone: "", city: "", bio: "",
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
      });
      setLoading(false);
    })();
  }, [navigate]);

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
      })
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
    toast({ title: "Çıkış yapıldı" });
    navigate("/mobile/login");
  };

  if (loading) {
    return (
      <div style={{ background: "hsl(var(--m-bg))", minHeight: "100vh" }}>
        <MobileHeader largeTitle="Profil" />
        <div className="px-5"><div className="m-card p-4 text-[14px]" style={{ color: "hsl(var(--m-text-secondary))" }}>Yükleniyor…</div></div>
      </div>
    );
  }

  const initial = (form.name || spec?.email || "?").charAt(0).toUpperCase();

  const Field = ({ icon: Icon, label, value, onChange, type = "text", multiline = false }: any) => (
    <div>
      <label className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: "hsl(var(--m-text-secondary))" }}>{label}</label>
      <div className="mt-2 relative">
        <Icon className="w-5 h-5 absolute left-3 top-3.5" style={{ color: "hsl(var(--m-text-secondary))" }} />
        {multiline ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={4}
            className="w-full pl-11 pr-3 py-3 rounded-xl text-[15px] outline-none resize-none"
            style={{ background: "hsl(var(--m-bg))", color: "hsl(var(--m-text-primary))" }}
          />
        ) : (
          <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full h-12 pl-11 pr-3 rounded-xl text-[15px] outline-none"
            style={{ background: "hsl(var(--m-bg))", color: "hsl(var(--m-text-primary))" }}
          />
        )}
      </div>
    </div>
  );

  return (
    <div style={{ background: "hsl(var(--m-bg))", minHeight: "100vh", paddingBottom: 120 }}>
      <MobileHeader largeTitle="Profil" subtitle={spec?.specialty} />

      {/* Avatar */}
      <div className="px-5 mb-6">
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
            <h2 className="font-semibold text-[17px] truncate" style={{ color: "hsl(var(--m-text-primary))" }}>{form.name}</h2>
            <p className="text-[13px] truncate" style={{ color: "hsl(var(--m-text-secondary))" }}>{spec?.email}</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="px-5 space-y-4 mb-6">
        <div className="m-card p-5 space-y-4">
          <Field icon={User} label="Ad Soyad" value={form.name} onChange={(v: string) => setForm({ ...form, name: v })} />
          <Field icon={Phone} label="Telefon" value={form.phone} onChange={(v: string) => setForm({ ...form, phone: v })} type="tel" />
          <Field icon={MapPin} label="Şehir" value={form.city} onChange={(v: string) => setForm({ ...form, city: v })} />
          <Field icon={FileText} label="Hakkımda" value={form.bio} onChange={(v: string) => setForm({ ...form, bio: v })} multiline />
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="w-full h-12 rounded-2xl font-semibold flex items-center justify-center gap-2 m-pressable disabled:opacity-60"
          style={{ background: "hsl(var(--m-accent))", color: "white" }}
        >
          <Save className="w-5 h-5" /> {saving ? "Kaydediliyor…" : "Kaydet"}
        </button>
      </div>

      <MobileSection label="Diğer" className="mb-6">
        <div className="m-card overflow-hidden">
          <MobileListRow icon={Bell} title="Bildirimler" onClick={() => toast({ title: "Yakında" })} />
          <MobileListRow icon={Mail} title="E-posta tercihleri" onClick={() => toast({ title: "Yakında" })} />
        </div>
      </MobileSection>

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
