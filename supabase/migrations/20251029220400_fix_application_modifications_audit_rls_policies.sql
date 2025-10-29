-- Fix RLS policies for application_modifications and application_audit_log
-- to allow broader access similar to the applications table

-- Update application_modifications RLS policies
DROP POLICY IF EXISTS "Users can view modifications for their properties" ON application_modifications;
DROP POLICY IF EXISTS "Only system can insert modifications" ON application_modifications;

-- Allow property owners and applicants to view modifications for their applications
CREATE POLICY "Property owners and applicants can view modifications" ON application_modifications
    FOR SELECT USING (
        property_id IN (
            SELECT id FROM properties WHERE owner_id = auth.uid()
        ) OR application_id IN (
            SELECT id FROM applications WHERE applicant_id = auth.uid()
        )
    );

-- Allow property owners to insert modifications for their applications
CREATE POLICY "Property owners can insert modifications for their applications" ON application_modifications
    FOR INSERT WITH CHECK (
        property_id IN (
            SELECT id FROM properties WHERE owner_id = auth.uid()
        )
    );

-- Update application_audit_log RLS policies
DROP POLICY IF EXISTS "Users can view audit logs for their properties" ON application_audit_log;
DROP POLICY IF EXISTS "Only system can insert audit logs" ON application_audit_log;

-- Allow property owners and applicants to view audit logs for their applications
CREATE POLICY "Property owners and applicants can view audit logs" ON application_audit_log
    FOR SELECT USING (
        property_id IN (
            SELECT id FROM properties WHERE owner_id = auth.uid()
        ) OR application_id IN (
            SELECT id FROM applications WHERE applicant_id = auth.uid()
        )
    );

-- Allow property owners to insert audit logs for their applications
CREATE POLICY "Property owners can insert audit logs for their applications" ON application_audit_log
    FOR INSERT WITH CHECK (
        property_id IN (
            SELECT id FROM properties WHERE owner_id = auth.uid()
        )
    );

-- Grant necessary permissions
GRANT SELECT ON application_modifications TO authenticated;
GRANT SELECT ON application_audit_log TO authenticated;
