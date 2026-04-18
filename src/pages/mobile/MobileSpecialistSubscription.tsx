import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { MobileEmptyState } from "@/components/mobile/MobileEmptyState";
import { CreditCard, CheckCircle2, Calendar, Package } from "lucide-react";

export default function MobileSpecialistSubscription() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sub, setSub] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { navigate("/mobile/login"); return; }

      const email = session.user.email || "";

      // Specialist name (web ile aynı: hem email hem isim eşleşmesi)
      const { data: spec } = await supabase
        .from("specialists")
        .select("name, email")
        .or(`user_id.eq.${session.user.id},email.eq.${email}`)
        .maybeSingle();
      const specName = spec?.name || "";

      // Aktif abonelik — önce email, yoksa isim ile dene
      let { data: autoOrder } = await supabase
        .from("automatic_orders")
        .select("*")
        .eq("customer_email", email)
        .eq("is_active", true)
        .maybeSingle();
      if (!autoOrder && specName) {
        const { data: byName } = await supabase
          .from("automatic_orders")
          .select("*")
          .eq("customer_name", specName)
          .eq("is_active", true)
          .maybeSingle();
        autoOrder = byName;
      }
      setSub(autoOrder);

      // Geçmiş ödemeler — email + isim birleşimi
      const { data: paidByEmail } = await supabase
        .from("orders")
        .select("amount, created_at, status, package_name, subscription_month, customer_email, customer_name")
        .ilike("customer_email", email)
        .in("status", ["approved", "completed"])
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      let allPaid: any[] = paidByEmail || [];
      if (specName) {
        const { data: paidByName } = await supabase
          .from("orders")
          .select("amount, created_at, status, package_name, subscription_month, customer_email, customer_name")
          .eq("customer_name", specName)
          .in("status", ["approved", "completed"])
          .is("deleted_at", null)
          .order("created_at", { ascending: false });
        const merged = new Map<string, any>();
        [...allPaid, ...(paidByName || [])].forEach((o: any) => {
          const k = `${o.created_at}-${o.amount}-${o.subscription_month || ""}`;
          if (!merged.has(k)) merged.set(k, o);
        });
        allPaid = Array.from(merged.values()).sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
      }
      setOrders(allPaid);
      setLoading(false);
    })();
  }, [navigate]);

  return (
    <div style={{ background: "hsl(var(--m-bg))", minHeight: "100vh", paddingBottom: 100 }}>
      <MobileHeader showBack largeTitle="Aboneliğim" subtitle="Ödeme durumum" />

      {loading ? (
        <div className="px-5">
          <div className="m-card p-4 text-[14px]" style={{ color: "hsl(var(--m-text-secondary))" }}>Yükleniyor…</div>
        </div>
      ) : !sub && orders.length === 0 ? (
        <>
          {/* Hero card */}
          <div className="px-5 mb-5">
            <div className="rounded-[28px] p-6" style={{ background: "hsl(var(--m-tint-lilac))" }}>
              <div className="flex items-center gap-2 mb-3">
                <Package className="w-4 h-4" style={{ color: "hsl(var(--m-text-secondary))" }} />
                <span className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: "hsl(var(--m-text-secondary))" }}>
                  Aktif Paket
                </span>
              </div>
              <div className="text-[22px] font-bold leading-tight mb-1" style={{ color: "hsl(var(--m-text-primary))", letterSpacing: "-0.02em" }}>
                {sub.package_name}
              </div>
              <div className="text-[13px]" style={{ color: "hsl(var(--m-text-secondary))" }}>
                {Number(sub.amount).toLocaleString("tr-TR")}₺ · Her ayın {sub.monthly_payment_day}'i
              </div>
            </div>
          </div>

          {/* Months grid */}
          <div className="px-5 mb-6">
            <div className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: "hsl(var(--m-text-secondary))" }}>
              Ödeme Takvimi
            </div>
            <div className="m-card p-4">
              <div className="grid grid-cols-6 gap-2">
                {Array.from({ length: sub.total_months || 24 }).map((_, i) => {
                  const m = i + 1;
                  const paid = (sub.paid_months || []).includes(m);
                  return (
                    <div
                      key={m}
                      className="aspect-square rounded-xl flex flex-col items-center justify-center text-[11px] font-bold"
                      style={{
                        background: paid ? "hsl(var(--m-tint-mint))" : "hsl(var(--m-bg))",
                        color: "hsl(var(--m-text-primary))",
                      }}
                    >
                      {paid && <CheckCircle2 className="w-3 h-3 mb-0.5" />}
                      {m}
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 text-[12px] text-center" style={{ color: "hsl(var(--m-text-secondary))" }}>
                {(sub.paid_months || []).length} / {sub.total_months || 24} ay ödendi
              </div>
            </div>
          </div>

          {/* History */}
          <div className="px-5 mb-6">
            <div className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: "hsl(var(--m-text-secondary))" }}>
              Geçmiş Ödemeler
            </div>
            {orders.length === 0 ? (
              <MobileEmptyState icon={Calendar} title="Henüz ödeme kaydı yok" />
            ) : (
              <div className="m-card overflow-hidden">
                {orders.slice(0, 12).map((o, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 px-4 py-3"
                    style={{ borderTop: i > 0 ? "1px solid hsl(var(--m-divider))" : undefined }}
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center"
                      style={{ background: "hsl(var(--m-tint-mint))" }}
                    >
                      <CheckCircle2 className="w-4 h-4" style={{ color: "hsl(var(--m-ink))" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[14px] font-semibold truncate" style={{ color: "hsl(var(--m-text-primary))" }}>
                        {o.subscription_month ? `${o.subscription_month}. Ay` : "Ödeme"}
                      </div>
                      <div className="text-[12px]" style={{ color: "hsl(var(--m-text-secondary))" }}>
                        {new Date(o.created_at).toLocaleDateString("tr-TR")}
                      </div>
                    </div>
                    <div className="text-[14px] font-bold" style={{ color: "hsl(var(--m-text-primary))" }}>
                      {Number(o.amount).toLocaleString("tr-TR")}₺
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
