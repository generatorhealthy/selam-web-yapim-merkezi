import {useEffect,useRef,useState} from 'react';
import {Check,Film,X,RefreshCw} from 'lucide-react';
import {FunctionsHttpError} from '@supabase/supabase-js';
import {supabase} from '@/integrations/supabase/client';
import {Button} from '@/components/ui/button';
import {useToast} from '@/hooks/use-toast';
type ReviewVideo={id:string;url:string;filename:string;specialists:{name:string;profile_picture?:string}|null};
async function request(body:Record<string,unknown>){
 const {data,error}=await supabase.functions.invoke('profile-videos',{body});
 if(error){let message='Videolar alınamadı';if(error instanceof FunctionsHttpError){try{message=(await error.context.json()).error||message;}catch{/* no body */}}throw new Error(message);}return data;
}
export default function ProfileVideoReview(){
 const [videos,setVideos]=useState<ReviewVideo[]>([]),[total,setTotal]=useState(0),[offset,setOffset]=useState(0),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const lock=useRef(false);const {toast}=useToast();
 const load=async(start=offset)=>{setLoading(true);try{const data=await request({action:'review-list',offset:start});setVideos(data.videos||[]);setTotal(data.total||0);setOffset(start);setError('');}catch(e){setError(e instanceof Error?e.message:'Videolar alınamadı');}finally{setLoading(false);}};
 useEffect(()=>{void load(0);},[]);
 const review=async(video:ReviewVideo,decision:'approved'|'rejected')=>{if(lock.current||!window.confirm(decision==='approved'?'Bu video uzman profilinde yayımlansın mı?':'Bu videoyu reddetmek istiyor musunuz?'))return;lock.current=true;setBusy(true);try{await request({action:'review',videoId:video.id,decision});toast({title:decision==='approved'?'Video onaylandı':'Video reddedildi'});await load(videos.length===1?Math.max(0,offset-20):offset);}catch(e){toast({title:'İşlem tamamlanamadı',description:e instanceof Error?e.message:'Tekrar deneyin',variant:'destructive'});}finally{setBusy(false);lock.current=false;}};
 return <section className="mb-8 border-y border-border py-6" aria-label="Onay bekleyen videolar">
  <div className="mb-5 flex items-center justify-between gap-3"><h2 className="flex items-center gap-2 text-xl font-semibold text-foreground"><Film className="h-5 w-5 text-primary"/>Onay Bekleyen Videolar <span className="text-sm text-muted-foreground">({total})</span></h2><Button variant="outline" size="icon" aria-label="Videoları yenile" title="Yenile" disabled={loading||busy} onClick={()=>void load()}><RefreshCw className="h-4 w-4"/></Button></div>
  {loading?<div className="h-24 animate-pulse rounded-lg bg-muted"/>:error?<p role="alert" className="text-sm text-destructive">{error}</p>:!videos.length?<p className="text-sm text-muted-foreground">Onay bekleyen video bulunmuyor.</p>:<div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{videos.map(video=><figure key={video.id} className="overflow-hidden rounded-lg border border-border bg-card"><div className="flex items-center gap-3 p-4">{video.specialists?.profile_picture&&<img src={video.specialists.profile_picture} alt="" className="h-10 w-10 rounded-full object-cover"/>}<p className="min-w-0 break-words font-medium text-foreground">{video.specialists?.name||'Uzman'}</p></div><video src={video.url} controls playsInline preload="none" className="aspect-video w-full bg-muted object-contain"/><figcaption className="p-4"><p className="mb-3 truncate text-sm text-muted-foreground">{video.filename}</p><div className="flex flex-wrap gap-2"><Button disabled={busy} onClick={()=>void review(video,'approved')}><Check className="mr-2 h-4 w-4"/>Onayla</Button><Button variant="outline" disabled={busy} onClick={()=>void review(video,'rejected')}><X className="mr-2 h-4 w-4"/>Reddet</Button></div></figcaption></figure>)}</div>}
  {total>20&&<div className="mt-5 flex items-center justify-end gap-3"><Button variant="outline" disabled={!offset||loading||busy} onClick={()=>void load(offset-20)}>Önceki</Button><span className="text-sm text-muted-foreground">{offset+1}–{Math.min(offset+20,total)} / {total}</span><Button variant="outline" disabled={offset+20>=total||loading||busy} onClick={()=>void load(offset+20)}>Sonraki</Button></div>}
 </section>;
}