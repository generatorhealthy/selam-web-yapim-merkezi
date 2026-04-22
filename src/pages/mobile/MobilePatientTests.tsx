import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { MobileEmptyState } from "@/components/mobile/MobileEmptyState";
import { Brain, ChevronRight } from "lucide-react";

interface TestResult {
  id: string;
  test_id: string | null;
  specialty_area: string | null;
  status: string | null;
  created_at: string;
  tests?: { title: string | null; image_url: string | null } | null;
}

export default function MobilePatientTests() {
  const navigate = useNavigate();
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate("/mobile/login");
        return;
      }
      const email = session.user.email;
      const { data } = await supabase
        .from("test_results")
        .select("id, test_id, specialty_area, status, created_at, tests(title, image_url)")
        .or(`patient_user_id.eq.${session.user.id}${email ? `,patient_email.eq.${email}` : ""}`)
        .order("created_at", { ascending: false });
      setResults((data as any) || []);
      setLoading(false);
    })();
  }, [navigate]);

  return (
    <div style={{ background: "hsl(var(--m-bg))", minHeight: "100vh", paddingBottom: 100 }}>
      <MobileHeader showBack largeTitle="Test Sonuçlarım" subtitle="Tamamladığınız testler" />
      <div className="px-5 pb-8 space-y-2">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: "hsl(var(--m-surface-muted))" }} />
          ))
        ) : results.length === 0 ? (
          <MobileEmptyState icon={Brain} title="Henüz test yok" description="Tamamladığınız testler burada görünecek" />
        ) : (
          results.map((r) => (
            <button
              key={r.id}
              onClick={() => navigate(`/test-sonucu/${r.id}`)}
              className="m-card p-4 w-full flex items-center gap-3 text-left m-pressable"
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden"
                style={{ background: "hsl(var(--m-purple-soft))" }}
              >
                {r.tests?.image_url ? (
                  <img src={r.tests.image_url} alt={r.tests.title || ""} className="w-full h-full object-cover" />
                ) : (
                  <Brain className="w-6 h-6" style={{ color: "hsl(var(--m-purple))" }} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-[15px] truncate" style={{ color: "hsl(var(--m-text-primary))" }}>
                  {r.tests?.title || "Test"}
                </h3>
                <p className="text-[12px] mt-0.5" style={{ color: "hsl(var(--m-text-secondary))" }}>
                  {new Date(r.created_at).toLocaleDateString("tr-TR")}
                  {r.specialty_area ? ` · ${r.specialty_area}` : ""}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 flex-shrink-0" style={{ color: "hsl(var(--m-text-tertiary))" }} />
            </button>
          ))
        )}
      </div>
    </div>
  );
}
