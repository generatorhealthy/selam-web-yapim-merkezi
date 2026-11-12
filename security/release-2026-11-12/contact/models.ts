// DRAFT ONLY. Two different authorization models; no active WAHA configuration.
export type Referral={id:string;ownerUserId:string;phone:string;specialistId:string;referred:boolean};
export type VerifiedActor={id:string;staff:boolean};
export function authorizeReferral(actor:VerifiedActor|null,referral:Referral|null){
 if(!actor||!referral?.referred||(!actor.staff&&actor.id!==referral.ownerUserId))throw new Error('not_authorized');
 return {referralId:referral.id,specialistId:referral.specialistId,phone:referral.phone};
}
export type SelfLinkOperation={id:string;phoneHash:string;specialistId:string;proofHash:string;expiresAt:number;verifiedAt:number|null;consumedAt:number|null};
export function authorizeSelfLink(op:SelfLinkOperation,proofHash:string,now:number){
 if(op.proofHash!==proofHash||op.verifiedAt===null||op.expiresAt<=now||op.consumedAt!==null)throw new Error('not_authorized');
 return {operationId:op.id,specialistId:op.specialistId};
}
// OTP verification/consumption and the outbox INSERT must be the SAME SQL transaction.
// Use a verified OTP provider, random codes hashed with server HMAC, constant-time proof checks,
// trusted proxy origin only; never treat a browser-provided phone, IP or "verified" flag as proof.