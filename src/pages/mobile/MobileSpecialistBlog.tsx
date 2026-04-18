import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { MobileEmptyState } from "@/components/mobile/MobileEmptyState";
import { FileText, Plus, X, Save, Sparkles } from "lucide-react";

export default function MobileSpecialistBlog() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [spec, setSpec] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", excerpt: "" });

  const load = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { navigate("/mobile/login"); return; }
    const { data: s } = await supabase
      .from("specialists")
      .select("id, name, specialty")
      .or(`user_id.eq.${session.user.id},email.eq.${session.user.email}`)
      .maybeSingle();
    if (!s) { navigate("/mobile/login"); return; }
    setSpec(s);
    const { data } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("specialist_id", s.id)
      .order("created_at", { ascending: false });
    setPosts(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const generateAI = async () => {
    if (!form.title.trim() || !spec) {
      toast({ title: "Başlık girin", variant: "destructive" });
      return;
    }
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-blog-content", {
        body: { topic: form.title, specialty: spec.specialty, specialistName: spec.name },
      });
      if (error) throw error;
      if (data?.content) {
        setForm((f) => ({
          ...f,
          content: data.content,
          excerpt: data.excerpt || f.excerpt,
        }));
        toast({ title: "İçerik oluşturuldu" });
      }
    } catch (e: any) {
      toast({ title: "AI hatası", description: e.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const save = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast({ title: "Başlık ve içerik gerekli", variant: "destructive" });
      return;
    }
    setSaving(true);
    const slug = form.title.toLowerCase()
      .replace(/[ğĞ]/g, "g").replace(/[üÜ]/g, "u").replace(/[şŞ]/g, "s")
      .replace(/[ıİ]/g, "i").replace(/[öÖ]/g, "o").replace(/[çÇ]/g, "c")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    const { error } = await supabase.from("blog_posts").insert([{
      title: form.title,
      content: form.content,
      excerpt: form.excerpt || form.content.slice(0, 160),
      slug: `${slug}-${Date.now()}`,
      specialist_id: spec.id,
      author_id: spec.id,
      author_name: spec.name,
      author_type: "specialist",
      status: "pending",
    }]);
    setSaving(false);
    if (error) {
      toast({ title: "Hata", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Yazı gönderildi", description: "Onay bekliyor" });
    setEditing(false);
    setForm({ title: "", content: "", excerpt: "" });
    load();
  };

  if (editing) {
    return (
      <div style={{ background: "hsl(var(--m-bg))", minHeight: "100vh", paddingBottom: 120 }}>
        <MobileHeader
          largeTitle="Yeni Yazı"
          trailing={
            <button onClick={() => setEditing(false)} className="m-pressable p-2">
              <X className="w-5 h-5" style={{ color: "hsl(var(--m-text-secondary))" }} />
            </button>
          }
        />

        <div className="px-5 space-y-4">
          <div className="m-card p-5 space-y-4">
            <div>
              <label className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: "hsl(var(--m-text-secondary))" }}>Başlık</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Yazı başlığı"
                className="mt-2 w-full h-12 px-3 rounded-xl text-[15px] outline-none"
                style={{ background: "hsl(var(--m-bg))", color: "hsl(var(--m-text-primary))" }}
              />
            </div>

            <button
              onClick={generateAI}
              disabled={generating}
              className="w-full h-11 rounded-xl font-semibold text-[14px] flex items-center justify-center gap-2 m-pressable disabled:opacity-60"
              style={{ background: "hsl(var(--m-accent-soft))", color: "hsl(var(--m-accent))" }}
            >
              <Sparkles className="w-4 h-4" /> {generating ? "Oluşturuluyor…" : "AI ile içerik oluştur"}
            </button>

            <div>
              <label className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: "hsl(var(--m-text-secondary))" }}>Özet</label>
              <textarea
                value={form.excerpt}
                onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                rows={2}
                placeholder="Kısa özet"
                className="mt-2 w-full px-3 py-3 rounded-xl text-[14px] outline-none resize-none"
                style={{ background: "hsl(var(--m-bg))", color: "hsl(var(--m-text-primary))" }}
              />
            </div>

            <div>
              <label className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: "hsl(var(--m-text-secondary))" }}>İçerik</label>
              <textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                rows={12}
                placeholder="Yazınızı buraya girin…"
                className="mt-2 w-full px-3 py-3 rounded-xl text-[14px] outline-none resize-none"
                style={{ background: "hsl(var(--m-bg))", color: "hsl(var(--m-text-primary))" }}
              />
            </div>
          </div>

          <button
            onClick={save}
            disabled={saving}
            className="w-full h-12 rounded-2xl font-semibold flex items-center justify-center gap-2 m-pressable disabled:opacity-60"
            style={{ background: "hsl(var(--m-accent))", color: "white" }}
          >
            <Save className="w-5 h-5" /> {saving ? "Kaydediliyor…" : "Onaya Gönder"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "hsl(var(--m-bg))", minHeight: "100vh", paddingBottom: 100 }}>
      <MobileHeader
        showBack
        largeTitle="Blog"
        subtitle={`${posts.length} yazı`}
        trailing={
          <button onClick={() => setEditing(true)} className="m-pressable p-2 rounded-full"
            style={{ background: "hsl(var(--m-accent))", color: "white" }}
          >
            <Plus className="w-5 h-5" />
          </button>
        }
      />

      <div className="px-5 space-y-3">
        {loading ? (
          <div className="m-card p-4 text-[14px]" style={{ color: "hsl(var(--m-text-secondary))" }}>Yükleniyor…</div>
        ) : posts.length === 0 ? (
          <MobileEmptyState
            icon={FileText}
            title="Henüz yazı yok"
            description="Yeni bir yazı oluşturmak için + butonuna basın"
          />
        ) : (
          posts.map((p) => (
            <div key={p.id} className="m-card p-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-semibold text-[15px] flex-1" style={{ color: "hsl(var(--m-text-primary))" }}>{p.title}</h3>
                <span className="text-[10px] font-bold px-2 py-1 rounded-full uppercase"
                  style={{
                    background: p.status === "published" ? "hsl(var(--m-success) / 0.15)" : "hsl(var(--m-accent-soft))",
                    color: p.status === "published" ? "hsl(var(--m-success))" : "hsl(var(--m-accent))",
                  }}
                >
                  {p.status === "published" ? "Yayında" : p.status === "pending" ? "Onayda" : p.status}
                </span>
              </div>
              {p.excerpt && (
                <p className="text-[13px] mt-2 line-clamp-2" style={{ color: "hsl(var(--m-text-secondary))" }}>{p.excerpt}</p>
              )}
              <div className="text-[11px] mt-2" style={{ color: "hsl(var(--m-text-secondary))" }}>
                {new Date(p.created_at).toLocaleDateString("tr-TR")}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
