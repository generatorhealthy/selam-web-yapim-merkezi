import {useEffect,useRef,useState} from 'react';
import {Link} from 'react-router-dom';
import {Helmet} from 'react-helmet-async';
import {Film,Upload,Download,ExternalLink,ArrowLeft,LogOut,RefreshCw,Search} from 'lucide-react';
import {supabase} from '@/integrations/supabase/client';
import {FunctionsHttpError} from '@supabase/supabase-js';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Dialog,DialogContent,DialogHeader,DialogTitle} from '@/components/ui/dialog';
import {useUserRole} from '@/hooks/useUserRole';
import {createSpecialtySlug} from '@/utils/doctorUtils';
import {useToast} from '@/hooks/use-toast';

type Job={id:string;name:string;profile_picture:string|null;slug:string;specialty:string;video_count:number;notice_status:string|null};
type Video={id:string;created_at:string;byte_size:number;mime_type:string};
async function api(body:Record<string,unknown>){
 const {data,error}=await supabase.functions.invoke('reels-api',{body});
 if(error){let message='İşlem tamamlanamadı';if(error instanceof FunctionsHttpError){try{message=(await error.context.json()).error||message;}catch{/* no response */}}throw new Error(message);}
 return data;
}
export default function ReelsVideos(){
 const {userProfile}=useUserRole();const admin=userProfile?.role==='admin';
 const [jobs,setJobs]=useState<Job[]>([]),[busy,setBusy]=useState(false),[search,setSearch]=useState(''),[query,setQuery]=useState(''),[more,setMore]=useState(false);
 const [selected,setSelected]=useState<Job|null>(null),[videos,setVideos]=useState<Video[]>([]),[uploading,setUploading]=useState(false),[playing,setPlaying]=useState('');
 const input=useRef<HTMLInputElement>(null);const lock=useRef(false);const {toast}=useToast();const generation=useRef(0);
 const fail=(e:unknown)=>toast({title:'İşlem tamamlanamadı',description:e instanceof Error?e.message:'Lütfen tekrar deneyin',variant:'destructive'});
 const load=async(append=false)=>{const g=++generation.current;setBusy(true);try{const data=await api({action:'list',offset:append?jobs.length:0,search:query});if(g!==generation.current)return;setJobs(prev=>append?[...prev,...data.jobs]:data.jobs);setMore(data.jobs.length===30);}catch(e){fail(e);}finally{if(g===generation.current)setBusy(false);}};
 useEffect(()=>{void load();},[query]);
 const open=async(job:Job)=>{setSelected(job);setVideos([]);setPlaying('');try{const data=await api({action:'videos',jobId:job.id});setVideos(data.videos);}catch(e){fail(e);}};
 const upload=async(file:File)=>{
  if(!selected||lock.current)return;lock.current=true;setUploading(true);const job=selected;
  try{
   if(file.size>50*1024*1024)throw new Error('Video en fazla 50 MB olabilir');
   const mime=file.type||(/\.mov$/i.test(file.name)?'video/quicktime':'');
   if(!['video/mp4','video/quicktime','video/webm'].includes(mime))throw new Error('Yalnız MP4, MOV veya WebM video yükleyebilirsiniz');
   const ticket=await api({action:'upload',jobId:job.id,filename:file.name,mime,size:file.size});
   const {error}=await supabase.storage.from('reels-videos').uploadToSignedUrl(ticket.path,ticket.token,file,{contentType:mime});
   if(error)throw new Error('Video yüklenemedi');
   await api({action:'finalize',uploadId:ticket.uploadId});
   toast({title:'Video yüklendi'});await open(job);void load();
  }catch(e){fail(e);}finally{setUploading(false);lock.current=false;if(input.current)input.current.value='';}
 };
 const videoUrl=async(v:Video,download=false)=>{try{const data=await api({action:'url',videoId:v.id,download});if(download){window.open(data.url,'_blank','noopener,noreferrer');}else setPlaying(data.url);}catch(e){fail(e);}};
 return <main className="min-h-screen bg-background text-foreground">
  <Helmet><title>Reels Videoları | Doktorum Ol</title><meta name="robots" content="noindex,nofollow"/></Helmet>
  <header className="border-b border-border"><div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-5 sm:px-8">
   <div className="flex min-w-0 items-center gap-3"><Film className="h-7 w-7 shrink-0 text-primary"/><div><h1 className="text-2xl font-semibold">Reels Videoları</h1><p className="text-sm text-muted-foreground">{admin?'Divan Paneli':'Sosyal Medya Ekibi'}</p></div></div>
   <div className="flex gap-2"><Button asChild variant="outline" size="icon" title="Panele dön"><Link to="/divan_paneli/dashboard"><ArrowLeft className="h-4 w-4"/></Link></Button><Button variant="outline" size="icon" title="Çıkış yap" onClick={()=>void supabase.auth.signOut()}><LogOut className="h-4 w-4"/></Button></div>
  </div></header>
  <section className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
   <form className="mb-8 flex gap-2" onSubmit={e=>{e.preventDefault();setQuery(search.trim());}}><Input aria-label="Uzman ara" placeholder="Uzman adı ara" value={search} onChange={e=>setSearch(e.target.value)} className="max-w-md"/><Button type="submit" size="icon" title="Ara"><Search className="h-4 w-4"/></Button><Button type="button" variant="outline" size="icon" title="Yenile" disabled={busy} onClick={()=>void load()}><RefreshCw className="h-4 w-4"/></Button></form>
   {busy&&jobs.length===0?<div className="grid grid-cols-2 gap-5 md:grid-cols-4">{Array.from({length:8},(_,i)=><div key={i} className="aspect-[3/4] animate-pulse rounded-lg bg-muted"/>)}</div>:<div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">{jobs.map(job=><article key={job.id} className="overflow-hidden rounded-lg border border-border bg-card">
    <Button variant="ghost" className="block h-auto w-full rounded-none p-0" onClick={()=>void open(job)} aria-label={`${job.name} videoları`}><div className="aspect-[4/3] overflow-hidden bg-muted">{job.profile_picture?<img src={job.profile_picture} alt={job.name} className="h-full w-full object-cover" loading="lazy"/>:<div className="flex h-full items-center justify-center"><Film className="h-12 w-12 text-muted-foreground"/></div>}</div></Button>
    <div className="p-4"><h2 className="break-words text-lg font-semibold">{job.name}</h2><p className="mb-4 text-sm text-muted-foreground">{job.video_count} video</p><div className="flex items-center justify-between gap-2"><Button variant="outline" size="sm" onClick={()=>void open(job)}><Upload className="mr-2 h-4 w-4"/>Videolar</Button><Button asChild variant="ghost" size="icon" title="Uzman profili"><a href={`/${createSpecialtySlug(job.specialty)}/${job.slug}`} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4"/></a></Button></div></div>
   </article>)}</div>}
   {!busy&&jobs.length===0&&<p className="py-12 text-center text-muted-foreground">Uzman bulunamadı.</p>}
   {more&&<div className="mt-8 text-center"><Button variant="outline" disabled={busy} onClick={()=>void load(true)}>{busy?'Yükleniyor…':'Daha fazla'}</Button></div>}
  </section>
  <Dialog open={Boolean(selected)} onOpenChange={open=>{if(!open&&!uploading){setSelected(null);setPlaying('');}}}><DialogContent className="max-h-[90dvh] max-w-3xl overflow-y-auto"><DialogHeader><DialogTitle className="break-words pr-6">{selected?.name}</DialogTitle></DialogHeader>
   <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-muted-foreground">MP4 · MOV · WebM / En fazla 50 MB</p><Button disabled={uploading} onClick={()=>input.current?.click()}><Upload className="mr-2 h-4 w-4"/>{uploading?'Yükleniyor ve doğrulanıyor…':'Video yükle'}</Button><input ref={input} type="file" accept="video/mp4,video/quicktime,video/webm,.mov" hidden onChange={e=>{const f=e.target.files?.[0];if(f)void upload(f);}}/></div>
   {playing&&<video src={playing} controls playsInline className="aspect-video w-full rounded-lg bg-muted"/>}
   <div className="divide-y divide-border">{videos.map(v=><div key={v.id} className="flex flex-wrap items-center justify-between gap-3 py-4"><div className="flex items-center gap-3"><Film className="h-5 w-5 text-primary"/><div><p className="font-medium">{new Date(v.created_at).toLocaleDateString('tr-TR')}</p><p className="text-sm text-muted-foreground">{(v.byte_size/1024/1024).toFixed(1)} MB</p></div></div><div className="flex gap-2"><Button variant="outline" size="sm" onClick={()=>void videoUrl(v)}>İzle</Button>{admin&&<Button variant="outline" size="icon" title="Videoyu indir" onClick={()=>void videoUrl(v,true)}><Download className="h-4 w-4"/></Button>}</div></div>)}</div>
   {videos.length===0&&<p className="py-6 text-center text-muted-foreground">Henüz video yüklenmedi.</p>}
  </DialogContent></Dialog>
 </main>;
}