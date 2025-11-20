-- Remove duplicate DELETE policies on tests table
DROP POLICY IF EXISTS "Specialists can delete their own tests" ON tests;
DROP POLICY IF EXISTS "Tests delete policy" ON tests;

-- Create single comprehensive DELETE policy
CREATE POLICY "Tests delete policy"
ON tests
FOR DELETE
USING (
  is_admin_user() OR (
    specialist_id IN (
      SELECT id FROM specialists
      WHERE user_id = auth.uid()
    )
  )
);