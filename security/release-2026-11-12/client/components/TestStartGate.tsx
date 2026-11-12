// Release-only gate: no questions or patient inputs are mounted before server authorization.
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { startTest, testDocuments, type Operation } from '@/lib/testSubmission';
export default function TestStartGate({testId,specialistId,onReady}:{testId:string;specialistId:string|null;onReady:(op:Operation)=>void}){
 const [docs,setDocs]=useState<{disclosure:string;consent:string;captchaSiteKey:string|null}|null>(null);
 const [shown,setShown]=useState(false);const [allowed,setAllowed]=useState(false);
 const [captcha,setCaptcha]=useState('');const [busy,setBusy]=useState(false);const [error,setError]=useState('');const lock=useRef(false);
 const widget=useRef<HTMLDivElement|null>(null);
 useEffect(()=>{let active=true;testDocuments().then(d=>{if(active)setDocs(d);}).catch(()=>{if(active)setError('Bilgilendirme şu anda alınamıyor.');});return()=>{active=false;};},[]);
 useEffect(()=>{
  if(!docs?.captchaSiteKey||!widget.current)return;
  const script=document.createElement('script');script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';script.async=true;
  let id:string|undefined;
  type Turnstile={render:(element:HTMLElement,opts:Record<string,unknown>)=>string;remove:(id:string)=>void};
  const api=()=> (window as unknown as {turnstile?:Turnstile}).turnstile;
  script.onload=()=>{if(widget.current)id=api()?.render(widget.current,{sitekey:docs.captchaSiteKey,action:'test_prepare',callback:(token:string)=>setCaptcha(token),'expired-callback':()=>setCaptcha(''),'error-callback':()=>setCaptcha('')});};
  document.head.appendChild(script);return()=>{if(id)api()?.remove(id);script.remove();};
 },[docs?.captchaSiteKey]);
 async function begin(){if(lock.current||!docs||!shown||!allowed)return;lock.current=true;setBusy(true);setError('');
  try{onReady(await startTest(testId,specialistId,captcha));}catch{setError('Teste başlanamadı. Lütfen doğrulamayı yenileyin.');}finally{lock.current=false;setBusy(false);}
 }
 return <section className="mx-auto max-w-2xl space-y-5 p-5">
  <h1 className="text-2xl font-semibold">Test öncesi bilgilendirme</h1>
  {docs&&<><div className="max-h-72 overflow-y-auto whitespace-pre-wrap border border-border p-4">{docs.disclosure}</div>
  <Label className="flex items-start gap-2"><Checkbox checked={shown} onCheckedChange={v=>setShown(v===true)}/>Aydınlatma metnini okudum.</Label>
  <div className="max-h-72 overflow-y-auto whitespace-pre-wrap border border-border p-4">{docs.consent}</div>
  <Label className="flex items-start gap-2"><Checkbox checked={allowed} onCheckedChange={v=>setAllowed(v===true)}/>Bu test kapsamında sağlık verilerimin işlenmesine ve ilgili yetkili uzmanla paylaşılmasına açık rıza veriyorum.</Label></>}
  <div ref={widget}/>
  {error&&<p role="alert" className="text-destructive">{error}</p>}
  <Button disabled={!docs||!shown||!allowed||busy} onClick={begin}>Teste Başla</Button>
 </section>;
}