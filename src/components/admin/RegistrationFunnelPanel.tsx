import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw } from "lucide-react";

type Row = { grp: string; stage: string; stage_order: number; n: number; measurable: boolean };

const STAGE_TR: Record<string, string> = {
  landing_visit: "Landing Visit", form_view: "Form View", first_field_focus: "First Field Focus",
  email_entered: "Email Entered", phone_entered: "Phone Entered", step_1_submit_attempt: "Step 1 Submit Attempt",
  step_2_view: "Step 2 View", registration_completed: "Registration Completed", profile_completed: "Profile Completed",
  checkout: "Checkout", paid: "Paid",
};
const DIMS = [
  { v: "all", l: "Tümü" }, { v: "meta_ad_id", l: "Reklam (meta_ad_id)" }, { v: "device", l: "Cihaz" },
  { v: "os", l: "İşletim sistemi" }, { v: "browser", l: "Tarayıcı" }, { v: "app", l: "Kaynak (Instagram/Facebook)" },
];
const COMPARE: { label: string; stage: string }[] = [
  { label: "Landing", stage: "landing_visit" }, { label: "Interaction", stage: "first_field_focus" },
  { label: "Step 1 Submit", stage: "step_1_submit_attempt" }, { label: "Step 2", stage: "step_2_view" },
  { label: "Registration", stage: "registration_completed" },
];
const COMPARE_MIN_V2 = 50;
const pct = (a: number, b: number) => (b > 0 ? `${((a / b) * 100).toFixed(1)}%` : "N/A");

const fetchFunnel = async (cohort: "v1" | "v2", dim: string) => {
  const { data, error } = await supabase.rpc("get_registration_funnel" as any, { p_cohort: cohort, p_dim: dim });
  if (error) throw error;
  return (data || []) as Row[];
};

