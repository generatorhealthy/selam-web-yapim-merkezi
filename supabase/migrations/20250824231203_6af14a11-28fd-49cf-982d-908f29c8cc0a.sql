-- Add a column to track if appointment was created by specialist
ALTER TABLE appointments ADD COLUMN created_by_specialist BOOLEAN DEFAULT FALSE;

-- Update existing appointments to be false (created by public/admin)
UPDATE appointments SET created_by_specialist = FALSE WHERE created_by_specialist IS NULL;