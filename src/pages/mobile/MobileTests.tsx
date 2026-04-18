import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { MobileEmptyState } from "@/components/mobile/MobileEmptyState";
import { Brain, ChevronRight } from "lucide-react";

interface Test {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  image_url: string | null;
  specialty_area: string | null;
}

export default function MobileTests() {
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("tests")
        .select("id, title, description, category, image_url, specialty_area")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      setTests((data as Test[]) || []);
      setLoading(false);
    })();
  }, []);

  return (
    <div style={{ background: "hsl(var(--m-bg))", minHeight: "100vh" }}>
      <MobileHeader largeTitle="Testler" subtitle="Kendinizi tanıyın" />

      <div className="px-5 pb-8 space-y-2">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ background: "hsl(var(--m-surface-muted))" }} />
          ))
        ) : tests.length === 0 ? (
          <MobileEmptyState icon={Brain} title="Test yok" description="Yakında eklenecek" />
        ) : (
          tests.map((t) => (
            <button
              key={t.id}
              onClick={() => navigate(`/mobile/tests/${t.id}`)}
              className="w-full m-card m-pressable p-4 flex items-center gap-3 text-left"
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
                {t.category && (
                  <span
                    className="inline-block mt-1 px-2 py-0.5 rounded-md text-[11px] font-medium"
                    style={{ background: "hsl(var(--m-purple-soft))", color: "hsl(var(--m-purple))" }}
                  >
                    {t.category}
                  </span>
                )}
              </div>
              <ChevronRight className="w-5 h-5 flex-shrink-0" style={{ color: "hsl(var(--m-text-tertiary))" }} />
            </button>
          ))
        )}
      </div>
    </div>
  );
}
