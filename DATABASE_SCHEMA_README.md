# Real Estate Platform Database Schema & Forms

## Overview

This document describes the complete database schema and React forms for a real estate platform built with Supabase, following Third Normal Form (3NF) principles and Chilean real estate requirements.

## Database Schema

### Tables Created

1. **profiles** - Extended user profiles linked to Supabase Auth
2. **properties** - Central property listings with detailed information
3. **guarantors** - Guarantor/co-signer information for rental applications
4. **applications** - Rental applications with snapshot data preservation
5. **offers** - Purchase offers for properties
6. **documents** - Centralized document management system
7. **property_images** - Property image management
8. **user_favorites** - Many-to-many relationship for user favorites

### Key Features

- **Complete Normalization**: All tables follow 3NF principles
- **Chilean Address Structure**: Supports Chilean regions, communes, and RUT format
- **Snapshot Data Preservation**: Applications preserve applicant data at time of submission
- **Comprehensive RLS**: Row Level Security policies for all tables
- **Storage Integration**: Supabase Storage buckets for images and documents
- **Automatic Profile Creation**: Trigger creates user profiles on signup

## Installation & Setup

### 1. Apply Database Migration

```sql
-- Run the migration file in your Supabase SQL editor
-- File: supabase/migrations/20250101000000_complete_real_estate_schema.sql
```

### 2. Configure Supabase Authentication

In your Supabase dashboard:

1. **Authentication → URL Configuration**
   - Site URL: `https://your-domain.com` (production)
   - Redirect URLs: `http://localhost:5174/` (development)

2. **Authentication → Providers → Email**
   - Enable Email provider
   - **Disable "Confirm email"** for development (re-enable for production)

### 3. Environment Variables

```env
VITE_SUPABASE_URL=https://phnkervuiijqmapgswkc.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobmtlcnZ1aWlqcW1hcGdzd2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNzQ2MjUsImV4cCI6MjA3MjY1MDYyNX0.va6jOCJN6MnbHSbbDFJaO2rN_3oCSVQlaYaPkPmXS2w

## React Forms

### 1. PropertyPublicationForm.tsx

**Location**: `src/components/properties/PropertyPublicationForm.tsx`

**Features**:
- Complete property information form
- Chilean address structure support
- Multiple image upload to `property-images` bucket
- Document upload to `user-documents` bucket
- Price formatting in Chilean Pesos
- Edit mode for existing properties

**Usage**:
```tsx
import PropertyPublicationForm from './components/properties/PropertyPublicationForm';

// Create new property
<PropertyPublicationForm 
  onSuccess={(propertyId) => console.log('Property created:', propertyId)}
  onCancel={() => setShowForm(false)}
/>

// Edit existing property
<PropertyPublicationForm 
  propertyId="existing-property-id"
  initialData={propertyData}
  onSuccess={() => console.log('Property updated')}
  onCancel={() => setShowForm(false)}
/>
```

**Form Fields**:
- `listing_type`: 'venta' | 'arriendo'
- `address_street`, `address_number`, `address_department`, `address_commune`, `address_region`
- `price_clp`: Property price in Chilean Pesos
- `common_expenses_clp`: Monthly common expenses
- `bedrooms`, `bathrooms`, `surface_m2`
- `description`: Property description
- Images: Multiple image upload
- Documents: Legal documents upload

### 2. RentalApplicationForm.tsx

**Location**: `src/components/properties/RentalApplicationForm.tsx`

**Features**:
- Multi-step form (4 steps)
- Applicant information with snapshot preservation
- Optional guarantor information
- Document upload for both applicant and guarantor
- Chilean address structure
- RUT validation support

**Usage**:
```tsx
import RentalApplicationForm from './components/properties/RentalApplicationForm';

<RentalApplicationForm 
  propertyId="property-id"
  onSuccess={(applicationId) => console.log('Application submitted:', applicationId)}
  onCancel={() => setShowForm(false)}
/>
```

**Form Steps**:
1. **Personal Information**: Names, RUT, profession, income, age, nationality, marital status
2. **Address**: Complete Chilean address structure
3. **Guarantor**: Optional guarantor information with address
4. **Documents & Message**: Document uploads and message to property owner

**Snapshot Data**: The form preserves applicant data at the time of application in the `applications` table:
- `snapshot_applicant_profession`
- `snapshot_applicant_monthly_income_clp`
- `snapshot_applicant_age`
- `snapshot_applicant_nationality`
- `snapshot_applicant_marital_status`
- `snapshot_applicant_address_*` fields

### 3. UserProfileForm.tsx

**Location**: `src/components/profile/UserProfileForm.tsx`

**Features**:
- Complete user profile management
- Chilean address structure
- Document management (upload, view, delete)
- Marital status and property regime handling
- Auto-fill from existing profile data

**Usage**:
```tsx
import UserProfileForm from './components/profile/UserProfileForm';

<UserProfileForm 
  onSuccess={() => console.log('Profile updated')}
  onCancel={() => setShowForm(false)}
