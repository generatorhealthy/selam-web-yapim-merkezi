import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { MobileEmptyState } from "@/components/mobile/MobileEmptyState";
import { MessageSquare, Plus, X, Send } from "lucide-react";

const STATUS_LABEL: Record<string, { tr: string; bg: string; fg: string }> = {
  open: { tr: "Açık", bg: "var(--m-tint-sky)", fg: "var(--m-ink)" },
  in_progress: { tr: "İşlemde", bg: "var(--m-tint-lilac)", fg: "var(--m-ink)" },
  resolved: { tr: "Çözüldü", bg: "var(--m-tint-mint)", fg: "var(--m-ink)" },
  closed: { tr: "Kapalı", bg: "var(--m-divider)", fg: "var(--m-text-secondary)" },
};

export default function MobileSpecialistSupport() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<any[]>([]);
  const [doctor, setDoctor] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", category: "general", priority: "medium" });
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { navigate("/mobile/login"); return; }

    const { data: spec } = await supabase
      .from("specialists")
      .select("id, name, email, user_id")
      .or(`user_id.eq.${session.user.id},email.eq.${session.user.email}`)
      .maybeSingle();
    if (!spec) { navigate("/mobile/login"); return; }
    setDoctor(spec);

    const { data } = await supabase
      .from("support_tickets" as any)
      .select("*")
      .eq("specialist_id", spec.id)
      .order("created_at", { ascending: false });
    setTickets((data as any[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const submit = async () => {
    if (!form.title.trim() || !form.description.trim()) {
      toast({ title: "Eksik bilgi", description: "Başlık ve açıklama gerekli.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("support_tickets" as any).insert({
      specialist_id: doctor.id,
      specialist_name: doctor.name,
      specialist_email: doctor.email || doctor.user_id,
      title: form.title,
      description: form.description,
      category: form.category,
      priority: form.priority,
      status: "open",
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Hata", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Talep oluşturuldu" });
    setForm({ title: "", description: "", category: "general", priority: "medium" });
    setShowForm(false);
    load();
  };

  return (
    <div style={{ background: "hsl(var(--m-bg))", minHeight: "100vh", paddingBottom: 100 }}>
      <MobileHeader showBack largeTitle="Destek" subtitle={`${tickets.length} talep`} />

      <div className="px-5 mb-4">
        <button
          onClick={() => setShowForm(true)}
          className="w-full h-12 rounded-2xl font-semibold flex items-center justify-center gap-2 m-pressable"
          style={{ background: "hsl(var(--m-ink))", color: "hsl(var(--m-bg))" }}
        >
          <Plus className="w-4 h-4" /> Yeni Destek Talebi
        </button>
      </div>

      <div className="px-5 space-y-3">
        {loading ? (
          <div className="m-card p-4 text-[14px]" style={{ color: "hsl(var(--m-text-secondary))" }}>Yükleniyor…</div>
        ) : tickets.length === 0 ? (
          <MobileEmptyState icon={MessageSquare} title="Henüz destek talebiniz yok" />
        ) : (
          tickets.map((t) => {
            const s = STATUS_LABEL[t.status] || STATUS_LABEL.open;
            return (
              <div key={t.id} className="m-card p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="font-bold text-[15px] flex-1" style={{ color: "hsl(var(--m-text-primary))" }}>{t.title}</div>
                  <span
                    className="text-[11px] font-semibold px-2 py-1 rounded-full"
                    style={{ background: `hsl(${s.bg})`, color: `hsl(${s.fg})` }}
                  >
                    {s.tr}
                  </span>
                </div>
                <div className="text-[13px] mb-2" style={{ color: "hsl(var(--m-text-secondary))" }}>{t.description}</div>
                <div className="text-[11px]" style={{ color: "hsl(var(--m-text-tertiary))" }}>
                  {new Date(t.created_at).toLocaleDateString("tr-TR")}
                </div>
                {t.admin_response && (
                  <div className="mt-3 p-3 rounded-xl text-[13px]" style={{ background: "hsl(var(--m-tint-mint))", color: "hsl(var(--m-ink))" }}>
                    <div className="font-semibold mb-1">Yanıt:</div>
                    {t.admin_response}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Sheet form */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-end"
          style={{ background: "rgba(0,0,0,0.4)" }}
          onClick={() => setShowForm(false)}
        >
          <div
            className="w-full bg-white rounded-t-[28px] p-5 max-h-[85vh] overflow-y-auto"
            style={{ background: "hsl(var(--m-surface))" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[20px] font-bold" style={{ color: "hsl(var(--m-text-primary))" }}>Yeni Talep</h3>
              <button onClick={() => setShowForm(false)} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "hsl(var(--m-bg))" }}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Başlık"
                className="w-full h-12 px-4 rounded-2xl outline-none text-[15px]"
                style={{ background: "hsl(var(--m-bg))", color: "hsl(var(--m-text-primary))" }}
              />
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full h-12 px-4 rounded-2xl outline-none text-[15px]"
                style={{ background: "hsl(var(--m-bg))", color: "hsl(var(--m-text-primary))" }}
              >
                <option value="general">Genel</option>
                <option value="technical">Teknik</option>
                <option value="payment">Ödeme</option>
                <option value="account">Hesap</option>
              </select>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full h-12 px-4 rounded-2xl outline-none text-[15px]"
                style={{ background: "hsl(var(--m-bg))", color: "hsl(var(--m-text-primary))" }}
              >
                <option value="low">Düşük</option>
                <option value="medium">Orta</option>
                <option value="high">Yüksek</option>
                <option value="urgent">Acil</option>
              </select>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Açıklama"
                rows={5}
                className="w-full p-4 rounded-2xl outline-none text-[15px] resize-none"
                style={{ background: "hsl(var(--m-bg))", color: "hsl(var(--m-text-primary))" }}
              />
              <button
                onClick={submit}
                disabled={submitting}
                className="w-full h-12 rounded-2xl font-semibold flex items-center justify-center gap-2 m-pressable disabled:opacity-60"
                style={{ background: "hsl(var(--m-accent))", color: "white" }}
              >
                <Send className="w-4 h-4" /> {submitting ? "Gönderiliyor…" : "Gönder"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
