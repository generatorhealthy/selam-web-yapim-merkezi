CREATE POLICY health_test_release_service ON public.health_test_release FOR ALL TO service_role USING(true) WITH CHECK(true);
CREATE POLICY health_test_documents_service_read ON public.health_test_documents FOR SELECT TO service_role USING(true);
CREATE POLICY health_test_documents_service_insert ON public.health_test_documents FOR INSERT TO service_role WITH CHECK(true);
CREATE POLICY health_test_operations_service ON public.health_test_operations FOR ALL TO service_role USING(true) WITH CHECK(true);
CREATE POLICY health_test_events_service_read ON public.health_test_consent_events FOR SELECT TO service_role USING(true);
CREATE POLICY health_test_events_service_insert ON public.health_test_consent_events FOR INSERT TO service_role WITH CHECK(true);