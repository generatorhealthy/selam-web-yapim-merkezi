-- Fix RLS policies for tests deletion
-- Drop the existing DELETE policy
DROP POLICY IF EXISTS "Specialists can delete their own tests" ON tests;

-- Create correct DELETE policy that joins with specialists table
CREATE POLICY "Specialists can delete their own tests"
ON tests
FOR DELETE
USING (
  specialist_id IN (
    SELECT id FROM specialists
    WHERE user_id = auth.uid()
  )
);