-- Cleanup script to limit all vendor tags to maximum 3 tags
-- Run this in Supabase SQL Editor

-- Update planner_vendor_library to keep only first 3 tags
UPDATE planner_vendor_library
SET tags = tags[1:3]
WHERE array_length(tags, 1) > 3;

-- Verify the update
SELECT
  id,
  vendor_name,
  vendor_type,
  array_length(tags, 1) as tag_count,
  tags
FROM planner_vendor_library
WHERE tags IS NOT NULL
ORDER BY array_length(tags, 1) DESC NULLS LAST;
