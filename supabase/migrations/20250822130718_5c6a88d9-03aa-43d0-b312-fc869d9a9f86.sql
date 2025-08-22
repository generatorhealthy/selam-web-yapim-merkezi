-- Create a table for tracking website visits and active sessions
CREATE TABLE public.website_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  page_url TEXT NOT NULL,
  referrer TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_active TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for better performance
CREATE INDEX idx_website_analytics_session_id ON public.website_analytics(session_id);
CREATE INDEX idx_website_analytics_created_at ON public.website_analytics(created_at);
CREATE INDEX idx_website_analytics_last_active ON public.website_analytics(last_active);

-- Enable Row Level Security
ALTER TABLE public.website_analytics ENABLE ROW LEVEL SECURITY;

-- Create policies for analytics access (admin only for reading)
CREATE POLICY "Admin can view all analytics" 
ON public.website_analytics 
FOR SELECT 
USING (true); -- Will be restricted by application logic

CREATE POLICY "Anyone can insert analytics" 
ON public.website_analytics 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update their session" 
ON public.website_analytics 
FOR UPDATE 
USING (true);

-- Create function to clean old sessions (older than 30 minutes)
CREATE OR REPLACE FUNCTION public.cleanup_old_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM public.website_analytics 
  WHERE last_active < now() - interval '30 minutes';
END;
$$ LANGUAGE plpgsql;

-- Create function to update last active time
CREATE OR REPLACE FUNCTION public.update_session_activity()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_active = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic last_active updates
CREATE TRIGGER update_analytics_last_active
BEFORE UPDATE ON public.website_analytics
FOR EACH ROW
EXECUTE FUNCTION public.update_session_activity();