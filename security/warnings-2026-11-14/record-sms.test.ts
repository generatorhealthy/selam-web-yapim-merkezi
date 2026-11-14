import {test,expect} from 'bun:test';
import {resolveRecordSms,type RecordKind} from './candidates/record-sms';
const requestId='11111111-1111-4111-8111-111111111111';
const staff={id:'staff',role:'staff',approved:true};
test('each business SMS target comes from stored record, not browser phone',()=>{
 const kinds:RecordKind[]=['specialist','appointment','order','application','referral'];
 const templates=['account','confirmation','payment','application','referral'];
 kinds.forEach((kind,i)=>{
  const r=resolveRecordSms(staff,{kind,recordId:'record',requestId,template:templates[i],phone:'05551111111'},
   {id:'record',kind,phone:'05457333049',status:kind==='order'?'pending':'confirmed'});
  expect(r?.phone).toBe('05457333049');
 });
});
test('staff custom text and unrelated specialist appointment are rejected',()=>{
 const record={id:'record',kind:'appointment' as const,phone:'05457333049',status:'confirmed',ownerId:'owner'};
 expect(resolveRecordSms(staff,{kind:'appointment',recordId:'record',requestId,template:'custom',message:'arbitrary'},record)).toBeNull();
 expect(resolveRecordSms({id:'other',role:'specialist',approved:true},{kind:'appointment',recordId:'record',requestId,template:'confirmation'},record)).toBeNull();
});
test('pending appointment cannot emit confirmation, paid order cannot emit payment reminder',()=>{
 expect(resolveRecordSms(staff,{kind:'appointment',recordId:'record',requestId,template:'confirmation'},{id:'record',kind:'appointment',phone:'05457333049',status:'pending'})).toBeNull();
 expect(resolveRecordSms(staff,{kind:'order',recordId:'record',requestId,template:'payment'},{id:'record',kind:'order',phone:'05457333049',status:'approved'})).toBeNull();
});