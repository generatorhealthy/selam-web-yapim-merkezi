import {test,expect} from 'bun:test';
import {verifyWahaHmac,verifyScheduledCaller} from './provider-transition';
test('cron missing configuration or public JWT never grants authority',()=>{
  expect(verifyScheduledCaller(new Headers({authorization:'Bearer public'}),undefined)).toBe(false);
  expect(verifyScheduledCaller(new Headers({'x-cron-secret':'wrong'}),'synthetic-only')).toBe(false);
  expect(verifyScheduledCaller(new Headers({'x-cron-secret':'synthetic-only'}),'synthetic-only')).toBe(true);
});
test('WAHA SHA512 binds exact raw body, not parsed JSON',async()=>{
  const raw=new TextEncoder().encode('{"event":"message"}'),secret='local-fixture-only';
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-512'},false,['sign']);
  const signed=new Uint8Array(await crypto.subtle.sign('HMAC',key,raw));
  const signature=Array.from(signed,b=>b.toString(16).padStart(2,'0')).join('');
  const headers=new Headers({'x-webhook-hmac':signature,'x-webhook-hmac-algorithm':'sha512'});
  expect(await verifyWahaHmac(raw,headers,secret)).toBe(true);
  expect(await verifyWahaHmac(new TextEncoder().encode('{ "event":"message"}'),headers,secret)).toBe(false);
  expect(await verifyWahaHmac(raw,headers,undefined)).toBe(false);
  expect(await verifyWahaHmac(raw,new Headers(),secret)).toBe(false);
});