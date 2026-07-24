-- Add status column to hafalan_progress table
-- Status: 'lulus' = passed, 'ngulang' = needs repeat
ALTER TABLE hafalan_progress
ADD COLUMN IF NOT EXISTS status text DEFAULT 'lulus' CHECK (status IN ('lulus', 'ngulang'));
