import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { HEALTH_UNAVAILABLE, startTest, testDocuments, type Operation, type TestDocuments } from '@/lib/testSubmission';

export default function TestStartGate({ testId, specialistId, onReady }: {
  testId: string; specialistId: string | null; onReady: (operation: Operation) => void;
}) {
  const [documents, setDocuments] = useState<TestDocuments | null>(null);
  const [read, setRead] = useState(false);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);
  useEffect(() => {
    let active = true;
    setDocuments(null); setRead(false); setConsent(false); setError('');
    testDocuments(testId, specialistId).then(value => { if (active) setDocuments(value); })
      .catch(() => { if (active) setError(HEALTH_UNAVAILABLE); });
    return () => { active = false; };
  }, [testId, specialistId]);
  async function begin() {
    if (lock.current || !documents || !read || !consent) return;
    lock.current = true; setBusy(true); setError('');
    try { onReady(await startTest(testId, specialistId, documents, { disclosureRead: read, healthConsentGranted: consent })); }
    catch (cause) { setError(cause instanceof Error ? cause.message : HEALTH_UNAVAILABLE); }
    finally { lock.current = false; setBusy(false); }
  }
  return <section className="mx-auto max-w-2xl space-y-5 p-5">
    <h1 className="text-2xl font-semibold">Test öncesi bilgilendirme</h1>
    {!documents && !error && <div className="h-32 animate-pulse rounded-md bg-muted" />}
    {documents && <>
      <h2 className="text-lg font-medium">{documents.testTitle}</h2>
      <p className="text-muted-foreground">İlgili uzman: {documents.specialistName}</p>
      <div className="max-h-72 overflow-y-auto whitespace-pre-wrap border border-border p-4">{documents.disclosure}</div>
      <Label className="flex items-start gap-3"><Checkbox checked={read} onCheckedChange={value => setRead(value === true)} />Aydınlatma metnini okudum.</Label>
      <div className="max-h-72 overflow-y-auto whitespace-pre-wrap border border-border p-4">{documents.consent}</div>
      <Label className="flex items-start gap-3"><Checkbox checked={consent} onCheckedChange={value => setConsent(value === true)} />
        Yalnız bu test hizmeti için sağlık verilerimin işlenmesine, yanıt ve sonuçlarımın saklanmasına ve yukarıda belirtilen yetkili uzmanla paylaşılmasına açık rıza veriyorum.
      </Label>
      <p className="text-sm text-muted-foreground">Bu izin üyelik, pazarlama veya yurt dışı aktarım izni değildir. İzin vermemeniz diğer platform hizmetlerini kullanmanıza engel olmaz.</p>
    </>}
    {error && <p role="alert" className="text-destructive">{error}</p>}
    <div className="flex flex-wrap gap-3">
      <Button disabled={!documents || !read || !consent || busy} onClick={begin}>{busy ? 'Doğrulanıyor…' : 'İzin Ver ve Teste Başla'}</Button>
      <Button variant="outline" asChild><a href="/uzmanlar">İzin Vermeden Devam Et</a></Button>
    </div>
  </section>;
}