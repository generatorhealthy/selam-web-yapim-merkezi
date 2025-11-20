-- Create comprehensive DELETE policies for test-related tables

-- test_questions table DELETE policy
DROP POLICY IF EXISTS "Test questions delete policy" ON test_questions;
CREATE POLICY "Test questions delete policy"
ON test_questions
FOR DELETE
USING (
  is_admin_user() OR (
    test_id IN (
      SELECT t.id FROM tests t
      INNER JOIN specialists s ON s.id = t.specialist_id
      WHERE s.user_id = auth.uid()
    )
  )
);

-- test_results table DELETE policy
DROP POLICY IF EXISTS "Test results delete policy" ON test_results;
CREATE POLICY "Test results delete policy"
ON test_results
FOR DELETE
USING (
  is_admin_user() OR (
    specialist_id IN (
      SELECT id FROM specialists
      WHERE user_id = auth.uid()
    )
  )
);