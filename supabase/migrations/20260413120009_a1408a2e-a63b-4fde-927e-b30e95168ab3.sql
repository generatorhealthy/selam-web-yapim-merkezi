
CREATE OR REPLACE FUNCTION public.update_test_titles_on_specialist_name_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.name IS DISTINCT FROM NEW.name THEN
    UPDATE public.tests
    SET title = regexp_replace(title, ' - ' || regexp_replace(OLD.name, '([.\\*+?^${}()|[\]])', '\\\1', 'g') || '$', ' - ' || NEW.name),
        updated_at = now()
    WHERE specialist_id = NEW.id
      AND title LIKE '% - ' || OLD.name;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_test_titles_on_name_change ON public.specialists;

CREATE TRIGGER trigger_update_test_titles_on_name_change
  AFTER UPDATE ON public.specialists
  FOR EACH ROW
  EXECUTE FUNCTION public.update_test_titles_on_specialist_name_change();
