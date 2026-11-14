/** Offline candidate. Imports stay within the release package, never app/deployed paths. */
export type Ticket = { id: string; specialist_id: string; title: string; description: string; category: string; priority: string };
export type Specialist = { id: string; user_id: string; name: string; email: string };
export type SupportPorts = {
  user: (req: Request) => Promise<string | null>;
  ticket: (id: string) => Promise<Ticket | null>;
  legacyTickets: (uid: string, title: string, description: string) => Promise<Ticket[]>;
  specialist: (id: string) => Promise<Specialist | null>;
  claim: (id: string) => Promise<boolean>;
  finish: (id: string, state: 'sent' | 'unknown') => Promise<void>;
  mail: (body: Record<string, unknown>) => Promise<void>;
};
export const escape = (v: string) => v.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c] ?? c));
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const json = (status: number, body: unknown) => Response.json(body, {status});
export function supportHandler(p: SupportPorts) {
  return async (req: Request): Promise<Response> => {
    if(req.method !== 'POST') return json(405,{error:'method'});
    const uid = await p.user(req);
    if(!uid) return json(401,{error:'auth'});
    let b: any;
    try { b = await req.json(); } catch { return json(400,{error:'input'}); }
    let ticket: Ticket | null = null;
    if(typeof b?.ticketId === 'string' && uuid.test(b.ticketId)) ticket = await p.ticket(b.ticketId);
    else if(b?.ticketId === '' && typeof b.ticketTitle === 'string' && b.ticketTitle.length <= 500
      && typeof b.ticketDescription === 'string' && b.ticketDescription.length <= 10000) {
      // Adapter MUST filter by owning user and created_at >= now()-15min; limit 2.
      const candidates = await p.legacyTickets(uid,b.ticketTitle,b.ticketDescription);
      if(candidates.length === 1) ticket = candidates[0];
    } else return json(400,{error:'input'});
    if(!ticket) return json(403,{error:'unavailable'});
    const spec = await p.specialist(ticket.specialist_id);
    if(!spec || spec.user_id !== uid) return json(403,{error:'unavailable'});
    if(!await p.claim(ticket.id)) return json(200,{success:true,duplicate:true});
    try {
      await p.mail({sender:{name:'Doktorum Ol',email:'info@doktorumol.com.tr'},to:[{email:'info@doktorumol.com.tr'}],
        subject:'Yeni destek talebi',htmlContent:`<h1>Yeni destek talebi</h1><p>${escape(ticket.title)}</p><p>${escape(spec.name)} — ${escape(spec.email)}</p><p>${escape(ticket.description).replace(/\n/g,'<br>')}</p><a href="https://doktorumol.com.tr/divan_paneli/support-tickets">Destek paneli</a>`});
      await p.finish(ticket.id,'sent');
      return json(200,{success:true});
    } catch {
      await p.finish(ticket.id,'unknown').catch(()=>undefined);
      return json(503,{error:'delivery_unknown',retryable:false});
    }
  };
}
