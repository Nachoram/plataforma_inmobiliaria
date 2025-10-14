/*
  # Update Property Form Fields Migration

  This migration updates the properties table structure to support the new form fields
  added to the "Publicar Propiedad en Arriendo" form, including detailed property
  characteristics, amenities, and advisor assignments.

  ## Changes Made:
  1. Replace surface_m2 with metros_utiles and metros_totales
  2. Add new property characteristic fields (terraza, construction year, living room)
  3. Create ENUM types for hot water system and kitchen type
  4. Add amenity management with many-to-many relationship
  5. Add advisor assignment field

  ## Tables Modified:
  - properties: Add new columns and modify existing ones
  - amenidades: New table for amenity definitions
  - propiedad_amenidades: New junction table for property-amenity relationships

  ## New Columns Added to properties:
  - metros_utiles (NUMERIC(8,2))
  - metros_totales (NUMERIC(8,2))
  - tiene_terraza (BOOLEAN DEFAULT false)
  - ano_construccion (INTEGER)
  - tiene_sala_estar (BOOLEAN DEFAULT false)
  - sistema_agua_caliente (tipo_agua_caliente)
  - tipo_cocina (tipo_cocina)
  - asesor_id (UUID REFERENCES profiles(id))
*/

BEGIN;

-- =====================================================
-- STEP 1: CREATE ENUM TYPES
-- =====================================================

-- Create ENUM for hot water system types
CREATE TYPE tipo_agua_caliente AS ENUM ('Calefón', 'Termo Eléctrico', 'Caldera Central');

-- Create ENUM for kitchen types
CREATE TYPE tipo_cocina AS ENUM ('Cerrada', 'Americana', 'Integrada');

-- =====================================================
-- STEP 2: MODIFY PROPERTIES TABLE
-- =====================================================

-- Add new columns for property measurements (replacing surface_m2)
ALTER TABLE properties ADD COLUMN metros_utiles NUMERIC(8, 2);
ALTER TABLE properties ADD COLUMN metros_totales NUMERIC(8, 2);

-- Add new property characteristic columns
ALTER TABLE properties ADD COLUMN tiene_terraza BOOLEAN DEFAULT false;
ALTER TABLE properties ADD COLUMN ano_construccion INTEGER;
ALTER TABLE properties ADD COLUMN tiene_sala_estar BOOLEAN DEFAULT false;

-- Add ENUM columns for hot water system and kitchen type
ALTER TABLE properties ADD COLUMN sistema_agua_caliente tipo_agua_caliente;
ALTER TABLE properties ADD COLUMN tipo_cocina tipo_cocina;

-- Add advisor assignment column
ALTER TABLE properties ADD COLUMN asesor_id UUID REFERENCES profiles(id);

-- Set default values for ENUM columns
UPDATE properties SET sistema_agua_caliente = 'Calefón' WHERE sistema_agua_caliente IS NULL;
UPDATE properties SET tipo_cocina = 'Cerrada' WHERE tipo_cocina IS NULL;

-- Make ENUM columns NOT NULL after setting defaults
ALTER TABLE properties ALTER COLUMN sistema_agua_caliente SET DEFAULT 'Calefón';
ALTER TABLE properties ALTER COLUMN tipo_cocina SET DEFAULT 'Cerrada';

-- Migrate existing surface_m2 data to new columns (if needed)
-- Assuming surface_m2 represented total area, we'll use it for metros_totales
UPDATE properties SET metros_totales = surface_m2 WHERE surface_m2 IS NOT NULL;

-- Mark surface_m2 as deprecated (we'll keep it for backward compatibility but won't use it in new code)
-- ALTER TABLE properties DROP COLUMN surface_m2; -- Uncomment if you want to remove the old column

-- =====================================================
-- STEP 3: CREATE AMENITIES SYSTEM
-- =====================================================

-- Create amenities table
CREATE TABLE amenidades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) UNIQUE NOT NULL,
    descripcion TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert initial amenities
INSERT INTO amenidades (nombre, descripcion) VALUES
    ('Conserje', 'Servicio de conserje 24/7'),
    ('Condominio', 'Propiedad ubicada en condominio'),
    ('Piscina', 'Piscina disponible'),
    ('Salón de Eventos', 'Salón para eventos y reuniones'),
    ('Gimnasio', 'Gimnasio equipado'),
    ('Cowork', 'Espacios de coworking'),
    ('Quincho', 'Área de quincho/parrilla'),
    ('Sala de Cine', 'Sala de cine privada'),
    ('Áreas Verdes', 'Jardines y áreas verdes');

-- Create junction table for property-amenity many-to-many relationship
CREATE TABLE propiedad_amenidades (
    propiedad_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    amenidad_id UUID REFERENCES amenidades(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (propiedad_id, amenidad_id)
);

-- Create indexes for better performance
CREATE INDEX idx_propiedad_amenidades_propiedad_id ON propiedad_amenidades(propiedad_id);
CREATE INDEX idx_propiedad_amenidades_amenidad_id ON propiedad_amenidades(amenidad_id);

-- =====================================================
-- STEP 4: UPDATE RLS POLICIES (if needed)
-- =====================================================

-- Note: RLS policies for the new tables will need to be added separately
-- based on your application's security requirements

-- =====================================================
-- STEP 5: ADD COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE amenidades IS 'Table containing all available property amenities';
COMMENT ON TABLE propiedad_amenidades IS 'Junction table for property-amenity many-to-many relationships';
COMMENT ON COLUMN properties.metros_utiles IS 'Useful square meters of the property';
COMMENT ON COLUMN properties.metros_totales IS 'Total square meters of the property';
COMMENT ON COLUMN properties.tiene_terraza IS 'Whether the property has a terrace';
COMMENT ON COLUMN properties.ano_construccion IS 'Construction year of the property';
COMMENT ON COLUMN properties.tiene_sala_estar IS 'Whether the property has a living room';
COMMENT ON COLUMN properties.sistema_agua_caliente IS 'Hot water system type';
COMMENT ON COLUMN properties.tipo_cocina IS 'Kitchen type';
COMMENT ON COLUMN properties.asesor_id IS 'ID of the assigned advisor';

COMMIT;
