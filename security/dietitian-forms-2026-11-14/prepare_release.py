"""Prepare offline release candidates. No network, credentials, or live database calls."""
import hashlib
import json
from pathlib import Path
import uuid

ROOT = Path(__file__).parent
catalog = json.loads((ROOT / 'catalog.json').read_text())
namespace = uuid.UUID('2443bb96-b6ad-4f88-8d2b-8ffb7726ad3b')
def quote(value):
    return "'" + str(value).replace("'", "''") + "'"

ids = [str(uuid.uuid5(namespace, catalog['version'] + ':' + f['slug'])) for f in catalog['forms']]
seed = ['-- OFFLINE DATA CANDIDATE. Content approval + separate data execution approval required.',
        '-- Insert-only inactive drafts; never enables health collection.', 'BEGIN;']
for tid, form in zip(ids, catalog['forms']):
    content = '<p>' + catalog['notice'] + '</p><p>' + catalog['interpretation'] + '</p>'
    seed.append('INSERT INTO public.tests (id,title,description,content,category,specialty_area,status,is_active,specialist_id) VALUES (' +
                ','.join([quote(tid), quote(form['title']), quote(form['description']), quote(content),
                          quote('Beslenme Değerlendirme Formu'), quote('Diyetisyen'), quote('pending'), 'false', 'NULL']) +
                ') ON CONFLICT(id) DO NOTHING;')
    for q in form['questions']:
        qid = str(uuid.uuid5(namespace, tid + ':' + str(q['step_number'])))
        seed.append('INSERT INTO public.test_questions (id,test_id,question_text,question_type,options,step_number,is_required) VALUES (' +
                    ','.join([quote(qid), quote(tid), quote(q['question_text']), quote(q['question_type']),
                              quote(json.dumps(q['options'], ensure_ascii=False)) + '::jsonb', str(q['step_number']), 'false']) +
                    ') ON CONFLICT(id) DO NOTHING;')
seed.append('COMMIT;')
(ROOT / 'seed-drafts.sql').write_text('\n'.join(seed) + '\n')

schema = """-- OFFLINE SCHEMA CANDIDATE. Separate migration approval required.
-- This does not change legacy triggers, grants, release flags, or historical business rows.
CREATE OR REPLACE FUNCTION public.attach_dietitian_intake_forms_v1(p_specialist uuid)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE s public.specialists%ROWTYPE; t public.tests%ROWTYPE; copied_id uuid; mapped_id uuid;
  expected uuid[] := ARRAY[__IDS__]::uuid[]; added integer := 0; did_insert integer;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended('dietitian-intake-v1:'||p_specialist::text,0));
  SELECT * INTO s FROM public.specialists WHERE id=p_specialist;
  IF NOT FOUND OR s.specialty <> 'Diyetisyen' THEN RETURN 0; END IF;
  -- Only these 15 exact templates, after their independent content/publication approval.
  FOR t IN SELECT * FROM public.tests WHERE id=ANY(expected) AND specialist_id IS NULL
      AND specialty_area='Diyetisyen' AND category='Beslenme Değerlendirme Formu'
      AND status='approved' AND is_active=true ORDER BY id LOOP
    IF (SELECT count(*) FROM public.test_questions WHERE test_id=t.id) <> 4
      OR EXISTS (SELECT 1 FROM public.test_questions q WHERE q.test_id=t.id
        AND (q.is_required OR q.question_type <> 'multiple_choice' OR jsonb_typeof(q.options)<>'array'
        OR NOT(q.options @> '["Paylaşmak istemiyorum","Bana uygun değil"]'::jsonb)))
    THEN RAISE EXCEPTION 'dietitian_template_not_verified'; END IF;
    copied_id := md5('dietitian-intake-v1:'||t.id::text||':'||s.id::text)::uuid;
    -- Never reuse an unrelated historical test or overwrite its questions.
    IF EXISTS(SELECT 1 FROM public.tests WHERE id=copied_id
      AND (specialist_id IS DISTINCT FROM s.id OR specialty_area IS DISTINCT FROM 'Diyetisyen'
        OR category IS DISTINCT FROM 'Beslenme Değerlendirme Formu'))
    THEN RAISE EXCEPTION 'dietitian_copy_conflict'; END IF;
    INSERT INTO public.tests(id,title,description,content,category,specialty_area,status,is_active,specialist_id)
      VALUES(copied_id,t.title,t.description,t.content,t.category,t.specialty_area,'approved',true,s.id)
      ON CONFLICT(id) DO NOTHING;
    GET DIAGNOSTICS did_insert = ROW_COUNT;
    IF did_insert=1 THEN
      INSERT INTO public.test_questions(id,test_id,question_text,question_type,options,step_number,is_required)
        SELECT md5(copied_id::text||':'||q.id::text)::uuid,copied_id,q.question_text,q.question_type,
          q.options,q.step_number,false FROM public.test_questions q WHERE q.test_id=t.id;
      added := added+1;
    END IF;
    IF (SELECT count(*) FROM public.test_questions WHERE test_id=copied_id)<>4 THEN
      RAISE EXCEPTION 'dietitian_copy_incomplete'; END IF;
    mapped_id:=md5('dietitian-map-v1:'||copied_id::text||':'||s.id::text)::uuid;
    INSERT INTO public.specialist_tests(id,specialist_id,test_id,is_enabled)
      SELECT mapped_id,s.id,copied_id,true WHERE NOT EXISTS(
        SELECT 1 FROM public.specialist_tests WHERE specialist_id=s.id AND test_id=copied_id)
      ON CONFLICT(id) DO NOTHING;
  END LOOP;
  RETURN added;
END $$;
REVOKE ALL ON FUNCTION public.attach_dietitian_intake_forms_v1(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.attach_dietitian_intake_forms_v1(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.on_dietitian_intake_registration_v1()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NEW.specialty='Diyetisyen' THEN PERFORM public.attach_dietitian_intake_forms_v1(NEW.id); END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.on_dietitian_intake_registration_v1() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER dietitian_intake_registration_v1 AFTER INSERT ON public.specialists
FOR EACH ROW EXECUTE FUNCTION public.on_dietitian_intake_registration_v1();
""".replace('__IDS__', ','.join(quote(tid) for tid in ids))
(ROOT / 'assignment-schema.sql').write_text(schema)
manifest = {'version': catalog['version'], 'template_ids': ids, 'catalog_sha256': hashlib.sha256((ROOT/'catalog.json').read_bytes()).hexdigest(),
            'content_approved': False, 'live_execution_approved': False, 'health_collection_enabled': False}
(ROOT / 'release-manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
print('Prepared insert-only draft data and separate service-only assignment schema; nothing executed live.')