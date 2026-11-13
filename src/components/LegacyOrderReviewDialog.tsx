import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ClipboardList, RefreshCw } from 'lucide-react';
import { z } from 'zod';

const rowSchema = z.object({ orderId: z.string().uuid(), registeredEmail: z.string(), status: z.string(), paymentStatus: z.string().nullable(), ownership: z.enum(['registered_email_match','review_required']), historicalOwnershipVerified: z.literal(false), specialist: z.object({ id: z.string().uuid(), userId: z.string().uuid(), name: z.string(), email: z.string() }).nullable() });
const receiptSchema = z.object({ scopeCount: z.literal(64), rows: z.array(rowSchema).max(64), missingCount: z.number().int().nonnegative() });
type Receipt = z.infer<typeof receiptSchema>;
export default function LegacyOrderReviewDialog() {
  const [open, setOpen] = useState(false), [loading, setLoading] = useState(false), [error, setError] = useState('');
  const [receipt, setReceipt] = useState<Receipt | null>(null), [refresh, setRefresh] = useState(0);
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true); setReceipt(null); setError('');
    supabase.functions.invoke('legacy-order-review', { body: {} }).then(({ data, error: requestError }) => {
      if (cancelled) return;
      const parsed = receiptSchema.safeParse(data);
      if (requestError || !parsed.success) setError('İnceleme listesi alınamadı veya erişim yetkiniz yok.');
      else setReceipt(parsed.data);
    }).catch(() => { if (!cancelled) setError('İnceleme listesi alınamadı.'); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [open, refresh]);
  const matched = receipt?.rows.filter(r => r.ownership === 'registered_email_match') ?? [];
  const uncertain = receipt?.rows.filter(r => r.ownership === 'review_required') ?? [];
  const list = (rows: Receipt['rows']) => <div className="space-y-4">
    {rows.length === 0 && <p className="py-6 text-sm text-muted-foreground">Bu grupta kayıt yok.</p>}
    {rows.map(row => <article key={row.orderId} className="border-b border-border py-4 text-sm">
      <dl className="grid gap-2 sm:grid-cols-[10rem_1fr]">
        <dt className="text-muted-foreground">Sipariş numarası</dt><dd className="break-all font-mono text-xs">{row.orderId}</dd>
        <dt className="text-muted-foreground">Kayıtlı e-posta</dt><dd className="break-all">{row.registeredEmail || 'Kayıtlı değil'}</dd>
        <dt className="text-muted-foreground">Uzman hesabı</dt><dd>{row.specialist?.name ?? 'Doğrulanamadı'}</dd>
        {row.specialist && <><dt className="text-muted-foreground">Hesap numarası</dt><dd className="break-all font-mono text-xs">{row.specialist.userId}</dd></>}
        <dt className="text-muted-foreground">Sipariş / ödeme</dt><dd>{row.status} / {row.paymentStatus ?? 'Teyit yok'}</dd>
      </dl>
    </article>)}
  </div>;
  return <>
    <Button variant="outline" onClick={() => setOpen(true)}><ClipboardList className="mr-2 h-4 w-4" />Eski Sipariş İncelemesi</Button>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-3xl max-h-[85dvh] overflow-y-auto">
        <DialogHeader><DialogTitle>64 Eski Sipariş</DialogTitle><DialogDescription>Güncel hesap eşleşmesi geçmiş ödeme sahipliğini doğrulamaz. Belirsiz kayıtlar bağlanmaz.</DialogDescription></DialogHeader>
        {loading && <div className="h-32 animate-pulse bg-muted" />}
        {error && <p role="alert" className="text-destructive">{error}</p>}
        {receipt && <>
          {receipt.missingCount > 0 && <p role="alert" className="text-destructive">Kapsamdaki {receipt.missingCount} kayıt bulunamadı.</p>}
          <Tabs defaultValue="uncertain"><TabsList className="grid h-auto w-full grid-cols-2"><TabsTrigger value="uncertain" className="whitespace-normal">Belirsiz ({uncertain.length})</TabsTrigger><TabsTrigger value="matched" className="whitespace-normal">Kayıtlı e-posta eşleşmesi ({matched.length})</TabsTrigger></TabsList>
            <TabsContent value="uncertain">{list(uncertain)}</TabsContent><TabsContent value="matched">{list(matched)}</TabsContent>
          </Tabs>
        </>}
        <Button variant="outline" disabled={loading} onClick={() => setRefresh(v => v + 1)}><RefreshCw className="mr-2 h-4 w-4" />Yenile</Button>
      </DialogContent>
    </Dialog>
  </>;
}