import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ManualOrderApproval({ orderId, customerName, customerEmail }: { orderId: string; customerName: string; customerEmail: string }) {
  const { toast } = useToast();
  const cache = useQueryClient();
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState('');
  const [notice, setNotice] = useState('');
  useEffect(() => { setReason(''); setNotice(''); }, [orderId]);
  const approval = useQuery({ queryKey: ['manual_order_approval', orderId], queryFn: async () => {
    const { data, error } = await supabase.from('order_manual_approvals').select('active,approved_at,reason').eq('order_id', orderId).maybeSingle();
    if (error) throw error;
    return data;
  } });
  const apply = async (action: 'approve' | 'pending') => {
    if (lock.current || reason.trim().length < 5) return;
    lock.current = true; setBusy(true); setNotice('');
    try {
      const { data, error } = await supabase.functions.invoke('manual-order-approval', { body: { orderId, action, reason: reason.trim() } });
      if (error || data?.success !== true) {
        const detail = error?.context instanceof Response ? await error.context.json().catch(() => null) : data;
        throw new Error(detail?.error || 'Manuel onay kaydedilemedi');
      }
      const text = action === 'pending' ? 'Sipariş beklemede; profil yayında kalır. Gönderilen e-posta geri alınmaz.'
        : data.duplicate ? 'Manuel onay zaten kayıtlı; yeni e-posta gönderilmedi.'
        : data.documents?.success ? data.documents.currentInformationOnly ? 'Manuel onay kaydedildi; yalnız güncel ön bilgilendirme gönderildi, arşivlenmiş sözleşme yok.' : 'Manuel onay kaydedildi; kayıtlı belgeler gönderildi.'
        : 'Manuel onay kaydedildi; belge teslimi doğrulanamadı. Yeniden göndermeden teslim durumunu kontrol edin.';
      setNotice(text); toast({ title: action === 'approve' ? 'Manuel onay kaydedildi' : 'Beklemeye alındı', description: text });
      await cache.invalidateQueries({ queryKey: ['manual_order_approval'] });
      await cache.invalidateQueries({ queryKey: ['manual_order_approvals'] });
      await cache.invalidateQueries({ queryKey: ['orders'] });
    } catch (cause) {
      const text = cause instanceof Error ? cause.message : 'İşlem doğrulanamadı';
      setNotice(text); toast({ title: 'İşlem yapılamadı', description: text, variant: 'destructive' });
    } finally { lock.current = false; setBusy(false); }
  };
  return <section className="md:col-span-2 space-y-3 border-t border-border pt-4">
    <div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">Manuel Onay — Ödeme Alınmadı</h3>{approval.data?.active && <Badge variant="secondary">Manuel onaylı · Ödeme bekliyor</Badge>}</div>
    <p className="text-sm break-words">{customerName} · {customerEmail}</p>
    <p className="text-sm text-muted-foreground">Profil yayımlanır. Ödeme alınmış sayılmaz; fatura ve ödenmiş ay kaydı oluşmaz.</p>
    <Label htmlFor="manual-order-reason">İşlem gerekçesi</Label>
    <Textarea id="manual-order-reason" value={reason} maxLength={1000} onChange={event => setReason(event.target.value)} disabled={busy} />
    <div className="flex flex-wrap gap-2">
      {approval.data?.active ? <Button type="button" variant="outline" disabled={busy || reason.trim().length < 5} onClick={() => apply('pending')}><RotateCcw className="mr-2 h-4 w-4" />Beklemeye Al</Button>
        : <Button type="button" disabled={busy || approval.isLoading || approval.isError || reason.trim().length < 5} onClick={() => apply('approve')}><CheckCircle className="mr-2 h-4 w-4" />{busy ? 'Kaydediliyor…' : 'Manuel Onay Ver'}</Button>}
    </div>
    {approval.isError && <p className="text-sm text-destructive">Manuel onay durumu okunamadı.</p>}
    {notice && <p role="status" className="text-sm break-words">{notice}</p>}
  </section>;
}