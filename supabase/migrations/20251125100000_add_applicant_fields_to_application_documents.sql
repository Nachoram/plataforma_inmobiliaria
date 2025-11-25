/*
  # Add Applicant Fields to Application Documents
  
  This migration adds fields to associate documents with specific applicants (postulants or guarantors)
  and track rejection reasons.
  
  1. Changes to application_documents:
    - Add applicant_id (uuid)
    - Add applicant_type (varchar)
    - Add rejection_reason (text)
*/

ALTER TABLE application_documents 
ADD COLUMN IF NOT EXISTS applicant_id uuid,
ADD COLUMN IF NOT EXISTS applicant_type varchar(50) CHECK (applicant_type IN ('postulant', 'guarantor')),
ADD COLUMN IF NOT EXISTS rejection_reason text;

CREATE INDEX IF NOT EXISTS idx_application_documents_applicant_id ON application_documents(applicant_id);

