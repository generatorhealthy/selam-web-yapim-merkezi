-- Create call_reports table for daily call tracking
CREATE TABLE public.call_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_date DATE NOT NULL,
  employee_name TEXT NOT NULL,
  report_type TEXT NOT NULL CHECK (report_type IN ('danisan', 'danisma')),
  
  -- Danışan fields
  danisan_acmadi INTEGER DEFAULT 0,
  danisan_vazgecti INTEGER DEFAULT 0,
  danisan_yanlis INTEGER DEFAULT 0,
  danisan_yonlendirme INTEGER DEFAULT 0,
  
  -- Danışman fields
  danisma_acmadi INTEGER DEFAULT 0,
  danisma_bilgi_verildi INTEGER DEFAULT 0,
  danisma_kayit INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.call_reports ENABLE ROW LEVEL SECURITY;

-- Admin and staff can view all reports
CREATE POLICY "Admin and staff can view call reports"
ON public.call_reports
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'staff')
    AND is_approved = true
  )
);

-- Admin and staff can insert reports
CREATE POLICY "Admin and staff can insert call reports"
ON public.call_reports
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'staff')
    AND is_approved = true
  )
);

-- Admin and staff can update reports
CREATE POLICY "Admin and staff can update call reports"
ON public.call_reports
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'staff')
    AND is_approved = true
  )
);

-- Admin can delete reports
CREATE POLICY "Admin can delete call reports"
ON public.call_reports
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_id = auth.uid()
    AND role = 'admin'
    AND is_approved = true
  )
);

-- Create index for faster queries
CREATE INDEX idx_call_reports_date ON public.call_reports(report_date);
CREATE INDEX idx_call_reports_employee ON public.call_reports(employee_name);
CREATE INDEX idx_call_reports_type ON public.call_reports(report_type);

-- Trigger for updated_at
CREATE TRIGGER update_call_reports_updated_at
BEFORE UPDATE ON public.call_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();