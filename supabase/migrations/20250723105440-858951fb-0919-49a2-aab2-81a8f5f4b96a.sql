-- Yeni uzman eklendiğinde o uzmanın uzmanlık alanına göre otomatik testler oluşturacak fonksiyon
CREATE OR REPLACE FUNCTION public.create_specialist_tests()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Eğer uzmanın uzmanlık alanı Psikolog ise, Psikolog testlerini ekle
  IF NEW.specialty = 'Psikolog' THEN
    INSERT INTO public.tests (title, description, category, specialty_area, status, is_active, specialist_id)
    SELECT 
      title || ' - ' || NEW.name,
      description,
      category,
      specialty_area,
      'approved',
      true,
      NEW.id
    FROM public.tests 
    WHERE specialty_area = 'Psikolog' AND specialist_id IS NULL
    LIMIT 10;
  
  -- Eğer uzmanın uzmanlık alanı Aile Danışmanı ise, Aile Danışmanı testlerini ekle
  ELSIF NEW.specialty = 'Aile Danışmanı' THEN
    INSERT INTO public.tests (title, description, category, specialty_area, status, is_active, specialist_id)
    SELECT 
      title || ' - ' || NEW.name,
      description,
      category,
      specialty_area,
      'approved',
      true,
      NEW.id
    FROM public.tests 
    WHERE specialty_area = 'Aile Danışmanı' AND specialist_id IS NULL
    LIMIT 10;
  
  -- Eğer uzmanın uzmanlık alanı Psikolojik Danışmanlık ise, Psikolojik Danışmanlık testlerini ekle
  ELSIF NEW.specialty = 'Psikolojik Danışmanlık' THEN
    INSERT INTO public.tests (title, description, category, specialty_area, status, is_active, specialist_id)
    SELECT 
      title || ' - ' || NEW.name,
      description,
      category,
      specialty_area,
      'approved',
      true,
      NEW.id
    FROM public.tests 
    WHERE specialty_area = 'Psikolojik Danışmanlık' AND specialist_id IS NULL
    LIMIT 10;
  
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Trigger oluştur: Yeni uzman eklendiğinde otomatik testler oluştur
CREATE TRIGGER trigger_create_specialist_tests
  AFTER INSERT ON public.specialists
  FOR EACH ROW
  EXECUTE FUNCTION public.create_specialist_tests();