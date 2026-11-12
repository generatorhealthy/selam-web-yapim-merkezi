"""Generate a REVIEW-ONLY patch from the exact server-read function snapshot.
Does not connect to a database. Production SQL must use the migration tool.
"""
from pathlib import Path
import hashlib
root=Path(__file__).parent
original=(root/'original.sql').read_text()
assert original.count('CREATE OR REPLACE FUNCTION')==1
assert "SET search_path TO 'public'" in original
assert original.count("EXECUTE 'CREATE TABLE public.'")==12
gate="""BEGIN
  -- Never use current_user here: SECURITY DEFINER makes it the owner.
  -- Direct postgres cron job 23 is preserved; PostgREST SET ROLE cannot pass this branch.
  IF NOT (
    current_setting('role', true) = 'service_role'
    OR (session_user = 'postgres' AND current_setting('role', true) IN ('none', 'postgres')
        AND auth.uid() IS NULL)
    OR (current_setting('role', true) = 'authenticated' AND public.is_admin_user())
  ) THEN
    RAISE EXCEPTION 'Forbidden: approved admin or trusted database scheduler required'
      USING ERRCODE = '42501';
  END IF;
  IF current_setting('role', true) = 'authenticated' THEN
    p_created_by := auth.uid();
  END IF;
"""
patched=original.replace("SET search_path TO 'public'", "SET search_path TO 'pg_catalog', 'public', 'pg_temp'").replace('BEGIN\n',gate,1)
# Every dynamically CREATED public table receives grants before RLS, existing backups untouched.
line="  EXECUTE 'CREATE TABLE public.' || quote_ident(v_backup_table) || ' AS TABLE public."
out=[]
for l in patched.splitlines():
 out.append(l)
 if l.startswith(line):
  # GET DIAGNOSTICS must immediately follow CREATE, grants would change ROW_COUNT.
  pass
 if l.strip()=='GET DIAGNOSTICS v_record_count = ROW_COUNT;':
  out.extend(["  EXECUTE 'GRANT SELECT ON public.' || quote_ident(v_backup_table) || ' TO authenticated';", "  EXECUTE 'GRANT ALL ON public.' || quote_ident(v_backup_table) || ' TO service_role';"])
header='-- DRAFT ONLY: NOT APPLIED. Re-read live definition/owner/cron before migration.\nBEGIN;\n'
acl="""
REVOKE ALL ON FUNCTION public.create_full_database_backup(text,uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_full_database_backup(text,uuid,text) TO authenticated, service_role;
COMMIT;
"""
(root/'migration-draft.sql').write_text(header+'\n'.join(out)+'\n'+acl)
rollback=header+original.replace('BEGIN\n',gate,1)+acl
(root/'safe-rollback.sql').write_text(rollback)
(root/'SHA256SUMS').write_text(''.join(hashlib.sha256((root/f).read_bytes()).hexdigest()+'  '+f+'\n' for f in ['original.sql','migration-draft.sql','safe-rollback.sql']))