/** New card sales are unavailable. Does not read orders, parse inputs or contact iyzico. */
export function cardStartHandler(req: Request): Response {
  const headers = {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type'};
  if(req.method === 'OPTIONS') return new Response('ok',{headers});
  if(req.method !== 'POST') return Response.json({error:'method'},{status:405,headers});
  return Response.json({status:'failure',errorCode:'card_sales_unavailable',errorMessage:'Kredi kartı ile yeni satış kapalıdır. Banka havalesi ile devam edebilirsiniz.'},{status:409,headers});
}
