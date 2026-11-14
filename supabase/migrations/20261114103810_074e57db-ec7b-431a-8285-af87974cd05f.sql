-- OFFLINE SCHEMA CANDIDATE. Separate migration approval required.
-- This does not change legacy triggers, grants, release flags, or historical business rows.
CREATE OR REPLACE FUNCTION public.attach_dietitian_intake_forms_v1(p_specialist uuid)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE s public.specialists%ROWTYPE; t public.tests%ROWTYPE; copied_id uuid; mapped_id uuid;
  expected uuid[] := ARRAY['300a4d54-d4c3-5443-9342-9561144b4181','6b035e9d-f3fa-5831-ab60-9e31bbb1ed91','7d3f52a6-8cb9-5ca9-a822-55c48081867b','01aa4766-b5d2-5870-b9e0-f4747bef937c','95b2a3aa-db0c-50be-b2e1-5cad3d114712','cd7674d6-347a-576b-bf12-b9bf473805da','ea4c16c2-d5cc-538c-a3a7-0dcc0e543470','07128706-184f-552a-85c4-7a0a88f09e4c','5485c459-5ff5-556b-ac9b-9d8e914da79e','87345cfa-c4e6-5aad-a41b-3de5538d01a2','2c62b321-c574-53b8-8f1b-db2dd8ef1b77','313fd598-7dd4-5f86-a1af-4d96faffca86','69aa51cf-af3d-55ca-b5fe-3d4a65d5b369','f8aca394-6acf-5761-a3ba-d787584f28e5','de24039c-026a-5531-97e2-ae4349fecc65']::uuid[]; added integer := 0; did_insert integer;
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