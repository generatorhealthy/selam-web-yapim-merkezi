/** Only new server-issued session/secret pairs; never adopts old localStorage session ids. */
export function leadSessionClient(store:{getItem:(k:string)=>string|null;setItem:(k:string,v:string)=>void},issue:()=>Promise<{session_id:string;token:string;expires_at?:string}>, now:()=>number = Date.now) {
 let pending:Promise<{session_id:string;token:string}>|undefined;
 const key='dko_verified_lead_session_v1';
 return async()=>{
  let cached:any;try{cached=JSON.parse(store.getItem(key)??'null');}catch{}
  if(cached&&/^ls_[0-9a-f-]{36}$/i.test(cached.session_id)&&/^[0-9a-f]{64}$/.test(cached.token)&&Number.isFinite(Date.parse(cached.expires_at))&&Date.parse(cached.expires_at)>now()+60000)return cached;
  if(!pending)pending=issue().then(pair=>{
   if(!/^ls_[0-9a-f-]{36}$/i.test(pair.session_id)||!/^[0-9a-f]{64}$/.test(pair.token))throw new Error('invalid_session');
   const cachedPair={...pair,expires_at:pair.expires_at??new Date(now()+29*86400000).toISOString()};
   store.setItem(key,JSON.stringify(cachedPair));return cachedPair;
  }).finally(()=>{pending=undefined;});
  return pending;
 };
}
