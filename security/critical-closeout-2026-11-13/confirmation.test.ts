import {test, expect} from 'bun:test';
import {handleConfirmation, type ConfirmationPorts} from '../../supabase/functions/send-patient-appointment-confirmation/handler';
const id = '11111111-1111-4111-8111-111111111111';
function fixture() {
  let claimed = false, sent = 0, recipient = '', content = '', state = '';
  const ports: ConfirmationPorts = {
    identity: async () => ({id: 'owner'}),
    appointment: async () => ({id, specialist_id: 'spec', patient_name: '<script>bad</script>', patient_email: 'stored@example.invalid', appointment_date: '2026-11-14', appointment_time: '10:00', status: 'pending'}),
    ownsSpecialist: async user => user === 'owner',
    claim: async () => { if (claimed) return false; claimed = true; return true; },
    deliver: async (email, _name, html) => {sent++; recipient=email;content=html;return true;},
    mark: async (_id, status) => {state=status;},
  };
  const req = (body: object) => new Request('https://synthetic.invalid', {method:'POST',body:JSON.stringify(body)});
  return {ports,req, sends:()=>sent, recipient:()=>recipient, content:()=>content, state:()=>state};
}
test('anonymous confirmation cannot send or claim',async()=>{const f=fixture();f.ports.identity=async()=>null;expect((await handleConfirmation(f.req({appointmentId:id}),f.ports,{})).status).toBe(401);expect(f.sends()).toBe(0);});
test('another specialist cannot send this appointment',async()=>{const f=fixture();f.ports.ownsSpecialist=async()=>false;expect((await handleConfirmation(f.req({appointmentId:id}),f.ports,{})).status).toBe(403);expect(f.sends()).toBe(0);});
test('caller recipient and health notes are rejected',async()=>{const f=fixture();expect((await handleConfirmation(f.req({appointmentId:id,patientEmail:'attacker@example.invalid',notes:'private'}),f.ports,{})).status).toBe(400);expect(f.sends()).toBe(0);});
test('stored recipient, escaped text and 20 concurrent requests send once',async()=>{const f=fixture();const responses=await Promise.all(Array.from({length:20},()=>handleConfirmation(f.req({appointmentId:id}),f.ports,{})));expect(responses.filter(r=>r.status===200)).toHaveLength(1);expect(responses.filter(r=>r.status===409)).toHaveLength(19);expect(f.sends()).toBe(1);expect(f.recipient()).toBe('stored@example.invalid');expect(f.content()).not.toContain('<script>');expect(f.state()).toBe('sent');});
test('provider uncertainty keeps claim and never retries',async()=>{const f=fixture();let calls=0;f.ports.deliver=async()=>{calls++;throw Error('timeout');};expect((await handleConfirmation(f.req({appointmentId:id}),f.ports,{})).status).toBe(502);expect((await handleConfirmation(f.req({appointmentId:id}),f.ports,{})).status).toBe(409);expect(calls).toBe(1);expect(f.state()).toBe('unknown');});