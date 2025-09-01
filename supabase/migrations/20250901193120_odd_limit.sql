/*
  # Create user-documents storage bucket

  1. Storage Setup
    - Create 'user-documents' bucket for user document uploads
    - Set bucket as private for security
    - Enable RLS on the bucket

  2. Security Policies
    - Allow authenticated users to upload their own documents
    - Allow users to read their own documents
    - Allow users to delete their own documents
    - Restrict access based on user ID in file path
*/

-- Create the user-documents bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-documents',
  'user-documents',
  false,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
);

-- Enable RLS on the bucket
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to upload files to their own folder
CREATE POLICY "Users can upload own documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow users to read their own documents
CREATE POLICY "Users can read own documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'user-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow users to delete their own documents
CREATE POLICY "Users can delete own documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow users to update their own documents
CREATE POLICY "Users can update own documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'user-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);