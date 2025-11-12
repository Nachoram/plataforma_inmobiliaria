-- Add has_auto_renewal_clause column to rental_contracts table
-- This column indicates whether the contract includes an automatic renewal clause

ALTER TABLE rental_contracts
ADD COLUMN has_auto_renewal_clause boolean NOT NULL DEFAULT false;

-- Add comment to the column
COMMENT ON COLUMN rental_contracts.has_auto_renewal_clause IS 'Indicates if the contract includes an automatic renewal clause that allows renewal for the same period under the same conditions unless otherwise notified';

