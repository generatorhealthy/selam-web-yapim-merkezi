
-- 1. Public bucket for SEO blog images
INSERT INTO storage.buckets (id, name, public)
VALUES ('blog-images', 'blog-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Blog images public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'blog-images');

CREATE POLICY "Authenticated can upload blog images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'blog-images');

-- 2. SEO branches (categories)
CREATE TABLE public.seo_branches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  icon text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.seo_branches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/staff can manage seo_branches"
ON public.seo_branches FOR ALL
TO authenticated
USING (public.is_admin_or_staff_user())
WITH CHECK (public.is_admin_or_staff_user());

-- 3. SEO keywords table
CREATE TABLE public.seo_keywords (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES public.seo_branches(id) ON DELETE CASCADE,
  main_keyword text NOT NULL,
  related_keywords text[] NOT NULL DEFAULT '{}',
  search_intent text,
  difficulty text DEFAULT 'medium',
  priority integer NOT NULL DEFAULT 0,
  content_status text NOT NULL DEFAULT 'pending', -- pending | generating | published | failed
  blog_post_id uuid REFERENCES public.blog_posts(id) ON DELETE SET NULL,
  generated_at timestamptz,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_seo_keywords_branch ON public.seo_keywords(branch_id);
CREATE INDEX idx_seo_keywords_status ON public.seo_keywords(content_status);

ALTER TABLE public.seo_keywords ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/staff can manage seo_keywords"
ON public.seo_keywords FOR ALL
TO authenticated
USING (public.is_admin_or_staff_user())
WITH CHECK (public.is_admin_or_staff_user());

CREATE TRIGGER trg_seo_branches_updated
BEFORE UPDATE ON public.seo_branches
FOR EACH ROW EXECUTE FUNCTION public.safe_timestamp_update();

CREATE TRIGGER trg_seo_keywords_updated
BEFORE UPDATE ON public.seo_keywords
FOR EACH ROW EXECUTE FUNCTION public.safe_timestamp_update();

-- 4. Seed branches
INSERT INTO public.seo_branches (slug, name, description, icon, sort_order) VALUES
('psikolog', 'Psikolog', 'Psikolog branşı için SEO içerikleri', 'Brain', 1),
('klinik-psikolog', 'Klinik Psikolog', 'Klinik psikoloji içerikleri', 'Stethoscope', 2),
('psikolojik-danisman', 'Psikolojik Danışman', 'PDR ve psikolojik danışmanlık', 'HeartHandshake', 3),
('aile-danismani', 'Aile Danışmanı', 'Aile danışmanlığı içerikleri', 'Users', 4),
('iliski-danismani', 'İlişki Danışmanı', 'Çift ve ilişki danışmanlığı', 'Heart', 5),
('cocuk-ergen-psikolog', 'Çocuk - Ergen Psikoloğu', 'Çocuk ve ergen psikolojisi', 'Baby', 6),
('cinsel-terapist', 'Cinsel Terapist', 'Cinsel danışmanlık ve terapi', 'Sparkles', 7);
