-- Tests tablosundaki specialist_id foreign key'ini önce kaldır
ALTER TABLE tests DROP CONSTRAINT IF EXISTS tests_specialist_id_fkey;

-- Cascade delete ile yeniden oluştur - uzman silindiğinde testleri de silinecek
ALTER TABLE tests 
ADD CONSTRAINT tests_specialist_id_fkey 
FOREIGN KEY (specialist_id) 
REFERENCES specialists(id) 
ON DELETE CASCADE;

-- Test questions tablosundaki test_id foreign key'ini de cascade delete yap
ALTER TABLE test_questions DROP CONSTRAINT IF EXISTS test_questions_test_id_fkey;

ALTER TABLE test_questions 
ADD CONSTRAINT test_questions_test_id_fkey 
FOREIGN KEY (test_id) 
REFERENCES tests(id) 
ON DELETE CASCADE;

-- Test results tablosundaki specialist_id foreign key'ini de cascade delete yap
ALTER TABLE test_results DROP CONSTRAINT IF EXISTS test_results_specialist_id_fkey;

ALTER TABLE test_results 
ADD CONSTRAINT test_results_specialist_id_fkey 
FOREIGN KEY (specialist_id) 
REFERENCES specialists(id) 
ON DELETE CASCADE;