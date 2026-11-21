import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";
import { PhoneCall, Play, Square } from "lucide-react";

const AREAS = [
  { v: "bireysel", l: "Bireysel Terapi" },
  { v: "cocuk", l: "Çocuk Terapisi" },
  { v: "cift", l: "Çift Terapisi" },
  { v: "aile", l: "Aile Danışmanlığı" },
  { v: "iliski", l: "İlişki Danışmanlığı" },
];

async function call(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("lead-ivr-campaign", { body });
  if (error) {
    let msg = error.message;
    if (error instanceof FunctionsHttpError) {
      try { msg = (await error.context.json()).error || msg; } catch { /* */ }
    }
    throw new Error(msg);
  }
  return data;
}

export default function BulkIvrDialog() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState<number | null>(null);
  const [area, setArea] = useState("cift");
  const [audio, setAudio] = useState<string | null>(null);
  const [testPhone, setTestPhone] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const run = async (key: string, fn: () => Promise<void>) => {
    setBusy(key);
    try { await fn(); } catch (e) { toast({ title: "Hata", description: (e as Error).message, variant: "destructive" }); }
    finally { setBusy(null); }
  };

  const openDialog = () => {
    setOpen(true);
    run("count", async () => setCount((await call({ action: "eligible" })).count));
  };

  return (
    <>
      <Button onClick={openDialog} size="sm" className="shrink-0">
        <PhoneCall className="h-4 w-4 mr-2" /> Toplu Otomatik Ara
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Açmayanları otomatik ara</DialogTitle>
            <DialogDescription>
              Arayan numara: <b>0216 706 06 11</b>. Aynı anda en fazla 2 arama, yalnız 09:30–20:00 arası.
              1'i tuşlayanlar ve 2'yi tuşlayanlar ayrı kartlara geçer.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-lg border p-3 space-y-2">
              <div className="text-sm font-medium">1. Sesi dinleyin</div>
              <div className="flex gap-2">
                <Select value={area} onValueChange={(v) => { setArea(v); setAudio(null); }}>
                  <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{AREAS.map((a) => <SelectItem key={a.v} value={a.v}>{a.l}</SelectItem>)}</SelectContent>
                </Select>
                <Button variant="outline" disabled={!!busy} onClick={() => run("sample", async () => setAudio((await call({ action: "sample", area })).audio))}>
                  <Play className="h-4 w-4 mr-1" />{busy === "sample" ? "Hazırlanıyor..." : "Dinle"}
                </Button>
              </div>
              {audio && <audio src={audio} controls autoPlay className="w-full" />}
            </div>

            <div className="rounded-lg border p-3 space-y-2">
              <div className="text-sm font-medium">2. Kendi numaranıza deneme araması</div>
              <div className="flex gap-2">
                <Input placeholder="05xx xxx xx xx" value={testPhone} onChange={(e) => setTestPhone(e.target.value)} />
                <Button variant="outline" disabled={!!busy || !testPhone} onClick={() => run("test", async () => {
                  await call({ action: "start", test_phone: testPhone, area });
                  toast({ title: "Deneme araması başlatıldı", description: "Telefonunuz birazdan çalacak." });
                })}>{busy === "test" ? "Başlatılıyor..." : "Beni ara"}</Button>
              </div>
            </div>

            <div className="rounded-lg border p-3 space-y-2">
              <div className="text-sm font-medium">3. Toplu arama</div>
              <p className="text-sm text-muted-foreground">
                {count === null ? "Sayılıyor..." : `${count} danışan aranacak (son 24 saatte otomatik arananlar ve sabit hatlar hariç).`}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" disabled={!!busy || !count} onClick={() => run("small", async () => {
                  const r = await call({ action: "start", limit: 5 });
                  toast({ title: "Küçük deneme başladı", description: `${r.count} kişi aranacak.` });
                })}>İlk 5 kişiyle dene</Button>
                <Button disabled={!!busy || !count} onClick={() => run("all", async () => {
                  if (!confirm(`${count} danışan otomatik aranacak. Onaylıyor musunuz?`)) return;
                  const r = await call({ action: "start" });
                  toast({ title: "Toplu arama başladı", description: `${r.count} kişi sırayla aranacak.` });
                })}>Hepsini ara</Button>
                <Button variant="destructive" disabled={!!busy} onClick={() => run("stop", async () => {
                  await call({ action: "stop" });
                  toast({ title: "Toplu arama durduruldu" });
                })}><Square className="h-4 w-4 mr-1" />Durdur</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
