import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { X, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { createSpecialtySlug } from "@/utils/doctorUtils";
import { useRef } from "react";

export interface RecentSpecialist {
  id: string;
  name: string;
  specialty: string;
  profile_picture?: string;
  city?: string;
  slug?: string;
}

const STORAGE_KEY = "recently_viewed_specialists";
const MAX_RECENT = 10;

export const addToRecentlyViewed = (specialist: RecentSpecialist) => {
  try {
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as RecentSpecialist[];
    const filtered = existing.filter((s) => s.id !== specialist.id);
    const updated = [specialist, ...filtered].slice(0, MAX_RECENT);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
};

export const getRecentlyViewed = (): RecentSpecialist[] => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
};

const RecentlyViewedSpecialists = ({ currentSpecialistId }: { currentSpecialistId?: string }) => {
  const [recent, setRecent] = useState<RecentSpecialist[]>([]);
  const [visible, setVisible] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const all = getRecentlyViewed();
    const filtered = currentSpecialistId ? all.filter((s) => s.id !== currentSpecialistId) : all;
    setRecent(filtered);
  }, [currentSpecialistId]);

  if (!visible || recent.length === 0) return null;

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -200 : 200, behavior: "smooth" });
  };

  return (
    <div className="bg-white border-b border-gray-100 shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 shrink-0">
            <Clock className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold text-gray-700 whitespace-nowrap">Son İncelenen Uzmanlar</span>
          </div>

          <button onClick={() => scroll("left")} className="shrink-0 p-1 rounded-full hover:bg-gray-100 text-gray-400 hidden sm:block">
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div ref={scrollRef} className="flex gap-2 overflow-x-auto scrollbar-hide flex-1" style={{ scrollbarWidth: "none" }}>
            {recent.map((s) => {
              const specialtySlug = createSpecialtySlug(s.specialty);
              return (
                <Link
                  key={s.id}
                  to={`/${specialtySlug}/${doctorSlug}`}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 hover:bg-blue-100 transition-colors shrink-0 group"
                >
                  {s.profile_picture ? (
                    <img src={s.profile_picture} alt={s.name} className="w-7 h-7 rounded-full object-cover border border-blue-200" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                      {s.name.charAt(0)}
                    </div>
                  )}
                  <div className="flex flex-col leading-tight">
                    <span className="text-xs font-medium text-gray-800 group-hover:text-blue-700 whitespace-nowrap max-w-[120px] truncate">
                      {s.name}
                    </span>
                    <span className="text-[10px] text-gray-500 whitespace-nowrap">{s.specialty}</span>
                  </div>
                </Link>
              );
            })}
          </div>

          <button onClick={() => scroll("right")} className="shrink-0 p-1 rounded-full hover:bg-gray-100 text-gray-400 hidden sm:block">
            <ChevronRight className="w-4 h-4" />
          </button>

          <button onClick={() => setVisible(false)} className="shrink-0 p-1 rounded-full hover:bg-gray-100 text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecentlyViewedSpecialists;
