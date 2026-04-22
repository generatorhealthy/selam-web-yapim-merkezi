import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { MobileEmptyState } from "@/components/mobile/MobileEmptyState";
import { Brain, ChevronRight, Plus, Pencil, Trash2 } from "lucide-react";
import TestCreator from "@/components/TestCreator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface Test {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  image_url: string | null;
  specialty_area: string | null;
  status?: string | null;
  is_active?: boolean | null;
}

export default function MobileTests() {
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSpecialist, setIsSpecialist] = useState(false);
  const [specialistId, setSpecialistId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const loadAll = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    let specId: string | null = null;
    let isSpec = false;

    if (session?.user) {
      const { data: byUserId } = await supabase
        .from("specialists")
        .select("id")
        .eq("user_id", session.user.id)
        .limit(1)
        .maybeSingle();

      if (byUserId?.id) {
        specId = byUserId.id;
        isSpec = true;
      } else if (session.user.email) {
        const { data: byEmail } = await supabase
          .from("specialists")
          .select("id")
          .ilike("email", session.user.email)
          .limit(1)
          .maybeSingle();
        if (byEmail?.id) {
          specId = byEmail.id;
          isSpec = true;
        }
      }
    }

    setIsSpecialist(isSpec);
    setSpecialistId(specId);

    let query = supabase
      .from("tests")
      .select("id, title, description, category, image_url, specialty_area, status, is_active")
      .order("created_at", { ascending: false });

    if (isSpec && specId) {
      // Uzman: kendi tüm testleri (aktif/pasif/onay bekleyen)
      query = query.eq("specialist_id", specId);
    } else {
      // Danışan/ziyaretçi: sadece yayında olanlar
      query = query.eq("is_active", true);
    }

    const { data } = await query;
    setTests((data as Test[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleEdit = async (test: Test) => {
    // Soruları da getir
    const { data: questions } = await supabase
      .from("test_questions")
      .select("*")
      .eq("test_id", test.id)
      .order("step_number", { ascending: true });

    setEditingTest({ ...test, questions: questions || [] });
    setEditorOpen(true);
  };

  const handleNew = () => {
    setEditingTest(null);
    setEditorOpen(true);
  };

  const handleDelete = async (test: Test) => {
    if (!confirm(`"${test.title}" testini silmek istediğinize emin misiniz?`)) return;
    const { error } = await supabase.from("tests").delete().eq("id", test.id);
    if (error) {
      toast({ title: "Silinemedi", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Test silindi" });
    loadAll();
  };

  const handleTestSaved = () => {
    setEditorOpen(false);
    setEditingTest(null);
    loadAll();
    toast({ title: "Test kaydedildi" });
  };

  const statusBadge = (t: Test) => {
    if (t.is_active) return { label: "Yayında", bg: "hsl(145 65% 92%)", fg: "hsl(145 65% 30%)" };
    if (t.status === "pending") return { label: "Onay Bekliyor", bg: "hsl(35 95% 92%)", fg: "hsl(35 95% 35%)" };
    if (t.status === "rejected") return { label: "Reddedildi", bg: "hsl(0 75% 95%)", fg: "hsl(0 75% 40%)" };
    return { label: "Taslak", bg: "hsl(220 15% 92%)", fg: "hsl(220 15% 35%)" };
  };

  return (
    <div style={{ background: "hsl(var(--m-bg))", minHeight: "100vh", paddingBottom: 100 }}>
      <MobileHeader
        largeTitle={isSpecialist ? "Testlerim" : "Testler"}
        subtitle={isSpecialist ? "Oluşturduğunuz testler" : "Kendinizi tanıyın"}
        rightAction={
          isSpecialist ? (
            <button
              onClick={handleNew}
              aria-label="Yeni test"
              className="w-10 h-10 rounded-full flex items-center justify-center m-pressable"
              style={{ background: "hsl(var(--m-accent))", color: "white" }}
            >
              <Plus className="w-5 h-5" />
            </button>
          ) : undefined
        }
      />

      <div className="px-5 pb-8 space-y-2">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ background: "hsl(var(--m-surface-muted))" }} />
          ))
        ) : tests.length === 0 ? (
          <MobileEmptyState
            icon={Brain}
            title={isSpecialist ? "Henüz test yok" : "Test yok"}
            description={isSpecialist ? "Sağ üstteki + ile yeni test oluşturun" : "Yakında eklenecek"}
          />
        ) : (
          tests.map((t) => {
            const badge = statusBadge(t);
            return (
              <div key={t.id} className="m-card p-4">
                <button
                  onClick={() => (isSpecialist ? handleEdit(t) : navigate(`/mobile/tests/${t.id}`))}
                  className="w-full flex items-center gap-3 text-left m-pressable"
                >
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden"
                    style={{ background: "hsl(var(--m-purple-soft))" }}
                  >
                    {t.image_url ? (
                      <img src={t.image_url} alt={t.title} className="w-full h-full object-cover" />
                    ) : (
                      <Brain className="w-6 h-6" style={{ color: "hsl(var(--m-purple))" }} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[15px] truncate" style={{ color: "hsl(var(--m-text-primary))" }}>
                      {t.title}
                    </h3>
                    {t.description && (
                      <p className="text-[13px] line-clamp-2" style={{ color: "hsl(var(--m-text-secondary))" }}>
                        {t.description}
                      </p>
                    )}
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      {t.category && (
                        <span
                          className="inline-block px-2 py-0.5 rounded-md text-[11px] font-medium"
                          style={{ background: "hsl(var(--m-purple-soft))", color: "hsl(var(--m-purple))" }}
                        >
                          {t.category}
                        </span>
                      )}
                      {isSpecialist && (
                        <span
                          className="inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold"
                          style={{ background: badge.bg, color: badge.fg }}
                        >
                          {badge.label}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 flex-shrink-0" style={{ color: "hsl(var(--m-text-tertiary))" }} />
                </button>

                {isSpecialist && (
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t" style={{ borderColor: "hsl(var(--m-divider))" }}>
                    <button
                      onClick={() => handleEdit(t)}
                      className="flex-1 h-9 rounded-xl flex items-center justify-center gap-1.5 text-[13px] font-semibold m-pressable"
                      style={{ background: "hsl(var(--m-accent-soft))", color: "hsl(var(--m-accent))" }}
                    >
                      <Pencil className="w-3.5 h-3.5" /> Düzenle
                    </button>
                    <button
                      onClick={() => handleDelete(t)}
                      className="h-9 px-3 rounded-xl flex items-center justify-center gap-1.5 text-[13px] font-semibold m-pressable"
                      style={{ background: "hsl(0 75% 95%)", color: "hsl(0 75% 40%)" }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTest ? "Testi Düzenle" : "Yeni Test Oluştur"}</DialogTitle>
          </DialogHeader>
          {specialistId && (
            <TestCreator
              specialistId={specialistId}
              editingTest={editingTest}
              onTestCreated={handleTestSaved}
              onCancel={() => {
                setEditorOpen(false);
                setEditingTest(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
