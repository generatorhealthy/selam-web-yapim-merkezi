import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Copy, Users, CheckCircle2, Gift, Share2, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Referred {
  id: string;
  name: string;
  email: string | null;
  created_at: string;
  is_active: boolean | null;
  has_paid: boolean;
}

interface Props {
  variant?: "web" | "mobile";
}

/**
 * Uzmanın davet ettiği kişileri ve davet kodunu gösterir.
 * Hem web (DoctorDashboard) hem mobile (MobileSpecialistReferrals) tarafından kullanılır.
 */
export default function SpecialistReferralsPanel({ variant = "web" }: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState<string | null>(null);
  const [items, setItems] = useState<Referred[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          setLoading(false);
          return;
        }

        // Uzmanı bul
        const { data: spec } = await supabase
          .from("specialists")
          .select("id, name, email")
          .or(`user_id.eq.${session.user.id},email.eq.${session.user.email}`)
          .maybeSingle();

        if (!spec) {
          setLoading(false);
          return;
        }

        // Referans kodunu al / oluştur
        const { data: refCode } = await supabase
          .from("specialist_referral_codes")
          .select("code")
          .eq("specialist_id", spec.id)
          .maybeSingle();

        if (!cancelled && refCode?.code) {
          setCode(refCode.code);
        }

        // Bu kodu kullanarak kayıt olan uzmanları bul
        if (refCode?.code) {
          const { data: referredSpecs } = await supabase
            .from("specialists")
            .select("id, name, email, created_at, is_active")
            .eq("referral_signup_code", refCode.code)
            .order("created_at", { ascending: false });

          // Onaylanmış sipariş var mı kontrolü (ödeme yaptılar mı?)
          const referred = (referredSpecs || []) as any[];
          const emails = referred.map((r) => r.email).filter(Boolean);

          let paidEmails = new Set<string>();
          if (emails.length > 0) {
            const { data: orders } = await supabase
              .from("orders")
              .select("customer_email, status")
              .in("customer_email", emails)
              .in("status", ["approved", "completed"]);
            paidEmails = new Set((orders || []).map((o: any) => (o.customer_email || "").toLowerCase()));
          }

          if (!cancelled) {
            setItems(
              referred.map((r) => ({
                id: r.id,
                name: r.name,
                email: r.email,
                created_at: r.created_at,
                is_active: r.is_active,
                has_paid: r.email ? paidEmails.has(r.email.toLowerCase()) : false,
              }))
            );
          }
        }
      } catch (e) {
        console.error("Referrals load error", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const inviteUrl = code ? `${window.location.origin}/kayit-ol?ref=${code}` : "";

  const copyCode = async () => {
    if (!code) return;
    await navigator.clipboard.writeText(code);
    toast({ title: "Kod kopyalandı", description: code });
  };

  const copyLink = async () => {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    toast({ title: "Davet bağlantısı kopyalandı" });
  };

  const share = async () => {
    if (!inviteUrl) return;
    if ((navigator as any).share) {
      try {
        await (navigator as any).share({
          title: "Doktorum Ol — Uzman Olarak Kayıt Ol",
          text: `Doktorum Ol platformuna kayıt olmak için davet kodum: ${code}`,
          url: inviteUrl,
        });
      } catch {}
    } else {
      copyLink();
    }
  };

  const totalCount = items.length;
  const paidCount = items.filter((i) => i.has_paid).length;

  if (variant === "mobile") {
    return (
      <div className="space-y-4">
        {/* Kod kartı */}
        <div
          className="rounded-[24px] p-5"
          style={{
            background: "linear-gradient(135deg, hsl(217 91% 60%) 0%, hsl(224 82% 54%) 100%)",
            color: "white",
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Gift className="w-4 h-4" />
            <span className="text-[12px] font-bold uppercase tracking-wider opacity-90">Davet Kodun</span>
          </div>
          {loading ? (
            <div className="h-8 rounded animate-pulse bg-white/20" />
          ) : code ? (
            <>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[28px] font-extrabold tracking-wider">{code}</span>
                <button
                  onClick={copyCode}
                  className="w-10 h-10 rounded-full flex items-center justify-center bg-white/20 m-pressable"
                  aria-label="Kodu kopyala"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                <button
                  onClick={copyLink}
                  className="h-10 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-1.5 bg-white/20 m-pressable"
                >
                  <Copy className="w-4 h-4" /> Bağlantı
                </button>
                <button
                  onClick={share}
                  className="h-10 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-1.5 bg-white text-[hsl(217_91%_50%)] m-pressable"
                >
                  <Share2 className="w-4 h-4" /> Paylaş
                </button>
              </div>
            </>
          ) : (
            <p className="text-[13px] opacity-80">Davet kodu henüz oluşturulmadı.</p>
          )}
        </div>

        {/* İstatistik */}
        <div className="grid grid-cols-2 gap-3">
          <div className="m-card p-4">
            <Users className="w-5 h-5" style={{ color: "hsl(var(--m-text-secondary))" }} />
            <div className="text-[24px] font-bold mt-2" style={{ color: "hsl(var(--m-text-primary))" }}>{totalCount}</div>
            <div className="text-[12px]" style={{ color: "hsl(var(--m-text-secondary))" }}>Davet ettiğin</div>
          </div>
          <div className="m-card p-4">
            <CheckCircle2 className="w-5 h-5" style={{ color: "hsl(var(--m-success, 142 71% 45%))" }} />
            <div className="text-[24px] font-bold mt-2" style={{ color: "hsl(var(--m-text-primary))" }}>{paidCount}</div>
            <div className="text-[12px]" style={{ color: "hsl(var(--m-text-secondary))" }}>Ödeme yapan</div>
          </div>
        </div>

        {/* Liste */}
        <div className="space-y-2">
          <h3 className="text-[14px] font-semibold px-1" style={{ color: "hsl(var(--m-text-primary))" }}>
            Davet Ettiklerin
          </h3>
          {loading ? (
            <div className="m-card p-4 text-[13px]" style={{ color: "hsl(var(--m-text-secondary))" }}>Yükleniyor…</div>
          ) : items.length === 0 ? (
            <div className="m-card p-6 text-center">
              <UserPlus className="w-10 h-10 mx-auto mb-2" style={{ color: "hsl(var(--m-text-tertiary))" }} />
              <p className="text-[14px] font-semibold" style={{ color: "hsl(var(--m-text-primary))" }}>Henüz davet yok</p>
              <p className="text-[12px] mt-1" style={{ color: "hsl(var(--m-text-secondary))" }}>
                Kodunu paylaş, kayıt olan uzmanları burada gör.
              </p>
            </div>
          ) : (
            items.map((it) => (
              <div key={it.id} className="m-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] font-semibold truncate" style={{ color: "hsl(var(--m-text-primary))" }}>
                      {it.name}
                    </div>
                    {it.email && (
                      <div className="text-[12px] truncate mt-0.5" style={{ color: "hsl(var(--m-text-secondary))" }}>
                        {it.email}
                      </div>
                    )}
                    <div className="text-[11px] mt-1" style={{ color: "hsl(var(--m-text-tertiary))" }}>
                      {new Date(it.created_at).toLocaleDateString("tr-TR", {
                        day: "2-digit", month: "long", year: "numeric",
                      })}
                    </div>
                  </div>
                  <span
                    className="text-[10px] font-bold px-2 py-1 rounded-full shrink-0"
                    style={{
                      background: it.has_paid ? "hsl(142 71% 45% / 0.15)" : "hsl(var(--m-bg))",
                      color: it.has_paid ? "hsl(142 71% 35%)" : "hsl(var(--m-text-secondary))",
                    }}
                  >
                    {it.has_paid ? "ÖDENDİ" : "BEKLİYOR"}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // === WEB versiyonu (DoctorDashboard içinde kullanılır) ===
  return (
    <div className="space-y-6">
      {/* Davet Kodu Kartı */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-2 mb-4">
          <Gift className="w-5 h-5" />
          <span className="text-sm font-bold uppercase tracking-wider opacity-90">Davet Kodun</span>
        </div>
        {loading ? (
          <div className="h-12 rounded animate-pulse bg-white/20" />
        ) : code ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="text-4xl font-extrabold tracking-wider">{code}</div>
              <p className="text-sm opacity-80 mt-2 break-all">{inviteUrl}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={copyCode}
                className="px-4 h-11 rounded-xl text-sm font-semibold flex items-center gap-2 bg-white/20 hover:bg-white/30 transition"
              >
                <Copy className="w-4 h-4" /> Kod
              </button>
              <button
                onClick={copyLink}
                className="px-4 h-11 rounded-xl text-sm font-semibold flex items-center gap-2 bg-white/20 hover:bg-white/30 transition"
              >
                <Copy className="w-4 h-4" /> Bağlantı
              </button>
              <button
                onClick={share}
                className="px-4 h-11 rounded-xl text-sm font-semibold flex items-center gap-2 bg-white text-blue-700 hover:bg-blue-50 transition"
              >
                <Share2 className="w-4 h-4" /> Paylaş
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm opacity-80">Davet kodu henüz oluşturulmadı.</p>
        )}
      </div>

      {/* İstatistik */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-background border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="text-3xl font-bold">{totalCount}</div>
          <div className="text-sm text-muted-foreground mt-1">Davet ettiğin uzman</div>
        </div>
        <div className="bg-background border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-3xl font-bold">{paidCount}</div>
          <div className="text-sm text-muted-foreground mt-1">Ödeme yapan</div>
        </div>
      </div>

      {/* Liste */}
      <div className="bg-background border rounded-2xl overflow-hidden">
        <div className="p-5 border-b">
          <h3 className="font-bold text-lg">Davet Ettiklerin</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Davet kodunla kayıt olan uzmanların listesi
          </p>
        </div>
        {loading ? (
          <div className="p-6 text-sm text-muted-foreground">Yükleniyor…</div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center">
            <UserPlus className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
            <p className="font-semibold">Henüz davet yok</p>
            <p className="text-sm text-muted-foreground mt-1">
              Davet kodunu paylaşarak yeni uzmanlar kazanabilirsin.
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {items.map((it) => (
              <div key={it.id} className="p-4 flex items-center justify-between gap-3 hover:bg-muted/30 transition">
                <div className="min-w-0 flex-1">
                  <div className="font-semibold truncate">{it.name}</div>
                  {it.email && (
                    <div className="text-sm text-muted-foreground truncate">{it.email}</div>
                  )}
                  <div className="text-xs text-muted-foreground/70 mt-0.5">
                    {new Date(it.created_at).toLocaleDateString("tr-TR", {
                      day: "2-digit", month: "long", year: "numeric",
                    })}
                  </div>
                </div>
                <span
                  className={`text-xs font-bold px-3 py-1.5 rounded-full shrink-0 ${
                    it.has_paid
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {it.has_paid ? "Ödeme Yapıldı" : "Ödeme Bekliyor"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
