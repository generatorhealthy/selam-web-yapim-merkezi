
-- Add slug column to specialists
ALTER TABLE public.specialists ADD COLUMN IF NOT EXISTS slug text;

-- Create a function to generate slug from Turkish name
CREATE OR REPLACE FUNCTION public.generate_specialist_slug(p_name text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public'
AS $$
DECLARE
  v_slug text;
BEGIN
  v_slug := p_name;
  -- Remove titles
  v_slug := regexp_replace(v_slug, 'Prof\.\s*Dr\.\s*', '', 'gi');
  v_slug := regexp_replace(v_slug, 'Dr\.\s*', '', 'gi');
  v_slug := regexp_replace(v_slug, 'Dan\.\s*', '', 'gi');
  v_slug := regexp_replace(v_slug, 'Uzm\.\s*', '', 'gi');
  v_slug := regexp_replace(v_slug, 'Doç\.\s*', '', 'gi');
  v_slug := regexp_replace(v_slug, '\.', '', 'g');
  -- Turkish char mapping
  v_slug := translate(v_slug, 'ğĞüÜşŞıİöÖçÇ', 'gGuUsSiIoOcC');
  -- Lowercase, replace spaces with hyphens, remove non-alphanumeric
  v_slug := lower(v_slug);
  v_slug := regexp_replace(v_slug, '\s+', '-', 'g');
  v_slug := regexp_replace(v_slug, '[^a-z0-9-]', '', 'g');
  v_slug := regexp_replace(v_slug, '-+', '-', 'g');
  v_slug := trim(both '-' from v_slug);
  RETURN v_slug;
END;
$$;

-- Populate slugs for existing specialists
UPDATE public.specialists 
SET slug = generate_specialist_slug(name) 
WHERE slug IS NULL AND name IS NOT NULL;

-- Handle duplicate slugs by appending a suffix
DO $$
DECLARE
  rec RECORD;
  counter int;
BEGIN
  FOR rec IN 
    SELECT slug, array_agg(id ORDER BY created_at) as ids
    FROM public.specialists
    WHERE slug IS NOT NULL
    GROUP BY slug
    HAVING count(*) > 1
  LOOP
    counter := 1;
    FOR i IN 2..array_length(rec.ids, 1) LOOP
      UPDATE public.specialists 
      SET slug = rec.slug || '-' || counter
      WHERE id = rec.ids[i];
      counter := counter + 1;
    END LOOP;
  END LOOP;
END $$;

-- Now make it NOT NULL and UNIQUE
ALTER TABLE public.specialists ALTER COLUMN slug SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_specialists_slug ON public.specialists(slug);

-- Trigger to auto-set slug on INSERT (never update on name change)
CREATE OR REPLACE FUNCTION public.set_specialist_slug()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter int := 0;
BEGIN
  -- Only set slug if it's not already set
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    base_slug := generate_specialist_slug(NEW.name);
    final_slug := base_slug;
    LOOP
      EXIT WHEN NOT EXISTS (SELECT 1 FROM public.specialists WHERE slug = final_slug AND id != NEW.id);
      counter := counter + 1;
      final_slug := base_slug || '-' || counter;
    END LOOP;
    NEW.slug := final_slug;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_set_specialist_slug
BEFORE INSERT ON public.specialists
FOR EACH ROW
EXECUTE FUNCTION public.set_specialist_slug();

-- Prevent slug from being changed on UPDATE
CREATE OR REPLACE FUNCTION public.preserve_specialist_slug()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.slug IS NOT NULL AND OLD.slug != '' THEN
    NEW.slug := OLD.slug;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_preserve_specialist_slug
BEFORE UPDATE ON public.specialists
FOR EACH ROW
EXECUTE FUNCTION public.preserve_specialist_slug();
