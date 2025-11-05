-- Agregar campo repertory_number a las tablas de aplicaciones
-- Fecha: 5 de noviembre de 2025
-- Descripción: Agregar el campo repertory_number para personas jurídicas constituidas tradicionalmente

-- ========================================
-- TABLA: application_applicants
-- ========================================
-- Agregar columna repertory_number
ALTER TABLE application_applicants
ADD COLUMN IF NOT EXISTS repertory_number varchar(50);

-- Agregar comentario a la columna
COMMENT ON COLUMN application_applicants.repertory_number IS 'Número de repertorio para constituciones tradicionales';

-- ========================================
-- TABLA: application_guarantors
-- ========================================
-- Agregar columna repertory_number
ALTER TABLE application_guarantors
ADD COLUMN IF NOT EXISTS repertory_number varchar(50);

-- Agregar comentario a la columna
COMMENT ON COLUMN application_guarantors.repertory_number IS 'Número de repertorio para constituciones tradicionales';

-- ========================================
-- ÍNDICES (si son necesarios)
-- ========================================
-- Crear índices para búsquedas eficientes si es necesario
CREATE INDEX IF NOT EXISTS idx_application_applicants_repertory_number
ON application_applicants(repertory_number)
WHERE repertory_number IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_application_guarantors_repertory_number
ON application_guarantors(repertory_number)
WHERE repertory_number IS NOT NULL;
