import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Handshake, LogOut, Copy, Link2, Users, CheckCircle2, Clock, Wallet, TrendingUp, Loader2,
} from "lucide-react";

interface Partner {
  id: string;
  name: string;
  referral_code: string;
  commission_per_signup: number;
  is_active: boolean;
}

interface Referral {
  id: string;
  specialist_email: string;
  specialist_name: string | null;
  specialist_phone: string | null;
  signup_at: string;
  first_paid_at: string | null;
  commission_amount: number;
  commission_status: "pending" | "earned" | "paid" | "cancelled";
}

interface Payment {
  id: string;
  amount: number;
  paid_at: string;
  payment_method: string | null;
  invoice_no: string | null;
  notes: string | null;
}

const statusLabels: Record<string, { label: string; className: string }> = {
  pending: { label: "Beklemede", className: "bg-amber-100 text-amber-800 border-amber-200" },
  earned: { label: "Kazanıldı", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  paid: { label: "Ödendi", className: "bg-blue-100 text-blue-800 border-blue-200" },
  cancelled: { label: "İptal", className: "bg-red-100 text-red-700 border-red-200" },
};

const PartnerDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [partner, setPartner] = useState<Partner | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session?.user) {
        navigate("/partner-giris");
        return;
      }
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("role, is_approved")
        .eq("user_id", sess.session.user.id)
        .maybeSingle();
      if (!profile || profile.role !== "partner" || !profile.is_approved) {
        await supabase.auth.signOut();
        toast.error("Bu alan yalnızca iş ortakları içindir.");
        navigate("/partner-giris");
        return;
      }
      const { data: p, error: pErr } = await supabase
        .from("partners" as any)
        .select("id, name, referral_code, commission_per_signup, is_active")
        .eq("user_id", sess.session.user.id)
        .maybeSingle();
      if (pErr || !p) {
        toast.error("İş ortağı kaydınız bulunamadı. Yönetici ile iletişime geçin.");
        setLoading(false);
        return;
      }
      setPartner(p as any);

      const [refRes, payRes] = await Promise.all([
        supabase
          .from("partner_referrals" as any)
          .select("id, specialist_email, specialist_name, specialist_phone, signup_at, first_paid_at, commission_amount, commission_status")
          .eq("partner_id", (p as any).id)
          .order("signup_at", { ascending: false }),
        supabase
          .from("partner_commission_payments" as any)
          .select("id, amount, paid_at, payment_method, invoice_no, notes")
          .eq("partner_id", (p as any).id)
          .order("paid_at", { ascending: false }),
      ]);
      setReferrals((refRes.data as any) || []);
      setPayments((payRes.data as any) || []);
      setLoading(false);
    };
    void load();
  }, [navigate]);

  const referralUrl = useMemo(
    () => (partner ? `https://doktorumol.com.tr/kayit-ol?ref=${partner.referral_code}` : ""),
    [partner]
  );

  const stats = useMemo(() => {
    const total = referrals.length;
    const earned = referrals.filter((r) => r.commission_status === "earned");
    const paid = referrals.filter((r) => r.commission_status === "paid");
    const pending = referrals.filter((r) => r.commission_status === "pending");
    const totalEarned = earned.reduce((s, r) => s + Number(r.commission_amount || 0), 0);
    const totalPaid = paid.reduce((s, r) => s + Number(r.commission_amount || 0), 0);
    return {
      total,
      earnedCount: earned.length,
      paidCount: paid.length,
      pendingCount: pending.length,
      totalEarned,
      totalPaid,
      unpaidBalance: totalEarned,
    };
  }, [referrals]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/partner-giris");
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl);
      toast.success("Referans linki kopyalandı");
    } catch {
      toast.error("Kopyalanamadı");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>İş ortağı kaydı bulunamadı</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={handleLogout} variant="outline">
              <LogOut className="w-4 h-4 mr-2" /> Çıkış Yap
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{partner.name} - İş Ortağı Paneli</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-100/40">
        {/* Header */}
        <div className="bg-white border-b border-blue-100 shadow-sm">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow">
                <Handshake className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">{partner.name}</h1>
                <p className="text-xs text-muted-foreground">Kurumsal İş Ortağı Paneli</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" /> Çıkış
            </Button>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 space-y-8">
          {/* Referral link card */}
          <Card className="border-blue-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Link2 className="w-5 h-5 text-blue-600" />
                Referans Linkiniz
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
                <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 font-mono text-sm break-all">
                  {referralUrl}
                </div>
                <Button onClick={copyLink}>
                  <Copy className="w-4 h-4 mr-2" /> Kopyala
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Yönlendirdiğiniz her uzman bu link üzerinden kayıt olduğunda otomatik olarak
                referanslarınıza eklenir. İlk aylık ödemesi tamamlandığında komisyonunuz
                "Kazanıldı" olarak işaretlenir.
              </p>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={Users} label="Toplam Yönlendirme" value={stats.total} color="blue" />
            <StatCard icon={Clock} label="Beklemede" value={stats.pendingCount} color="amber" />
            <StatCard icon={CheckCircle2} label="Ödeme Yapan" value={stats.earnedCount + stats.paidCount} color="emerald" />
            <StatCard
              icon={Wallet}
              label="Bakiye (TL)"
              value={stats.unpaidBalance.toLocaleString("tr-TR")}
              color="indigo"
            />
          </div>

          <Tabs defaultValue="referrals">
            <TabsList>
              <TabsTrigger value="referrals">
                <Users className="w-4 h-4 mr-2" /> Yönlendirmeler ({referrals.length})
              </TabsTrigger>
              <TabsTrigger value="payments">
                <Wallet className="w-4 h-4 mr-2" /> Komisyon Ödemeleri ({payments.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="referrals" className="mt-4">
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Uzman</TableHead>
                          <TableHead>Kayıt Tarihi</TableHead>
                          <TableHead>İlk Ödeme</TableHead>
                          <TableHead className="text-right">Komisyon</TableHead>
                          <TableHead>Durum</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {referrals.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                              Henüz yönlendirme yok. Referans linkinizi paylaşın.
                            </TableCell>
                          </TableRow>
                        ) : (
                          referrals.map((r) => {
                            const s = statusLabels[r.commission_status] || statusLabels.pending;
                            return (
                              <TableRow key={r.id}>
                                <TableCell>
                                  <div className="font-medium">{r.specialist_name || "—"}</div>
                                  <div className="text-xs text-muted-foreground">{r.specialist_email}</div>
                                </TableCell>
                                <TableCell>{new Date(r.signup_at).toLocaleDateString("tr-TR")}</TableCell>
                                <TableCell>
                                  {r.first_paid_at ? new Date(r.first_paid_at).toLocaleDateString("tr-TR") : "—"}
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                  {Number(r.commission_amount).toLocaleString("tr-TR")} ₺
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className={s.className}>{s.label}</Badge>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payments" className="mt-4">
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tarih</TableHead>
                          <TableHead className="text-right">Tutar</TableHead>
                          <TableHead>Yöntem</TableHead>
                          <TableHead>Fatura No</TableHead>
                          <TableHead>Not</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payments.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                              Henüz komisyon ödemesi yok.
                            </TableCell>
                          </TableRow>
                        ) : (
                          payments.map((p) => (
                            <TableRow key={p.id}>
                              <TableCell>{new Date(p.paid_at).toLocaleDateString("tr-TR")}</TableCell>
                              <TableCell className="text-right font-medium">
                                {Number(p.amount).toLocaleString("tr-TR")} ₺
                              </TableCell>
                              <TableCell>{p.payment_method || "—"}</TableCell>
                              <TableCell>{p.invoice_no || "—"}</TableCell>
                              <TableCell className="max-w-xs truncate">{p.notes || "—"}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

const StatCard = ({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: any;
  label: string;
  value: number | string;
  color: "blue" | "amber" | "emerald" | "indigo";
}) => {
  const colorMap: Record<string, string> = {
    blue: "from-blue-500 to-blue-600",
    amber: "from-amber-500 to-orange-500",
    emerald: "from-emerald-500 to-green-600",
    indigo: "from-indigo-500 to-purple-600",
  };
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className="text-2xl font-bold mt-1">{value}</div>
          </div>
          <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${colorMap[color]} flex items-center justify-center shadow`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PartnerDashboard;
