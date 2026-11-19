import { useEffect, useRef, useState } from 'react';
import { ShieldCheck, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { APPOINTMENT_PHONE_ENABLED, phoneRequest } from '@/lib/appointmentPhone';

export function AppointmentPhoneVerification({phone,name,email,onVerified}:{phone:string;name:string;email:string;onVerified:(proof:string)=>void}) {
 const [challenge,setChallenge]=useState(''),[code,setCode]=useState(''),[verified,setVerified]=useState(false);
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[retryAt,setRetryAt]=useState(0),[now,setNow]=useState(Date.now());
 const generation=useRef(0),lock=useRef(false);
 useEffect(()=>{generation.current+=1;setChallenge('');setCode('');setVerified(false);onVerified('');},[phone,name,email]);
 useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(timer);},[]);
 if(!APPOINTMENT_PHONE_ENABLED) return null;
 const run=async()=>{
  if(lock.current) return;lock.current=true;setBusy(true);setError('');const version=generation.current;
  try {
   if(!challenge){const result=await phoneRequest({action:'send',phone,name,email});
    if(version!==generation.current)return;
    if(!result.challengeId)throw new Error('Kod gönderimi doğrulanamadı.');setChallenge(result.challengeId);setRetryAt(Date.now()+60000);
   }else{const result=await phoneRequest({action:'verify',challengeId:challenge,code});
    if(version!==generation.current)return;
    if(!result.proof)throw new Error('Telefon doğrulanamadı.');setVerified(true);onVerified(result.proof);
   }
  }catch(e){setError(e instanceof Error?e.message:'İşlem tamamlanamadı.');}
  finally{lock.current=false;setBusy(false);}
 };
 return <div className="space-y-3 border-t border-border pt-3">
  {verified?<p className="flex items-center gap-2 text-primary"><ShieldCheck className="h-4 w-4"/>Telefon doğrulandı</p>:<>
   {challenge&&<div className="space-y-2"><Label htmlFor="appointment-phone-code">SMS doğrulama kodu</Label><Input id="appointment-phone-code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,''))} placeholder="6 haneli kod"/></div>}
   <Button type="button" variant="outline" onClick={run} disabled={busy || !phone || !name || !email || (!!challenge&&code.length!==6)}><Send className="mr-2 h-4 w-4"/>{busy?'Bekleyin…':challenge?'Telefonu doğrula':'SMS kodu gönder'}</Button>
   {challenge&&<Button type="button" variant="ghost" disabled={busy||now<retryAt} onClick={()=>{setChallenge('');setCode('');}}>{now<retryAt?`${Math.ceil((retryAt-now)/1000)} sn`:'Yeni kod iste'}</Button>}
  </>}
  {error&&<p role="alert" className="text-sm text-destructive">{error}</p>}
 </div>;
}