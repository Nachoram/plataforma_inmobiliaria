-- Migration: Add location fields for parking and storage to properties table
-- Date: 2025-10-14 16:17:26
-- Description: Adds optional text columns for parking and storage location details

-- Inicia la transacción
BEGIN;

-- 1. Añade una columna de texto para la ubicación de la bodega.
-- Puede ser NULL si no hay bodega o no se especifica.
ALTER TABLE public.properties
ADD COLUMN ubicacion_bodega TEXT;

-- 2. Añade una columna de texto para la ubicación del estacionamiento.
-- Puede ser NULL si no hay o no se especifica.
ALTER TABLE public.properties
ADD COLUMN ubicacion_estacionamiento TEXT;

-- Finaliza la transacción
COMMIT;
