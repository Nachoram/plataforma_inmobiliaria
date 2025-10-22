-- 🎯 Crear postulación de prueba para tu propiedad
-- Tu User ID: c14fe4b0-2204-4e30-800e-7d2c12c8aa9d
-- Tu Property ID: 550e8400-e29b-41d4-a716-446655440004

-- ========================================
-- OPCIÓN 1: Crear postulación simple (tú como postulante)
-- ========================================
INSERT INTO applications (
  property_id,
  applicant_id,
  status,
  message,
  created_at
) VALUES (
  '550e8400-e29b-41d4-a716-446655440004',  -- Tu propiedad en Avenida Providencia
  '84f7ab60-2499-4524-8a57-5012b103acfb',   -- Usuario prueba1@gmail.com como postulante
  'pendiente',
  'Esta es una postulación de prueba para verificar que el sistema funciona correctamente.',
  NOW()
);

-- ========================================
-- OPCIÓN 2: Crear varias postulaciones de prueba
-- ========================================
-- Postulación 2: De usuario probando@gmail.com
INSERT INTO applications (
  property_id,
  applicant_id,
  status,
  message,
  created_at
) VALUES (
  '550e8400-e29b-41d4-a716-446655440004',
  'baa7170e-8acf-46e7-adfd-f73bf5435d94',  -- probando@gmail.com
  'pendiente',
  'Me interesa mucho esta propiedad. Tengo estabilidad laboral y excelentes referencias.',
  NOW() - INTERVAL '1 day'
);

-- Postulación 3: De usuario carlos.soto@example.com
INSERT INTO applications (
  property_id,
  applicant_id,
  status,
  message,
  created_at
) VALUES (
  '550e8400-e29b-41d4-a716-446655440004',
  'b80b77d8-70f8-4481-879e-8dbfd22b949c',  -- carlos.soto@example.com
  'aprobada',
  'Excelente ubicación. Soy profesional con ingresos estables. Adjunto toda mi documentación.',
  NOW() - INTERVAL '2 days'
);

-- ========================================
-- VERIFICAR QUE SE CREARON
-- ========================================
SELECT 
  a.id as application_id,
  a.property_id,
  p.address_street,
  a.applicant_id,
  prof.email as applicant_email,
  a.status,
  a.created_at,
  a.message
FROM applications a
JOIN properties p ON a.property_id = p.id
LEFT JOIN profiles prof ON a.applicant_id = prof.id
WHERE p.owner_id = 'c14fe4b0-2204-4e30-800e-7d2c12c8aa9d'
ORDER BY a.created_at DESC;

-- ========================================
-- CONTAR DE NUEVO
-- ========================================
SELECT 
  p.id as property_id,
  p.address_street,
  COUNT(a.id) as postulation_count
FROM properties p
LEFT JOIN applications a ON p.id = a.property_id
WHERE p.owner_id = 'c14fe4b0-2204-4e30-800e-7d2c12c8aa9d'
GROUP BY p.id, p.address_street;

-- Ahora deberías ver: postulation_count = 3

