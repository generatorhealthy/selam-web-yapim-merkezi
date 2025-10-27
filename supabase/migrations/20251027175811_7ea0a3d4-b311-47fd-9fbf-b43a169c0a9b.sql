-- Social media shares tracking table
CREATE TABLE IF NOT EXISTS public.social_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  blog_post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('twitter', 'linkedin', 'pinterest', 'ghost', 'kooplog', 'tumblr')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
  shared_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.social_shares ENABLE ROW LEVEL SECURITY;

-- Admin and staff can view all shares
CREATE POLICY "Admin and staff can view all social shares"
ON public.social_shares
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.role IN ('admin', 'staff')
  )
);

-- Admin and staff can insert shares
CREATE POLICY "Admin and staff can insert social shares"
ON public.social_shares
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.role IN ('admin', 'staff')
  )
);

-- Admin and staff can update shares
CREATE POLICY "Admin and staff can update social shares"
ON public.social_shares
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.role IN ('admin', 'staff')
  )
);

-- Create index for better performance
CREATE INDEX idx_social_shares_blog_post_id ON public.social_shares(blog_post_id);
CREATE INDEX idx_social_shares_platform ON public.social_shares(platform);
CREATE INDEX idx_social_shares_status ON public.social_shares(status);

-- Update trigger for updated_at
CREATE TRIGGER update_social_shares_updated_at
BEFORE UPDATE ON public.social_shares
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
