-- Add specialist_id field to blog_posts table
ALTER TABLE public.blog_posts ADD COLUMN specialist_id uuid;

-- Add foreign key constraint for specialist_id
ALTER TABLE public.blog_posts 
ADD CONSTRAINT blog_posts_specialist_id_fkey 
FOREIGN KEY (specialist_id) 
REFERENCES public.specialists(id) 
ON DELETE SET NULL;