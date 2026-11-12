import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { withdrawTestConsent, type Operation } from '@/lib/testSubmission';
export default function TestConsentControl({ operation, onWithdraw }: { operation: Operation; onWithdraw: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function withdraw() {
    if (busy) return;
    setBusy(true);
    try { await withdrawTestConsent(operation); onWithdraw(); }
    catch { setError('İzniniz geri alınamadı. Yanıtlarınız korunuyor; lütfen tekrar deneyin.'); }
    finally { setBusy(false); }
  }
  return <div className="mx-auto max-w-2xl space-y-2 px-5 py-3">
    <Button variant="outline" disabled={busy} onClick={withdraw}>{busy ? 'İşleniyor…' : 'Test İznimi Geri Al'}</Button>
    {error && <p role="alert" className="text-destructive">{error}</p>}
  </div>;
}