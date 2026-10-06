import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import AdminBackButton from "@/components/AdminBackButton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phone, MessageCircle, RefreshCw } from "lucide-react";

interface Row {
  user_id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
  reminders_sent: number;
  status: string;
  note: string | null;
  followup_updated_at: string | null;
}

const STATUSES = [
  { value: "aranmadi", label: "Aranmadı" },
  { value: "ulasilamadi", label: "Ulaşılamadı" },
  { value: "tekrar_ara", label: "Tekrar Aranacak" },
  { value: "ilgileniyor", label: "İlgileniyor" },
  { value: "ilgilenmiyor", label: "İlgilenmiyor" },
];

const waLink = (p: string) => {
  let d = p.replace(/\D/g, "");
  if (d.startsWith("0")) d = "9" + d;
  else if (d.length === 10) d = "90" + d;
  return `https://wa.me/${d}`;
};

export default function IncompleteRegistrations() {
  const { toast } = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState("30");
  const [filter, setFilter] = useState("all");
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("get_incomplete_registrations" as any, { p_days: Number(days) });
    if (error) toast({ title: "Liste alınamadı", description: error.message, variant: "destructive" });
    const list = (data as Row[]) || [];
    setRows(list);
    setNotes(Object.fromEntries(list.map((r) => [r.user_id, r.note || ""])));
    setLoading(false);
  };

  useEffect(() => { load(); }, [days]);

  const save = async (userId: string, patch: { status?: string; note?: string }) => {
    const row = rows.find((r) => r.user_id === userId);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("registration_followups" as any).upsert({
      user_id: userId,
      status: patch.status ?? row?.status ?? "aranmadi",
      note: patch.note ?? notes[userId] ?? null,
      updated_at: new Date().toISOString(),
      updated_by: u.user?.id,
    });
    if (error) return toast({ title: "Kaydedilemedi", description: error.message, variant: "destructive" });
    setRows((prev) => prev.map((r) => (r.user_id === userId ? { ...r, ...patch, followup_updated_at: new Date().toISOString() } : r)));
    toast({ title: "Kaydedildi" });
  };

  const visible = rows.filter((r) => filter === "all" || r.status === filter);

  return (
    <div className="container mx-auto p-4 space-y-4">
      <Helmet><title>Kaydı Yarım Kalanlar</title></Helmet>
      <AdminBackButton />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Kaydı Yarım Kalanlar</h1>
          <p className="text-sm text-muted-foreground">Telefonunu bırakıp kaydını veya ödemesini tamamlamayan uzmanlar — aynı gün arayın.</p>
        </div>
        <div className="flex gap-2">
          <Select value={days} onValueChange={setDays}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Son 24 saat</SelectItem>
              <SelectItem value="7">Son 7 gün</SelectItem>
              <SelectItem value="30">Son 30 gün</SelectItem>
              <SelectItem value="90">Son 90 gün</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm durumlar</SelectItem>
              {STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={load} aria-label="Yenile"><RefreshCw className="h-4 w-4" /></Button>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">{loading ? "Yükleniyor..." : `${visible.length} kişi`}</p>

      {loading ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-28 rounded-lg bg-muted animate-pulse" />)}</div>
      ) : visible.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">Bu aralıkta yarım kalan kayıt yok.</CardContent></Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {visible.map((r) => (
            <Card key={r.user_id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between gap-2">
                  <span>{r.name || "İsimsiz"}</span>
                  <Badge variant="secondary">{r.reminders_sent}/3 hatırlatma</Badge>
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {r.email} · Kayıt: {new Date(r.created_at).toLocaleString("tr-TR")}
                </p>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  <Button asChild size="sm"><a href={`tel:${r.phone}`}><Phone className="h-4 w-4 mr-1" />{r.phone}</a></Button>
                  <Button asChild size="sm" variant="outline"><a href={waLink(r.phone || "")} target="_blank" rel="noreferrer"><MessageCircle className="h-4 w-4 mr-1" />WhatsApp</a></Button>
                  <Select value={r.status} onValueChange={(v) => save(r.user_id, { status: v })}>
                    <SelectTrigger className="h-9 w-44"><SelectValue /></SelectTrigger>
                    <SelectContent>{STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <Textarea
                  rows={2}
                  placeholder="Görüşme notu"
                  value={notes[r.user_id] ?? ""}
                  onChange={(e) => setNotes((n) => ({ ...n, [r.user_id]: e.target.value }))}
                  onBlur={() => (notes[r.user_id] ?? "") !== (r.note ?? "") && save(r.user_id, { note: notes[r.user_id] })}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
