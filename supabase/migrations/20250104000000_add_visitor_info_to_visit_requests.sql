-- Add visitor information fields to visit_requests table
-- This allows storing visitor contact details for property visits

-- Add visitor information columns
ALTER TABLE visit_requests
ADD COLUMN IF NOT EXISTS visitor_name text,
ADD COLUMN IF NOT EXISTS visitor_email text,
ADD COLUMN IF NOT EXISTS visitor_phone text;

-- Add comments for the new columns
COMMENT ON COLUMN visit_requests.visitor_name IS 'Full name of the person requesting the visit';
COMMENT ON COLUMN visit_requests.visitor_email IS 'Email address of the person requesting the visit';
COMMENT ON COLUMN visit_requests.visitor_phone IS 'Phone number of the person requesting the visit';

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_visit_requests_visitor_email ON visit_requests(visitor_email);
CREATE INDEX IF NOT EXISTS idx_visit_requests_visitor_phone ON visit_requests(visitor_phone);

-- Update existing records to populate visitor info from user profiles if available
-- This is optional and only runs if the profiles table has the necessary data
UPDATE visit_requests
SET
  visitor_name = COALESCE(visitor_name, profiles.first_name || ' ' || COALESCE(profiles.paternal_last_name, '')),
  visitor_email = COALESCE(visitor_email, profiles.email),
  visitor_phone = COALESCE(visitor_phone, profiles.phone)
FROM profiles
WHERE visit_requests.user_id = profiles.id
AND (visit_requests.visitor_name IS NULL OR visit_requests.visitor_email IS NULL OR visit_requests.visitor_phone IS NULL);

-- Add validation constraints
ALTER TABLE visit_requests
ADD CONSTRAINT check_visitor_email_format CHECK (
  visitor_email IS NULL OR
  visitor_email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
);

ALTER TABLE visit_requests
ADD CONSTRAINT check_visitor_phone_format CHECK (
  visitor_phone IS NULL OR
  visitor_phone ~ '^[0-9+\-\s()]+$'
);



