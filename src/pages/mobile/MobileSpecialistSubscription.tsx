import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { MobileEmptyState } from "@/components/mobile/MobileEmptyState";
import { CreditCard, CheckCircle2, Calendar, Package, Gift } from "lucide-react";
import { PaymentMethodChangeDialog } from "@/components/PaymentMethodChangeDialog";
import { useToast } from "@/hooks/use-toast";

export default function MobileSpecialistSubscription() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sub, setSub] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [referralSummary, setReferralSummary] = useState<{ total: number; qualified: number; bonusGranted: number; bonusMonths: number } | null>(null);
  const [isPaymentChangeOpen, setIsPaymentChangeOpen] = useState(false);
  const { toast } = useToast();

  // Iyzico kart değişikliği dönüşünü yakala
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const change = params.get("paymentChange");
    if (change === "success") {
      toast({ title: "Ödeme yöntemi güncellendi", description: "Yeni kartınız başarıyla kaydedildi." });
      window.history.replaceState({}, "", window.location.pathname);
    } else if (change === "failed") {
      toast({ title: "İşlem başarısız", description: "Kart değiştirme tamamlanamadı.", variant: "destructive" });
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [toast]);

  useEffect(() => {
    let cancelled = false;

    // 0) Cache'ten anında doldur — kullanıcı bekletilmesin
    try {
      const cachedOrders = sessionStorage.getItem("mobile_sub_orders");
      const cachedSub = sessionStorage.getItem("mobile_sub_auto");
      if (cachedOrders) {
        const parsed = JSON.parse(cachedOrders);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setOrders(parsed);
          setLoading(false);
        }
      }
      if (cachedSub) {
        const parsedSub = JSON.parse(cachedSub);
        if (parsedSub) setSub(parsedSub);
      }
    } catch (_) {}

    (async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          navigate("/mobile/login");
          return;
        }

        const sessionEmail = session.user.email?.trim() || "";

        // Önce user_id ile uzmanı bul; telefonla girişte session email boş olabiliyor.
        let { data: spec } = await supabase
          .from("specialists")
          .select("id, name, email")
          .eq("user_id", session.user.id)
          .maybeSingle();

        if (!spec && sessionEmail) {
          const { data: specByEmail } = await supabase
            .from("specialists")
            .select("id, name, email")
            .eq("email", sessionEmail)
            .maybeSingle();
          spec = specByEmail;
        }

        const specialistEmail = spec?.email?.trim() || sessionEmail;
        const specialistName = spec?.name?.trim() || "";
        const emailCandidates = Array.from(new Set([sessionEmail, specialistEmail].filter(Boolean)));

        // 1) HIZLI: Sadece DB sorguları paralel — edge function'u dahil etme
        const [autoByEmailRes, autoByNameRes, ordersByEmailRes, ordersByNameRes] = await Promise.all([
          emailCandidates.length > 0
            ? supabase
                .from("automatic_orders")
                .select("*")
                .in("customer_email", emailCandidates)
                .eq("is_active", true)
                .order("updated_at", { ascending: false })
                .limit(1)
                .maybeSingle()
            : Promise.resolve({ data: null }),
          specialistName
            ? supabase
                .from("automatic_orders")
                .select("*")
                .ilike("customer_name", `%${specialistName}%`)
                .eq("is_active", true)
                .order("updated_at", { ascending: false })
                .limit(1)
                .maybeSingle()
            : Promise.resolve({ data: null }),
          emailCandidates.length > 0
            ? supabase
                .from("orders")
                .select("id, amount, created_at, status, package_name, subscription_month, customer_email, customer_name")
                .in("customer_email", emailCandidates)
                .is("deleted_at", null)
                .order("created_at", { ascending: false })
            : Promise.resolve({ data: [] }),
          specialistName
            ? supabase
                .from("orders")
                .select("id, amount, created_at, status, package_name, subscription_month, customer_email, customer_name")
                .ilike("customer_name", `%${specialistName}%`)
                .is("deleted_at", null)
                .order("created_at", { ascending: false })
            : Promise.resolve({ data: [] }),
        ]);

        if (cancelled) return;

        const subValue = autoByEmailRes.data || autoByNameRes.data || null;
        setSub(subValue);
        try { sessionStorage.setItem("mobile_sub_auto", JSON.stringify(subValue)); } catch (_) {}

        const merged = new Map<string, any>();
        const mergeOrders = (list: any[]) => {
          list.forEach((order: any) => {
            const key = order.id || `${order.created_at}-${order.amount}-${order.package_name}-${order.subscription_month || ""}`;
            if (!merged.has(key)) merged.set(key, order);
          });
        };
        mergeOrders(ordersByEmailRes.data || []);
        mergeOrders(ordersByNameRes.data || []);

        const sortedOrders = Array.from(merged.values()).sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
        setOrders(sortedOrders);
        try { sessionStorage.setItem("mobile_sub_orders", JSON.stringify(sortedOrders)); } catch (_) {}
        setLoading(false);

        // Referans özeti (paralel, hata olursa sessizce geç)
        if (spec?.id) {
          try {
            const { data: refs } = await supabase
              .from("specialist_referrals")
              .select("status")
              .eq("referrer_specialist_id", spec.id);
            if (!cancelled && refs) {
              const total = refs.length;
              const qualified = refs.filter((r: any) => r.status === "qualified" || r.status === "bonus_granted").length;
              const bonusGranted = refs.filter((r: any) => r.status === "bonus_granted").length;
              setReferralSummary({ total, qualified, bonusGranted, bonusMonths: bonusGranted * 2 });
            }
          } catch {}
        }

        // 2) ARKA PLANDA: Edge function ile ek kayıtları getir, varsa birleştir
        if (specialistEmail || specialistName) {
          try {
            const { data: edgeData } = await supabase.functions.invoke("get-specialist-contracts", {
              body: {
                email: specialistEmail || null,
                name: specialistName || null,
              },
            });
            if (cancelled || !Array.isArray(edgeData) || edgeData.length === 0) return;
            mergeOrders(edgeData);
            const mergedSorted = Array.from(merged.values()).sort(
              (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
            );
            setOrders(mergedSorted);
            try { sessionStorage.setItem("mobile_sub_orders", JSON.stringify(mergedSorted)); } catch (_) {}
          } catch {}
        }
      } catch (error) {
        console.error("MobileSpecialistSubscription error:", error);
        if (!cancelled) {
          setSub(null);
          setOrders([]);
          setLoading(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [navigate]);

  return (
    <div style={{ background: "hsl(var(--m-bg))", minHeight: "100vh", paddingBottom: 100 }}>
      <MobileHeader showBack largeTitle="Aboneliğim" subtitle="Ödeme durumum" />

      {loading ? (
        <div className="px-5">
          <div className="m-card p-4 text-[14px]" style={{ color: "hsl(var(--m-text-secondary))" }}>Yükleniyor…</div>
        </div>
      ) : !sub && orders.length === 0 ? (
        <div className="px-5">
          <MobileEmptyState icon={CreditCard} title="Aktif aboneliğiniz yok" />
        </div>
      ) : (
        <>
          {/* Hero card */}
          {sub ? (
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
          ) : (
            <div className="px-5 mb-5">
              <div className="rounded-[28px] p-6" style={{ background: "hsl(var(--m-tint-lilac))" }}>
                <div className="flex items-center gap-2 mb-3">
                  <Package className="w-4 h-4" style={{ color: "hsl(var(--m-text-secondary))" }} />
                  <span className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: "hsl(var(--m-text-secondary))" }}>
                    Siparişlerim
                  </span>
                </div>
                <div className="text-[22px] font-bold leading-tight mb-1" style={{ color: "hsl(var(--m-text-primary))", letterSpacing: "-0.02em" }}>
                  {orders[0]?.package_name || "Paket"}
                </div>
                <div className="text-[13px]" style={{ color: "hsl(var(--m-text-secondary))" }}>
                  Toplam {orders.length} ödeme kaydı
                </div>
              </div>
            </div>
          )}

          {/* Referans bonus kartı */}
          {referralSummary && referralSummary.total > 0 && (
            <div className="px-5 mb-5">
              <div className="rounded-[24px] p-5" style={{ background: "hsl(var(--m-tint-mint))" }}>
                <div className="flex items-center gap-2 mb-2">
                  <Gift className="w-4 h-4" style={{ color: "hsl(var(--m-text-primary))" }} />
                  <span className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: "hsl(var(--m-text-secondary))" }}>
                    Davet Bonusları
                  </span>
                </div>
                <div className="text-[18px] font-bold mb-3" style={{ color: "hsl(var(--m-text-primary))" }}>
                  +{referralSummary.bonusMonths} ay ücretsiz üyelik
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <div className="text-[20px] font-bold" style={{ color: "hsl(var(--m-text-primary))" }}>{referralSummary.total}</div>
                    <div className="text-[11px]" style={{ color: "hsl(var(--m-text-secondary))" }}>Davet</div>
                  </div>
                  <div>
                    <div className="text-[20px] font-bold" style={{ color: "hsl(var(--m-text-primary))" }}>{referralSummary.qualified}</div>
                    <div className="text-[11px]" style={{ color: "hsl(var(--m-text-secondary))" }}>Hak Eden</div>
                  </div>
                  <div>
                    <div className="text-[20px] font-bold" style={{ color: "hsl(var(--m-text-primary))" }}>{referralSummary.bonusGranted}</div>
                    <div className="text-[11px]" style={{ color: "hsl(var(--m-text-secondary))" }}>Tanımlandı</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Ödeme Yöntemini Değiştir Butonu */}
          {(sub || orders.length > 0) && (() => {
            const currentMethod = sub?.payment_method || orders[0]?.payment_method;
            const isBank = currentMethod === "bank_transfer" || currentMethod === "banka_havalesi";
            return (
              <div className="px-5 mb-5">
                <button
                  onClick={() => setIsPaymentChangeOpen(true)}
                  className="w-full rounded-[20px] py-4 px-5 flex items-center justify-center gap-2 font-semibold text-[15px] active:scale-[0.98] transition-transform"
                  style={{
                    background: "hsl(var(--primary))",
                    color: "hsl(var(--primary-foreground))",
                  }}
                >
                  <CreditCard className="w-5 h-5" />
                  {isBank ? "Kredi Kartına Geç" : "Ödeme Yöntemimi Değiştir"}
                </button>
                <p className="text-[12px] text-center mt-2" style={{ color: "hsl(var(--m-text-secondary))" }}>
                  {isBank
                    ? "Banka havalesi yerine kredi kartı ile otomatik ödeme yapın"
                    : "Yeni kart ekleyin, sonraki tahsilatlar yeni karttan alınsın"}
                </p>
              </div>
            );
          })()}

          {sub && (
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
          )}

          {/* History */}
          <div className="px-5 mb-6">
            <div className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: "hsl(var(--m-text-secondary))" }}>
              Geçmiş Ödemeler
            </div>
            {orders.length === 0 ? (
              <MobileEmptyState icon={Calendar} title="Henüz ödeme kaydı yok" />
            ) : (
              <div className="m-card overflow-hidden">
                {orders.slice(0, 24).map((o, i) => (
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
                        {o.package_name || (o.subscription_month ? `${o.subscription_month}. Ay` : "Ödeme")}
                      </div>
                      <div className="text-[12px]" style={{ color: "hsl(var(--m-text-secondary))" }}>
                        {new Date(o.created_at).toLocaleDateString("tr-TR")}
                        {o.subscription_month ? ` · ${o.subscription_month}. Ay` : ""}
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

      <PaymentMethodChangeDialog
        open={isPaymentChangeOpen}
        onClose={() => setIsPaymentChangeOpen(false)}
        currentPaymentMethod={sub?.payment_method || orders[0]?.payment_method}
      />
    </div>
  );
}

