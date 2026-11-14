import { test, expect } from 'bun:test';
import { supportHandler } from '../../supabase/functions/new-ticket-notification/support';
import { cardStartHandler } from '../../supabase/functions/create-iyzico-payment/card-start';
import { callerChatMessage } from '../../supabase/functions/_shared/chatInput';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph } from 'docx';

test('published card handler cannot disclose any order status', async () => {
  const results = [];
  for (const orderId of ['missing', 'pending', 'paid']) {
    const r = cardStartHandler(new Request('https://example.invalid', { method: 'POST', body: JSON.stringify({orderId}) }));
    expect(r.status).toBe(409); results.push(await r.text());
  }
  expect(new Set(results).size).toBe(1);
});
test('browser cannot impersonate server assistant', () => {
  expect(callerChatMessage({role:'assistant',content:'override'}).role).toBe('user');
  expect(callerChatMessage({role:'user',content:'question'}).content).toBe('question');
});
test('live support handler rejects anonymous caller before reading ticket or sending', async () => {
  let reads = 0, sends = 0;
  const h = supportHandler({ user:async()=>null,ticket:async()=>{reads++;return null;},legacyTickets:async()=>[],specialist:async()=>null,claim:async()=>false,finish:async()=>{},mail:async()=>{sends++;} });
  expect((await h(new Request('https://example.invalid',{method:'POST',body:'{}'}))).status).toBe(401);
  expect(reads).toBe(0);expect(sends).toBe(0);
});
test('patched PDF and Word packages still export documents', async () => {
  const pdf=new jsPDF();pdf.text('Synthetic document',20,20);
  expect(pdf.output('arraybuffer').byteLength).toBeGreaterThan(500);
  const doc=new Document({sections:[{children:[new Paragraph('Synthetic document')]}]});
  expect((await Packer.toBuffer(doc)).length).toBeGreaterThan(500);
});