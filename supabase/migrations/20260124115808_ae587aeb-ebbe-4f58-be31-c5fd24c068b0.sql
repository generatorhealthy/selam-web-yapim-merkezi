-- Update accounting-documents bucket to allow larger files (500MB)
UPDATE storage.buckets 
SET file_size_limit = 524288000  -- 500MB in bytes
WHERE id = 'accounting-documents';