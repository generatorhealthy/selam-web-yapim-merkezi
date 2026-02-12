
-- Create specialist_applications table for tracking incoming specialist registrations
CREATE TABLE public.specialist_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  specialty TEXT,
  city TEXT,
  experience TEXT,
  education TEXT,
  about TEXT,
  subject TEXT,
  message TEXT,
  source TEXT NOT NULL DEFAULT 'registration_form',
  status TEXT NOT NULL DEFAULT 'yeni',
  handled_by TEXT,
  handled_by_user_id UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.specialist_applications ENABLE ROW LEVEL SECURITY;

-- Admin and staff can view all applications
CREATE POLICY "Admin and staff can view applications"
ON public.specialist_applications
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_profiles.user_id = auth.uid()
    AND user_profiles.role IN ('admin', 'staff')
    AND user_profiles.is_approved = true
  )
);

-- Admin and staff can update applications (status, notes, handled_by)
CREATE POLICY "Admin and staff can update applications"
ON public.specialist_applications
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_profiles.user_id = auth.uid()
    AND user_profiles.role IN ('admin', 'staff')
    AND user_profiles.is_approved = true
  )
);

-- Anyone can insert (from public forms)
CREATE POLICY "Anyone can submit applications"
ON public.specialist_applications
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Admin can delete
CREATE POLICY "Admin can delete applications"
ON public.specialist_applications
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_profiles.user_id = auth.uid()
    AND user_profiles.role = 'admin'
    AND user_profiles.is_approved = true
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_specialist_applications_updated_at
BEFORE UPDATE ON public.specialist_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
