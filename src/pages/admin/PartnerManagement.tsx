import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { ArrowLeft, Plus, Handshake, Wallet, Loader2 } from "lucide-react";

interface Partner {
  id: string;
  user_id: string | null;
  name: string;
  referral_code: string;
  commission_per_signup: number;
  is_active: boolean;
  contact_email: string | null;
  contact_phone: string | null;
  notes: string | null;
  created_at: string;
}

interface Stats {
  total: number;
  pending: number;
  earned: number;
  paid: number;
  balance: number;
}

const PartnerManagement = () => {
  const { userProfile, loading: roleLoading } = useUserRole();

  const [partners, setPartners] = useState<Partner[]>([]);
  const [stats, setStats] = useState<Record<string, Stats>>({});
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [openCreate, setOpenCreate] = useState(false);
  const [openPayment, setOpenPayment] = useState<Partner | null>(null);
  const [openLink, setOpenLink] = useState<Partner | null>(null);
  const [linkEmail, setLinkEmail] = useState("");
  const [form, setForm] = useState({
    name: "",
    referral_code: "",
    commission_per_signup: 1000,
    contact_email: "",
    contact_phone: "",
    notes: "",
  });
  const [payment, setPayment] = useState({ amount: 0, invoice_no: "", notes: "" });

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("partners" as any)
      .select("*")
      .order("created_at", { ascending: false });
    const list = ((data as any) || []) as Partner[];
    setPartners(list);

    // Stats per partner
    const map: Record<string, Stats> = {};
    for (const p of list) {
      const { data: refs } = await supabase
        .from("partner_referrals" as any)
        .select("commission_status, commission_amount")
        .eq("partner_id", p.id);
      const rows = ((refs as any) || []) as { commission_status: string; commission_amount: number }[];
      map[p.id] = {
        total: rows.length,
        pending: rows.filter((r) => r.commission_status === "pending").length,
        earned: rows.filter((r) => r.commission_status === "earned").length,
        paid: rows.filter((r) => r.commission_status === "paid").length,
        balance: rows
          .filter((r) => r.commission_status === "earned")
          .reduce((s, r) => s + Number(r.commission_amount || 0), 0),
      };
    }
    setStats(map);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const handleCreate = async () => {
    if (!form.name || !form.referral_code) {
      toast.error("Ad ve referans kodu zorunlu");
      return;
    }
    setCreating(true);
    const { error } = await supabase.from("partners" as any).insert({
      name: form.name,
      referral_code: form.referral_code.toUpperCase().trim(),
      commission_per_signup: form.commission_per_signup,
      contact_email: form.contact_email || null,
      contact_phone: form.contact_phone || null,
      notes: form.notes || null,
    });
    setCreating(false);
    if (error) {
      toast.error("Oluşturulamadı: " + error.message);
      return;
    }
    toast.success("İş ortağı oluşturuldu");
    setOpenCreate(false);
    setForm({ name: "", referral_code: "", commission_per_signup: 1000, contact_email: "", contact_phone: "", notes: "" });
    void load();
  };

  const toggleActive = async (p: Partner) => {
    const { error } = await supabase.from("partners" as any).update({ is_active: !p.is_active }).eq("id", p.id);
    if (error) return toast.error(error.message);
    void load();
  };

  const linkUser = async () => {
    if (!openLink || !linkEmail) return;
    const { error } = await supabase.rpc("link_partner_user" as any, {
      p_partner_id: openLink.id,
      p_email: linkEmail.trim(),
    });
    if (error) return toast.error(error.message);
    toast.success("Kullanıcı bağlandı");
    setOpenLink(null);
    setLinkEmail("");
    void load();
  };

  const recordPayment = async () => {
    if (!openPayment || !payment.amount) return;
    const { error } = await supabase.from("partner_commission_payments" as any).insert({
      partner_id: openPayment.id,
      amount: payment.amount,
      invoice_no: payment.invoice_no || null,
      notes: payment.notes || null,
    });
    if (error) return toast.error(error.message);

    // Mark earned referrals as paid up to amount
    // Simple approach: mark all earned as paid
    await supabase
      .from("partner_referrals" as any)
      .update({ commission_status: "paid", paid_at: new Date().toISOString() })
      .eq("partner_id", openPayment.id)
      .eq("commission_status", "earned");

    toast.success("Ödeme kaydedildi");
    setOpenPayment(null);
    setPayment({ amount: 0, invoice_no: "", notes: "" });
    void load();
  };

  return (
    <>
      <Helmet>
        <title>İş Ortakları - Divan Paneli</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="min-h-screen bg-slate-50 p-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" asChild>
                <Link to="/divan_paneli/dashboard">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Geri
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Handshake className="w-6 h-6 text-blue-600" /> Kurumsal İş Ortakları
                </h1>
                <p className="text-sm text-muted-foreground">
                  Referans kodu ile uzman getiren partner kurumlar ve komisyonları
                </p>
              </div>
            </div>
            <Dialog open={openCreate} onOpenChange={setOpenCreate}>
              <DialogTrigger asChild>
                <Button><Plus className="w-4 h-4 mr-2" /> Yeni İş Ortağı</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Yeni İş Ortağı Oluştur</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label>Kurum Adı *</Label>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div>
                    <Label>Referans Kodu *</Label>
                    <Input
                      value={form.referral_code}
                      onChange={(e) => setForm({ ...form, referral_code: e.target.value })}
                      placeholder="IZMIR2026"
                    />
                  </div>
                  <div>
                    <Label>Kayıt Başına Komisyon (TL)</Label>
                    <Input
                      type="number"
                      value={form.commission_per_signup}
                      onChange={(e) => setForm({ ...form, commission_per_signup: Number(e.target.value) })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>E-posta</Label>
                      <Input value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} />
                    </div>
                    <div>
                      <Label>Telefon</Label>
                      <Input value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <Label>Not</Label>
                    <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleCreate} disabled={creating}>
                    {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Oluştur
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            Not: İş ortağının panele giriş yapabilmesi için önce "Kullanıcı Oluştur" ekranından
            <strong> Partner (İş Ortağı)</strong> rolüyle bir hesap oluşturun, sonra buradaki
            kayda o kullanıcının ID'sini bağlayın.
          </p>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">İş Ortağı Listesi</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-10 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Kurum</TableHead>
                        <TableHead>Referans Kodu</TableHead>
                        <TableHead className="text-right">Komisyon</TableHead>
                        <TableHead className="text-center">Yönlendirme</TableHead>
                        <TableHead className="text-right">Bakiye</TableHead>
                        <TableHead>Aktif</TableHead>
                        <TableHead className="text-right">İşlem</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {partners.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                            Henüz iş ortağı yok.
                          </TableCell>
                        </TableRow>
                      ) : (
                        partners.map((p) => {
                          const s = stats[p.id] || { total: 0, pending: 0, earned: 0, paid: 0, balance: 0 };
                          return (
                            <TableRow key={p.id}>
                              <TableCell>
                                <div className="font-medium">{p.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {p.contact_email || "—"} {p.user_id ? "" : "· 🔴 Kullanıcı bağlı değil"}
                                </div>
                              </TableCell>
                              <TableCell>
                                <code className="bg-slate-100 px-2 py-1 rounded text-sm">{p.referral_code}</code>
                              </TableCell>
                              <TableCell className="text-right">{Number(p.commission_per_signup).toLocaleString("tr-TR")} ₺</TableCell>
                              <TableCell className="text-center">
                                <div className="flex gap-1 justify-center flex-wrap">
                                  <Badge variant="outline" className="bg-slate-50">{s.total} toplam</Badge>
                                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700">{s.earned} kazanıldı</Badge>
                                  <Badge variant="outline" className="bg-blue-50 text-blue-700">{s.paid} ödendi</Badge>
                                </div>
                              </TableCell>
                              <TableCell className="text-right font-medium">{s.balance.toLocaleString("tr-TR")} ₺</TableCell>
                              <TableCell>
                                <Switch checked={p.is_active} onCheckedChange={() => toggleActive(p)} />
                              </TableCell>
                              <TableCell className="text-right space-x-1 whitespace-nowrap">
                                {!p.user_id && (
                                  <Button size="sm" variant="secondary" onClick={() => setOpenLink(p)}>
                                    Kullanıcı Bağla
                                  </Button>
                                )}
                                <Button size="sm" variant="outline" onClick={() => setOpenPayment(p)}>
                                  <Wallet className="w-4 h-4 mr-1" /> Ödeme
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={!!openPayment} onOpenChange={(v) => !v && setOpenPayment(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Komisyon Ödemesi Kaydet — {openPayment?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Tutar (TL) *</Label>
              <Input
                type="number"
                value={payment.amount}
                onChange={(e) => setPayment({ ...payment, amount: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label>Fatura No</Label>
              <Input value={payment.invoice_no} onChange={(e) => setPayment({ ...payment, invoice_no: e.target.value })} />
            </div>
            <div>
              <Label>Not</Label>
              <Input value={payment.notes} onChange={(e) => setPayment({ ...payment, notes: e.target.value })} />
            </div>
            <p className="text-xs text-muted-foreground">
              Kaydedildiğinde bu iş ortağının "Kazanıldı" durumundaki tüm komisyonları "Ödendi" olarak işaretlenir.
            </p>
          </div>
          <DialogFooter>
            <Button onClick={recordPayment}>Kaydet</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!openLink} onOpenChange={(v) => !v && setOpenLink(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kullanıcı Bağla — {openLink?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Önce "Kullanıcı Oluştur" ekranından <strong>Partner</strong> rolüyle bir hesap
              oluşturun, ardından o kullanıcının e-postasını buraya girin.
            </p>
            <div>
              <Label>Partner Kullanıcı E-postası</Label>
              <Input
                type="email"
                value={linkEmail}
                onChange={(e) => setLinkEmail(e.target.value)}
                placeholder="partner@kurum.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={linkUser}>Bağla</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PartnerManagement;
