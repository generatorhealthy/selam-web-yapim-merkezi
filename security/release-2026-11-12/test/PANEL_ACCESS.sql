-- ISOLATED TEST / REVIEW. Existing specialist/admin RLS remains unchanged at rollout.
-- This fixture demonstrates the deployed specialist ownership predicate; not production execution.
ALTER TABLE public.test_results ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.test_results TO authenticated;
GRANT SELECT ON public.specialists TO authenticated;
CREATE POLICY isolated_specialist_result_read ON public.test_results FOR SELECT TO authenticated
USING (EXISTS(SELECT 1 FROM public.specialists s WHERE s.id=test_results.specialist_id AND s.user_id=auth.uid()));