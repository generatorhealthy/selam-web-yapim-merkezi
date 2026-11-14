export type LeadPorts = {
  issue: () => Promise<{session_id:string;token:string}>;
  verify: (session:string,token:string) => Promise<boolean>;
  event: (session:string,input:Record<string,unknown>,userId:string|null) => Promise<void>;
  user: (req:Request) => Promise<string|null>;
};
export function leadHandler(p:LeadPorts) {
  return async(req:Request) => {
    if(req.method !== 'POST') return Response.json({error:'method'},{status:405});
    let b:any; try {b=await req.json();} catch {return Response.json({error:'input'},{status:400});}
    if(b?.action === 'issue') return Response.json(await p.issue());
    if(!b || typeof b.session_id !== 'string' || !/^ls_[0-9a-f-]{36}$/i.test(b.session_id)
      || typeof b.token !== 'string' || !/^[0-9a-f]{64}$/.test(b.token)
      || typeof b.event_name !== 'string' || JSON.stringify(b).length > 10000) return Response.json({error:'input'},{status:400});
    if(!await p.verify(b.session_id,b.token)) return Response.json({error:'unauthorized'},{status:401});
    // identity is not read from body; the service adapter must supply only this verified user.
    await p.event(b.session_id,{event_name:b.event_name,event_id:b.event_id,properties:b.properties,touch:b.touch},await p.user(req));
    return Response.json({success:true});
  };
}
