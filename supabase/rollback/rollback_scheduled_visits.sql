-- Rollback migration: Remove scheduled_visits table and related objects

-- Drop triggers
DROP TRIGGER IF EXISTS trigger_update_scheduled_visits_updated_at ON scheduled_visits;
DROP TRIGGER IF EXISTS trigger_update_scheduled_visit ON visit_requests;
DROP TRIGGER IF EXISTS trigger_create_scheduled_visit ON visit_requests;

-- Drop functions
DROP FUNCTION IF EXISTS update_scheduled_visits_updated_at();
DROP FUNCTION IF EXISTS update_scheduled_visit();
DROP FUNCTION IF EXISTS create_scheduled_visit_from_request();

-- Drop policies
DROP POLICY IF EXISTS "Users can view visits they're involved in" ON scheduled_visits;
DROP POLICY IF EXISTS "Users can create visits for properties they own" ON scheduled_visits;
DROP POLICY IF EXISTS "Authorized users can update visits" ON scheduled_visits;

-- Drop indexes
DROP INDEX IF EXISTS idx_scheduled_visits_visit_request;
DROP INDEX IF EXISTS idx_scheduled_visits_assigned_agent;
DROP INDEX IF EXISTS idx_scheduled_visits_status;
DROP INDEX IF EXISTS idx_scheduled_visits_visitor_email;
DROP INDEX IF EXISTS idx_scheduled_visits_property_date;

-- Drop table
DROP TABLE IF EXISTS scheduled_visits;



