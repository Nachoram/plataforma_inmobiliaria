/*
  # Create Storage Buckets and Policies

  1. Storage Buckets
    - `property-documents` - For property-related documents (photos, legal docs)
    - `user-documents` - For user profile documents (ID, commercial reports)

  2. Security Policies
    - Enable RLS on storage.objects
    - Allow authenticated users to upload files to their own folders
    - Allow users to read their own uploaded files
    - Restrict access based on user authentication

  3. Bucket Configuration
    - Private buckets for security
    - Proper file path structure with user ID prefixes
*/

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('property-documents', 'property-documents', false, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  ('user-documents', 'user-documents', false, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Authenticated users can upload property documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own property documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload user documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own user documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own property documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own user documents" ON storage.objects;

-- Policies for property-documents bucket
CREATE POLICY "Authenticated users can upload property documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'property-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view their own property documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'property-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own property documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'property-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policies for user-documents bucket
CREATE POLICY "Authenticated users can upload user documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view their own user documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'user-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own user documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);