/*
  # Actualización del esquema de base de datos

  1. Nuevas tablas y campos
    - Actualización de campos existentes
    - Nuevas relaciones y constraints
    - Optimizaciones de índices

  2. Seguridad
    - Actualización de políticas RLS
    - Nuevos permisos y restricciones

  3. Datos
    - Migración de datos existentes
    - Valores por defecto actualizados
*/

-- Actualizar tabla de propiedades con nuevos campos si no existen
DO $$
BEGIN
  -- Agregar campo de estado actualizado si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE properties ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;

  -- Agregar campo de visibilidad si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'is_visible'
  ) THEN
    ALTER TABLE properties ADD COLUMN is_visible boolean DEFAULT true;
  END IF;

  -- Agregar campo de destacado si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'is_featured'
  ) THEN
    ALTER TABLE properties ADD COLUMN is_featured boolean DEFAULT false;
  END IF;
END $$;

-- Actualizar tabla de aplicaciones con nuevos campos
DO $$
BEGIN
  -- Agregar campo de prioridad si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'applications' AND column_name = 'priority'
  ) THEN
    ALTER TABLE applications ADD COLUMN priority integer DEFAULT 0;
  END IF;

  -- Agregar campo de notas internas si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'applications' AND column_name = 'internal_notes'
  ) THEN
    ALTER TABLE applications ADD COLUMN internal_notes text;
  END IF;

  -- Agregar campo de fecha de respuesta si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'applications' AND column_name = 'responded_at'
  ) THEN
    ALTER TABLE applications ADD COLUMN responded_at timestamptz;
  END IF;
END $$;

-- Actualizar tabla de ofertas con nuevos campos
DO $$
BEGIN
  -- Agregar campo de fecha de expiración si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'offers' AND column_name = 'expires_at'
  ) THEN
    ALTER TABLE offers ADD COLUMN expires_at timestamptz;
  END IF;

  -- Agregar campo de condiciones especiales si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'offers' AND column_name = 'special_conditions'
  ) THEN
    ALTER TABLE offers ADD COLUMN special_conditions text;
  END IF;
END $$;

-- Crear tabla de notificaciones si no existe
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  is_read boolean DEFAULT false,
  related_entity_type text,
  related_entity_id uuid,
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS en notificaciones
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Políticas para notificaciones
CREATE POLICY "Users can read their own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Crear tabla de mensajes si no existe
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject text NOT NULL,
  content text NOT NULL,
  is_read boolean DEFAULT false,
  related_application_id uuid REFERENCES applications(id) ON DELETE SET NULL,
  related_property_id uuid REFERENCES properties(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS en mensajes
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Políticas para mensajes
CREATE POLICY "Users can read messages they sent or received"
  ON messages
  FOR SELECT
  TO authenticated
  USING (sender_id = auth.uid() OR recipient_id = auth.uid());

CREATE POLICY "Users can send messages"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Recipients can update message read status"
  ON messages
  FOR UPDATE
  TO authenticated
  USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());

-- Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Agregar trigger para updated_at en properties si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_properties_updated_at'
  ) THEN
    CREATE TRIGGER update_properties_updated_at
      BEFORE UPDATE ON properties
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_properties_updated_at ON properties(updated_at);
CREATE INDEX IF NOT EXISTS idx_properties_is_visible ON properties(is_visible);
CREATE INDEX IF NOT EXISTS idx_properties_is_featured ON properties(is_featured);
CREATE INDEX IF NOT EXISTS idx_applications_priority ON applications(priority);
CREATE INDEX IF NOT EXISTS idx_applications_responded_at ON applications(responded_at);
CREATE INDEX IF NOT EXISTS idx_offers_expires_at ON offers(expires_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_created_at ON notifications(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read);

-- Actualizar datos existentes
UPDATE properties SET updated_at = created_at WHERE updated_at IS NULL;
UPDATE properties SET is_visible = true WHERE is_visible IS NULL;
UPDATE properties SET is_featured = false WHERE is_featured IS NULL;

-- Crear vista para propiedades activas
CREATE OR REPLACE VIEW active_properties AS
SELECT *
FROM properties
WHERE is_visible = true AND status = 'disponible'
ORDER BY is_featured DESC, created_at DESC;

-- Crear vista para estadísticas de usuario
CREATE OR REPLACE VIEW user_statistics AS
SELECT 
  p.owner_id as user_id,
  COUNT(DISTINCT p.id) as total_properties,
  COUNT(DISTINCT CASE WHEN p.status = 'disponible' THEN p.id END) as available_properties,
  COUNT(DISTINCT CASE WHEN p.listing_type = 'venta' THEN p.id END) as sale_properties,
  COUNT(DISTINCT CASE WHEN p.listing_type = 'arriendo' THEN p.id END) as rental_properties,
  COUNT(DISTINCT a.id) as total_applications,
  COUNT(DISTINCT CASE WHEN a.status = 'pendiente' THEN a.id END) as pending_applications,
  COUNT(DISTINCT o.id) as total_offers,
  COUNT(DISTINCT CASE WHEN o.status = 'pendiente' THEN o.id END) as pending_offers
FROM properties p
LEFT JOIN applications a ON p.id = a.property_id
LEFT JOIN offers o ON p.id = o.property_id
GROUP BY p.owner_id;

-- Otorgar permisos
GRANT SELECT ON active_properties TO authenticated;
GRANT SELECT ON user_statistics TO authenticated;
GRANT ALL ON notifications TO authenticated;
GRANT ALL ON messages TO authenticated;

-- Comentarios para documentación
COMMENT ON TABLE notifications IS 'Sistema de notificaciones para usuarios';
COMMENT ON TABLE messages IS 'Sistema de mensajería entre usuarios';
COMMENT ON COLUMN properties.is_visible IS 'Controla si la propiedad es visible públicamente';
COMMENT ON COLUMN properties.is_featured IS 'Marca propiedades destacadas';
COMMENT ON COLUMN applications.priority IS 'Prioridad de la aplicación (0=normal, 1=alta, 2=urgente)';
COMMENT ON COLUMN applications.internal_notes IS 'Notas internas del propietario sobre la aplicación';