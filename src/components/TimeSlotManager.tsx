import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Clock, Save } from "lucide-react";

interface TimeSlotManagerProps {
  doctorId: string;
  onUpdate?: () => void;
}

const DEFAULT_TIME_SLOTS = [
  "09:30", "10:00", "10:30", "11:00", "11:30", "12:00",
  "12:30", "13:00", "13:30", "14:00", "14:30", "15:00",
  "15:30", "16:00", "16:30", "17:00", "17:30", "18:00",
  "18:30", "19:00", "19:30", "20:00", "20:30", "21:00"
];

export const TimeSlotManager = ({ doctorId, onUpdate }: TimeSlotManagerProps) => {
  const { toast } = useToast();
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTimeSlots();
  }, [doctorId]);

  const fetchTimeSlots = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('specialists')
        .select('available_time_slots')
        .eq('id', doctorId)
        .single();

      if (error) throw error;

      if (data?.available_time_slots) {
        setSelectedSlots(data.available_time_slots as string[]);
      } else {
        // Varsayılan olarak tüm saatleri seçili yap
        setSelectedSlots(DEFAULT_TIME_SLOTS);
      }
    } catch (error) {
      console.error('Saat dilimleri yüklenirken hata:', error);
      toast({
        title: "Hata",
        description: "Saat dilimleri yüklenemedi.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleTimeSlot = (slot: string) => {
    setSelectedSlots(prev => {
      if (prev.includes(slot)) {
        return prev.filter(s => s !== slot);
      } else {
        return [...prev, slot].sort();
      }
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('specialists')
        .update({ 
          available_time_slots: selectedSlots,
          updated_at: new Date().toISOString()
        })
        .eq('id', doctorId);

      if (error) throw error;

      toast({
        title: "Başarılı",
        description: "Müsait saat dilimleri güncellendi.",
      });

      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Saat dilimleri güncellenirken hata:', error);
      toast({
        title: "Hata",
        description: "Saat dilimleri güncellenemedi.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const selectAll = () => {
    setSelectedSlots(DEFAULT_TIME_SLOTS);
  };

  const clearAll = () => {
    setSelectedSlots([]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 mb-4">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={selectAll}
        >
          Tümünü Seç
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={clearAll}
        >
          Tümünü Kaldır
        </Button>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
        {DEFAULT_TIME_SLOTS.map((slot) => {
          const isSelected = selectedSlots.includes(slot);
          return (
            <button
              key={slot}
              type="button"
              onClick={() => toggleTimeSlot(slot)}
              className={`
                px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all duration-200
                ${isSelected 
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm hover:bg-primary/90' 
                  : 'bg-muted text-muted-foreground border-border hover:border-primary/50'
                }
              `}
            >
              <Clock className="w-3 h-3 inline mr-1" />
              {slot}
            </button>
          );
        })}
      </div>

      <div className="flex justify-between items-center pt-4 border-t">
        <p className="text-sm text-muted-foreground">
          {selectedSlots.length} saat dilimi seçildi
        </p>
        <Button
          onClick={handleSave}
          disabled={saving}
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Kaydediliyor..." : "Kaydet"}
        </Button>
      </div>
    </div>
  );
};
