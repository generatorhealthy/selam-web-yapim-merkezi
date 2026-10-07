DO $migration$
DECLARE def text;
BEGIN
SELECT pg_get_functiondef('public.get_ad_performance(date,date,text,text,text)'::regprocedure) INTO def;
IF position('SELECT DISTINCT ON (tc.user_id) tc.user_id,' in def)=0 THEN RAISE EXCEPTION 'Unexpected reporting definition'; END IF;
def := replace(def,'SELECT DISTINCT ON (tc.user_id) tc.user_id,','SELECT DISTINCT ON (tc.user_id) tc.user_id, tc.first_visit_at,');
def := replace(def,'FROM touch tc
    ORDER BY','FROM touch tc
    WHERE NULLIF(tc.t->>''meta_ad_id'','''') IS NOT NULL AND EXISTS(SELECT 1 FROM meta_daily_metrics md WHERE md.ad_id=tc.t->>''meta_ad_id'')
    ORDER BY');
def := replace(def,'LEFT JOIN pay ON pay.em = lower(up.email)', 'LEFT JOIN LATERAL (
 SELECT lower(o.customer_email) em,sum(o.amount) amt FROM orders o
 WHERE lower(o.customer_email)=lower(up.email) AND o.status IN (''approved'',''completed'') AND o.deleted_at IS NULL
 AND COALESCE(o.payment_status,'''') NOT IN (''failed'',''refunded'',''cancelled'',''canceled'',''iade'') AND o.amount>0
 AND COALESCE(o.approved_at,o.created_at)>=u.first_visit_at
 GROUP BY lower(o.customer_email)
 ) pay ON true');
EXECUTE def;
END $migration$;