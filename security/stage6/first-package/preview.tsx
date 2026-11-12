// Dev-only isolated fixture: no Supabase, notification or app entry import.
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import '../../../src/index.css';
import { Button } from '../../../src/components/ui/button';
import { ConsentFields } from './ConsentFields';
import { appointmentData } from './policy';
function Preview() {
  const [testConsent,setTestConsent] = useState(false);
  const [appointmentConsent,setAppointmentConsent] = useState(false);
  const [result,setResult] = useState('');
  return <main className="mx-auto max-w-2xl space-y-8 p-6 text-foreground bg-background">
    <h1 className="text-2xl font-semibold">İzin ekranları — yayımlanmamış taslak</h1>
    <section className="space-y-4"><h2 className="text-xl font-semibold">Psikolojik değerlendirme</h2>
      <ConsentFields purpose="test" checked={testConsent} onChange={setTestConsent} />
      <Button disabled={!testConsent} onClick={()=>setResult('Sentetik test tercihi alındı; sunucuya veri gönderilmedi.')}>Değerlendirmeye başla</Button></section>
    <section className="space-y-4"><h2 className="text-xl font-semibold">Randevu talebi</h2>
      <ConsentFields purpose="appointment" checked={appointmentConsent} onChange={setAppointmentConsent} />
      <Button variant="outline" onClick={()=>{ const p=appointmentData({patient_name:'Sentetik kişi'},{notes:'Sentetik sağlık açıklaması',topic:'Sentetik destek'},appointmentConsent);setResult(p.notes ? 'Sentetik sağlık açıklaması seçildi; sunucuya veri gönderilmedi.' : 'Genel randevu: sağlık açıklaması ve destek türü çıkarıldı; sunucuya veri gönderilmedi.'); }}>Genel randevu talebini sürdür</Button></section>
    <output className="block text-sm text-muted-foreground" aria-live="polite">{result}</output>
  </main>;
}
const root = document.getElementById('draft-root');
if (root) createRoot(root).render(<Preview />);