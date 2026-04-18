import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Save } from "lucide-react";

export default function MobilePatientProfile() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [form, setForm] = useState({
    first_name: "", last_name: "", phone: "", city: "", birth_date: "", gender: "",
  });

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.auth.getSession();
      const user = s.session?.user;
      if (!user) { navigate("/mobile/login"); return; }
      setUserId(user.id);
      const { data } = await supabase.from("patient_profiles").select("*").eq("user_id", user.id).maybeSingle();
      if (data) {
        setForm({
          first_name: data.first_name ?? "",
          last_name: data.last_name ?? "",
          phone: data.phone ?? "",
          city: data.city ?? "",
          birth_date: data.birth_date ?? "",
          gender: data.gender ?? "",
        });
      }
      setLoading(false);
    })();
  }, [navigate]);

  const save = async () => {
    if (!userId) return;
    setSaving(true);
    const full_name = `${form.first_name} ${form.last_name}`.trim();
    const { error } = await supabase.from("patient_profiles").upsert({
      user_id: userId,
      ...form,
      full_name,
      birth_date: form.birth_date || null,
    }, { onConflict: "user_id" });
    setSaving(false);
    if (error) toast({ title: "Hata", description: error.message, variant: "destructive" });
    else toast({ title: "Kaydedildi" });
  };

  if (loading) return <div style={{ background: "hsl(var(--m-bg))", minHeight: "100vh" }} />;

  const setField = (k: keyof typeof form) => (e: any) => setForm((s) => ({ ...s, [k]: e.target.value }));
  const inputCls = "mt-2 w-full h-12 px-3 rounded-xl text-[15px] outline-none";
  const inputStyle = { background: "hsl(var(--m-bg))", color: "hsl(var(--m-text-primary))" };

  return (
    <div style={{ background: "hsl(var(--m-bg))", minHeight: "100vh", paddingBottom: 120 }}>
      <MobileHeader showBack largeTitle="Profil Bilgilerim" />
      <div className="px-5 mt-4 space-y-4">
        <div className="m-card p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: "hsl(var(--m-text-secondary))" }}>Ad</label>
              <input value={form.first_name} onChange={setField("first_name")} className={inputCls} style={inputStyle} />
            </div>
            <div>
              <label className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: "hsl(var(--m-text-secondary))" }}>Soyad</label>
              <input value={form.last_name} onChange={setField("last_name")} className={inputCls} style={inputStyle} />
            </div>
          </div>
          <div>
            <label className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: "hsl(var(--m-text-secondary))" }}>Telefon</label>
            <input type="tel" value={form.phone} onChange={setField("phone")} className={inputCls} style={inputStyle} />
          </div>
          <div>
            <label className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: "hsl(var(--m-text-secondary))" }}>Şehir</label>
            <input value={form.city} onChange={setField("city")} className={inputCls} style={inputStyle} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: "hsl(var(--m-text-secondary))" }}>Doğum Tarihi</label>
              <input type="date" value={form.birth_date} onChange={setField("birth_date")} className={inputCls} style={inputStyle} />
            </div>
            <div>
              <label className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: "hsl(var(--m-text-secondary))" }}>Cinsiyet</label>
              <select value={form.gender} onChange={setField("gender")} className={inputCls} style={inputStyle}>
                <option value="">Seçiniz</option>
                <option value="female">Kadın</option>
                <option value="male">Erkek</option>
                <option value="other">Diğer</option>
              </select>
            </div>
          </div>
          <button onClick={save} disabled={saving}
            className="w-full h-12 rounded-2xl font-semibold flex items-center justify-center gap-2 m-pressable disabled:opacity-60"
            style={{ background: "hsl(var(--m-accent))", color: "white" }}>
            <Save className="w-5 h-5" />
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </div>
      </div>
    </div>
  );
}
