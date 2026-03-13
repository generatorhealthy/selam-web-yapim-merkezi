import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Save, ChevronLeft, ChevronRight, CalendarDays, RotateCcw, X } from "lucide-react";
import { 
  parseAvailability, 
  AvailabilityData, 
  DEFAULT_TIME_SLOTS, 
  formatDateKey 
} from "@/utils/availabilityUtils";

interface TimeSlotManagerProps {
  doctorId: string;
  onUpdate?: () => void;
}

const WEEKDAY_NAMES = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const MONTH_NAMES = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
];

export const TimeSlotManager = ({ doctorId, onUpdate }: TimeSlotManagerProps) => {
  const { toast } = useToast();
  const [availability, setAvailability] = useState<AvailabilityData>({ default: DEFAULT_TIME_SLOTS, dates: {} });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    fetchAvailability();
  }, [doctorId]);

  const fetchAvailability = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('specialists')
        .select('available_time_slots')
        .eq('id', doctorId)
        .single();

      if (error) throw error;
      setAvailability(parseAvailability(data?.available_time_slots));
    } catch (error) {
      console.error('Müsaitlik verileri yüklenirken hata:', error);
      toast({ title: "Hata", description: "Müsaitlik verileri yüklenemedi.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const calendarDays = useMemo(() => {
    const { year, month } = currentMonth;
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Monday=0 adjustment (JS: Sunday=0)
    let startDow = firstDay.getDay() - 1;
    if (startDow < 0) startDow = 6;

    const days: (Date | null)[] = [];
    for (let i = 0; i < startDow; i++) days.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(year, month, d));
    }
    return days;
  }, [currentMonth]);

  const today = formatDateKey(new Date());

  const getDayStatus = (dateStr: string) => {
    const dates = availability.dates || {};
    if (dateStr in dates) {
      return dates[dateStr].length === 0 ? 'unavailable' : 'custom';
    }
    return 'default';
  };

  const getSlotCountForDate = (dateStr: string) => {
    const dates = availability.dates || {};
    if (dateStr in dates) return dates[dateStr].length;
    return availability.default.length;
  };

  const toggleDayAvailability = (dateStr: string) => {
    setAvailability(prev => {
      const newDates = { ...prev.dates };
      const status = getDayStatus(dateStr);
      
      if (status === 'unavailable') {
        // Re-enable with defaults
        delete newDates[dateStr];
      } else {
        // Mark as unavailable
        newDates[dateStr] = [];
      }
      
      return { ...prev, dates: newDates };
    });
  };

  const handleDayClick = (dateStr: string) => {
    setSelectedDate(prev => prev === dateStr ? null : dateStr);
  };

  const toggleTimeSlotForDate = (dateStr: string, slot: string) => {
    setAvailability(prev => {
      const newDates = { ...prev.dates };
      const currentSlots = newDates[dateStr] ?? [...prev.default];
      
      if (currentSlots.includes(slot)) {
        newDates[dateStr] = currentSlots.filter(s => s !== slot);
      } else {
        newDates[dateStr] = [...currentSlots, slot].sort();
      }
      
      return { ...prev, dates: newDates };
    });
  };

  const toggleDefaultSlot = (slot: string) => {
    setAvailability(prev => {
      const newDefault = prev.default.includes(slot)
        ? prev.default.filter(s => s !== slot)
        : [...prev.default, slot].sort();
      return { ...prev, default: newDefault };
    });
  };

  const resetDateToDefault = (dateStr: string) => {
    setAvailability(prev => {
      const newDates = { ...prev.dates };
      delete newDates[dateStr];
      return { ...prev, dates: newDates };
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('specialists')
        .update({
          available_time_slots: availability as any,
          updated_at: new Date().toISOString()
        })
        .eq('id', doctorId);

      if (error) throw error;

      toast({ title: "Başarılı", description: "Müsaitlik durumu güncellendi." });
      onUpdate?.();
    } catch (error) {
      console.error('Müsaitlik güncellenirken hata:', error);
      toast({ title: "Hata", description: "Müsaitlik durumu güncellenemedi.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const goToPrevMonth = () => {
    setCurrentMonth(prev => {
      const m = prev.month - 1;
      return m < 0 ? { year: prev.year - 1, month: 11 } : { year: prev.year, month: m };
    });
    setSelectedDate(null);
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => {
      const m = prev.month + 1;
      return m > 11 ? { year: prev.year + 1, month: 0 } : { year: prev.year, month: m };
    });
    setSelectedDate(null);
  };

  const selectedDateSlots = useMemo(() => {
    if (!selectedDate) return [];
    const dates = availability.dates || {};
    if (selectedDate in dates) return dates[selectedDate];
    return availability.default;
  }, [selectedDate, availability]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={goToPrevMonth}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h3 className="text-lg font-bold text-foreground">
          {MONTH_NAMES[currentMonth.month]} {currentMonth.year}
        </h3>
        <Button variant="ghost" size="icon" onClick={goToNextMonth}>
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAY_NAMES.map(day => (
          <div key={day} className="text-center text-xs font-semibold text-muted-foreground py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((date, idx) => {
          if (!date) {
            return <div key={`empty-${idx}`} className="aspect-square" />;
          }

          const dateStr = formatDateKey(date);
          const isToday = dateStr === today;
          const isPast = dateStr < today;
          const status = getDayStatus(dateStr);
          const slotCount = getSlotCountForDate(dateStr);
          const isSelected = selectedDate === dateStr;

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => handleDayClick(dateStr)}
              onDoubleClick={() => toggleDayAvailability(dateStr)}
              disabled={isPast}
              className={`
                relative aspect-square rounded-xl border-2 flex flex-col items-center justify-center gap-0.5
                transition-all duration-200 text-sm font-medium
                ${isPast 
                  ? 'opacity-30 cursor-not-allowed border-transparent bg-muted/30'
                  : isSelected
                    ? 'ring-2 ring-primary ring-offset-2 border-primary bg-primary/10 shadow-md scale-105'
                    : status === 'unavailable'
                      ? 'bg-destructive/10 border-destructive/30 text-destructive hover:border-destructive/50'
                      : status === 'custom'
                        ? 'bg-accent border-accent-foreground/20 hover:border-primary/50 hover:shadow-sm'
                        : 'bg-card border-border hover:border-primary/50 hover:shadow-sm'
                }
                ${isToday ? 'ring-2 ring-primary/30' : ''}
              `}
            >
              <span className={`text-sm font-bold ${
                status === 'unavailable' ? 'text-destructive' : 
                isSelected ? 'text-primary' : 'text-foreground'
              }`}>
                {date.getDate()}
              </span>
              {!isPast && (
                <span className={`text-[10px] leading-none ${
                  status === 'unavailable' ? 'text-destructive/70' : 'text-muted-foreground'
                }`}>
                  {status === 'unavailable' ? 'Kapalı' : `${slotCount} saat`}
                </span>
              )}
              {status === 'custom' && !isPast && (
                <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded border-2 border-border bg-card" />
          <span>Varsayılan</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-accent relative">
            <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-primary" />
          </div>
          <span>Özelleştirilmiş</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded border-2 border-destructive/30 bg-destructive/10" />
          <span>Kapalı</span>
        </div>
        <span className="ml-auto italic">Çift tıkla = Günü aç/kapat</span>
      </div>

      {/* Selected Date Detail Panel */}
      {selectedDate && (
        <div className="border-2 border-primary/20 rounded-2xl p-5 bg-gradient-to-br from-primary/5 to-background space-y-4 animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-primary" />
              <h4 className="font-bold text-foreground">
                {new Date(selectedDate + 'T00:00:00').toLocaleDateString('tr-TR', { 
                  day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' 
                })}
              </h4>
            </div>
            <div className="flex gap-2">
              {(availability.dates || {})[selectedDate] !== undefined && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => resetDateToDefault(selectedDate)}
                  className="text-xs"
                >
                  <RotateCcw className="w-3 h-3 mr-1" />
                  Varsayılana Dön
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setSelectedDate(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {getDayStatus(selectedDate) === 'unavailable' ? (
            <div className="text-center py-6">
              <p className="text-destructive font-medium mb-3">Bu gün kapalı olarak işaretlenmiş</p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => toggleDayAvailability(selectedDate)}
              >
                Günü Aç
              </Button>
            </div>
          ) : (
            <>
              <div className="flex gap-2 mb-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setAvailability(prev => ({
                      ...prev,
                      dates: { ...prev.dates, [selectedDate]: [...DEFAULT_TIME_SLOTS] }
                    }));
                  }}
                >
                  Tümünü Seç
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => toggleDayAvailability(selectedDate)}
                >
                  Günü Kapat
                </Button>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                {DEFAULT_TIME_SLOTS.map((slot) => {
                  const isActive = selectedDateSlots.includes(slot);
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => toggleTimeSlotForDate(selectedDate, slot)}
                      className={`
                        px-2 py-2 rounded-lg border-2 text-xs font-medium transition-all duration-200
                        ${isActive
                          ? 'bg-primary text-primary-foreground border-primary shadow-sm hover:bg-primary/90'
                          : 'bg-muted/50 text-muted-foreground border-border hover:border-primary/50'
                        }
                      `}
                    >
                      <Clock className="w-3 h-3 inline mr-0.5" />
                      {slot}
                    </button>
                  );
                })}
              </div>

              <p className="text-xs text-muted-foreground">
                {selectedDateSlots.length} saat dilimi aktif
                {(availability.dates || {})[selectedDate] === undefined && (
                  <Badge variant="secondary" className="ml-2 text-[10px]">Varsayılan</Badge>
                )}
              </p>
            </>
          )}
        </div>
      )}

      {/* Default Slots Section */}
      {!selectedDate && (
        <div className="border rounded-2xl p-5 bg-muted/30 space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            <h4 className="font-bold text-foreground">Varsayılan Saat Dilimleri</h4>
            <Badge variant="secondary" className="text-[10px]">Tüm günler için geçerli</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Belirli bir güne özel ayar yapılmadığında bu saatler kullanılır.
          </p>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
            {DEFAULT_TIME_SLOTS.map((slot) => {
              const isActive = availability.default.includes(slot);
              return (
                <button
                  key={slot}
                  type="button"
                  onClick={() => toggleDefaultSlot(slot)}
                  className={`
                    px-2 py-2 rounded-lg border-2 text-xs font-medium transition-all duration-200
                    ${isActive
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm hover:bg-primary/90'
                      : 'bg-muted/50 text-muted-foreground border-border hover:border-primary/50'
                    }
                  `}
                >
                  <Clock className="w-3 h-3 inline mr-0.5" />
                  {slot}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            {availability.default.length} varsayılan saat dilimi
          </p>
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end pt-2">
        <Button onClick={handleSave} disabled={saving} size="lg">
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
        </Button>
      </div>
    </div>
  );
};