/** Yalnız gerçek Meta reklam trafiği; v1 ve v2 ayrı cohort. Kayıt UX'ine veya Meta'ya dokunmaz. */
export default function RegistrationFunnelPanel() {
  const [cohort, setCohort] = useState<"v1" | "v2">("v2");
  const [dim, setDim] = useState("all");
  const [rows, setRows] = useState<Row[]>([]);
  const [v1All, setV1All] = useState<Row[]>([]);
  const [v2All, setV2All] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = async () => {
    setLoading(true); setErr(null);
    try {
      const [r, a, b] = await Promise.all([fetchFunnel(cohort, dim), fetchFunnel("v1", "all"), fetchFunnel("v2", "all")]);
      setRows(r); setV1All(a); setV2All(b);
    } catch (e: any) { setErr(e?.message || "Yüklenemedi"); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, [cohort, dim]);

  const groups = useMemo(() => {
    const m = new Map<string, Row[]>();
    rows.forEach((r) => { if (!m.has(r.grp)) m.set(r.grp, []); m.get(r.grp)!.push(r); });
    return [...m.entries()].map(([g, rs]) => [g, rs.sort((x, y) => x.stage_order - y.stage_order)] as const)
      .sort((a, b) => (b[1][0]?.n || 0) - (a[1][0]?.n || 0));
  }, [rows]);

  const v2Landing = v2All.find((r) => r.stage === "landing_visit")?.n || 0;
  const get = (rs: Row[], s: string) => rs.find((r) => r.stage === s);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
          <CardTitle className="text-base">Kayıt Hunisi — gerçek Meta reklam trafiği</CardTitle>
          <div className="flex items-center gap-2">
            <Select value={cohort} onValueChange={(v) => setCohort(v as any)}>
              <SelectTrigger className="w-40 h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="v2">v2 (v2_2026-10-07)</SelectItem>
                <SelectItem value="v1">v1 (eski ekran)</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dim} onValueChange={setDim}>
              <SelectTrigger className="w-52 h-9"><SelectValue /></SelectTrigger>
              <SelectContent>{DIMS.map((d) => <SelectItem key={d.v} value={d.v}>{d.l}</SelectItem>)}</SelectContent>
            </Select>
            <Button size="sm" variant="outline" onClick={load} disabled={loading}><RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /></Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Test kampanyaları/reklam kimlikleri, otomasyon tarayıcıları ve gizli sekmede yüklenip hiç etkileşim olmayan ön yükleme oturumları hariç.
            v1'de ölçülmeyen aşamalar N/A gösterilir. Cihaz/tarayıcı/kaynak kırılımı yalnız v2'de mevcuttur.
          </p>
          {err && <p className="text-sm text-destructive">{err}</p>}
          {groups.length === 0 && !loading && <p className="text-sm text-muted-foreground">Henüz veri yok.</p>}
          {groups.map(([g, rs]) => {
            const landing = rs[0]?.n || 0;
            return (
              <div key={g} className="overflow-x-auto">
                <div className="text-sm font-medium mb-1">{g} <span className="text-muted-foreground font-normal">· {landing} oturum</span></div>
                <table className="w-full text-sm">
                  <thead><tr className="text-left text-muted-foreground border-b">
                    <th className="py-1.5 pr-3">Aşama</th><th className="pr-3">Oturum</th><th className="pr-3">Önceki aşamadan</th>
                    <th className="pr-3">Landing'den toplam</th><th>Drop-off</th>
                  </tr></thead>
                  <tbody>
                    {rs.map((r, i) => {
                      // Önceki ölçülebilir aşamaya göre hesapla (v1'de N/A aşamalar atlanır)
                      const prev = [...rs.slice(0, i)].reverse().find((p) => p.measurable);
                      const ok = r.measurable;
                      return (
                        <tr key={r.stage} className="border-b last:border-0">
                          <td className="py-1.5 pr-3">{STAGE_TR[r.stage] || r.stage}</td>
                          <td className="pr-3">{ok ? r.n : "N/A"}</td>
                          <td className="pr-3">{!ok ? "N/A" : i === 0 ? "—" : pct(r.n, prev?.n || 0)}</td>
                          <td className="pr-3">{ok ? pct(r.n, landing) : "N/A"}</td>
                          <td>{!ok || i === 0 || !prev?.n ? (ok && i === 0 ? "—" : "N/A") : `${(100 - (r.n / prev.n) * 100).toFixed(1)}%`}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">v1 vs v2 karşılaştırması</CardTitle>
          <Badge variant={v2Landing >= COMPARE_MIN_V2 ? "default" : "secondary"}>v2 landing: {v2Landing}/{COMPARE_MIN_V2}</Badge>
        </CardHeader>
        <CardContent>
          {v2Landing < COMPARE_MIN_V2 ? (
            <p className="text-sm text-muted-foreground">v2'de {COMPARE_MIN_V2} gerçek Meta landing visit oluşunca karşılaştırma burada açılır.</p>
          ) : (
            <table className="w-full text-sm">
              <thead><tr className="text-left text-muted-foreground border-b">
                <th className="py-1.5 pr-3">Aşama</th><th className="pr-3">v1 oturum</th><th className="pr-3">v1 landing'den</th>
                <th className="pr-3">v2 oturum</th><th>v2 landing'den</th>
              </tr></thead>
              <tbody>
                {COMPARE.map((c) => {
                  const a = get(v1All, c.stage), b = get(v2All, c.stage);
                  const l1 = get(v1All, "landing_visit")?.n || 0, l2 = v2Landing;
                  return (
                    <tr key={c.stage} className="border-b last:border-0">
                      <td className="py-1.5 pr-3">{c.label}</td>
                      <td className="pr-3">{a?.measurable ? a.n : "N/A"}</td>
                      <td className="pr-3">{a?.measurable ? pct(a.n, l1) : "N/A"}</td>
                      <td className="pr-3">{b?.measurable ? b.n : "N/A"}</td>
                      <td>{b?.measurable ? pct(b.n, l2) : "N/A"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
