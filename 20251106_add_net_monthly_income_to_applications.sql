-- Agregar campo net_monthly_income_clp para personas jurídicas
-- Fecha: 6 de noviembre de 2025
-- Descripción: Agregar campos para ingreso neto mensual de personas jurídicas

-- ========================================
-- TABLA: application_applicants
-- ========================================
-- Agregar columna net_monthly_income_clp
ALTER TABLE application_applicants
ADD COLUMN IF NOT EXISTS net_monthly_income_clp bigint DEFAULT 0;

-- Agregar comentario a la columna
COMMENT ON COLUMN application_applicants.net_monthly_income_clp IS 'Ingreso neto mensual en CLP para personas jurídicas';

-- ========================================
-- TABLA: application_guarantors
-- ========================================
-- Agregar columna net_monthly_income_clp
ALTER TABLE application_guarantors
ADD COLUMN IF NOT EXISTS net_monthly_income_clp bigint DEFAULT 0;

-- Agregar comentario a la columna
COMMENT ON COLUMN application_guarantors.net_monthly_income_clp IS 'Ingreso neto mensual en CLP para personas jurídicas';

-- ========================================
-- ÍNDICES (si son necesarios)
-- ========================================
-- Crear índices para búsquedas eficientes si es necesario
CREATE INDEX IF NOT EXISTS idx_application_applicants_net_monthly_income_clp
ON application_applicants(net_monthly_income_clp)
WHERE net_monthly_income_clp > 0;

CREATE INDEX IF NOT EXISTS idx_application_guarantors_net_monthly_income_clp
ON application_guarantors(net_monthly_income_clp)
WHERE net_monthly_income_clp > 0;
