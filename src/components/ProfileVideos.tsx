import {useEffect,useRef,useState} from 'react';
import {Film,Plus,Trash2,Loader2} from 'lucide-react';
import {FunctionsHttpError} from '@supabase/supabase-js';
import {supabase} from '@/integrations/supabase/client';
import {Button} from '@/components/ui/button';
import {useToast} from '@/hooks/use-toast';
type Video={id:string;url:string;created_at:string;moderation_status?:string};
async function request(body:Record<string,unknown>){
 const {data,error}=await supabase.functions.invoke('profile-videos',{body});
 if(error){let message='Video işlemi tamamlanamadı';if(error instanceof FunctionsHttpError){try{message=(await error.context.json()).error||message;}catch{/* empty */}}throw new Error(message);}
 return data;
}
export default function ProfileVideos({specialistId,editable=false,poster}:{specialistId:string;editable?:boolean;poster?:string}){
 const [videos,setVideos]=useState<Video[]>([]),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const input=useRef<HTMLInputElement>(null),lock=useRef(false);const {toast}=useToast();
 const load=async()=>{try{const data=await request({action:editable?'mine':'list',specialistId});setVideos(data.videos||[]);setError('');}catch(e){setError(e instanceof Error?e.message:'Videolar yüklenemedi');}finally{setLoading(false);}};
 useEffect(()=>{setVideos([]);setLoading(true);void load();},[specialistId,editable]);
 const fail=(e:unknown)=>toast({title:'Video işlemi tamamlanamadı',description:e instanceof Error?e.message:'Tekrar deneyin',variant:'destructive'});
 const upload=async(file:File)=>{
  if(lock.current)return;lock.current=true;setBusy(true);
  try{
   if(file.size>50*1024*1024)throw new Error('Video en fazla 50 MB olabilir');
   const mime=file.type||(/\.mov$/i.test(file.name)?'video/quicktime':'');
   const ticket=await request({action:'upload',specialistId,filename:file.name,mime,size:file.size});
   const {error}=await supabase.storage.from('profile-videos').uploadToSignedUrl(ticket.path,ticket.token,file,{contentType:mime});if(error)throw new Error('Yükleme tamamlanamadı');
   await request({action:'finalize',videoId:ticket.videoId});await load();toast({title:'Video onaya gönderildi',description:'Yönetici onayından sonra profilinizde yayımlanacak.'});
  }catch(e){fail(e);}finally{setBusy(false);lock.current=false;if(input.current)input.current.value='';}
 };
 const remove=async(video:Video)=>{if(lock.current||!window.confirm('Bu videoyu profilinizden kaldırmak istiyor musunuz?'))return;lock.current=true;setBusy(true);try{await request({action:'delete',videoId:video.id});await load();}catch(e){fail(e);}finally{setBusy(false);lock.current=false;}};
 return <section className="mt-6 border-t border-border pt-6" aria-label="Profil videoları">
  <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><h3 className="flex items-center gap-2 text-lg font-semibold text-foreground"><Film className="h-5 w-5 text-primary"/>Videolar {editable&&<span className="text-sm font-normal text-muted-foreground">{videos.length}/6</span>}</h3>{editable&&<Button type="button" variant="outline" disabled={busy||loading||videos.length>=6} onClick={()=>input.current?.click()}><Plus className="mr-2 h-4 w-4"/>Video ekle</Button>}</div>
  {editable&&<><input ref={input} hidden type="file" accept="video/mp4,video/webm,video/quicktime,.mov" onChange={e=>{const file=e.target.files?.[0];if(file)void upload(file);}}/><p className="mb-5 text-sm text-muted-foreground">En fazla 6 video · MP4, MOV, WebM · Video başına 50 MB</p></>}
  {busy&&<p role="status" className="mb-4 flex items-center gap-2 text-sm text-primary"><Loader2 className="h-4 w-4 animate-spin"/>Video işleniyor…</p>}
  {loading?<div className="aspect-video max-w-sm animate-pulse rounded-lg bg-muted"/>:error?<p className="text-sm text-muted-foreground">{error}</p>:videos.length===0?<div className="flex items-center gap-3 rounded-lg border border-dashed border-border bg-muted/30 px-5 py-7"><Film className="h-8 w-8 shrink-0 text-muted-foreground"/><p className="text-sm text-muted-foreground">Henüz video eklenmedi.</p></div>:<div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">{videos.map((video,i)=><figure key={video.id} className="overflow-hidden rounded-lg border border-border bg-card"><video src={video.url} poster={poster} controls playsInline preload="metadata" className="aspect-[4/5] w-full bg-muted object-contain"/><figcaption className="flex items-center justify-between gap-2 px-4 py-3"><div><span className="text-sm font-medium text-foreground">Video {i+1}</span>{editable&&<p className="text-xs text-muted-foreground">{video.moderation_status==='approved'?'Yayında':video.moderation_status==='rejected'?'Reddedildi':'Onay bekliyor'}</p>}</div>{editable&&<Button type="button" variant="ghost" size="icon" title="Videoyu sil" aria-label={`Video ${i+1} sil`} disabled={busy} onClick={()=>void remove(video)}><Trash2 className="h-4 w-4 text-destructive"/></Button>}</figcaption></figure>)}</div>}
 </section>;
}