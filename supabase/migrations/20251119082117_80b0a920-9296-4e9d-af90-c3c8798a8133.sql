-- Enable RLS on test_results if not already enabled
ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert test results (since tests can be taken by anonymous users)
CREATE POLICY "Anyone can insert test results"
ON test_results
FOR INSERT
TO public
WITH CHECK (true);

-- Allow users to view their own test results
CREATE POLICY "Users can view test results"
ON test_results
FOR SELECT
TO public
USING (true);