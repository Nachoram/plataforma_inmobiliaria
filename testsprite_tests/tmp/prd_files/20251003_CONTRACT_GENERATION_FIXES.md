# Contract Generation Fixes - October 3, 2025

## Issues Identified and Fixed

### 1. PostgREST 400 Bad Request Error
**Problem**: Invalid syntax in select query parameter `profiles!properties_owner_id_fkey(...)`

**Root Cause**: The `!` character is not valid PostgREST syntax for nested relationships.

**Fix**: Removed the `!properties_owner_id_fkey` from the profiles join in `contractGenerator.ts`.

**Before**:
```typescript
profiles!properties_owner_id_fkey (
  first_name,
  paternal_last_name,
  maternal_last_name,
  rut,
  email,
  phone
)
```

**After**:
```typescript
profiles (
  first_name,
  paternal_last_name,
  maternal_last_name,
  rut,
  email,
  phone
)
```

### 2. PGRST200 Relationship Error
**Problem**: "Could not find a relationship between 'applications' and 'applicants' in the schema cache"

**Root Cause**: Incorrect PostgREST syntax for foreign key relationships.

**Fix**: Updated the relationship syntax to use the correct PostgREST format.

**Before**:
```typescript
structured_applicant:applicants (
  id,
  full_name,
  rut,
  contact_email,
  contact_phone,
  profession,
  company
),
structured_guarantor:guarantors (
  id,
  full_name,
  rut,
  contact_email,
  contact_phone,
  profession,
  company
),
```

**After**:
```typescript
structured_applicant (
  id,
  full_name,
  rut,
  contact_email,
  contact_phone,
  profession,
  company
),
structured_guarantor (
  id,
  full_name,
  rut,
  contact_email,
  contact_phone,
  profession,
  company
),
```

### 3. Missing Database Schema Columns
**Problem**: `structured_applicant_id` and `structured_guarantor_id` columns might not exist in the applications table.

**Fix**: Created migration `20251003160000_ensure_structured_relationships.sql` to ensure these columns exist with proper foreign key constraints.

## Files Modified

1. **`src/lib/contractGenerator.ts`**:
   - Fixed PostgREST select query syntax
   - Corrected foreign key relationship syntax

2. **`20251003160000_ensure_structured_relationships.sql`** (NEW):
   - Ensures `structured_applicant_id` column exists with FK to applicants
   - Ensures `structured_guarantor_id` column exists with FK to guarantors
   - Creates performance indexes
   - Verifies foreign key constraints

3. **`check_applications_columns.sql`** (NEW):
   - Diagnostic query to check column existence

## Deployment Instructions

### Step 1: Apply Database Migration
Run the migration to ensure schema is correct:

```sql
-- Apply the new migration
\i 20251003160000_ensure_structured_relationships.sql
```

Or if using Supabase CLI:
```bash
supabase db push
```

### Step 2: Restart PostgREST
If you're using a self-hosted PostgREST instance, restart it to refresh the schema cache:

```bash
# Restart your PostgREST service
sudo systemctl restart postgrest
```

### Step 3: Test Contract Generation
1. Navigate to an application in your frontend
2. Try to approve the application (this should trigger contract generation)
3. Check browser console for errors
4. Verify contract is created successfully

### Step 4: Run Diagnostic Queries
Use the diagnostic SQL file to verify your schema:

```sql
\i check_applications_columns.sql
```

Expected output should show:
- `structured_applicant_id` (uuid, nullable)
- `structured_guarantor_id` (uuid, nullable)

## PostgREST Relationship Syntax Reference

For future reference, correct PostgREST syntax for foreign keys:

- **Foreign Key Column**: `structured_applicant_id` (references applicants.id)
- **PostgREST Access**: `structured_applicant(column1, column2)`
- **NOT**: `structured_applicant:applicants(column1, column2)`
- **NOT**: `structured_applicant!fk_name(column1, column2)`

## Testing Checklist

- [ ] Database migration applied successfully
- [ ] PostgREST restarted (if self-hosted)
- [ ] No 400 Bad Request errors in browser console
- [ ] No PGRST200 relationship errors
- [ ] Contract generation completes without warnings
- [ ] Contract appears in rental_contracts table

## Troubleshooting

### If 400 Bad Request persists:
1. Check browser network tab for exact request URL
2. Verify the select parameter encoding
3. Ensure all column names exist in referenced tables

### If PGRST200 error persists:
1. Verify foreign key constraints exist in database
2. Check that referenced tables (applicants, guarantors) exist
3. Ensure PostgREST can see the schema changes

### If contract generation still fails:
1. Check that application has rental_contract_conditions
2. Verify structured_applicant and structured_guarantor data exists
3. Check RLS policies allow the operations

## Summary

These fixes address the root causes of the Supabase query errors:
- ✅ Corrected PostgREST select syntax
- ✅ Fixed foreign key relationship queries
- ✅ Ensured database schema has required columns
- ✅ Created migration for schema consistency

The contract generation should now work without the previous errors.
