/*
  # Create visit requests table

  1. New Tables
    - `visit_requests`
      - `id` (uuid, primary key)
      - `property_id` (uuid, foreign key to properties)
      - `user_id` (uuid, foreign key to profiles)
      - `requested_date` (date)
      - `requested_time_slot` (text)
      - `message` (text, optional)
      - `status` (text, default 'pending')
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `visit_requests` table
    - Add policies for users to create and read their own visit requests
    - Add policies for property owners to read visit requests for their properties
*/

CREATE TABLE IF NOT EXISTS visit_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  requested_date date NOT NULL,
  requested_time_slot text NOT NULL CHECK (requested_time_slot IN ('morning', 'afternoon', 'flexible')),
  message text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected', 'completed')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE visit_requests ENABLE ROW LEVEL SECURITY;

-- Users can create visit requests
CREATE POLICY "Users can create visit requests"
  ON visit_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can read their own visit requests
CREATE POLICY "Users can read own visit requests"
  ON visit_requests
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Property owners can read visit requests for their properties
CREATE POLICY "Property owners can read visit requests for their properties"
  ON visit_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties 
      WHERE properties.id = visit_requests.property_id 
      AND properties.owner_id = auth.uid()
    )
  );

-- Property owners can update visit requests for their properties
CREATE POLICY "Property owners can update visit requests for their properties"
  ON visit_requests
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties 
      WHERE properties.id = visit_requests.property_id 
      AND properties.owner_id = auth.uid()
    )
  );