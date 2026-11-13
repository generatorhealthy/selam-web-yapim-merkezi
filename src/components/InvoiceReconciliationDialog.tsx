import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ExternalLink, RefreshCw } from 'lucide-react';
import { z } from 'zod';

const receiptSchema = z.object({
  orderId: z.string().uuid(), exportReference: z.string(), orderCode: z.string(),
  state: z.enum(['confirmed', 'review_required', 'payment_not_approved', 'not_queued']),
  invoiceNumber: z.string().nullable(), issuedAt: z.string().nullable(),
  providerLookupSupported: z.literal(false), retryAllowed: z.literal(false), paymentStatus: z.string(),
});
type Receipt = z.infer<typeof receiptSchema>;
const states = {
  confirmed: 'Fatura teyidi kayıtlı', review_required: 'Manuel mutabakat bekliyor',
  payment_not_approved: 'Ödeme onaylanmamış', not_queued: 'Aktarım kuyruğunda değil',
};

export default function InvoiceReconciliationDialog({ orderId, onClose }: { orderId: string | null; onClose: () => void }) {
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    if (!orderId) return;
    let cancelled = false;
    setReceipt(null); setError(''); setLoading(true);
    supabase.functions.invoke('birfatura-manual-reconciliation', { body: { orderId } }).then(({ data, error: requestError }) => {
      if (cancelled) return;
      const parsed = receiptSchema.safeParse(data);
      if (requestError || !parsed.success || parsed.data.orderId !== orderId) {
        setError('Fatura durumu doğrulanamadı. Yeni fatura gönderilmedi.');
      } else setReceipt(parsed.data);
    }).catch(() => { if (!cancelled) setError('Fatura durumu alınamadı. Yeni fatura gönderilmedi.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [orderId, refresh]);
  return <Dialog open={!!orderId} onOpenChange={open => { if (!open) onClose(); }}>
    <DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>BirFatura Mutabakatı</DialogTitle>
        <DialogDescription>Fatura teyidi ödeme durumundan bağımsızdır.</DialogDescription>
      </DialogHeader>
      {loading && <div className="h-20 animate-pulse bg-muted" />}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {receipt && <div className="space-y-4 text-sm">
        <p className="font-semibold">{states[receipt.state]}</p>
        <dl className="grid grid-cols-1 gap-2 break-all">
          <dt className="text-muted-foreground">Sipariş</dt><dd>{receipt.orderId}</dd>
          <dt className="text-muted-foreground">BirFatura sipariş kodu</dt><dd>{receipt.orderCode}</dd>
          <dt className="text-muted-foreground">Fatura numarası</dt><dd>{receipt.invoiceNumber ?? 'Teyit alınmadı'}</dd>
          {receipt.state === 'confirmed' && receipt.issuedAt && <><dt className="text-muted-foreground">Fatura tarihi</dt><dd>{new Date(receipt.issuedAt).toLocaleString('tr-TR')}</dd></>}
        </dl>
        {receipt.state !== 'confirmed' && <>
          <p>BirFatura panelinde bu sipariş koduyla kayıtlı fatura ve aktarım durumunu kontrol edin.</p>
          <p>Fatura varsa numara ve tarihi BirFatura’nın mevcut teyit kanalıyla iletilmelidir. Sonuç belirsizse yeniden fatura oluşturmayın.</p>
          <p className="text-muted-foreground">Bu bağlantı üzerinden otomatik fatura sorgusu ve güvenli yeniden gönderim mevcut değildir.</p>
        </>}
      </div>}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" disabled={loading} onClick={() => setRefresh(v => v + 1)}><RefreshCw className="mr-2 h-4 w-4" />Teyidi kontrol et</Button>
        <Button variant="outline" asChild><a href="https://birfatura.com/" target="_blank" rel="noopener noreferrer"><ExternalLink className="mr-2 h-4 w-4" />BirFatura</a></Button>
      </div>
    </DialogContent>
  </Dialog>;
}