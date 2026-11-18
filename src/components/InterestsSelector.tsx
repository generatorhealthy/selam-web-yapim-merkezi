import { useState } from "react";
import { Check, Plus } from "lucide-react";
import { getSuggestedInterests } from "@/lib/specialistInterests";
import { cn } from "@/lib/utils";

interface InterestsSelectorProps {
  specialty?: string | null;
  value: string[];
  onChange: (next: string[]) => void;
  className?: string;
  /** Show heading + helper text */
  showHeader?: boolean;
}

/**
 * Tıklanabilir buton-chip seçici. Aktif seçimler primary renkle dolu,
 * öneri olan ama henüz seçilmemiş alanlar outline gösterilir.
 */
export default function InterestsSelector({
  specialty,
  value,
  onChange,
  className,
  showHeader = true,
}: InterestsSelectorProps) {
  const suggested = getSuggestedInterests(specialty);
  const selectedSet = new Set(value || []);

  // Birleşik liste: önce mevcut seçimler (önerilerde olmasa bile korunur), sonra önerilenler
  const merged = Array.from(new Set([...(value || []), ...suggested]));

  const toggle = (item: string) => {
    if (selectedSet.has(item)) {
      onChange((value || []).filter((v) => v !== item));
    } else {
      onChange([...(value || []), item]);
    }
  };

  const [custom, setCustom] = useState("");
  const addCustom = () => {
    const item = custom.trim().replace(/\s+/g, " ").slice(0, 80);
    if (!item) return;
    const exists = (value || []).some((v) => v.toLocaleLowerCase("tr") === item.toLocaleLowerCase("tr"));
    if (!exists) onChange([...(value || []), item]);
    setCustom("");
  };

  return (
    <div className={className}>
      {showHeader && (
        <div className="mb-3">
          <h3 className="text-base font-semibold text-foreground">İlgi Alanları</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Profilinizde gösterilecek ilgi alanlarınızı seçin. İstediğinizi ekleyip çıkarabilirsiniz.
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {merged.map((item) => {
          const active = selectedSet.has(item);
          return (
            <button
              key={item}
              type="button"
              onClick={() => toggle(item)}
              className={cn(
                "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[13px] font-medium border transition-all",
                active
                  ? "bg-primary text-primary-foreground border-primary shadow-sm hover:bg-primary/90"
                  : "bg-background text-foreground border-border hover:border-primary/40 hover:bg-primary/5"
              )}
            >
              {active ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <Plus className="w-3.5 h-3.5 opacity-60" />
              )}
              <span>{item}</span>
            </button>
          );
        })}
      </div>

      <div className="flex gap-2 mt-4">
        <input
          type="text"
          value={custom}
          maxLength={80}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustom(); } }}
          placeholder="Listede olmayan bir alan yazın"
          className="flex-1 h-10 rounded-md border border-input bg-background px-3 text-sm"
        />
        <button
          type="button"
          onClick={addCustom}
          className="inline-flex items-center gap-1.5 h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" /> Ekle
        </button>
      </div>

      {value && value.length > 0 && (
        <p className="text-xs text-muted-foreground mt-3">
          {value.length} ilgi alanı seçili
        </p>
      )}
    </div>
  );
}

/**
 * Salt-okunur görüntüleme: profilde gösterilir.
 */
export function InterestsDisplay({
  items,
  className,
  variant = "primary",
}: {
  items: string[];
  className?: string;
  variant?: "primary" | "soft" | "outline";
}) {
  if (!items || items.length === 0) return null;
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {items.map((item) => (
        <span
          key={item}
          className={cn(
            "inline-flex items-center px-3.5 py-1.5 rounded-full text-[13px] font-medium border",
            variant === "primary" && "bg-primary text-primary-foreground border-primary",
            variant === "soft" && "bg-primary/10 text-primary border-primary/20",
            variant === "outline" && "bg-background text-primary border-primary/40"
          )}
        >
          {item}
        </span>
      ))}
    </div>
  );
}
