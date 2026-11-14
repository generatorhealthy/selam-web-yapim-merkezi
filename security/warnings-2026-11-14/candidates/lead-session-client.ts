/** Only new server-issued session/secret pairs; never adopts old localStorage session ids. */
export function leadSessionClient(store:{getItem:(k:string)=>string|null;setItem:(k:string,v:string)=>void},issue:()=>Promise<{session_id:string;token:string}>) {
 let pending:Promise<{session_id:string;token:string}>|undefined;
 const key='dko_verified_lead_session_v1';
 return async()=>{
  let cached:any;try{cached=JSON.parse(store.getItem(key)??'null');}catch{}
  if(cached&&/^ls_[0-9a-f-]{36}$/i.test(cached.session_id)&&/^[0-9a-f]{64}$/.test(cached.token))return cached;
  if(!pending)pending=issue().then(pair=>{
   if(!/^ls_[0-9a-f-]{36}$/i.test(pair.session_id)||!/^[0-9a-f]{64}$/.test(pair.token))throw new Error('invalid_session');
   store.setItem(key,JSON.stringify(pair));return pair;
  }).finally(()=>{pending=undefined;});
  return pending;
 };
}
