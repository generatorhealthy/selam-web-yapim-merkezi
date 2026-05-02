import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { StickyNote, Trash2, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface SpecialistNotesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  specialistId: string;
  specialistName: string;
  onCountChange?: (count: number) => void;
}

interface NoteRow {
  id: string;
  note: string;
  created_at: string;
  created_by_name: string | null;
}

export const SpecialistNotesDialog = ({
  open,
  onOpenChange,
  specialistId,
  specialistName,
  onCountChange,
}: SpecialistNotesDialogProps) => {
  const { toast } = useToast();
  const [notes, setNotes] = useState<NoteRow[]>([]);
  const [newNote, setNewNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadNotes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("specialist_admin_notes")
      .select("id, note, created_at, created_by_name")
      .eq("specialist_id", specialistId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Notlar yüklenemedi:", error);
      toast({ title: "Hata", description: "Notlar yüklenemedi", variant: "destructive" });
    } else {
      setNotes(data || []);
      onCountChange?.((data || []).length);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (open) {
      void loadNotes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, specialistId]);

  const handleAdd = async () => {
    const trimmed = newNote.trim();
    if (!trimmed) return;
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    let createdByName: string | null = null;
    if (user) {
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("name, email")
        .eq("user_id", user.id)
        .maybeSingle();
      createdByName = profile?.name || profile?.email || user.email || null;
    }

    const { error } = await supabase.from("specialist_admin_notes").insert({
      specialist_id: specialistId,
      note: trimmed,
      created_by: user?.id ?? null,
      created_by_name: createdByName,
    });

    if (error) {
      console.error("Not eklenemedi:", error);
      toast({ title: "Hata", description: "Not eklenemedi", variant: "destructive" });
    } else {
      setNewNote("");
      toast({ title: "Not eklendi" });
      await loadNotes();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu notu silmek istediğinizden emin misiniz?")) return;
    const { error } = await supabase.from("specialist_admin_notes").delete().eq("id", id);
    if (error) {
      toast({ title: "Hata", description: "Not silinemedi", variant: "destructive" });
    } else {
      toast({ title: "Not silindi" });
      await loadNotes();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <StickyNote className="w-5 h-5 text-amber-500" />
            Notlar — {specialistName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <Textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Bu uzmanla ilgili bir not yazın..."
            rows={3}
          />
          <div className="flex justify-end">
            <Button onClick={handleAdd} disabled={saving || !newNote.trim()}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Not Ekle
            </Button>
          </div>
        </div>

        <div className="border-t pt-3 max-h-72 overflow-y-auto space-y-2">
          {loading ? (
            <div className="text-center py-6 text-gray-500 text-sm">Yükleniyor...</div>
          ) : notes.length === 0 ? (
            <div className="text-center py-6 text-gray-500 text-sm">Henüz not yok.</div>
          ) : (
            notes.map((n) => (
              <div key={n.id} className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <p className="whitespace-pre-wrap text-gray-800 flex-1">{n.note}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDelete(n.id)}
                    title="Sil"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <div className="mt-2 text-xs text-gray-500 flex justify-between">
                  <span>{n.created_by_name || "Bilinmeyen"}</span>
                  <span>
                    {format(new Date(n.created_at), "dd MMM yyyy HH:mm", { locale: tr })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Kapat</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
