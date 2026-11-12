import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { permitsHealth, transcriptView, type HealthEvidence } from './healthEvidence.ts';
const scope = { subject:'synthetic-user',operation:'synthetic-test',purpose:'health_test' as const, documentVersion:'synthetic-v1',documentHash:'a'.repeat(64),documentPublished:true,legalBasisValidated:true };
const evidence:HealthEvidence = { ...scope, source:'separate_health_consent', action:'grant',serverRecordedAt:'2026-11-12T18:59:00Z' };
Deno.test('separate server-bound test evidence permits its own operation',()=>assertEquals(permitsHealth(evidence,scope),true));
Deno.test('none of 57 legacy membership approvals becomes health consent',()=>{
 for(let i=0;i<57;i++) assertEquals(permitsHealth({...evidence,source:'legacy_membership',operation:`legacy-${i}`},{...scope,operation:`legacy-${i}`}),false);
});
Deno.test('no evidence means no health write authorization',()=>assertEquals(permitsHealth(undefined,scope),false));
Deno.test('withdrawn health consent denies new write',()=>assertEquals(permitsHealth({...evidence,action:'withdraw'},scope),false));
Deno.test('consent for another operation or subject cannot authorize test',()=>{
 assertEquals(permitsHealth({...evidence,operation:'other'},scope),false);
 assertEquals(permitsHealth({...evidence,subject:'other'},scope),false);
});
Deno.test('checkbox and evidence cannot invent legal validation',()=>assertEquals(permitsHealth(evidence,{...scope,legalBasisValidated:false}),false));
Deno.test('unpublished or mismatched document is rejected',()=>{
 assertEquals(permitsHealth(evidence,{...scope,documentPublished:false}),false);
 assertEquals(permitsHealth({...evidence,documentHash:'b'.repeat(64)},scope),false);
});
Deno.test('no server time means no trusted consent evidence',()=>assertEquals(permitsHealth({...evidence,serverRecordedAt:''},scope),false));
Deno.test('unestablished historic transcript basis hides content without deleting record',()=>{
 const input={authenticated:true,authorizedForRecord:true,legalBasisValidated:false,transcript:'synthetic health detail',createdAt:'2026-11-12T18:59:00Z'};
 assertEquals(transcriptView(input),{createdAt:input.createdAt,transcript:null});
 assertEquals(input.transcript,'synthetic health detail');
});
Deno.test('unrelated caller sees no historic transcript metadata or content',()=>assertEquals(transcriptView({authenticated:true,authorizedForRecord:false,legalBasisValidated:true,transcript:'synthetic',createdAt:'synthetic'}),null));