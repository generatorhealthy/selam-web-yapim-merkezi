import {assertEquals} from 'https://deno.land/std@0.224.0/assert/mod.ts';
import {requestSchema,sha} from './adapter.ts';
const id='00000000-0000-4000-8000-000000000001';
Deno.test('prepare rejects arbitrary recipient or user identity',()=>assertEquals(requestSchema.safeParse({action:'prepare',testId:id,specialistId:id,guestDeclared:true,email:'leak@example.invalid'}).success,false));
Deno.test('submit rejects client scores and results',()=>assertEquals(requestSchema.safeParse({action:'submit',operationId:id,capability:'a'.repeat(64),name:'Synthetic',contact:'test',answers:{},results:{score:100}}).success,false));
Deno.test('guest operation validates with null specialist, server must resolve',()=>assertEquals(requestSchema.safeParse({action:'prepare',testId:id,specialistId:null,guestDeclared:true}).success,true));
Deno.test('capability is hashed deterministically',async()=>{assertEquals((await sha('synthetic')).length,64);assertEquals(await sha('synthetic'),await sha('synthetic'));assertEquals(await sha('a')===await sha('b'),false);});