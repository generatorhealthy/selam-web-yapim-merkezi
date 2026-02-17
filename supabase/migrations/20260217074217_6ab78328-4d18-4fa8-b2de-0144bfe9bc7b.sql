
-- Staff attendance tracking table
CREATE TABLE public.staff_attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  staff_name TEXT NOT NULL,
  check_in TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  check_out TIMESTAMPTZ,
  work_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, work_date)
);

ALTER TABLE public.staff_attendance ENABLE ROW LEVEL SECURITY;

-- Staff can see their own records
CREATE POLICY "Staff can view own attendance"
ON public.staff_attendance FOR SELECT
USING (auth.uid() = user_id OR public.is_admin_user());

-- Staff can insert their own check-in
CREATE POLICY "Staff can check in"
ON public.staff_attendance FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Staff can update their own record (for check-out)
CREATE POLICY "Staff can check out"
ON public.staff_attendance FOR UPDATE
USING (auth.uid() = user_id OR public.is_admin_user());

-- Admin can delete records
CREATE POLICY "Admin can delete attendance"
ON public.staff_attendance FOR DELETE
USING (public.is_admin_user());

-- Trigger for updated_at
CREATE TRIGGER update_staff_attendance_updated_at
BEFORE UPDATE ON public.staff_attendance
FOR EACH ROW
EXECUTE FUNCTION public.safe_timestamp_update();
