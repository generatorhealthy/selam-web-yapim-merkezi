// Call before any staging-only seed, request or test. Never falls back to production env.
export function assertStaging(url:string,allowlistedProject:string){
 const host=new URL(url).hostname;
 if(!allowlistedProject||allowlistedProject==='irnfwewabogveofwemvg'||host!==`${allowlistedProject}.supabase.co`)throw new Error('staging_origin_not_allowed');
 return url;
}