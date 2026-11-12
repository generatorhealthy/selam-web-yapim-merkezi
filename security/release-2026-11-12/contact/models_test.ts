import {assertEquals,assertThrows} from 'https://deno.land/std@0.224.0/assert/mod.ts';
import {authorizeReferral,authorizeSelfLink} from './models.ts';
const r={id:'r',ownerUserId:'owner',phone:'synthetic',specialistId:'s',referred:true};
Deno.test('referral denies visitor and unrelated specialist',()=>{assertThrows(()=>authorizeReferral(null,r));assertThrows(()=>authorizeReferral({id:'other',staff:false},r));});
Deno.test('referral returns only recorded phone for owner and staff',()=>{assertEquals(authorizeReferral({id:'owner',staff:false},r).phone,'synthetic');assertEquals(authorizeReferral({id:'staff',staff:true},r).specialistId,'s');});
const op={id:'op',phoneHash:'ph',specialistId:'s',proofHash:'proof',expiresAt:200,verifiedAt:10,consumedAt:null};
Deno.test('self-link requires proof, verified ownership and unexpired one-use operation',()=>{assertThrows(()=>authorizeSelfLink(op,'wrong',100));assertThrows(()=>authorizeSelfLink({...op,verifiedAt:null},'proof',100));assertThrows(()=>authorizeSelfLink(op,'proof',200));assertThrows(()=>authorizeSelfLink({...op,consumedAt:50},'proof',100));assertEquals(authorizeSelfLink(op,'proof',100),{operationId:'op',specialistId:'s'});});