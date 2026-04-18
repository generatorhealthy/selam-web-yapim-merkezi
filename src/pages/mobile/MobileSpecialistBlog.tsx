import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { MobileEmptyState } from "@/components/mobile/MobileEmptyState";
import FileUpload from "@/components/FileUpload";
import { FileText, Plus, X, Save, Sparkles, Image as ImageIcon, Edit3, Trash2, Eye } from "lucide-react";

const generateSlug = (title: string) =>
  title
    .toLowerCase()
    .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
    .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const STATUS_META: Record<string, { label: string; bg: string; color: string }> = {
  published: { label: "Yayında", bg: "hsl(var(--m-success) / 0.15)", color: "hsl(var(--m-success))" },
  pending: { label: "Onayda", bg: "hsl(var(--m-accent-soft))", color: "hsl(var(--m-accent))" },
  revision_needed: { label: "Düzeltme", bg: "hsl(var(--m-warning) / 0.18)", color: "hsl(var(--m-warning))" },
  draft: { label: "Taslak", bg: "hsl(var(--m-surface-muted))", color: "hsl(var(--m-text-secondary))" },
};

export default function MobileSpecialistBlog() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [spec, setSpec] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [form, setForm] = useState({
    title: "",
    content: "",
    excerpt: "",
    featured_image: "",
    seo_title: "",
    seo_description: "",
    keywords: "",
  });

  const resetForm = () =>
    setForm({ title: "", content: "", excerpt: "", featured_image: "", seo_title: "", seo_description: "", keywords: "" });

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
      .or(`author_id.eq.${session.user.id},specialist_id.eq.${s.id}`)
      .order("created_at", { ascending: false });
    setPosts(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const generateAI = async () => {
    if (!form.title.trim() || !spec) {
      toast({ title: "Önce bir konu/başlık girin", variant: "destructive" });
      return;
    }
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-blog-content", {
        body: { topic: form.title, specialty: spec.specialty, doctorName: spec.name, specialistName: spec.name },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setForm((f) => ({
        ...f,
        title: data.title || f.title,
        content: data.content || f.content,
        excerpt: data.excerpt || f.excerpt,
        seo_title: data.seo_title || f.seo_title,
        seo_description: data.seo_description || f.seo_description,
        keywords: data.keywords || f.keywords,
      }));
      toast({ title: "İçerik oluşturuldu", description: "İncelleyip onaya gönderebilirsiniz." });
    } catch (e: any) {
      toast({ title: "AI hatası", description: e.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const startEdit = (post: any) => {
    setEditingId(post.id);
    setForm({
      title: post.title || "",
      content: post.content || "",
      excerpt: post.excerpt || "",
      featured_image: post.featured_image || "",
      seo_title: post.seo_title || "",
      seo_description: post.seo_description || "",
      keywords: post.keywords || "",
    });
    setEditing(true);
  };

  const startCreate = () => {
    setEditingId(null);
    resetForm();
    setEditing(true);
  };

  const save = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast({ title: "Başlık ve içerik gerekli", variant: "destructive" });
      return;
    }
    if (!spec) return;
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    const slug = generateSlug(form.title);
    const wordCount = form.content.replace(/<[^>]*>/g, " ").split(/\s+/).filter(Boolean).length;
    const keywordsArray = form.keywords
      ? form.keywords.split(",").map((k) => k.trim()).filter(Boolean).slice(0, 3).join(", ")
      : null;

    const payload: any = {
      title: form.title,
      content: form.content,
      excerpt: form.excerpt || form.content.replace(/<[^>]*>/g, " ").slice(0, 160),
      slug,
      author_id: session?.user?.id || spec.id,
      author_name: spec.name,
      author_type: "specialist",
      specialist_id: spec.id,
      status: "pending",
      word_count: wordCount,
      seo_title: form.seo_title || null,
      seo_description: form.seo_description || null,
      keywords: keywordsArray,
      featured_image: form.featured_image || null,
    };

    let error: any = null;
    if (editingId) {
      const { error: e } = await supabase
        .from("blog_posts")
        .update({ ...payload, admin_message: null })
        .eq("id", editingId);
      error = e;
    } else {
      const { error: e } = await supabase.from("blog_posts").insert([payload]);
      error = e;
    }

    setSaving(false);
    if (error) {
      toast({ title: "Hata", description: error.message, variant: "destructive" });
      return;
    }
    toast({
      title: editingId ? "Yazı güncellendi" : "Yazı gönderildi",
      description: "Onay bekliyor.",
    });
    setEditing(false);
    setEditingId(null);
    resetForm();
    load();
  };

  const deletePost = async (id: string) => {
    if (!confirm("Bu yazıyı silmek istediğinize emin misiniz?")) return;
    const { error } = await supabase.from("blog_posts").delete().eq("id", id);
    if (error) {
      toast({ title: "Hata", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Yazı silindi" });
    load();
  };

  if (editing) {
    return (
      <div style={{ background: "hsl(var(--m-bg))", minHeight: "100vh", paddingBottom: 140 }}>
        <MobileHeader
          largeTitle={editingId ? "Yazıyı Düzenle" : "Yeni Yazı"}
          subtitle={spec?.specialty}
          trailing={
            <button onClick={() => { setEditing(false); setEditingId(null); }} className="m-pressable p-2">
              <X className="w-5 h-5" style={{ color: "hsl(var(--m-text-secondary))" }} />
            </button>
          }
        />

        <div className="px-5 space-y-4">
          {/* Görsel */}
          <div className="m-card p-4">
            <label className="text-[12px] font-semibold uppercase tracking-wider flex items-center gap-1.5"
              style={{ color: "hsl(var(--m-text-secondary))" }}
            >
              <ImageIcon className="w-3.5 h-3.5" /> Kapak Görseli
            </label>
            <div className="mt-3">
              <FileUpload
                onUpload={(url) => setForm((f) => ({ ...f, featured_image: url }))}
                currentImage={form.featured_image}
                accept="image/jpeg,image/jpg,image/png,image/webp"
                maxSize={5 * 1024 * 1024}
              />
            </div>
          </div>

          <div className="m-card p-5 space-y-4">
            <div>
              <label className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: "hsl(var(--m-text-secondary))" }}>Başlık *</label>
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
              <label className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: "hsl(var(--m-text-secondary))" }}>İçerik *</label>
              <textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                rows={14}
                placeholder="Yazınızı buraya girin… (HTML kullanabilirsiniz)"
                className="mt-2 w-full px-3 py-3 rounded-xl text-[14px] outline-none resize-none"
                style={{ background: "hsl(var(--m-bg))", color: "hsl(var(--m-text-primary))" }}
              />
              <div className="mt-1 text-[11px]" style={{ color: "hsl(var(--m-text-tertiary))" }}>
                {form.content.replace(/<[^>]*>/g, " ").split(/\s+/).filter(Boolean).length} kelime
              </div>
            </div>
          </div>

          {/* SEO */}
          <div className="m-card p-5 space-y-4">
            <div className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: "hsl(var(--m-text-secondary))" }}>
              SEO ve Google Ayarları
            </div>

            <div>
              <label className="text-[11px]" style={{ color: "hsl(var(--m-text-secondary))" }}>Google Başlık (Maks 65)</label>
              <input
                value={form.seo_title}
                maxLength={65}
                onChange={(e) => setForm({ ...form, seo_title: e.target.value })}
                placeholder="Google'da görünecek başlık"
                className="mt-1.5 w-full h-11 px-3 rounded-xl text-[14px] outline-none"
                style={{ background: "hsl(var(--m-bg))", color: "hsl(var(--m-text-primary))" }}
              />
              <div className="mt-1 text-[11px]" style={{ color: "hsl(var(--m-text-tertiary))" }}>{form.seo_title.length}/65</div>
            </div>

            <div>
              <label className="text-[11px]" style={{ color: "hsl(var(--m-text-secondary))" }}>Google Açıklama (Maks 140)</label>
              <textarea
                value={form.seo_description}
                maxLength={140}
                rows={2}
                onChange={(e) => setForm({ ...form, seo_description: e.target.value })}
                placeholder="Google'da görünecek açıklama"
                className="mt-1.5 w-full px-3 py-3 rounded-xl text-[14px] outline-none resize-none"
                style={{ background: "hsl(var(--m-bg))", color: "hsl(var(--m-text-primary))" }}
              />
              <div className="mt-1 text-[11px]" style={{ color: "hsl(var(--m-text-tertiary))" }}>{form.seo_description.length}/140</div>
            </div>

            <div>
              <label className="text-[11px]" style={{ color: "hsl(var(--m-text-secondary))" }}>Anahtar Kelimeler (3 adet, virgülle)</label>
              <input
                value={form.keywords}
                onChange={(e) => setForm({ ...form, keywords: e.target.value })}
                placeholder="kelime1, kelime2, kelime3"
                className="mt-1.5 w-full h-11 px-3 rounded-xl text-[14px] outline-none"
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
            <Save className="w-5 h-5" /> {saving ? "Kaydediliyor…" : editingId ? "Güncelle ve Onaya Gönder" : "Onaya Gönder"}
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
          <button onClick={startCreate} className="m-pressable p-2 rounded-full"
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
          posts.map((p) => {
            const meta = STATUS_META[p.status] || STATUS_META.draft;
            const canView = p.status === "published" && p.slug;
            return (
              <div key={p.id} className="m-card overflow-hidden">
                {p.featured_image && (
                  <div
                    className="w-full h-36 overflow-hidden cursor-pointer"
                    onClick={() => canView && navigate(`/mobile/blog/${p.slug}`)}
                  >
                    <img
                      src={p.featured_image}
                      alt={p.title}
                      loading="lazy"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget.parentElement as HTMLElement).style.display = "none";
                      }}
                    />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h3
                      className="font-semibold text-[15px] flex-1 cursor-pointer"
                      style={{ color: "hsl(var(--m-text-primary))" }}
                      onClick={() => canView && navigate(`/mobile/blog/${p.slug}`)}
                    >
                      {p.title}
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-1 rounded-full uppercase shrink-0"
                      style={{ background: meta.bg, color: meta.color }}
                    >
                      {meta.label}
                    </span>
                  </div>

                  {p.excerpt && (
                    <p className="text-[13px] mt-2 line-clamp-2" style={{ color: "hsl(var(--m-text-secondary))" }}>
                      {p.excerpt}
                    </p>
                  )}

                  {p.admin_message && p.status === "revision_needed" && (
                    <div
                      className="mt-3 p-3 rounded-xl text-[12px]"
                      style={{ background: "hsl(var(--m-warning) / 0.12)", color: "hsl(var(--m-warning))" }}
                    >
                      <strong>Yönetici notu:</strong> {p.admin_message}
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-3">
                    <div className="text-[11px]" style={{ color: "hsl(var(--m-text-tertiary))" }}>
                      {new Date(p.created_at).toLocaleDateString("tr-TR")}
                      {p.word_count ? ` · ${p.word_count} kelime` : ""}
                    </div>
                    <div className="flex items-center gap-1">
                      {canView && (
                        <button
                          onClick={() => navigate(`/mobile/blog/${p.slug}`)}
                          className="p-2 rounded-lg m-pressable"
                          style={{ color: "hsl(var(--m-text-secondary))" }}
                          aria-label="Görüntüle"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => startEdit(p)}
                        className="p-2 rounded-lg m-pressable"
                        style={{ color: "hsl(var(--m-accent))" }}
                        aria-label="Düzenle"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deletePost(p.id)}
                        className="p-2 rounded-lg m-pressable"
                        style={{ color: "hsl(var(--m-danger, 0 84% 60%))" }}
                        aria-label="Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
