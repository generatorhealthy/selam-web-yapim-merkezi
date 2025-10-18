-- Create blog_notifications table for specialist blog post notifications
CREATE TABLE IF NOT EXISTS public.blog_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  specialist_id UUID NOT NULL REFERENCES public.specialists(id) ON DELETE CASCADE,
  blog_post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.blog_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Specialists can only see their own notifications
CREATE POLICY "Specialists can view their own blog notifications"
ON public.blog_notifications
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.specialists s
    WHERE s.id = blog_notifications.specialist_id 
    AND s.user_id = auth.uid()
  )
);

-- Specialists can update their own notifications (mark as read)
CREATE POLICY "Specialists can update their own blog notifications"
ON public.blog_notifications
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.specialists s
    WHERE s.id = blog_notifications.specialist_id 
    AND s.user_id = auth.uid()
  )
);

-- Admins can insert notifications
CREATE POLICY "Admins can insert blog notifications"
ON public.blog_notifications
FOR INSERT
WITH CHECK (is_admin_user() OR is_admin_or_staff_user());

-- Create index for faster queries
CREATE INDEX idx_blog_notifications_specialist_id ON public.blog_notifications(specialist_id);
CREATE INDEX idx_blog_notifications_read ON public.blog_notifications(read);

-- Add trigger for updated_at
CREATE TRIGGER update_blog_notifications_updated_at
BEFORE UPDATE ON public.blog_notifications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();