/>
```

**Form Sections**:
- **Personal Information**: Names, RUT, email, phone, profession, marital status
- **Address**: Complete Chilean address structure
- **Documents**: Upload, view, and manage user documents

## Database Relationships

### Entity Relationship Diagram

```
auth.users (1) ←→ (1) profiles
profiles (1) ←→ (N) properties
profiles (1) ←→ (N) applications
profiles (1) ←→ (N) offers
profiles (1) ←→ (N) documents
properties (1) ←→ (N) applications
properties (1) ←→ (N) offers
properties (1) ←→ (N) property_images
properties (1) ←→ (N) user_favorites
profiles (1) ←→ (N) user_favorites
guarantors (1) ←→ (N) applications
applications (1) ←→ (N) documents
```

### Key Relationships

1. **User Profile**: Each user has one profile with extended information
2. **Property Ownership**: Users can own multiple properties
3. **Applications**: Users can apply to multiple properties, properties can have multiple applications
4. **Guarantors**: Applications can have one guarantor (optional)
5. **Documents**: Centralized document management for all entities
6. **Favorites**: Many-to-many relationship between users and properties

## Storage Buckets

### 1. property-images (Public)
- **Purpose**: Property photos and images
- **Access**: Public read, authenticated upload
- **File Types**: JPEG, PNG, WebP, GIF
- **Size Limit**: 10MB per file
- **Path Structure**: `{property_id}/{timestamp}-{index}.{ext}`

### 2. user-documents (Private)
- **Purpose**: User documents, legal documents, application documents
- **Access**: Private, user-specific access
- **File Types**: PDF, DOC, DOCX, JPEG, PNG
- **Size Limit**: 50MB per file
- **Path Structure**: `{user_id}/{entity_type}/{entity_id}/{timestamp}-{filename}`

## Security (RLS Policies)

### Profiles
- Users can view, update, and insert their own profile only

### Properties
- Anyone can view active properties
- Users can manage their own properties (CRUD)

### Applications
- Users can view their own applications
- Property owners can view applications for their properties
- Users can create applications for themselves

### Offers
- Users can view their own offers
- Property owners can view offers for their properties
- Users can create offers for themselves

### Documents
- Users can manage their own documents
- Property owners can view documents related to their properties

### Storage
- Property images: Public read, owner-specific write
- User documents: User-specific access only

## Helper Functions

### Database Functions

1. **get_property_with_details(property_uuid)**
   - Returns complete property information with related data
   - Includes owner info, images count, applications count, offers count

2. **get_user_complete_profile(user_uuid)**
   - Returns complete user profile with statistics
   - Includes properties count, applications count, offers count, favorites count

### Views

1. **active_properties_view**
   - Pre-filtered view of active properties with owner information
   - Optimized for property listings

2. **applications_complete_view**
   - Complete application information with all related data
   - Includes property, applicant, and guarantor information

## Usage Examples

### Creating a Property

```tsx
const handlePropertySuccess = (propertyId: string) => {
  console.log('Property created with ID:', propertyId);
  // Redirect to property details or show success message
};

<PropertyPublicationForm 
  onSuccess={handlePropertySuccess}
  onCancel={() => setShowForm(false)}
/>
```

### Submitting a Rental Application

```tsx
const handleApplicationSuccess = (applicationId: string) => {
  console.log('Application submitted with ID:', applicationId);
  // Show success message or redirect
};

<RentalApplicationForm 
  propertyId={selectedProperty.id}
  onSuccess={handleApplicationSuccess}
  onCancel={() => setShowForm(false)}
/>
```

### Managing User Profile

```tsx
const handleProfileSuccess = () => {
  console.log('Profile updated successfully');
  // Refresh profile data or show success message
};

<UserProfileForm 
  onSuccess={handleProfileSuccess}
  onCancel={() => setShowForm(false)}
/>
```

## Data Validation

### Chilean RUT Format
- Format: `12.345.678-9`
- Validation should be implemented in the frontend

### Chilean Address Structure
- **Regions**: 16 Chilean regions
- **Communes**: Municipalities within regions
- **Street + Number**: Required
- **Department**: Optional (for apartments)

### Price Formatting
- All prices in Chilean Pesos (CLP)
- Use `Intl.NumberFormat('es-CL')` for formatting
- Example: `$150.000.000 CLP`

## Error Handling

All forms include comprehensive error handling:
- Database errors
- File upload errors
- Validation errors
- Network errors

Error messages are displayed in user-friendly format with specific guidance.

## Performance Considerations

### Indexes
- Strategic indexes on frequently queried columns
- Composite indexes for common query patterns
- Partial indexes for active records

### Storage
- Optimized file paths for efficient retrieval
- Separate buckets for different file types
- Appropriate file size limits

### Queries
- Views for common query patterns
- Helper functions for complex operations
- Efficient RLS policies

## Migration Notes

The database schema is designed to be applied to a fresh Supabase project. If you have existing data, you may need to:

1. Backup existing data
2. Apply the migration
3. Migrate existing data to the new schema
4. Update application code to use new field names

## Support

For questions or issues with the database schema or forms:

1. Check the Supabase logs for database errors
2. Verify RLS policies are correctly applied
3. Ensure storage buckets are properly configured
4. Check authentication configuration

## License

This database schema and forms are part of the real estate platform project and follow the same licensing terms.
