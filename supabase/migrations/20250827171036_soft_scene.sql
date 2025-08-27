/*
  # Real Estate Platform Database Schema

  1. New Tables
    - `profiles` - User profile information
    - `properties` - Property listings (sale/rent)
    - `applications` - Rental applications
    - `offers` - Purchase offers

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Proper foreign key relationships

  3. Features
    - Support for both sale and rental properties
    - Application system for rentals
    - Offer system for sales
    - File storage for photos and documents
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  full_name text,
  contact_email text,
  contact_phone text,
  created_at timestamptz DEFAULT now()
);

-- Create properties table
CREATE TABLE IF NOT EXISTS properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES profiles(id),
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

-- Create applications table (for rental properties)
CREATE TABLE IF NOT EXISTS applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id),
  applicant_id uuid NOT NULL REFERENCES profiles(id),
  message text,
  status text DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'aprobada', 'rechazada')),
  created_at timestamptz DEFAULT now()
);

-- Create offers table (for sale properties)
CREATE TABLE IF NOT EXISTS offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id),
  buyer_id uuid NOT NULL REFERENCES profiles(id),
  offer_amount numeric NOT NULL,
  message text,
  status text DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'aceptada', 'rechazada')),
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Properties policies
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

-- Applications policies
CREATE POLICY "Users can read their own applications"
  ON applications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = applicant_id);

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

CREATE POLICY "Users can create applications"
  ON applications
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = applicant_id);

-- Offers policies
CREATE POLICY "Users can read their own offers"
  ON offers
  FOR SELECT
  TO authenticated
  USING (auth.uid() = buyer_id);

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

CREATE POLICY "Users can create offers"
  ON offers
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = buyer_id);