-- Update the appointments SELECT policy to allow staff members to view appointments
DROP POLICY IF EXISTS "Specialists can view their appointments" ON appointments;

CREATE POLICY "Specialists and staff can view appointments"
ON appointments
FOR SELECT
USING (
  (EXISTS (
    SELECT 1
    FROM specialists
    WHERE specialists.id = appointments.specialist_id 
    AND specialists.user_id = auth.uid()
  )) 
  OR is_admin_user() 
  OR is_admin_or_staff_user()
);