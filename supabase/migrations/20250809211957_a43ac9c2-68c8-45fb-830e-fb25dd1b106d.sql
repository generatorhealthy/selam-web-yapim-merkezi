-- Update all blog posts to be published as "Editör" instead of "Dr. Uzman - specialist"
UPDATE public.blog_posts 
SET 
    author_name = 'Editör',
    author_type = 'admin'
WHERE author_name = 'Dr. Uzman' AND author_type = 'specialist';