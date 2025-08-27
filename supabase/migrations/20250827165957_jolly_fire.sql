/*
  # Real Estate Platform Database Schema

  1. New Tables
    - `profiles` - User profiles linked to Supabase Auth
      - `id` (uuid, primary key, references auth.users.id)
      - `full_name` (text)
      - `contact_email` (text) 
      - `contact_phone` (text)
      - `created_at` (timestamp)
    
    - `properties` - Property listings
      - `id` (uuid, primary key)
      - `owner_id` (uuid, references profiles.id)
      - `listing_type` (text, "venta" or "arriendo")
      - `address`, `city`, `country` (text)
      - `description` (text)
      - `price` (numeric)
      - `bedrooms`, `bathrooms`, `area_sqm` (integers)
      - `photos_urls`, `documents_urls` (text arrays)
      - `status` (text, "disponible", "vendida", "arrendada")
      - `created_at` (timestamp)
    
    - `applications` - Rental applications
      - `id` (uuid, primary key)
      - `property_id`, `applicant_id` (uuid, foreign keys)
      - `message` (text)
      - `status` (text, "pendiente", "aprobada", "rechazada")
      - `created_at` (timestamp)
    
    - `offers` - Purchase offers
      - `id` (uuid, primary key)
      - `property_id`, `buyer_id` (uuid, foreign keys)
      - `offer_amount` (numeric)
      - `message` (text)
      - `status` (text, "pendiente", "aceptada", "rechazada")
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Public read access for available properties
*/

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  full_name text,
  contact_email text,
  contact_phone text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Properties table
CREATE TABLE IF NOT EXISTS properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES profiles(id) NOT NULL,
  listing_type text NOT NULL CHECK (listing_type IN ('venta', 'arriendo')),
  address text NOT NULL,
  city text NOT NULL,
  country text NOT NULL DEFAULT 'Chile',
  description text,
  price numeric NOT NULL,
  bedrooms integer DEFAULT 0,
  bathrooms integer DEFAULT 0,
  area_sqm integer,
  photos_urls text[] DEFAULT '{}',
  documents_urls text[] DEFAULT '{}',
  status text DEFAULT 'disponible' CHECK (status IN ('disponible', 'vendida', 'arrendada')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read available properties"
  ON properties
  FOR SELECT
  TO anon, authenticated
  USING (status = 'disponible');

CREATE POLICY "Users can read own properties"
  ON properties
  FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert own properties"
  ON properties
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own properties"
  ON properties
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own properties"
  ON properties
  FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- Applications table
CREATE TABLE IF NOT EXISTS applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) NOT NULL,
  applicant_id uuid REFERENCES profiles(id) NOT NULL,
  message text,
  status text DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'aprobada', 'rechazada')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Property owners can read applications for their properties"
  ON applications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties 
      WHERE properties.id = applications.property_id 
      AND properties.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can read their own applications"
  ON applications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = applicant_id);

CREATE POLICY "Users can create applications"
  ON applications
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = applicant_id);

-- Offers table
CREATE TABLE IF NOT EXISTS offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) NOT NULL,
  buyer_id uuid REFERENCES profiles(id) NOT NULL,
  offer_amount numeric NOT NULL,
  message text,
  status text DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'aceptada', 'rechazada')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Property owners can read offers for their properties"
  ON offers
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties 
      WHERE properties.id = offers.property_id 
      AND properties.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can read their own offers"
  ON offers
  FOR SELECT
  TO authenticated
  USING (auth.uid() = buyer_id);

CREATE POLICY "Users can create offers"
  ON offers
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = buyer_id);

-- Create storage buckets for file uploads
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('property-photos', 'property-photos', true),
  ('property-documents', 'property-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Authenticated users can upload property photos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'property-photos');

CREATE POLICY "Anyone can view property photos"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'property-photos');

CREATE POLICY "Users can delete their own property photos"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'property-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Authenticated users can upload property documents"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'property-documents');

CREATE POLICY "Property owners can view documents"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'property-documents' AND auth.uid()::text = (storage.foldername(name))[1]);