SELECT cron.alter_job(jobid, active := false)
FROM cron.job
WHERE jobname LIKE 'seo-auto-publish-v2-slot%';