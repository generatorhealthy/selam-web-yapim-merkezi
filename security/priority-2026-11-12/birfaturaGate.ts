// Fail-closed draft. Existing integration remains unchanged pending dependency approval.
export function authorizeBirfatura(req:Request,secret:string|undefined):number {
 if(!secret?.trim())return 503;
 const names=['apipassword','api_password','api-password','apikey','api_key','api-key','x-api-key','token','x-token','apitoken','api_token','password','sifre','apisifre'];
 let token=names.map(n=>req.headers.get(n)).find(Boolean);
 const url=new URL(req.url);
 token=token||['token','apiKey','apiPassword','apipassword'].map(n=>url.searchParams.get(n)).find(Boolean);
 if(!token)return 401;
 const a=new TextEncoder().encode(token.trim()),b=new TextEncoder().encode(secret.trim());
 let diff=a.length^b.length;for(let i=0;i<Math.max(a.length,b.length);i++)diff|=(a[i]??0)^(b[i]??0);
 return diff===0?200:401;
}