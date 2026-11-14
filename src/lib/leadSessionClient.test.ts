import {test} from 'node:test';
import assert from 'node:assert/strict';
import {leadSessionClient} from './leadSessionClient';
const pair={session_id:'ls_11111111-1111-4111-8111-111111111111',token:'a'.repeat(64)};
test('expired marketing session is renewed, never silently retained',async()=>{
 let value=JSON.stringify({...pair,expires_at:'2026-01-01T00:00:00Z'}),issued=0;
 const session=leadSessionClient({getItem:()=>value,setItem:(_,v)=>{value=v;}},async()=>{issued++;return pair;},()=>Date.parse('2026-11-14T00:00:00Z'));
 await session();await session();assert.equal(issued,1);
});
test('parallel calls share one new server session request',async()=>{
 let value:string|null=null,issued=0;
 const session=leadSessionClient({getItem:()=>value,setItem:(_,v)=>{value=v;}},async()=>{issued++;return pair;});
 await Promise.all(Array.from({length:20},()=>session()));assert.equal(issued,1);
});