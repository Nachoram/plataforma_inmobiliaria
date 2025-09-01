/*
  # Refactorización de Base de Datos: Relaciones Muchos a Muchos

  Este script implementa las tablas de rompimiento necesarias para soportar:
  1. Co-propiedad: Múltiples usuarios pueden ser propietarios de una misma propiedad
  2. Favoritos: Usuarios pueden marcar múltiples propiedades como favoritas

  ## Nuevas Tablas
  - `property_owners`: Vincula usuarios con propiedades que poseen
  - `user_favorites`: Registra propiedades marcadas como favoritas por usuarios

  ## Seguridad
  - Habilita RLS en ambas tablas
  - Políticas que permiten a usuarios gestionar solo sus propios registros
*/

-- =====================================================
-- TABLA DE ROMPIMIENTO: PROPERTY_OWNERS
-- =====================================================

CREATE TABLE IF NOT EXISTS property_owners (
  user_id uuid NOT NULL,
  property_id uuid NOT NULL,
  ownership_percentage decimal(5,2) DEFAULT 100.00 CHECK (ownership_percentage > 0 AND ownership_percentage <= 100),
  created_at timestamptz DEFAULT now(),
  
  -- Clave primaria compuesta para evitar duplicados
  PRIMARY KEY (user_id, property_id),
  
  -- Claves foráneas con eliminación en cascada
  CONSTRAINT fk_property_owners_user 
    FOREIGN KEY (user_id) 
    REFERENCES profiles(id) 
    ON DELETE CASCADE,
    
  CONSTRAINT fk_property_owners_property 
    FOREIGN KEY (property_id) 
    REFERENCES properties(id) 
    ON DELETE CASCADE
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_property_owners_user_id ON property_owners(user_id);
CREATE INDEX IF NOT EXISTS idx_property_owners_property_id ON property_owners(property_id);
CREATE INDEX IF NOT EXISTS idx_property_owners_created_at ON property_owners(created_at);

-- Habilitar Row Level Security
ALTER TABLE property_owners ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad para property_owners
CREATE POLICY "Users can view property ownership records"
  ON property_owners
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR 
    property_id IN (
      SELECT id FROM properties WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own ownership records"
  ON property_owners
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own ownership records"
  ON property_owners
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own ownership records"
  ON property_owners
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- =====================================================
-- TABLA DE ROMPIMIENTO: USER_FAVORITES
-- =====================================================

CREATE TABLE IF NOT EXISTS user_favorites (
  user_id uuid NOT NULL,
  property_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  
  -- Clave primaria compuesta para evitar duplicados
  PRIMARY KEY (user_id, property_id),
  
  -- Claves foráneas con eliminación en cascada
  CONSTRAINT fk_user_favorites_user 
    FOREIGN KEY (user_id) 
    REFERENCES profiles(id) 
    ON DELETE CASCADE,
    
  CONSTRAINT fk_user_favorites_property 
    FOREIGN KEY (property_id) 
    REFERENCES properties(id) 
    ON DELETE CASCADE
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_property_id ON user_favorites(property_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_created_at ON user_favorites(created_at);

-- Habilitar Row Level Security
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad para user_favorites
CREATE POLICY "Users can view their own favorites"
  ON user_favorites
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can add properties to their favorites"
  ON user_favorites
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can remove properties from their favorites"
  ON user_favorites
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- =====================================================
-- CONSULTAS SQL DE EJEMPLO
-- =====================================================

/*
-- 1. Obtener todas las propiedades que le pertenecen a un usuario específico
SELECT 
  p.*,
  po.ownership_percentage,
  po.created_at as ownership_since
FROM properties p
INNER JOIN property_owners po ON p.id = po.property_id
WHERE po.user_id = 'USER_UUID_HERE'
ORDER BY po.created_at DESC;

-- 2. Obtener todos los propietarios de una propiedad específica
SELECT 
  pr.full_name,
  pr.contact_email,
  po.ownership_percentage,
  po.created_at as ownership_since
FROM profiles pr
INNER JOIN property_owners po ON pr.id = po.user_id
WHERE po.property_id = 'PROPERTY_UUID_HERE'
ORDER BY po.ownership_percentage DESC;

-- 3. Obtener todas las propiedades marcadas como favoritas por un usuario específico
SELECT 
  p.*,
  uf.created_at as favorited_at
FROM properties p
INNER JOIN user_favorites uf ON p.id = uf.property_id
WHERE uf.user_id = 'USER_UUID_HERE'
ORDER BY uf.created_at DESC;

-- 4. Contar cuántos usuarios han marcado una propiedad específica como favorita
SELECT 
  p.address,
  p.price,
  COUNT(uf.user_id) as total_favorites
FROM properties p
LEFT JOIN user_favorites uf ON p.id = uf.property_id
WHERE p.id = 'PROPERTY_UUID_HERE'
GROUP BY p.id, p.address, p.price;

-- 5. Obtener las propiedades más populares (con más favoritos)
SELECT 
  p.id,
  p.address,
  p.price,
  p.listing_type,
  COUNT(uf.user_id) as total_favorites
FROM properties p
LEFT JOIN user_favorites uf ON p.id = uf.property_id
WHERE p.status = 'disponible'
GROUP BY p.id, p.address, p.price, p.listing_type
ORDER BY total_favorites DESC, p.created_at DESC
LIMIT 10;

-- 6. Verificar si una propiedad específica está en los favoritos de un usuario
SELECT EXISTS(
  SELECT 1 
  FROM user_favorites 
  WHERE user_id = 'USER_UUID_HERE' 
    AND property_id = 'PROPERTY_UUID_HERE'
) as is_favorite;

-- 7. Obtener propiedades con co-propietarios (más de un propietario)
SELECT 
  p.id,
  p.address,
  COUNT(po.user_id) as total_owners,
  STRING_AGG(pr.full_name, ', ') as owners_names
FROM properties p
INNER JOIN property_owners po ON p.id = po.property_id
INNER JOIN profiles pr ON po.user_id = pr.id
GROUP BY p.id, p.address
HAVING COUNT(po.user_id) > 1
ORDER BY total_owners DESC;

-- 8. Migrar datos existentes de la tabla properties a property_owners
-- (Ejecutar solo si hay datos existentes que migrar)
INSERT INTO property_owners (user_id, property_id, ownership_percentage, created_at)
SELECT 
  owner_id as user_id,
  id as property_id,
  100.00 as ownership_percentage,
  created_at
FROM properties
WHERE owner_id IS NOT NULL
ON CONFLICT (user_id, property_id) DO NOTHING;
*/