-- Create prospective_registrations table
CREATE TABLE public.prospective_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  consultant_name TEXT NOT NULL,
  consultant_surname TEXT NOT NULL,
  consultant_phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'payment_pending' CHECK (status IN ('payment_pending', 'order_pending', 'cancelled', 'completed')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.prospective_registrations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admin and staff can manage prospective registrations"
ON public.prospective_registrations
FOR ALL
TO authenticated
USING (is_admin_user() OR is_admin_or_staff_user())
WITH CHECK (is_admin_user() OR is_admin_or_staff_user());

-- Create trigger for updated_at
CREATE TRIGGER update_prospective_registrations_updated_at
BEFORE UPDATE ON public.prospective_registrations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();