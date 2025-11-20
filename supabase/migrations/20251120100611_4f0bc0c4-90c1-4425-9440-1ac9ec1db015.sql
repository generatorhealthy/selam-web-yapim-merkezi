-- Allow specialists to delete test questions for their own tests

-- Drop existing foreign key and add it back with CASCADE
ALTER TABLE test_questions 
DROP CONSTRAINT IF EXISTS test_questions_test_id_fkey;

ALTER TABLE test_questions
ADD CONSTRAINT test_questions_test_id_fkey 
FOREIGN KEY (test_id) 
REFERENCES tests(id) 
ON DELETE CASCADE;

-- Drop the existing DELETE policy if it exists
DROP POLICY IF EXISTS "Specialists can delete their own test questions" ON test_questions;

-- Add DELETE policy for test_questions
-- Specialists can delete questions if they own the test
CREATE POLICY "Specialists can delete their own test questions"
ON test_questions
FOR DELETE
USING (
  test_id IN (
    SELECT id FROM tests
    WHERE specialist_id = auth.uid()
  )
);