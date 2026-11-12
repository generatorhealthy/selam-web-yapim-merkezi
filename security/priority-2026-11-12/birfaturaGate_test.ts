import {assertEquals} from 'https://deno.land/std@0.224.0/assert/mod.ts';
import {authorizeBirfatura} from './birfaturaGate.ts';
Deno.test('missing BirFatura secret fails closed',()=>assertEquals(authorizeBirfatura(new Request('https://isolated.invalid'),undefined),503));
Deno.test('missing caller token denied',()=>assertEquals(authorizeBirfatura(new Request('https://isolated.invalid'),'synthetic-secret'),401));
Deno.test('wrong token denied',()=>assertEquals(authorizeBirfatura(new Request('https://isolated.invalid',{headers:{'x-api-key':'wrong'}}),'synthetic-secret'),401));
Deno.test('existing header protocol preserved',()=>assertEquals(authorizeBirfatura(new Request('https://isolated.invalid',{headers:{apipassword:'synthetic-secret'}}),'synthetic-secret'),200));
Deno.test('existing query fallback preserved during migration',()=>assertEquals(authorizeBirfatura(new Request('https://isolated.invalid?token=synthetic-secret'),'synthetic-secret'),200));