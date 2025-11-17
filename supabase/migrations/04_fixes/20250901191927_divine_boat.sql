/*
  # Create User Profiles Table for Auto-fill Functionality

  1. New Tables
    - `user_profiles`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - Personal data fields (name, rut, profession, etc.)
      - Address fields (address, apartment_number, region, commune)
      - Contact fields (email, phone)
      - Work-related fields (company, income, seniority)
      - Document URLs (id_document_url, commercial_report_url)
      - Guarantor data fields (same structure as personal data)
      - `created_at` and `updated_at` timestamps

  2. Security
    - Enable RLS on `user_profiles` table
    - Add policies for users to manage their own profiles
*/

CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Personal Data
  full_name text,
  rut text,
  profession text,
  company text,
  monthly_income numeric DEFAULT 0,
  work_seniority text,
  contact_email text,
  contact_phone text,
  
  -- Address
  address text,
  apartment_number text,
  region text,
  commune text,
  
  -- Documents
  id_document_url text,
  commercial_report_url text,
  
  -- Guarantor Data
  guarantor_full_name text,
  guarantor_rut text,
  guarantor_profession text,
  guarantor_company text,
  guarantor_monthly_income numeric DEFAULT 0,
  guarantor_work_seniority text,
  guarantor_contact_email text,
  guarantor_contact_phone text,
  
  -- Guarantor Address
  guarantor_address text,
  guarantor_apartment_number text,
  guarantor_region text,
  guarantor_commune text,
  
  -- Guarantor Documents
  guarantor_id_document_url text,
  guarantor_commercial_report_url text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create unique index on user_id
CREATE UNIQUE INDEX IF NOT EXISTS user_profiles_user_id_idx ON user_profiles(user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();