-- Add CASCADE DELETE to test-related foreign keys so deleting a test also deletes related data

-- Drop existing foreign key constraints
ALTER TABLE test_questions 
DROP CONSTRAINT IF EXISTS test_questions_test_id_fkey;

ALTER TABLE test_results 
DROP CONSTRAINT IF EXISTS test_results_test_id_fkey;

-- Re-add foreign key constraints with CASCADE DELETE
ALTER TABLE test_questions
ADD CONSTRAINT test_questions_test_id_fkey 
FOREIGN KEY (test_id) 
REFERENCES tests(id) 
ON DELETE CASCADE;

ALTER TABLE test_results
ADD CONSTRAINT test_results_test_id_fkey 
FOREIGN KEY (test_id) 
REFERENCES tests(id) 
ON DELETE CASCADE;